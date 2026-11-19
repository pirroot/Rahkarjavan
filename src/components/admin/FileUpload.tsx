'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, Loader2, Link as LinkIcon, FileVideo, FileImage } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  value: string
  onChange: (url: string, meta?: { key?: string; bucket?: string; size?: number; mimeType?: string }) => void
  folder?: string // 'videos' | 'images' | 'covers'
  accept?: string
  label?: string
  hint?: string
  showUrlInput?: boolean
  preview?: 'image' | 'video' | 'none'
  className?: string
}

export function FileUpload({
  value,
  onChange,
  folder = 'images',
  accept = 'image/*',
  label = 'آپلود فایل',
  hint,
  showUrlInput = true,
  preview = 'none',
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const r = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error || 'خطا در آپلود')
      onChange(json.file.url, {
        key: json.file.key,
        bucket: json.file.bucket,
        size: json.file.size,
        mimeType: json.file.mimeType,
      })
      toast.success(`فایل با موفقیت آپلود شد (${Math.round(json.file.size / 1024)} کیلوبایت)`)
    } catch (e: any) {
      toast.error(e.message || 'خطا در آپلود')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-sm font-medium">{label}</label>}

      {/* Preview */}
      {value && preview === 'image' && (
        <div className="relative w-full max-w-xs aspect-video rounded-md overflow-hidden bg-secondary border border-border">
          <img src={value} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white hover:bg-destructive flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {value && preview === 'video' && (
        <div className="relative w-full max-w-md aspect-video rounded-md overflow-hidden bg-black">
          <video src={value} controls className="w-full h-full" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white hover:bg-destructive flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          'border-2 border-dashed rounded-md p-4 text-center transition-colors cursor-pointer',
          uploading ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/30'
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-primary py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">در حال آپلود...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              فایل را اینجا رها کنید یا کلیک کنید
            </span>
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          </div>
        )}
      </div>

      {/* URL input toggle */}
      {showUrlInput && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowUrl(!showUrl)}
            className="text-xs h-7"
          >
            <LinkIcon className="h-3 w-3 ml-1" />
            یا URL وارد کنید
          </Button>
        </div>
      )}

      {showUrl && showUrlInput && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          dir="ltr"
        />
      )}

      {value && !showUrl && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          dir="ltr"
          className="text-xs font-mono"
        />
      )}
    </div>
  )
}
