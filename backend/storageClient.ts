/**
 * S3-compatible storage client (platform-agnostic).
 *
 * Works unchanged against:
 *  - MinIO          (local / self-hosted)
 *  - AWS S3         (set S3_ENDPOINT to default, remove S3_FORCE_PATH_STYLE)
 *  - GCP Cloud Storage (XML API with HMAC keys)
 *  - Azure Blob     (S3-compat gateway preview, or MinIO on AKS)
 *
 * Configuration is entirely via environment variables — no vendor SDK imports.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';

// ── Configuration ──────────────────────────────────────────────────────────

const getEnv = (key: string, fallback?: string): string => {
  const val = process.env[key] ?? fallback;
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

const s3Config = () => ({
  endpoint: getEnv('S3_ENDPOINT', 'http://minio:9000'),
  region: getEnv('S3_REGION', 'us-east-1'),
  credentials: {
    accessKeyId: getEnv('S3_ACCESS_KEY', 'minioadmin'),
    secretAccessKey: getEnv('S3_SECRET_KEY', 'minioadmin'),
  },
  forcePathStyle: getEnv('S3_FORCE_PATH_STYLE', 'true') === 'true',
});

let client: S3Client | null = null;

const getClient = (): S3Client => {
  if (!client) {
    client = new S3Client(s3Config());
  }
  return client;
};

// ── Bucket names ───────────────────────────────────────────────────────────

export const BUCKET_IMAGES = getEnv('S3_BUCKET_IMAGES', 'dish-images');
export const BUCKET_MODELS = getEnv('S3_BUCKET_MODELS', 'dish-models');

// ── Public URL builder ─────────────────────────────────────────────────────

const storagePublicUrl = (): string =>
  getEnv('STORAGE_PUBLIC_URL', 'http://localhost/storage');

/** Build a browser-accessible URL for a stored object. */
export const publicUrl = (bucket: string, key: string): string =>
  `${storagePublicUrl()}/${bucket}/${key}`;

// ── Operations ─────────────────────────────────────────────────────────────

/** Upload a buffer to a bucket. Returns the public URL. */
export const uploadFile = async (
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> => {
  await getClient().send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType })
  );
  return publicUrl(bucket, key);
};

/** Download an object as a readable stream. */
export const downloadFile = async (
  bucket: string,
  key: string
): Promise<NodeJS.ReadableStream> => {
  const res = await getClient().send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  return res.Body as NodeJS.ReadableStream;
};

/** Delete an object. */
export const deleteFile = async (bucket: string, key: string): Promise<void> => {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key })
  );
};

/** Check that a bucket exists (used for health checks). */
export const bucketExists = async (bucket: string): Promise<boolean> => {
  try {
    await getClient().send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch {
    return false;
  }
};
