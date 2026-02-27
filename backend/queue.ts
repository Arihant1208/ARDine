/**
 * BullMQ queue configuration (shared between API producer and Worker consumer).
 *
 * Platform-agnostic: uses Redis as the backing store.
 *  - Local:   redis:7-alpine container
 *  - Azure:   Azure Cache for Redis
 *  - AWS:     Amazon ElastiCache
 *  - GCP:     Cloud Memorystore
 *
 * Only the REDIS_URL env var changes between environments.
 */

import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';

// ── Redis connection ───────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

/** Shared Redis connection factory — reuse across queue and worker. */
export const createRedisConnection = (): IORedis => {
  return new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  });
};

// ── Queue names (constants) ────────────────────────────────────────────────

export const QUEUE_MODEL_GENERATION = 'model-generation';

// ── Job type definitions ───────────────────────────────────────────────────

export interface ModelGenerationJobData {
  dishId: string;
  userId: string;
  geometricPrompt: string;
  imageUrl: string; // URL of the uploaded dish image in blob storage
}

export interface ModelGenerationJobResult {
  modelUrl: string;
}

// ── Queue instance (producer side) ─────────────────────────────────────────

let modelQueue: Queue<ModelGenerationJobData, ModelGenerationJobResult> | null = null;

export const getModelGenerationQueue = (): Queue<ModelGenerationJobData, ModelGenerationJobResult> => {
  if (!modelQueue) {
    const opts: QueueOptions = {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    };
    modelQueue = new Queue(QUEUE_MODEL_GENERATION, opts);
  }
  return modelQueue;
};

/**
 * Enqueue a 3D model generation job.
 * Called by menuController after dish creation + image upload.
 */
export const enqueueModelGeneration = async (
  data: ModelGenerationJobData
): Promise<string> => {
  const job = await getModelGenerationQueue().add('generate', data, {
    jobId: `model-${data.dishId}`,
  });
  return job.id ?? data.dishId;
};
