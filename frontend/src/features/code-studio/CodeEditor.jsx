import { useRef } from 'react'

export default function CodeEditor({ value, onChange, readOnly = false }) {
  const taRef = useRef(null)
  const gutterRef = useRef(null)
  const lines = value.split('\n').length

  const syncScroll = () => {
    if (gutterRef.current && taRef.current) gutterRef.current.scrollTop = taRef.current.scrollTop
  }

  const apply = (next, caret) => {
    onChange(next)
    requestAnimationFrame(() => {
      const el = taRef.current
      if (el) el.setSelectionRange(caret, caret)
    })
  }

  const onKeyDown = (e) => {
    const el = e.currentTarget
    const { selectionStart: s, selectionEnd: end } = el

    if (e.key === 'Tab') {
      e.preventDefault()
      apply(value.slice(0, s) + '  ' + value.slice(end), s + 2)
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const lineStart = value.lastIndexOf('\n', s - 1) + 1
      const indent = (value.slice(lineStart, s).match(/^[ \t]*/) || [''])[0]
      const prev = value[s - 1]
      const extra = prev === '{' || prev === '(' || prev === '[' ? '  ' : ''
      const insert = '\n' + indent + extra
      apply(value.slice(0, s) + insert + value.slice(end), s + insert.length)
    }
  }

  return (
    <div className="cs-editor">
      <div className="cs-gutter" ref={gutterRef} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={taRef}
        className="cs-textarea"
        value={value}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
        aria-label="Code editor"
      />
    </div>
  )
}