const LANG_FILE = {
  html: 'index.html',
  css: 'style.css',
  javascript: 'script.js',
  js: 'script.js',
  jsx: 'App.jsx',
  tsx: 'App.tsx',
  typescript: 'main.ts',
  ts: 'main.ts',
  python: 'main.py',
  py: 'main.py',
  json: 'data.json',
  markdown: 'README.md',
  md: 'README.md',
  sql: 'query.sql',
  bash: 'run.sh',
  sh: 'run.sh',
}

const FILE_HINT = /(?:file(?:name)?|path)\s*[:=]\s*([\w./\\-]+\.\w+)/i
const LOOKS_LIKE_FILE = /^[\w./\\-]+\.\w+$/

const cleanPath = (p) =>
  p
    .replace(/\\/g, '/')
    .split('/')
    .filter((seg) => seg && seg !== '.' && seg !== '..')
    .join('/')

const uniquePath = (taken, path) => {
  if (!taken.has(path.toLowerCase())) return path
  const dot = path.lastIndexOf('.')
  const base = dot > 0 ? path.slice(0, dot) : path
  const ext = dot > 0 ? path.slice(dot) : ''
  let i = 2
  while (taken.has(`${base}-${i}${ext}`.toLowerCase())) i++
  return `${base}-${i}${ext}`
}

/**
 * Accepts the raw AI response (markdown with ``` fences) or plain code.
 * Returns [{ path, content }].
 * File names are read from: ```html index.html  |  first-line comment "filename: x.js"  |  language default.
 */
export default function parseGenerated(text) {
  if (!text || !text.trim()) return []
  const files = []
  const taken = new Set()
  const fence = /```([\w+#-]*)([^\n]*)\n([\s\S]*?)```/g
  let m

  while ((m = fence.exec(text))) {
    const lang = (m[1] || '').toLowerCase()
    const info = (m[2] || '').trim()
    let content = m[3].replace(/\s+$/, '') + '\n'
    let name = ''

    const infoToken = info.split(/\s+/).find((t) => LOOKS_LIKE_FILE.test(t))
    if (infoToken) name = infoToken

    if (!name) {
      const firstLine = content.split('\n')[0]
      const hint = firstLine.match(FILE_HINT)
      if (hint) {
        name = hint[1]
        content = content.split('\n').slice(1).join('\n')
      }
    }

    if (!name) name = LANG_FILE[lang] || 'snippet.txt'
    const path = uniquePath(taken, cleanPath(name) || 'snippet.txt')
    taken.add(path.toLowerCase())
    files.push({ path, content })
  }

  if (!files.length) {
    const body = text.trim() + '\n'
    files.push({ path: /^\s*</.test(body) ? 'index.html' : 'script.js', content: body })
  }
  return files
}