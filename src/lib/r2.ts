import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const TTL_DAYS = 7;

export function generateR2Key(senderId: string, fileName: string): string {
  const timestamp = Date.now();
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `transfers/${senderId}/${timestamp}_${safe}`;
}

export async function getUploadUrl(key: string, mimeType: string): Promise<string> {
  return getSignedUrl(r2, new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType,
  }), { expiresIn: 3600 }); // 1 hour to complete upload
}

export async function getDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(r2, new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }), { expiresIn: 3600 });
}

export async function deleteR2Object(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export function getExpiryDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + TTL_DAYS);
  return d;
}
