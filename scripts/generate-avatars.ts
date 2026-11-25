// generate-avatars.ts — create a set of branded predefined avatar images.
// پایگاه خبری راهکار جوان
//
// We render 12 deterministic SVG avatars with different background colors and
// a Persian letter glyph, convert each to PNG with sharp, and save them to
// /public/avatars/. Users pick one from the gallery; we never accept uploads.
//
// Run: bunx tsx scripts/generate-avatars.ts

import * as fs from 'fs'
import * as path from 'path'

const OUT_DIR = path.resolve(process.cwd(), 'public/avatars')

const PALETTE: { bg: string; fg: string; label: string }[] = [
  { bg: '#dc2626', fg: '#ffffff', label: 'ر' },
  { bg: '#2563eb', fg: '#ffffff', label: 'ج' },
  { bg: '#059669', fg: '#ffffff', label: 'خ' },
  { bg: '#9333ea', fg: '#ffffff', label: 'س' },
  { bg: '#ea580c', fg: '#ffffff', label: 'م' },
  { bg: '#0891b2', fg: '#ffffff', label: 'ن' },
  { bg: '#4f46e5', fg: '#ffffff', label: 'و' },
  { bg: '#db2777', fg: '#ffffff', label: 'ت' },
  { bg: '#16a34a', fg: '#ffffff', label: 'د' },
  { bg: '#ca8a04', fg: '#ffffff', label: 'ه' },
  { bg: '#475569', fg: '#ffffff', label: 'ی' },
  { bg: '#0f766e', fg: '#ffffff', label: 'ل' },
]

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  let sharpMod: any = null
  try { sharpMod = require('sharp') } catch {}
  for (let i = 0; i < PALETTE.length; i++) {
    const { bg, fg, label } = PALETTE[i]
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${shade(bg, -20)}"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" fill="url(#g)"/>
  <circle cx="128" cy="128" r="120" fill="${bg}" opacity="0.15"/>
  <text x="128" y="172" font-family="Tahoma, sans-serif" font-size="140" font-weight="bold" fill="${fg}" text-anchor="middle">${label}</text>
</svg>`
    if (sharpMod) {
      const buf = await sharpMod(Buffer.from(svg)).png().toBuffer()
      fs.writeFileSync(path.join(OUT_DIR, `avatar-${i + 1}.png`), buf)
    } else {
      fs.writeFileSync(path.join(OUT_DIR, `avatar-${i + 1}.svg`), svg)
    }
    console.log(`+ avatar ${i + 1} (${label})`)
  }
  // Write a manifest the frontend can import
  const ext = sharpMod ? 'png' : 'svg'
  const manifest = PALETTE.map((_, i) => `/avatars/avatar-${i + 1}.${ext}`)
  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  )
  console.log(`\n✅ ${PALETTE.length} avatars written to ${OUT_DIR}`)
}

/** Darken a hex color by `amt` (-255..255). */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) + amt
  let g = ((n >> 8) & 0xff) + amt
  let b = (n & 0xff) + amt
  r = Math.max(0, Math.min(255, r))
  g = Math.max(0, Math.min(255, g))
  b = Math.max(0, Math.min(255, b))
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

main().catch((e) => { console.error(e); process.exit(1) })
