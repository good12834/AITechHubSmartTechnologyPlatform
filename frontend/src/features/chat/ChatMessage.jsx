import React, { useState } from 'react';
import {
  BrainCircuit,
  User,
  Copy,
  Check,
  CheckCheck,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from 'lucide-react';
import MarkdownRenderer from '../../components/ui/MarkdownRenderer';

export default function ChatMessage({ message, isStreaming = false, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const [rated, setRated] = useState(null); // 'good' | 'bad'
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatMessageTime = (dateStr) => {
    try {
      const d = dateStr ? new Date(dateStr) : new Date();
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '2:14 PM';
    }
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end mb-6 group">
        <div className="max-w-xl rounded-2xl rounded-tr-sm bg-[#6046F5] px-5 py-3.5 text-sm text-white shadow-lg shadow-[#6046F5]/25 leading-relaxed font-normal">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 px-1 text-[11px] text-[#64748B]">
          <span>{formatMessageTime(message.created_at)}</span>
          <CheckCheck className="w-3.5 h-3.5 text-[#22D3EE]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3.5 mb-6 max-w-4xl group">
      {/* AI Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6046F5] via-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white shadow-md shadow-[#6046F5]/30">
          <BrainCircuit className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Message Container */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl border border-[#1E2C48] bg-[#111D34] p-5 shadow-xl text-white leading-relaxed">
          {/* Header label */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1A2742]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">AI TechHub</span>
              {message.model && (
                <span className="text-[10px] font-medium text-[#A78BFA] bg-[#6046F5]/20 border border-[#6046F5]/30 px-2 py-0.5 rounded-full">
                  {message.model}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#64748B]">
              {formatMessageTime(message.created_at)}
            </span>
          </div>

          {/* Rendered content */}
          <div className="text-sm text-[#F1F5F9] prose prose-invert max-w-none">
            <MarkdownRenderer content={message.content} />
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1.5 bg-[#A78BFA] animate-pulse align-middle" />
            )}
          </div>

          {/* Action buttons footer */}
          {!isStreaming && (
            <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[#1A2742] text-xs text-[#94A3B8]">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>

              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Regenerate</span>
                </button>
              )}

              <button
                onClick={() => setRated(rated === 'good' ? null : 'good')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                  rated === 'good'
                    ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                    : 'hover:bg-white/5 hover:text-white'
                }`}
                title="Good response"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="text-[11px]">Good response</span>
              </button>

              <button
                onClick={() => setRated(rated === 'bad' ? null : 'bad')}
                className={`flex items-center gap-1.5 p-1 rounded-lg transition-colors ${
                  rated === 'bad' ? 'text-rose-400' : 'hover:bg-white/5 hover:text-white'
                }`}
                title="Poor response"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

