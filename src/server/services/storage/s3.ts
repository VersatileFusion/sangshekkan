import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env ${name}`);
  }
  return v;
}

export function getS3Client() {
  const endpoint = required('R2_ENDPOINT');
  const accessKeyId = required('R2_ACCESS_KEY_ID');
  const secretAccessKey = required('R2_SECRET_ACCESS_KEY');
  return new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function generateObjectKey(params: { userId: string; originalName?: string; extension?: string }) {
  const safeExt = (params.extension || (params.originalName?.split('.').pop() ?? '')).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const id = randomUUID();
  const prefix = params.userId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `${prefix}/${id}${safeExt ? '.' + safeExt : ''}`;
}

export async function createPresignedPutUrl(opts: { key: string; contentType: string; expiresIn?: number; maxBytes?: number }) {
  const bucket = required('R2_BUCKET');
  const s3 = getS3Client();
  const maxBytes = typeof opts.maxBytes === 'number' ? opts.maxBytes : MAX_UPLOAD_BYTES;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: opts.key,
    ContentType: opts.contentType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: opts.expiresIn ?? 900 });
  return { uploadUrl, maxBytes };
}

export function getPublicUrl(key: string) {
  const base = required('ASSET_PUBLIC_BASE_URL');
  return `${base.replace(/\/$/, '')}/${key}`;
}

export const limits = { MAX_UPLOAD_BYTES };




