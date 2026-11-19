import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export type StorageProvider = 's3' | 'local'

export interface StorageConfig {
  provider: StorageProvider
  // S3/MinIO config
  endpoint?: string       // e.g. https://s3.amazonaws.com or http://minio:9000
  region?: string         // e.g. us-east-1
  bucket?: string
  accessKeyId?: string
  secretAccessKey?: string
  publicUrl?: string      // CDN/public URL prefix for served files
  forcePathStyle?: boolean // true for MinIO
  // Local config
  localDir?: string       // default /home/z/my-project/storage
  localPublicUrl?: string // e.g. /storage
}

let _config: StorageConfig | null = null
let _s3Client: S3Client | null = null

export function getStorageConfig(): StorageConfig {
  if (_config) return _config

  // Auto-detect from environment
  const useS3 = process.env.STORAGE_PROVIDER === 's3' || !!process.env.S3_BUCKET

  if (useS3) {
    _config = {
      provider: 's3',
      endpoint: process.env.S3_ENDPOINT || process.env.MINIO_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      bucket: process.env.S3_BUCKET || process.env.MINIO_BUCKET,
      accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.MINIO_SECRET_ACCESS_KEY,
      publicUrl: process.env.S3_PUBLIC_URL || process.env.MINIO_PUBLIC_URL,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || !!process.env.MINIO_ENDPOINT,
    }
  } else {
    _config = {
      provider: 'local',
      localDir: process.env.STORAGE_LOCAL_DIR || 'storage',
      localPublicUrl: process.env.STORAGE_LOCAL_URL || '/api/storage',
    }
  }
  return _config
}

function getS3Client(): S3Client {
  if (_s3Client) return _s3Client
  const cfg = getStorageConfig()
  _s3Client = new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region,
    credentials: cfg.accessKeyId && cfg.secretAccessKey ? {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    } : undefined,
    forcePathStyle: cfg.forcePathStyle,
  })
  return _s3Client
}

export interface UploadResult {
  key: string       // storage key (e.g. "videos/2026/11/abc123.mp4")
  bucket?: string   // bucket name (for S3)
  url: string       // public URL or local URL
  size: number      // bytes
  mimeType: string
}

/**
 * Upload a file to storage (S3 or local)
 * @param buffer file content
 * @param filename original filename (used for extension)
 * @param folder target folder, e.g. "videos", "covers", "avatars"
 * @param mimeType MIME type
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  folder: string = 'uploads',
  mimeType: string = 'application/octet-stream'
): Promise<UploadResult> {
  const cfg = getStorageConfig()
  const ext = path.extname(filename) || ''
  const hash = crypto.randomBytes(16).toString('hex')
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const key = `${folder}/${year}/${month}/${hash}${ext}`

  if (cfg.provider === 's3') {
    const s3 = getS3Client()
    await s3.send(new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Make it publicly readable (or use presigned URLs)
      ACL: 'public-read',
    }))
    const url = cfg.publicUrl
      ? `${cfg.publicUrl.replace(/\/$/, '')}/${key}`
      : `${cfg.endpoint}/${cfg.bucket}/${key}`
    return { key, bucket: cfg.bucket, url, size: buffer.length, mimeType }
  } else {
    // Local storage
    const filePath = path.join(cfg.localDir!, key)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, buffer)
    const url = `${cfg.localPublicUrl}/${key}`
    return { key, bucket: undefined, url, size: buffer.length, mimeType }
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(key: string): Promise<void> {
  const cfg = getStorageConfig()
  if (cfg.provider === 's3') {
    const s3 = getS3Client()
    await s3.send(new DeleteObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
    }))
  } else {
    const filePath = path.join(cfg.localDir!, key)
    try {
      await fs.unlink(filePath)
    } catch (e) {
      // file doesn't exist, ignore
    }
  }
}

/**
 * Get a presigned URL for temporary access to a private file
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const cfg = getStorageConfig()
  if (cfg.provider === 's3') {
    const s3 = getS3Client()
    const command = new GetObjectCommand({ Bucket: cfg.bucket, Key: key })
    return getSignedUrl(s3, command, { expiresIn })
  } else {
    // Local: just return public URL
    return `${cfg.localPublicUrl}/${key}`
  }
}

/**
 * Read a file from local storage (used by the local storage API route)
 */
export async function readLocalFile(key: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const cfg = getStorageConfig()
  if (cfg.provider !== 'local') return null
  const filePath = path.join(cfg.localDir!, key)
  try {
    const buffer = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
    }
    return { buffer, mimeType: mimeTypes[ext] || 'application/octet-stream' }
  } catch {
    return null
  }
}

/**
 * Check if storage is configured (for admin UI display)
 */
export function getStorageStatus() {
  const cfg = getStorageConfig()
  return {
    provider: cfg.provider,
    configured: cfg.provider === 's3' ? !!(cfg.bucket && cfg.accessKeyId) : true,
    bucket: cfg.bucket,
    endpoint: cfg.endpoint || cfg.localPublicUrl,
  }
}
