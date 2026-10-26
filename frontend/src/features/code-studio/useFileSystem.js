import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'aitechhub.codeStudio.fs.v1'
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3)

const starterNodes = () => {
  const mk = (name, content) => ({ id: uid(), parentId: null, type: 'file', name, content })
  return [
    mk(
      'index.html',
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1 id="title">Hello, Code Studio</h1>
  <button id="btn">Click me</button>
  <script src="script.js"></script>
</body>
</html>
`
    ),
    mk(
      'style.css',
      `body {
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin: 0;
}
`
    ),
    mk(
      'script.js',
      `document.getElementById('btn').addEventListener('click', () => {
  document.getElementById('title').textContent = 'You clicked it!'
})
`
    ),
  ]
}

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.every((n) => n && n.id && n.name && n.type)) return parsed
    }
  } catch {
    /* ignore corrupt storage */
  }
  return starterNodes()
}

export const validateName = (name) => {
  const n = (name || '').trim()
  if (!n) return 'Name is required.'
  if (n === '.' || n === '..') return 'Invalid name.'
  if (/[\\/:*?"<>|]/.test(n)) return 'Name can\u2019t contain \\ / : * ? " < > |'
  if (n.length > 100) return 'Name is too long.'
  return null
}

const sortNodes = (a, b) => {
  if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
}

export default function useFileSystem() {
  const [nodes, setNodes] = useState(load)
  const nodesRef = useRef(nodes)
  nodesRef.current = nodes

  // persist (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes))
      } catch {
        /* storage full or unavailable */
      }
    }, 300)
    return () => clearTimeout(t)
  }, [nodes])

  const commit = useCallback((next) => {
    nodesRef.current = next
    setNodes(next)
  }, [])

  const childrenOf = useCallback(
    (parentId) => nodesRef.current.filter((n) => n.parentId === parentId).sort(sortNodes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes]
  )
  const getNode = useCallback((id) => nodesRef.current.find((n) => n.id === id) || null, [])

  const pathOf = useCallback((id) => {
    const list = nodesRef.current
    const parts = []
    let cur = list.find((n) => n.id === id)
    while (cur) {
      parts.unshift(cur.name)
      cur = cur.parentId ? list.find((n) => n.id === cur.parentId) : null
    }
    return parts.join('/')
  }, [])

  const nameTaken = (list, parentId, name, ignoreId) =>
    list.some(
      (n) =>
        n.parentId === parentId &&
        n.id !== ignoreId &&
        n.name.toLowerCase() === name.toLowerCase()
    )

  const createNode = useCallback(
    ({ parentId = null, type = 'file', name, content = '' }) => {
      const clean = (name || '').trim()
      const err = validateName(clean)
      if (err) return { ok: false, error: err }
      const list = nodesRef.current
      if (nameTaken(list, parentId, clean)) {
        return { ok: false, error: `"${clean}" already exists here.` }
      }
      const node = { id: uid(), parentId, type, name: clean, content: type === 'file' ? content : '' }
      commit([...list, node])
      return { ok: true, id: node.id }
    },
    [commit]
  )

  const renameNode = useCallback(
    (id, name) => {
      const clean = (name || '').trim()
      const err = validateName(clean)
      if (err) return { ok: false, error: err }
      const list = nodesRef.current
      const target = list.find((n) => n.id === id)
      if (!target) return { ok: false, error: 'Not found.' }
      if (nameTaken(list, target.parentId, clean, id)) {
        return { ok: false, error: `"${clean}" already exists here.` }
      }
      commit(list.map((n) => (n.id === id ? { ...n, name: clean } : n)))
      return { ok: true }
    },
    [commit]
  )

  const deleteNode = useCallback(
    (id) => {
      const list = nodesRef.current
      const doomed = new Set([id])
      let grew = true
      while (grew) {
        grew = false
        for (const n of list) {
          if (n.parentId && doomed.has(n.parentId) && !doomed.has(n.id)) {
            doomed.add(n.id)
            grew = true
          }
        }
      }
      commit(list.filter((n) => !doomed.has(n.id)))
      return [...doomed]
    },
    [commit]
  )

  const updateContent = useCallback(
    (id, content) => {
      commit(nodesRef.current.map((n) => (n.id === id ? { ...n, content } : n)))
    },
    [commit]
  )

  /** files: [{ path: 'src/app.js', content: '...' }] -> creates folders, overwrites same path. Returns file ids. */
  const importFiles = useCallback(
    (files) => {
      const next = nodesRef.current.map((n) => ({ ...n }))
      const ids = []
      const ensureFolder = (parentId, name) => {
        let f = next.find(
          (n) => n.parentId === parentId && n.type === 'folder' && n.name.toLowerCase() === name.toLowerCase()
        )
        if (!f) {
          f = { id: uid(), parentId, type: 'folder', name, content: '' }
          next.push(f)
        }
        return f.id
      }
      for (const file of files) {
        const parts = file.path.split('/').filter(Boolean)
        if (!parts.length) continue
        const fileName = parts.pop()
        let parentId = null
        for (const p of parts) parentId = ensureFolder(parentId, p)
        const existing = next.find(
          (n) => n.parentId === parentId && n.type === 'file' && n.name.toLowerCase() === fileName.toLowerCase()
        )
        if (existing) {
          existing.content = file.content
          ids.push(existing.id)
        } else {
          const node = { id: uid(), parentId, type: 'file', name: fileName, content: file.content }
          next.push(node)
          ids.push(node.id)
        }
      }
      commit(next)
      return ids
    },
    [commit]
  )

  const allFiles = useCallback(
    () =>
      nodesRef.current
        .filter((n) => n.type === 'file')
        .map((n) => ({ id: n.id, path: pathOf(n.id), content: n.content })),
    [pathOf]
  )

  const reset = useCallback(() => commit(starterNodes()), [commit])

  return {
    nodes,
    childrenOf,
    getNode,
    pathOf,
    createNode,
    renameNode,
    deleteNode,
    updateContent,
    importFiles,
    allFiles,
    reset,
  }
}