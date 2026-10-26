import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

export default function MarkdownRenderer({ content = '' }) {
  return (
    <div className="prose prose-invert max-w-none text-sm text-[#F8FAFC] leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const value = String(children).replace(/\n$/, '');
            if (!inline && (match || value.includes('\n'))) {
              return (
                <CodeBlock
                  language={match ? match[1] : 'plaintext'}
                  value={value}
                />
              );
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-[#151C30] text-[#22D3EE] font-mono text-xs border border-white/5"
                {...props}
              >
                {children}
              </code>
            );
          },
          h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-white mt-3 mb-1">{children}</h3>,
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-[#9CA8C5]">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#7959F5] pl-4 italic text-[#9CA8C5] my-2 bg-[#151C30]/50 py-1 rounded-r-lg">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full divide-y divide-white/10 text-xs text-left border border-white/10 rounded-lg">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 bg-[#11182A] text-white font-semibold border-b border-white/10">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-white/5 text-[#9CA8C5]">{children}</td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#22D3EE] underline hover:text-[#7959F5] transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
