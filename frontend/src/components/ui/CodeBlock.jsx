import React, { useState } from 'react';
import { Check, Copy, FileCode2 } from 'lucide-react';

export default function CodeBlock({ language = 'plaintext', value = '', filename, showLineNumbers = true }) {
  const [copied, setCopied] = useState(false);

  // If first line starts with `// filename.ext` or `/* filename.ext */`, extract it
  let detectedFilename = filename;
  let codeContent = value;
  const firstLineMatch = value.match(/^(?:\/\/\s*|\/\*\s*)([a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+)(?:\s*\*\/)?\n/);
  if (!detectedFilename && firstLineMatch) {
    detectedFilename = firstLineMatch[1];
    codeContent = value.replace(firstLineMatch[0], '');
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = codeContent.split('\n');

  return (
    <div className="relative rounded-2xl overflow-hidden bg-[#0A101F] border border-[#1E2C48] my-3.5 font-mono text-xs shadow-lg">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F182E] border-b border-[#1A2742] text-[#9CA8C5]">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span className="font-semibold text-white tracking-wide text-[11px]">
            {detectedFilename || language.toUpperCase()}
          </span>
          {detectedFilename && (
            <span className="text-[10px] uppercase tracking-wider text-[#64748B] bg-white/5 px-1.5 py-0.5 rounded">
              {language}
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#6046F5]/20 hover:text-[#A78BFA] text-white transition-all text-[11px] font-medium"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content with Line Numbers */}
      <div className="overflow-x-auto p-4 text-[#F1F5F9] leading-relaxed selection:bg-[#6046F5]/30">
        <pre className="flex">
          {showLineNumbers && (
            <div className="select-none pr-4 text-[#475569] text-right font-mono border-r border-[#19243C] mr-4" aria-hidden="true">
              {lines.map((_, i) => (
                <div key={i} className="text-[11px] text-[#475569]">{i + 1}</div>
              ))}
            </div>
          )}
          <code className="flex-1 whitespace-pre font-mono text-[12px]">{codeContent}</code>
        </pre>
      </div>
    </div>
  );
}

