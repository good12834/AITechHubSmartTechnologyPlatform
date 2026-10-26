
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Code2,
  FileText,
  Workflow,
  Cpu,
  Shield,
  Zap,
  CheckCircle2,
  Terminal,
  Database,
  ChevronRight,
} from 'lucide-react';

const MODULES = [
  {
    id: 'chat',
    title: 'AI Chat Assistant',
    desc: 'Low-latency streaming conversations powered by local models like Llama 3.2 and DeepSeek.',
    icon: Sparkles,
    gradient: 'from-[#7959F5] to-[#6366F1]',
    previewSnippet: 'User: How do I implement retrieval augmented generation (RAG) with local embeddings?\n\nAssistant: Here is a modular pipeline using Sentence-Transformers and FAISS vector indexing...',
  },
  {
    id: 'code',
    title: 'Code Studio',
    desc: 'Generate, explain, debug, and refactor code across Python, TypeScript, Go, and SQL.',
    icon: Code2,
    gradient: 'from-[#22D3EE] to-[#0284C7]',
    previewSnippet: 'def optimize_queries(db_session, user_id):\n    # Eager loading with indexed foreign keys\n    return db_session.query(Project)\\\n        .options(joinedload(Project.documents))\\\n        .filter_by(owner_id=user_id).all()',
  },
  {
    id: 'docs',
    title: 'Document AI & RAG',
    desc: 'Upload PDFs and text files, auto-extract chunks, and ask grounded questions with source citations.',
    icon: FileText,
    gradient: 'from-emerald-400 to-teal-600',
    previewSnippet: 'Cited from Q3_Financial_Report.pdf [Chunk 4]:\n"Operating margin improved by 14.2% following the integration of internal AI automation pipelines."',
  },
  {
    id: 'workflows',
    title: 'AI Workflows',
    desc: 'Chain triggers, AI transformations, and automated storage actions into resilient scheduled jobs.',
    icon: Workflow,
    gradient: 'from-amber-400 to-orange-500',
    previewSnippet: 'Trigger: Document Uploaded -> Action: Extract Entities -> Action: Generate Executive Summary -> Output: Save to Project',
  },
];

const HERO_IMAGES = [
  {
    src: '/haif ai-robot.jpg',
    alt: 'AI robot',
    label: 'Local LLMs',
    sub: 'Llama 3.2 • DeepSeek',
    icon: Sparkles,
    accent: 'text-[#7959F5]',
    glow: 'from-[#7959F5]/40',
    position: 'lg:order-1 lg:mt-12',
  },
  {
    src: '/haif code-laptop.jpg',
    alt: 'Developer coding on a laptop',
    label: 'Code Studio',
    sub: 'Python • TS • Go • SQL',
    icon: Code2,
    accent: 'text-[#22D3EE]',
    glow: 'from-[#22D3EE]/40',
    position: 'lg:order-3 lg:-mt-4',
  },
];

function HeroImage({ image }) {
  const Icon = image.icon;
  return (
    <figure
      className={`group relative aspect-[3/4] w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 ${image.position}`}
    >
      <img
        src={image.src}
        alt={image.alt}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      {/* Tint + fade for readability */}
      <div className={`absolute inset-0 bg-gradient-to-t ${image.glow} via-[#0B1020]/30 to-transparent mix-blend-multiply`} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1020] via-transparent to-[#0B1020]/20" />
      {/* Inner ring */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none" />

      {/* Caption chip */}
      <figcaption className="absolute left-3 right-3 bottom-3 flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#0B1020]/70 backdrop-blur-md border border-white/10">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-4 h-4 ${image.accent}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white leading-tight">{image.label}</p>
          <p className="text-[11px] text-[#9CA8C5] truncate">{image.sub}</p>
        </div>
      </figcaption>
    </figure>
  );
}

export default function LandingPage() {
  const [activeModule, setActiveModule] = useState(MODULES[0]);

  return (
    <div
      className="relative overflow-hidden bg-[#0B1020]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-[#7959F5]/25 via-[#22D3EE]/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -left-40 w-[420px] h-[420px] rounded-full bg-[#7959F5]/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[420px] h-[420px] rounded-full bg-[#22D3EE]/10 blur-[120px] pointer-events-none" />

      {/* Hero Section: image | content | image */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)] gap-8 lg:gap-10 items-center">
          {/* Center content */}
          <div className="text-center lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151C30] border border-[#7959F5]/30 text-xs font-medium text-[#22D3EE] mb-6 shadow-md shadow-[#7959F5]/10">
              <Sparkles className="w-3.5 h-3.5 text-[#7959F5]" />
              <span>Local AI Inference • Zero Per-Token API Bills</span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
              One Workspace for{' '}
              <span className="bg-gradient-to-r from-[#7959F5] via-[#A78BFA] to-[#22D3EE] bg-clip-text text-transparent">
                Intelligent Productivity
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#9CA8C5] max-w-xl mx-auto leading-relaxed">
              AI TechHub is a portfolio-ready full-stack platform. Chat with local LLMs, generate and debug code, query documents via RAG, create visual assets, and automate repetitive workflows securely on your own hardware.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white font-semibold text-sm shadow-xl shadow-[#7959F5]/25 hover:shadow-[#22D3EE]/40 hover:scale-[1.02] transition-all"
              >
                <span>Launch Free Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#151C30] border border-white/10 text-white font-semibold text-sm hover:bg-[#1A243D] hover:border-white/20 transition-all"
              >
                <span>Sign In to Dashboard</span>
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#9CA8C5]">
              {['No credit card', 'Runs offline', 'Open-source models'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Images: side by side on mobile, flanking the content on desktop */}
          <div className="grid grid-cols-2 gap-4 lg:contents">
            {HERO_IMAGES.map((img) => (
              <HeroImage key={img.src} image={img} />
            ))}
          </div>
        </div>

        {/* Feature Badges Grid */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
          {[
            { Icon: Cpu, color: 'text-[#22D3EE]', title: 'Ollama Native', sub: 'Local model runtime' },
            { Icon: Shield, color: 'text-[#7959F5]', title: 'Private & Local', sub: 'Your data never leaves' },
            { Icon: Database, color: 'text-emerald-400', title: 'MySQL + RAG', sub: 'Persistent vectors' },
            { Icon: Zap, color: 'text-amber-400', title: 'Streaming SSE', sub: 'Real-time responses' },
          ].map(({ Icon, color, title, sub }) => (
            <div
              key={title}
              className="p-3.5 rounded-xl bg-[#11182A]/80 backdrop-blur border border-white/5 flex items-center gap-3 hover:border-white/15 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{title}</p>
                <p className="text-[11px] text-[#9CA8C5]">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Mockup Section */}
      <section className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
        <div className="relative">
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-[#7959F5]/50 via-transparent to-[#22D3EE]/50 blur-sm opacity-60" />
          <div className="relative rounded-3xl bg-[#11182A] border border-white/10 shadow-2xl overflow-hidden">
            {/* Mockup Title bar */}
            <div className="px-6 py-4 bg-[#0B1020] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-xs font-mono text-[#9CA8C5]">app.aitechhub.local/workspace</span>
              </div>
              <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Ollama Ready</span>
              </div>
            </div>

            {/* Interactive Tabs */}
            <div className="p-6 lg:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {MODULES.map((mod) => {
                  const Icon = mod.icon;
                  const isSelected = activeModule.id === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModule(mod)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all border ${
                        isSelected
                          ? 'bg-[#151C30] border-[#7959F5] shadow-lg shadow-[#7959F5]/20 text-white'
                          : 'bg-[#151C30]/50 border-white/5 text-[#9CA8C5] hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${mod.gradient} flex items-center justify-center text-white flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">{mod.title}</p>
                        <p className="text-[10px] text-[#64748B] truncate mt-0.5">Explore capability</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Preview Display Window */}
              <div className="rounded-2xl bg-[#0D1324] border border-white/5 p-6 font-mono text-xs leading-relaxed text-[#F8FAFC]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5 mb-4 text-[#9CA8C5]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#22D3EE]" />
                    <span className="font-semibold text-white">{activeModule.title}</span>
                    <span>•</span>
                    <span>{activeModule.desc}</span>
                  </div>
                  <Link
                    to={`/${activeModule.id === 'docs' ? 'documents' : activeModule.id === 'code' ? 'code-studio' : activeModule.id}`}
                    className="text-[#22D3EE] hover:underline flex items-center gap-1 font-sans flex-shrink-0"
                  >
                    <span>Open Module</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <pre className="whitespace-pre-wrap font-mono text-xs text-[#CBD5E1]">
                  {activeModule.previewSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Engineered for Real-World AI Productivity</h2>
          <p className="text-sm sm:text-base text-[#9CA8C5] mt-3">
            Built with modern architecture: Flask blueprints, relational integrity with MySQL, JWT authorization, and interchangeable AI inference providers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#151C30] to-[#11182A] border border-white/5 hover:border-[#7959F5]/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7959F5]/10 transition-all">
            <div className="w-11 h-11 rounded-xl bg-[#7959F5]/20 flex items-center justify-center text-[#7959F5] mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero-Leak Local Inference</h3>
            <p className="text-sm text-[#9CA8C5] leading-relaxed">
              Run models completely on your own machine through Ollama. Keep your proprietary code, customer records, and internal documents strictly confidential.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#151C30] to-[#11182A] border border-white/5 hover:border-[#22D3EE]/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#22D3EE]/10 transition-all">
            <div className="w-11 h-11 rounded-xl bg-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE] mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">RAG Document Intelligence</h3>
            <p className="text-sm text-[#9CA8C5] leading-relaxed">
              Upload PDF and text documentation. Documents are chunked and indexed automatically so you can search and extract cited answers with high precision.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#151C30] to-[#11182A] border border-white/5 hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Workflow className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated Multi-Step Workflows</h3>
            <p className="text-sm text-[#9CA8C5] leading-relaxed">
              Build resilient pipelines that trigger on events, perform multi-step AI reasoning, and deliver outputs directly to persistent workspace projects.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-5xl mx-auto px-6 py-20 relative z-10">
        <div className="rounded-3xl bg-gradient-to-r from-[#7959F5]/30 via-[#151C30] to-[#22D3EE]/20 border border-[#7959F5]/40 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#22D3EE]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-[#7959F5]/30 blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to unleash your local AI workspace?</h2>
            <p className="text-sm sm:text-base text-[#9CA8C5] max-w-xl mx-auto mt-3 mb-8">
              Get started right now. Register an account, explore all workspaces, and experience true AI independence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white text-sm font-semibold shadow-lg shadow-[#7959F5]/30 hover:scale-105 transition-all"
              >
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#11182A] border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-all"
              >
                <span>Sign In with Demo</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}