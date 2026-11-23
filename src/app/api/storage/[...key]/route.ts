// Local storage file server (catch-all for nested paths)
// Serves files from /home/z/my-project/storage when using local storage provider
// For S3 mode, this route is not used (files are served directly from S3)

import { NextRequest, NextResponse } from 'next/server'
import { readLocalFile, getStorageConfig } from '@/lib/storage'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const cfg = getStorageConfig()
  if (cfg.provider !== 'local') {
    return NextResponse.json({ error: 'Local storage disabled' }, { status: 404 })
  }

  const { key: keyParts } = await params
  const key = keyParts.join('/')

  const result = await readLocalFile(key)
  if (!result) {
    return new NextResponse('Not Found', { status: 404 })
  }

  return new NextResponse(result.buffer, {
    headers: {
      'Content-Type': result.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': result.buffer.length.toString(),
    },
  })
}
