import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// We use literal process.env calls so tsup can inline them during build
const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
};

let client: S3Client | null = null;

function getClient() {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_CONFIG.accessKeyId!,
        secretAccessKey: R2_CONFIG.secretAccessKey!,
      },
    });
  }
  return client;
}

const TTL_DAYS = 7;

export function generateR2Key(senderId: string, fileName: string): string {
  const timestamp = Date.now();
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `transfers/${senderId}/${timestamp}_${safe}`;
}

export async function getUploadUrl(key: string, mimeType: string): Promise<string> {
  return getSignedUrl(getClient(), new PutObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    ContentType: mimeType,
  }), { expiresIn: 3600 }); 
}

export async function getDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(getClient(), new GetObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
  }), { expiresIn: 3600 });
}

export async function deleteR2Object(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ 
    Bucket: R2_CONFIG.bucketName, 
    Key: key 
  }));
}

export function getExpiryDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + TTL_DAYS);
  return d;
}
