import React, { useRef, useEffect } from 'react';
import { Send, Square, Mic, Paperclip, Sparkles, Code2, FileText, Search } from 'lucide-react';

export default function ChatComposer({
  input,
  setInput,
  onSend,
  isStreaming,
  onStop,
  disabled,
  onQuickAction,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim() && !disabled) {
        onSend();
      }
    }
  };

  const QUICK_PROMPTS = [
    { label: 'Get Ideas', icon: Sparkles, prompt: 'Brainstorm creative, high-impact features for an AI TechHub platform.' },
    { label: 'Explain Code', icon: Code2, prompt: 'Explain how React hooks and the component lifecycle work with simple examples.' },
    { label: 'Summarize', icon: FileText, prompt: 'Summarize the architecture of a modern distributed microservices and LLM system.' },
    { label: 'Research', icon: Search, prompt: 'Analyze current best practices for streaming local Ollama LLM responses in React.' },
  ];

  return (
    <div className="space-y-3">
      {/* Input container */}
      <div className="relative flex items-center gap-3 rounded-full border border-[#1E2C48] bg-[#111D34] px-4 py-2.5 shadow-2xl focus-within:border-[#6046F5] transition-all">
        {/* Mic / Attachment Icon */}
        <button
          type="button"
          onClick={() => {
            if (onQuickAction) onQuickAction('Explain how useState works in React with a simple example.');
          }}
          className="rounded-full p-2 text-[#64748B] hover:bg-white/5 hover:text-[#A78BFA] transition-colors"
          title="Voice input / Dictation"
        >
          <Mic className="h-4 w-4" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-white placeholder-[#64748B] focus:outline-none resize-none max-h-36 overflow-y-auto leading-normal py-1"
        />

        {/* Send / Stop Button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all flex-shrink-0"
            title="Stop generating"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim() || disabled}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6046F5] text-white shadow-lg shadow-[#6046F5]/40 transition-all hover:bg-[#5035e0] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 flex-shrink-0"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Action Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {QUICK_PROMPTS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (onQuickAction) {
                  onQuickAction(item.prompt);
                } else {
                  setInput(item.prompt);
                }
              }}
              className="flex items-center gap-1.5 rounded-full border border-[#1E2C48] bg-[#0E172A] px-3.5 py-1.5 text-xs text-[#94A3B8] transition-all hover:border-[#6046F5] hover:bg-[#152038] hover:text-white"
            >
              <Icon className="h-3.5 w-3.5 text-[#A78BFA]" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

