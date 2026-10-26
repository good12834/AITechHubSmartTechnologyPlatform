import { useEffect, useRef, useState } from 'react'

const ICONS = {
  file: 'M6 2h8l4 4v16H6zM14 2v4h4',
  folder: 'M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  chevron: 'M9 6l6 6-6 6',
  newFile: 'M6 2h8l4 4v16H6zM14 2v4h4M12 11v6M9 14h6',
  newFolder: 'M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 10v6M9 13h6',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
}

export function Icon({ name, size = 14 }) {
  return (
    <svg
      className="cs-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  )
}

function NameInput({ initial = '', onSubmit, onCancel, depth }) {
  const ref = useRef(null)
  const [value, setValue] = useState(initial)
  const [error, setError] = useState('')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    const dot = initial.lastIndexOf('.')
    el.setSelectionRange(0, dot > 0 ? dot : initial.length)
  }, [initial])

  const submit = () => {
    const err = onSubmit(value)
    if (err) setError(err)
  }

  return (
    <div className="cs-row cs-row--input" style={{ paddingLeft: depth * 14 + 8 }}>
      <input
        ref={ref}
        className={`cs-name-input${error ? ' is-error' : ''}`}
        value={value}
        spellCheck={false}
        onChange={(e) => {
          setValue(e.target.value)
          setError('')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={onCancel}
        aria-label="Name"
      />
      {error && <div className="cs-name-error" role="alert">{error}</div>}
    </div>
  )
}

function Row({ node, depth, ctx }) {
  const { fs, selectedId, expanded, toggle, renamingId, setRenamingId, creating, startCreate, onSelect, onOpen, onDelete } = ctx
  const isFolder = node.type === 'folder'
  const isOpen = expanded.has(node.id)

  if (renamingId === node.id) {
    return (
      <NameInput
        depth={depth}
        initial={node.name}
        onCancel={() => setRenamingId(null)}
        onSubmit={(name) => {
          if (name.trim() === node.name) {
            setRenamingId(null)
            return null
          }
          const r = fs.renameNode(node.id, name)
          if (r.ok) setRenamingId(null)
          return r.ok ? null : r.error
        }}
      />
    )
  }

  return (
    <>
      <div
        className={`cs-row${selectedId === node.id ? ' is-selected' : ''}`}
        style={{ paddingLeft: depth * 14 + 8 }}
        role="treeitem"
        aria-expanded={isFolder ? isOpen : undefined}
        tabIndex={0}
        onClick={() => {
          onSelect(node.id)
          if (isFolder) toggle(node.id)
          else onOpen(node.id)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSelect(node.id)
            if (isFolder) toggle(node.id)
            else onOpen(node.id)
          }
          if (e.key === 'F2') setRenamingId(node.id)
          if (e.key === 'Delete') onDelete(node)
        }}
      >
        <span className={`cs-chev${isFolder ? '' : ' is-hidden'}${isOpen ? ' is-open' : ''}`}>
          <Icon name="chevron" size={12} />
        </span>
        <span className={isFolder ? 'cs-ico-folder' : 'cs-ico-file'}>
          <Icon name={isFolder ? 'folder' : 'file'} />
        </span>
        <span className="cs-row-name" title={fs.pathOf(node.id)}>{node.name}</span>
        <span className="cs-row-actions" onClick={(e) => e.stopPropagation()}>
          {isFolder && (
            <>
              <button type="button" title="New file" onClick={() => startCreate(node.id, 'file')}>
                <Icon name="newFile" />
              </button>
              <button type="button" title="New folder" onClick={() => startCreate(node.id, 'folder')}>
                <Icon name="newFolder" />
              </button>
            </>
          )}
          <button type="button" title="Rename (F2)" onClick={() => setRenamingId(node.id)}>
            <Icon name="pencil" />
          </button>
          <button type="button" title="Delete" className="is-danger" onClick={() => onDelete(node)}>
            <Icon name="trash" />
          </button>
        </span>
      </div>
      {isFolder && isOpen && (
        <>
          {creating && creating.parentId === node.id && (
            <CreateRow depth={depth + 1} ctx={ctx} />
          )}
          {fs.childrenOf(node.id).map((child) => (
            <Row key={child.id} node={child} depth={depth + 1} ctx={ctx} />
          ))}
        </>
      )}
    </>
  )
}

function CreateRow({ depth, ctx }) {
  const { fs, creating, setCreating, expandNode, onSelect, onOpen } = ctx
  return (
    <NameInput
      depth={depth}
      onCancel={() => setCreating(null)}
      onSubmit={(name) => {
        const r = fs.createNode({ parentId: creating.parentId, type: creating.type, name })
        if (!r.ok) return r.error
        if (creating.parentId) expandNode(creating.parentId)
        setCreating(null)
        onSelect(r.id)
        if (creating.type === 'file') onOpen(r.id)
        return null
      }}
    />
  )
}

export default function FileExplorer({ fs, selectedId, onSelect, onOpen, onDelete }) {
  const [expanded, setExpanded] = useState(() => new Set())
  const [renamingId, setRenamingId] = useState(null)
  const [creating, setCreating] = useState(null) // { parentId, type }

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const expandNode = (id) => setExpanded((prev) => new Set(prev).add(id))

  const startCreate = (parentId, type) => {
    if (parentId) expandNode(parentId)
    setRenamingId(null)
    setCreating({ parentId, type })
  }

  // new items go into the selected folder, or next to the selected file
  const targetParent = () => {
    const sel = selectedId ? fs.getNode(selectedId) : null
    if (!sel) return null
    return sel.type === 'folder' ? sel.id : sel.parentId
  }

  const ctx = {
    fs, selectedId, expanded, toggle, expandNode, renamingId, setRenamingId,
    creating, setCreating, startCreate, onSelect, onOpen, onDelete,
  }

  const roots = fs.childrenOf(null)

  return (
    <aside className="cs-explorer" aria-label="Project files">
      <header className="cs-explorer-head">
        <span className="cs-panel-title">Files</span>
        <span className="cs-explorer-tools">
          <button type="button" title="New file" onClick={() => startCreate(targetParent(), 'file')}>
            <Icon name="newFile" size={15} />
          </button>
          <button type="button" title="New folder" onClick={() => startCreate(targetParent(), 'folder')}>
            <Icon name="newFolder" size={15} />
          </button>
        </span>
      </header>

      <div className="cs-tree" role="tree" onClick={(e) => e.target === e.currentTarget && onSelect(null)}>
        {creating && creating.parentId === null && <CreateRow depth={0} ctx={ctx} />}
        {roots.map((n) => (
          <Row key={n.id} node={n} depth={0} ctx={ctx} />
        ))}
        {!roots.length && !creating && (
          <p className="cs-empty">No files yet. Use the buttons above to create a file or folder.</p>
        )}
      </div>
    </aside>
  )
}