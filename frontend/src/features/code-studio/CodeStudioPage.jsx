import React, { useState, useCallback } from 'react';
import { Code2, Sparkles, Terminal, RotateCcw, Cpu } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import codeApi from '../../services/codeApi';
import CodeStudioWorkspace from './CodeStudioWorkspace';

const LANGUAGES = [
  'React (JavaScript)',
  'Python',
  'TypeScript',
  'Flask (Python)',
  'HTML / CSS',
  'Tailwind',
  'Node.js',
  'SQL',
  'Go',
  'Rust',
];

const TASKS = ['Generate Code', 'Explain Code', 'Debug Code', 'Format Code', 'Convert Code', 'Write Tests'];

const DEFAULT_LANGUAGE = LANGUAGES[0];
const DEFAULT_TASK = TASKS[0];

export default function CodeStudioPage() {
  const { selectedModel } = useWorkspace();

  // Editor state - starts empty (no mock data)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [task, setTask] = useState(DEFAULT_TASK);
  const [prompt, setPrompt] = useState('');
  const [editorCode, setEditorCode] = useState('');

  // View state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Switch language
  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
    setError('');
  };

  // Execute AI generation / transformation via the real backend API
  const handleExecute = useCallback(async (overridePrompt) => {
    const textToRun = (overridePrompt || prompt).trim();
    if (!textToRun) {
      setError('Please provide instructions in the prompt box.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let res;
      if (task === 'Explain Code') {
        res = await codeApi.explainCode({
          code: editorCode,
          language: language.toLowerCase(),
          model: selectedModel,
        });
      } else if (task === 'Debug Code' || task === 'Write Tests') {
        res = await codeApi.improveCode({
          code: editorCode,
          instructions: textToRun || 'Review and improve this code.',
          language: language.toLowerCase(),
          model: selectedModel,
        });
        if (res?.output) {
          setEditorCode(res.output);
        }
      } else {
        res = await codeApi.generateCode({
          prompt: textToRun,
          language: language.toLowerCase(),
          model: selectedModel,
        });
        if (res?.output) {
          setEditorCode(res.output);
        }
      }

    } catch (err) {
      const msg = err?.message || 'Code generation failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [prompt, editorCode, language, task, selectedModel]);

  const handleNewFile = () => {
    setEditorCode('');
    setPrompt('');
    setError('');
  };

  return (
    <div className="space-y-5">
      {/* 1. Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#1E2C48] bg-gradient-to-r from-[#0C152B] via-[#111D34] to-[#18233C] p-5 shadow-2xl">
        <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-[#6046F5]/25 blur-3xl" />
        <div className="absolute right-10 top-0 h-44 w-44 rounded-full bg-[#A78BFA]/15 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#6046F5]/50 shadow-xl shadow-[#6046F5]/30 flex items-center justify-center">
                <Code2 className="h-8 w-8 text-[#6046F5]" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#6046F5] text-white shadow-md">
                <Code2 className="h-3 w-3" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Code Studio</span>
                  <span className="rounded-full bg-[#6046F5]/20 border border-[#6046F5]/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">
                    Live IDE
                  </span>
                </h1>
              </div>
              <p className="mt-0.5 text-xs text-[#94A3B8]">
                Generate, explain, debug, and preview code with AI models
              </p>
            </div>
          </div>

          {/* Model Status Pill */}
          <div className="flex items-center gap-2.5 rounded-xl border border-[#26375A] bg-[#0A101F]/80 px-4 py-2">
            <Cpu className="h-3.5 w-3.5" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">{selectedModel || 'Llama 3.2'}</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Runtime Online</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Configuration Toolbar Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E2C48] bg-[#0D1528] p-3.5 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Language dropdown */}
          <div className="flex items-center gap-2 rounded-xl border border-[#1E2C48] bg-[#111D34] px-3.5 py-2 text-xs">
            <span className="text-[#94A3B8] font-bold">Language:</span>
            <select
              value={language}
              onChange={(e) => handleSelectLanguage(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l} className="bg-[#0E172A] text-white">
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Task dropdown */}
          <div className="flex items-center gap-2 rounded-xl border border-[#1E2C48] bg-[#111D34] px-3.5 py-2 text-xs">
            <span className="text-[#94A3B8] font-bold">Task:</span>
            <select
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              {TASKS.map((t) => (
                <option key={t} value={t} className="bg-[#0E172A] text-white">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* New file / Reset */}
          <button
            onClick={handleNewFile}
            className="flex items-center gap-1.5 rounded-xl border border-[#1E2C48] bg-[#111D34] px-2.5 py-1 text-xs text-[#94A3B8] hover:text-white hover:border-[#6046F5] transition-colors"
            title="New file"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => handleExecute()}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6046F5] via-[#7C3AED] to-[#A78BFA] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#6046F5]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating with AI…</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>{task}</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Main Workspace: Stacked Layout (FILE WORKSPACE on top, PROMPT BOX below) */}
      <div className="grid grid-cols-1 gap-5">
        {/* FILE WORKSPACE */}
        <div className="rounded-3xl border border-[#1E2C48] bg-[#0E172A] p-5 shadow-2xl flex flex-col justify-between">
          <CodeStudioWorkspace generatedCode={editorCode} />
        </div>

        {/* PROMPT BOX + QUICK ACTIONS */}
        <div className="space-y-5">
          <div className="rounded-3xl border border-[#1E2C48] bg-[#0E172A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2742] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-[#A78BFA]" />
                <span>Your Prompt</span>
              </span>
            </div>

            <div className="relative">
              <textarea
                rows={6}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the code you want to generate, paste code to explain/debug, or request tests..."
                className="w-full rounded-2xl border border-[#1E2C48] bg-[#0A101F] p-4 text-xs font-mono text-white placeholder-[#64748B] focus:border-[#6046F5] focus:outline-none transition-all resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-[#64748B]">Press Generate to execute</span>
                <button
                  type="button"
                  onClick={() => handleExecute()}
                  disabled={loading || !prompt.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#6046F5] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#6046F5]/30 hover:bg-[#5035e0] transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Code</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Quick Action Chips */}
            <div className="mt-4 pt-3 border-t border-[#1A2742]">
              <p className="text-[10px] uppercase font-bold text-[#64748B] mb-2 tracking-wider">
                Quick Prompts:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Explain code', taskType: 'Explain Code', promptText: 'Explain how this code works and its key logic.' },
                  { label: 'Debug code', taskType: 'Debug Code', promptText: 'Find bugs, edge cases, and add safety guards.' },
                  { label: 'Write tests', taskType: 'Write Tests', promptText: 'Write comprehensive unit tests with edge-case coverage.' },
                  { label: 'Refactor', taskType: 'Generate Code', promptText: 'Refactor this code for clean architecture and performance.' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setPrompt(item.promptText);
                      setTask(item.taskType);
                    }}
                    className="rounded-lg border border-[#1E2C48] bg-[#111D34] px-2.5 py-1 text-[11px] text-[#94A3B8] hover:border-[#6046F5] hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
