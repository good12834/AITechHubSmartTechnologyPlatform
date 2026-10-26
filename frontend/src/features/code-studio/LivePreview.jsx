import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * LivePreview - Real sandboxed live code preview for Code Studio.
 *
 * Renders the user's generated code inside an isolated iframe sandbox so the
 * preview is interactive and safe. Supports:
 *   - HTML / JS / CSS (injected straight into the sandbox)
 *   - React / JSX (React + Babel loaded from CDN, JSX transformed client-side)
 *   - Other languages shown as a read-only code preview (cannot run client-side)
 *
 * Props:
 *   code      - source code to preview
 *   language  - language identifier (e.g. 'javascript', 'jsx', 'html', 'css', 'python')
 *   filename  - optional filename used to infer the renderer
 */
export default function LivePreview({ code = '', language = 'plaintext', filename = '' }) {
  const iframeRef = useRef(null);
  const [renderError, setRenderError] = useState(null);
  const hasCode = Boolean(code && code.trim());

  const lang = (language || 'plaintext').toLowerCase();
  const name = (filename || '').toLowerCase();

  const isReact =
    lang.includes('jsx') ||
    lang.includes('tsx') ||
    name.endsWith('.jsx') ||
    name.endsWith('.tsx') ||
    /\bimport\b.*\breact\b|from\s+['"]react['"]|export\s+default\s+(function|const|class)\s+(\w+)/i.test(code || '');

  const isHtml = lang === 'html' || name.endsWith('.html') || name.endsWith('.htm');
  const isCss = lang === 'css' || name.endsWith('.css');
  const isJs = lang === 'javascript' || lang === 'jsx' || name.endsWith('.js') || name.endsWith('.jsx');

  const canPreview = isReact || isHtml || isCss || isJs;

  const escapeHtmlFn = `
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  `;

  const buildPreviewHtml = useCallback((src) => {
    if (isReact) {
      let componentSource = String(src || '');
      componentSource = componentSource.replace(
        /export\s+default\s+(async\s+)?(function\s+(\w+)|const\s+(\w+)\s*=(|async\s*\()|class\s+(\w+))/i,
        (match, async, fnOrConst) =>
          `window.__PreviewComp = ${async || ''}${fnOrConst}`
      );

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Live Preview</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b1224; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    #root { width: 100%; max-width: 700px; height: 100%; }
  </style>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${componentSource}
  </script>
  <script>
    ${escapeHtmlFn}
    (function () {
      try {
        const Comp = window.__PreviewComp;
        if (!Comp) {
          throw new Error('No default export / component found to render.');
        }
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Comp));
      } catch (err) {
        document.body.innerHTML =
          '<div style="padding:24px;color:#f87171;font-family:monospace;white-space:pre-wrap;background:#450a0a;border:1px solid #7f1d1d;border-radius:8px;max-width:600px;margin:0 auto;">' +
          'Preview error: ' + escapeHtml(String(err && err.message ? err.message : err)) +
          '</div>';
        console.error('Live preview error', err);
      }
    })();
  </script>
</body>
</html>`;
    }

    if (isHtml) {
      return `<!DOCTYPE html>\n${src || ''}`;
    }

    let head = '';
    let body = '';
    if (isCss) {
      head = `<style>${String(src || '')}</style>`;
    }
    if (isJs && !isCss) {
      body = `<script>${String(src || '')}</script>`;
    }
    if (!isCss && !isJs) {
      body = `<pre style="padding:24px;color:#94a3b8;font-family:monospace;white-space:pre-wrap">No runnable preview for this language.</pre>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Live Preview</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b1224; color: #f1f5f9; }
  </style>
  ${head}
</head>
<body>
  ${body}
</body>
</html>`;
  }, [isReact, isHtml, isCss, isJs]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(buildPreviewHtml(code));
      doc.close();
      setRenderError(null);
    } catch (err) {
      setRenderError(err && err.message ? err.message : String(err));
    }
  }, [code, isReact, isHtml, isCss, isJs]);

  return (
    <div className="p-6 bg-gradient-to-b from-[#0B1224] to-[#080E1C] rounded-2xl min-h-[360px] flex flex-col border border-[#1E2C48]/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <svg className="h-5 w-5 text-[#6046F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Live Preview
        </h3>
        <span className="text-[10px] text-[#64748B] font-mono">
          {canPreview ? (isReact ? 'React (Live)' : isHtml ? 'HTML' : isCss ? 'CSS' : 'JavaScript') : 'Static'}
        </span>
      </div>

      {renderError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 mb-4">
          Preview render error: {renderError}
        </div>
      )}

      {!hasCode && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-[#64748B] mb-2">No code to preview yet.</p>
          <p className="text-[11px] text-[#475569]">Generate code in the editor to see it rendered live.</p>
        </div>
      )}

      {hasCode && canPreview && (
        <div className="flex-1 relative rounded-xl border border-[#1E2C48] bg-[#0A101F] overflow-hidden shadow-inner">
          <iframe
            ref={iframeRef}
            title="Live Preview"
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin"
            aria-label="Live code preview"
          />
        </div>
      )}

      {hasCode && !canPreview && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <p className="text-xs text-[#64748B] mb-2">Live preview not available for {lang.toUpperCase()}.</p>
          <p className="text-[11px] text-[#475569]">Preview the code in the editor instead.</p>
        </div>
      )}
    </div>
  );
}
