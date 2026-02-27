/**
 * 3D Model Generation Worker — BullMQ consumer.
 *
 * Runs as a standalone container (Dockerfile.worker).
 * Processes model-generation jobs from the Redis queue:
 *  1. Receives { dishId, userId, geometricPrompt, imageUrl }
 *  2. Simulates 3D generation (placeholder for Shap-E / TripoSR / cloud API)
 *  3. Uploads the .glb file to S3-compatible storage (MinIO locally)
 *  4. Scans the .glb with ClamAV before persisting
 *  5. Updates the dish record in PostgreSQL via the repository layer
 *
 * Scale horizontally: docker compose up --scale worker=N
 */

import { config as loadEnv } from 'dotenv';
loadEnv({ path: process.env.ENV_FILE ?? '.env' });

import { Worker, Job } from 'bullmq';
import {
  QUEUE_MODEL_GENERATION,
  createRedisConnection,
  ModelGenerationJobData,
  ModelGenerationJobResult,
} from './queue';
import { MenuRepository } from '../database/repositories';
import { uploadFile, BUCKET_MODELS } from './storageClient';
import { scanBuffer } from './scannerClient';
import type { Dish } from '../src/shared/types';

// ── Job processor ──────────────────────────────────────────────────────────

const processModelGeneration = async (
  job: Job<ModelGenerationJobData, ModelGenerationJobResult>
): Promise<ModelGenerationJobResult> => {
  const { dishId, userId, geometricPrompt } = job.data;
  console.log(`[Worker] Processing model for dish ${dishId}`);

  // Step 1: Mark generating + progress updates
  const progressSteps = [
    { progress: 20, label: 'Parsing geometric prompt' },
    { progress: 40, label: 'Generating mesh geometry' },
    { progress: 60, label: 'Applying materials & textures' },
    { progress: 80, label: 'Optimizing & compressing GLB' },
  ];

  for (const step of progressSteps) {
    await MenuRepository.updateDishStatus(userId, dishId, {
      generationProgress: step.progress,
      modelGenerationStatus: 'generating',
    });
    await job.updateProgress(step.progress);
    console.log(`[Worker] ${dishId}: ${step.label} (${step.progress}%)`);

    // Simulate processing time — replace with real model inference
    await new Promise((r) => setTimeout(r, 3000 + Math.random() * 2000));
  }

  // Step 2: Generate the 3D model
  // TODO: Replace with actual 3D generation call (Shap-E, TripoSR, etc.)
  // For now, download a placeholder .glb and treat it as the output
  const placeholderGlb = await fetchPlaceholderModel();

  // Step 3: Scan the .glb with ClamAV before storing
  try {
    const scanResult = await scanBuffer(placeholderGlb);
    if (!scanResult.clean) {
      console.error(`[Worker] ClamAV flagged model for dish ${dishId}: ${scanResult.detail}`);
      await MenuRepository.updateDishStatus(userId, dishId, {
        modelGenerationStatus: 'failed',
        generationProgress: 0,
      });
      throw new Error(`Model file failed security scan: ${scanResult.detail}`);
    }
    console.log(`[Worker] ClamAV scan passed for dish ${dishId}`);
  } catch (err) {
    // If ClamAV is unavailable, log warning but don't block (configurable)
    const isCritical = process.env.CLAMAV_REQUIRED === 'true';
    if (isCritical) throw err;
    console.warn(`[Worker] ClamAV unavailable, skipping scan: ${(err as Error).message}`);
  }

  // Step 4: Upload .glb to S3-compatible blob storage
  const objectKey = `${userId}/${dishId}.glb`;
  const modelUrl = await uploadFile(BUCKET_MODELS, objectKey, placeholderGlb, 'model/gltf-binary');
  console.log(`[Worker] Uploaded model to ${modelUrl}`);

  // Step 5: Mark dish as ready
  const finalUpdates: Partial<Dish> = {
    generationProgress: 100,
    modelGenerationStatus: 'ready',
    isARReady: true,
    arModelUrl: modelUrl,
  };
  await MenuRepository.updateDishStatus(userId, dishId, finalUpdates);
  await job.updateProgress(100);

  console.log(`[Worker] Dish ${dishId} model generation complete`);
  return { modelUrl };
};

// ── Placeholder model fetcher (replace with real pipeline) ─────────────────

const fetchPlaceholderModel = async (): Promise<Buffer> => {
  // In production, this would call the actual 3D generation model/service
  // and return the generated .glb bytes.
  // For now, create a minimal valid GLB header as a placeholder.
  const url = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch placeholder: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    // If fetch fails, return a minimal GLB header (12 bytes)
    // Real implementation would never hit this path
    console.warn('[Worker] Could not fetch placeholder model, using minimal GLB');
    const header = Buffer.alloc(12);
    header.writeUInt32LE(0x46546C67, 0); // magic: "glTF"
    header.writeUInt32LE(2, 4);           // version: 2
    header.writeUInt32LE(12, 8);          // length: 12
    return header;
  }
};

// ── Start the worker ───────────────────────────────────────────────────────

const connection = createRedisConnection();

const worker = new Worker<ModelGenerationJobData, ModelGenerationJobResult>(
  QUEUE_MODEL_GENERATION,
  processModelGeneration,
  {
    connection,
    concurrency: 2, // Process up to 2 jobs in parallel per worker instance
    limiter: {
      max: 10,
      duration: 60_000, // Max 10 jobs per minute (rate limiting)
    },
  }
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err.message);
});

console.log(`[Worker] 3D model generation worker started. Waiting for jobs on queue "${QUEUE_MODEL_GENERATION}"...`);
