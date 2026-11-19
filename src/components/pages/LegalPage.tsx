'use client'

import { useStore } from '@/lib/store'
import { useSettings } from '@/hooks/use-auth'
import { ChevronLeft } from 'lucide-react'

export function LegalPage() {
  const { navigate } = useStore()
  const settings = useSettings()
  const raw = settings.legal_text || ''

  // Render plain-text: line break = paragraph, "# " = h1, "- " = bullet
  const blocks = parseLegalText(raw)

  return (
    <div className="animate-fade-in">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('home')} className="hover:text-primary">راهکار جوان</button>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground">حریم خصوصی و قوانین</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-10">
          {blocks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              متن حریم خصوصی و قوانین هنوز توسط مدیر سایت تنظیم نشده است.
            </p>
          ) : (
            <div className="space-y-4 leading-8 text-foreground">
              {blocks.map((b, i) => {
                if (b.type === 'h1') return <h1 key={i} className="text-xl sm:text-2xl font-bold text-foreground">{b.text}</h1>
                if (b.type === 'li') return (
                  <ul key={i} className="list-disc pr-6 space-y-1 text-muted-foreground">
                    {b.items?.map((t, j) => <li key={j}>{t}</li>)}
                  </ul>
                )
                return <p key={i} className="text-muted-foreground">{b.text}</p>
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type Block =
  | { type: 'h1'; text: string }
  | { type: 'p'; text: string }
  | { type: 'li'; items: string[] }

// Group consecutive "- " lines into a single bullet list block.
function parseLegalText(text: string): Block[] {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd())
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2).trim() })
      i++
    } else if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2).trim())
        i++
      }
      blocks.push({ type: 'li', items })
    } else {
      blocks.push({ type: 'p', text: line.trim() })
      i++
    }
  }
  return blocks
}
