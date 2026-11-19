// Markdown <-> HTML conversion utilities
// پایگاه خبری راهکار جوان

// Simple markdown to HTML converter
// Supports: headings, bold, italic, lists, links, images, quotes, code, hr
export function markdownToHtml(markdown: string): string {
  if (!markdown) return ''

  let html = markdown

  // Code blocks (must be first to protect content)
  const codeBlocks: string[] = []
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length
    codeBlocks.push(`<pre class="code-block"><code class="language-${lang || 'txt'}">${escapeHtml(code.trim())}</code></pre>`)
    return `\u0000CODEBLOCK${idx}\u0000`
  })

  // Headings (h1-h6)
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr/>')

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Images: ![alt](src)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Lists (unordered)
  html = html.replace(/(?:^|\n)((?:- .+\n?)+)/g, (match, list) => {
    const items = list.trim().split('\n').map((line: string) => {
      return `<li>${line.replace(/^-\s+/, '')}</li>`
    }).join('')
    return `\n<ul>${items}</ul>\n`
  })

  // Lists (ordered)
  html = html.replace(/(?:^|\n)((?:\d+\. .+\n?)+)/g, (match, list) => {
    const items = list.trim().split('\n').map((line: string) => {
      return `<li>${line.replace(/^\d+\.\s+/, '')}</li>`
    }).join('')
    return `\n<ol>${items}</ol>\n`
  })

  // Tables (basic support)
  html = html.replace(/^\|(.+)\|\n\|[-| :]+\|\n((?:\|.*\|\n?)+)/gm, (_, header, rows) => {
    const headerCells = header.split('|').map((c: string) => c.trim()).filter(Boolean)
    const headerHtml = headerCells.map((c: string) => `<th>${c}</th>`).join('')
    const rowsHtml = rows.trim().split('\n').map((row: string) => {
      const cells = row.split('|').map((c: string) => c.trim()).filter(Boolean)
      return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join('')}</tr>`
    }).join('')
    return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`
  })

  // Paragraphs (lines that aren't already wrapped)
  html = html.split('\n\n').map((block) => {
    const trimmed = block.trim()
    if (!trimmed) return ''
    // Skip if already wrapped in HTML tag
    if (/^<(h[1-6]|ul|ol|blockquote|pre|hr|table|img|p|div)/i.test(trimmed)) {
      return trimmed
    }
    // Skip placeholder code blocks
    if (/^\u0000CODEBLOCK\d+\u0000$/.test(trimmed)) {
      return trimmed
    }
    // Wrap in <p>
    return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`
  }).join('\n')

  // Restore code blocks
  codeBlocks.forEach((block, idx) => {
    html = html.replace(`\u0000CODEBLOCK${idx}\u0000`, block)
  })

  return html
}

// Convert plain HTML to Markdown (lossy - for editing existing HTML content)
export function htmlToMarkdown(html: string): string {
  if (!html) return ''
  let md = html

  // Code blocks
  md = md.replace(/<pre(?:\s+class="[^"]*")?><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g, (_, lang, code) => {
    return `\`\`\`${lang || ''}\n${unescapeHtml(code)}\n\`\`\``
  })

  // Headings
  md = md.replace(/<h6[^>]*>(.+?)<\/h6>/gi, '###### $1\n')
  md = md.replace(/<h5[^>]*>(.+?)<\/h5>/gi, '##### $1\n')
  md = md.replace(/<h4[^>]*>(.+?)<\/h4>/gi, '#### $1\n')
  md = md.replace(/<h3[^>]*>(.+?)<\/h3>/gi, '### $1\n')
  md = md.replace(/<h2[^>]*>(.+?)<\/h2>/gi, '## $1\n')
  md = md.replace(/<h1[^>]*>(.+?)<\/h1>/gi, '# $1\n')

  // Horizontal rule
  md = md.replace(/<hr\s*\/?>/gi, '---\n')

  // Blockquote
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
    return content.trim().split('\n').map((line: string) => `> ${line.trim()}`).join('\n') + '\n'
  })

  // Bold and italic
  md = md.replace(/<strong><em>(.+?)<\/em><\/strong>/gi, '***$1***')
  md = md.replace(/<em><strong>(.+?)<\/strong><\/em>/gi, '***$1***')
  md = md.replace(/<strong>(.+?)<\/strong>/gi, '**$1**')
  md = md.replace(/<b>(.+?)<\/b>/gi, '**$1**')
  md = md.replace(/<em>(.+?)<\/em>/gi, '*$1*')
  md = md.replace(/<i>(.+?)<\/i>/gi, '*$1*')

  // Inline code
  md = md.replace(/<code>(.+?)<\/code>/gi, '`$1`')

  // Images
  md = md.replace(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
  md = md.replace(/<img[^>]*src="([^"]+)"[^>]*\/?>/gi, '![]($1)')

  // Links
  md = md.replace(/<a[^>]*href="([^"]+)"[^>]*target="_blank"[^>]*>(.+?)<\/a>/gi, '[$2]($1)')
  md = md.replace(/<a[^>]*href="([^"]+)"[^>]*>(.+?)<\/a>/gi, '[$2]($1)')

  // Lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, content) => {
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n').replace(/\n\n/g, '\n')
  })
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, content) => {
    let i = 1
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => `${i++}. $1\n`).replace(/\n\n/g, '\n')
  })

  // Tables (basic)
  md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, content) => {
    const headerMatch = content.match(/<thead[^>]*><tr[^>]*>([\s\S]*?)<\/tr><\/thead>/i)
    const bodyMatch = content.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
    let result = ''
    if (headerMatch) {
      const cells = headerMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || []
      const headers = cells.map((c: string) => c.replace(/<\/?th[^>]*>/gi, '').trim())
      result += `| ${headers.join(' | ')} |\n`
      result += `| ${headers.map(() => '---').join(' | ')} |\n`
    }
    if (bodyMatch) {
      const rows = bodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || []
      rows.forEach((row: string) => {
        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []
        const data = cells.map((c: string) => c.replace(/<\/?td[^>]*>/gi, '').trim())
        result += `| ${data.join(' | ')} |\n`
      })
    }
    return result
  })

  // Paragraphs and breaks
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
  md = md.replace(/<br\s*\/?>/gi, '\n')

  // Remove remaining tags
  md = md.replace(/<\/?div[^>]*>/gi, '')
  md = md.replace(/<\/?span[^>]*>/gi, '')

  // Clean up extra whitespace
  md = md.replace(/\n{3,}/g, '\n\n').trim()

  return md
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

// Calculate reading time (words / 200 wpm)
export function calculateReadingTime(content: string): number {
  if (!content) return 1
  // Strip HTML
  const text = content.replace(/<[^>]+>/g, ' ')
  // Count words (Persian + English)
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

// Generate meta description from content
export function generateMetaDescription(content: string, maxLength: number = 160): string {
  if (!content) return ''
  // Strip HTML and markdown
  let text = content.replace(/<[^>]+>/g, ' ')
  text = text.replace(/[#*`>_~\-\[\]()]/g, '')
  text = text.replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  // Truncate at word boundary
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength) + '...'
}

// Generate slug from title (Persian-aware)
export function generateSlug(title: string): string {
  return title
    .toString()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FF\w-]/g, '')
    .toLowerCase()
}
