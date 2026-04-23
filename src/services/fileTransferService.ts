import fs from 'fs';
import path from 'path';
import https from 'https';
import archiver from 'archiver';
import mime from 'mime-types';
import { prisma } from '../lib/prisma';
import { getUploadUrl, getDownloadUrl, deleteR2Object,
         generateR2Key, getExpiryDate } from '../lib/r2';

// ── ZIP a folder into a temp .zip ──────────────────────────────────────────
export async function zipFolder(folderPath: string): Promise<string> {
  const zipPath = `${folderPath}.zip`;
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve(zipPath));
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(folderPath, path.basename(folderPath));
    archive.finalize();
  });
}

// ── Upload file to R2 with progress callback ────────────────────────────────
export async function uploadToR2(
  filePath: string,
  key: string,
  mimeType: string,
  onProgress: (pct: number, speed: number) => void
): Promise<void> {
  const uploadUrl = await getUploadUrl(key, mimeType);
  const fileSize = fs.statSync(filePath).size;
  const fileStream = fs.createReadStream(filePath);

  return new Promise((resolve, reject) => {
    let uploaded = 0;
    const startTime = Date.now();
    
    fileStream.on('data', (chunk) => {
      uploaded += chunk.length;
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = elapsed > 0 ? uploaded / elapsed : 0;
      onProgress(Math.round((uploaded / fileSize) * 100), speed);
    });

    const url = new URL(uploadUrl);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'PUT',
      headers: { 'Content-Type': mimeType, 'Content-Length': fileSize },
    }, (res) => {
      res.statusCode === 200 ? resolve() : reject(new Error(`Upload failed: ${res.statusCode}`));
    });

    req.on('error', reject);
    fileStream.pipe(req);
  });
}

// ── Create DB record after successful upload ────────────────────────────────
export async function createTransferRecord(opts: {
  senderId: string;
  receiverIds: string[];
  fileName: string;
  fileSize: number;
  mimeType: string;
  r2Key: string;
}) {
  const { receiverIds, ...rest } = opts;
  return Promise.all(receiverIds.map(receiverId =>
    prisma.fileTransfer.create({
      data: { ...rest, receiverId, expiresAt: getExpiryDate() }
    })
  ));
}

// ── Get pending transfers for a user ───────────────────────────────────────
export async function getPendingTransfers(userId: string) {
  return prisma.fileTransfer.findMany({
    where: { receiverId: userId, status: 'PENDING' },
    include: { sender: { select: { username: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

// ── Count pending transfers (used in Dashboard heartbeat) ──────────────────
export async function countPendingTransfers(userId: string): Promise<number> {
  return prisma.fileTransfer.count({
    where: { receiverId: userId, status: 'PENDING' },
  });
}

// ── Download a file from R2 to local disk ──────────────────────────────────
export async function downloadFromR2(
  r2Key: string,
  destPath: string,
  onProgress: (pct: number, speed: number) => void
): Promise<void> {
  const downloadUrl = await getDownloadUrl(r2Key);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(downloadUrl, (res) => {
      const total = parseInt(res.headers['content-length'] ?? '0', 10);
      let received = 0;
      const startTime = Date.now();

      res.on('data', (chunk) => {
        received += chunk.length;
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? received / elapsed : 0;
        if (total) onProgress(Math.round((received / total) * 100), speed);
      });
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

// ── Accept a transfer ──────────────────────────────────────────────────────
export async function acceptTransfer(transferId: string, destPath: string,
  onProgress: (pct: number, speed: number) => void) {
  const transfer = await prisma.fileTransfer.findUniqueOrThrow({ where: { id: transferId } });
  const fullDest = path.join(destPath, transfer.fileName);
  await downloadFromR2(transfer.r2Key, fullDest, onProgress);
  await prisma.fileTransfer.update({
    where: { id: transferId },
    data: { status: 'DOWNLOADED', downloadedAt: new Date() }
  });
  
  // Clean up R2 if no more pending transfers for this key
  await maybeDeleteR2(transfer.r2Key);
  
  return fullDest;
}

// ── Decline a transfer ─────────────────────────────────────────────────────
export async function declineTransfer(transferId: string) {
  const transfer = await prisma.fileTransfer.findUniqueOrThrow({ where: { id: transferId } });
  await prisma.fileTransfer.update({
    where: { id: transferId },
    data: { status: 'DECLINED' }
  });
  
  // Clean up R2 if no more pending transfers for this key
  await maybeDeleteR2(transfer.r2Key);
}

// ── Before deleting from R2, check if anyone still needs it ─────────────────
async function maybeDeleteR2(r2Key: string) {
  const stillPending = await prisma.fileTransfer.count({
    where: { r2Key, status: 'PENDING' }
  });
  if (stillPending === 0) await deleteR2Object(r2Key);
}

// ── Cleanup expired transfers (run in heartbeat) ───────────────────────────
export async function cleanupExpiredTransfers() {
  const expired = await prisma.fileTransfer.findMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() } }
  });
  
  if (expired.length === 0) return;

  // For each expired record, update status
  await prisma.fileTransfer.updateMany({
    where: { id: { in: expired.map(t => t.id) } },
    data: { status: 'EXPIRED' }
  });

  // Then check each unique r2Key if it should be deleted
  const uniqueKeys = [...new Set(expired.map(t => t.r2Key))];
  await Promise.all(uniqueKeys.map(key => maybeDeleteR2(key).catch(() => {})));
}
