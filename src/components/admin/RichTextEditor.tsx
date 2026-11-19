'use client'

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  BoldItalicUnderlineToggles,
  toolbarPlugin,
  UndoRedo,
  ListsToggle,
  BlockTypeSelect,
  linkPlugin,
  LinkDialogToggle,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  InsertImage,
  InsertTable,
  CreateLink,
  Separator,
  frontmatterPlugin,
} from '@mdxeditor/editor'
import { forwardRef } from 'react'
import '@mdxeditor/editor/style.css'

interface RichTextEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  className?: string
}

export const RichTextEditor = forwardRef<any, RichTextEditorProps>(
  ({ value, onChange, placeholder = 'محتوای مطلب را اینجا بنویسید...', className }, _ref) => {
    return (
      <div className={`rich-text-editor-wrapper rounded-md border border-border bg-background ${className || ''}`}>
        <MDXEditor
          markdown={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            linkPlugin(),
            imagePlugin({
              imageUploadHandler: async (image: File) => {
                // Upload via our API
                const formData = new FormData()
                formData.append('file', image)
                formData.append('folder', 'article-content')
                const r = await fetch('/api/admin/upload', {
                  method: 'POST',
                  body: formData,
                })
                const json = await r.json()
                if (!r.ok) throw new Error(json.error || 'Upload failed')
                return json.file.url
              },
            }),
            tablePlugin(),
            codeBlockPlugin(),
            codeMirrorPlugin({
              codeBlockLanguages: {
                js: 'JavaScript',
                ts: 'TypeScript',
                tsx: 'TypeScript (React)',
                jsx: 'JavaScript (React)',
                css: 'CSS',
                html: 'HTML',
                json: 'JSON',
                bash: 'Bash',
                python: 'Python',
                sql: 'SQL',
                txt: 'Plain Text',
              },
            }),
            diffSourcePlugin(),
            frontmatterPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <Separator />
                  <BlockTypeSelect />
                  <BoldItalicUnderlineToggles />
                  <Separator />
                  <ListsToggle />
                  <Separator />
                  <CreateLink />
                  <InsertImage />
                  <InsertTable />
                </>
              ),
            }),
          ]}
          contentEditableClassName="prose prose-sm max-w-none dark:prose-invert min-h-[300px] px-4 py-3 focus:outline-none"
        />
      </div>
    )
  }
)

RichTextEditor.displayName = 'RichTextEditor'
