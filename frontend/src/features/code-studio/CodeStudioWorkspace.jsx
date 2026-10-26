import { useCallback, useEffect, useMemo, useState } from 'react'
import useFileSystem from './useFileSystem'
import parseGenerated from './parseGenerated'
import FileExplorer, { Icon } from './FileExplorer'
import CodeEditor from './CodeEditor'
import './codeStudio.css'

const langOf = (name = '') => {
  const ext = name.split('.').pop().toLowerCase()
  return (
    { html: 'HTML', css: 'CSS', js: 'JavaScript', jsx: 'JSX', ts: 'TypeScript', tsx: 'TSX', json: 'JSON', py: 'Python', md: 'Markdown', sql: 'SQL', sh: 'Shell' }[ext] ||
    'Plain text'
  )
}

const resolvePath = (baseDir, href) => {
  try {
    return decodeURIComponent(new URL(href, 'http://x/' + baseDir).pathname.slice(1)).toLowerCase()
  } catch {
    return href.toLowerCase()
  }
}

/** Builds a single HTML document from the project files so it can run in an iframe. */
function buildPreview(files) {
  const byPath = new Map(files.map((f) => [f.path.toLowerCase(), f]))
  const htmlFile =
    files.find((f) => f.path.toLowerCase() === 'index.html') ||
    files.find((f) => /\.html?$/i.test(f.path))

  const cssAll = files.filter((f) => /\.css$/i.test(f.path)).map((f) => f.content).join('\n')
  const jsAll = files.filter((f) => /\.js$/i.test(f.path)).map((f) => f.content).join('\n;\n')

  if (!htmlFile) {
    if (!cssAll && !jsAll) return null
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${cssAll}</style></head><body><script>${jsAll.replace(/<\/script/gi, '<\\/script')}<\/script></body></html>`
  }

  const slash = htmlFile.path.lastIndexOf('/')
  const baseDir = slash >= 0 ? htmlFile.path.slice(0, slash + 1) : ''
  let html = htmlFile.content

  html = html.replace(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi, (tag, href) => {
    if (!/rel=["']stylesheet["']/i.test(tag) || /^(https?:)?\/\//i.test(href)) return tag
    const f = byPath.get(resolvePath(baseDir, href))
    return f ? `<style>\n${f.content}\n</style>` : tag
  })

  html = html.replace(/<script\b([^>]*)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, a, src, b) => {
    if (/^(https?:)?\/\//i.test(src)) return tag
    const f = byPath.get(resolvePath(baseDir, src))
    return f ? `<script${a}${b}>\n${f.content.replace(/<\/script/gi, '<\\/script')}\n<\/script>` : tag
  })

  return html
}

export default function CodeStudioWorkspace({ generatedCode = '', onFilesChange }) {
  const fs = useFileSystem()
  const [openIds, setOpenIds] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [showPreview, setShowPreview] = useState(true)
  const [srcDoc, setSrcDoc] = useState('')
  const [runKey, setRunKey] = useState(0)
  const [prompt, setPrompt] = useState('')

  const openFile = useCallback((id) => {
    if (!id) return
    setOpenIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setActiveId(id)
  }, [])

  // open the first file on first load
  useEffect(() => {
    if (!activeId) {
      const first = fs.nodes.find((n) => n.type === 'file' && !n.parentId)
      if (first) openFile(first.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // AI generated code -> files (no manual copy/paste)
  useEffect(() => {
    if (!generatedCode || !generatedCode.trim()) return
    const ids = fs.importFiles(parseGenerated(generatedCode))
    if (ids.length) {
      setOpenIds((prev) => [...new Set([...prev, ...ids])])
      setActiveId(ids[0])
      setSelectedId(ids[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedCode])

  const closeTab = (id) => {
    setOpenIds((prev) => {
      const next = prev.filter((x) => x !== id)
      if (activeId === id) setActiveId(next[next.length - 1] || null)
      return next
    })
  }
  const handleDelete = (node) => {
    const what = node.type === 'folder' ? `folder "${node.name}" and everything inside it` : `"${node.name}"`
    if (!window.confirm(`Delete ${what}? This can\u2019t be undone.`)) return
    const removed = fs.deleteNode(node.id)
    setOpenIds((prev) => {
      const next = prev.filter((x) => !removed.includes(x))
      if (removed.includes(activeId)) setActiveId(next[next.length - 1] || null)
      return next
    })
    if (removed.includes(selectedId)) setSelectedId(null)
  }

  // live preview (debounced)
  useEffect(() => {
    if (!showPreview) return
    const t = setTimeout(() => {
      const doc = buildPreview(fs.allFiles())
      setSrcDoc(doc || '')
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fs.nodes, showPreview, runKey])

  useEffect(() => {
    if (onFilesChange) onFilesChange(fs.allFiles())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fs.nodes])

  const active = activeId ? fs.getNode(activeId) : null
  const tabs = useMemo(
    () => openIds.map((id) => fs.getNode(id)).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openIds, fs.nodes]
  )

  const downloadActive = () => {
    if (!active) return
    const url = URL.createObjectURL(new Blob([active.content], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = active.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const openInBrowser = () => {
    if (!srcDoc) return
    const blob = new Blob([srcDoc], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    URL.revokeObjectURL(url)
  }

  return (
    <section className={`cs-root${showPreview ? ' has-preview' : ''}`}>
      <FileExplorer
        fs={fs}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onOpen={openFile}
        onDelete={handleDelete}
      />

      <div className="cs-main">
        <div className="cs-tabbar">
          <div className="cs-tabs" role="tablist">
            {tabs.map((t) => (
              <div
                key={t.id}
                role="tab"
                aria-selected={t.id === activeId}
                className={`cs-tab${t.id === activeId ? ' is-active' : ''}`}
                onClick={() => {
                  setActiveId(t.id)
                  setSelectedId(t.id)
                }}
              >
                <span>{t.name}</span>
                <button
                  type="button"
                  aria-label={`Close ${t.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(t.id)
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="cs-toolbar">
            <button type="button" onClick={downloadActive} disabled={!active} title="Download this file">
              Download
            </button>
            <button type="button" onClick={() => setRunKey((k) => k + 1)} title="Re-run preview">
              Run
            </button>
            <button type="button" onClick={() => setShowPreview((v) => !v)} aria-pressed={showPreview}>
              {showPreview ? 'Hide preview' : 'Show preview'}
            </button>
            <button type="button" onClick={openInBrowser} disabled={!srcDoc} title="Open output in browser">
              Open in browser
            </button>
            <button
              type="button"
              className="is-danger"
              onClick={() => window.confirm('Reset the project to the starter files? All current files will be deleted.') && (fs.reset(), setOpenIds([]), setActiveId(null), setSelectedId(null))}
            >
              Reset
            </button>
          </div>
        </div>

        {active && active.type === 'file' ? (
          <>
            <CodeEditor value={active.content} onChange={(v) => fs.updateContent(active.id, v)} />
            <footer className="cs-status">
              <span>{fs.pathOf(active.id)}</span>
              <span>{langOf(active.name)}</span>
              <span>Autosaved</span>
            </footer>
            <section className="cs-prompt">
              <label htmlFor="cs-prompt-input">Prompt</label>
              <textarea
                id="cs-prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type a prompt or notes here..."
                rows={3}
                spellCheck={false}
              />
            </section>
          </>
        ) : (
          <div className="cs-placeholder">
            <p>Open a file from the list, or create one with <Icon name="newFile" /> to start writing code.</p>
          </div>
        )}
      </div>

      {showPreview && (
        <div className="cs-preview">
          <div className="cs-preview-head"><span className="cs-panel-title">Preview</span></div>
          {srcDoc ? (
            <iframe
              key={runKey}
              title="Live preview"
              className="cs-frame"
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              srcDoc={srcDoc}
            />
          ) : (
            <div className="cs-placeholder">
              <p>Add an <code>index.html</code> (or a .css / .js file) to see a live preview.</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
