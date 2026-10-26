import React from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Code2,
  FileText,
  Image as ImageIcon,
  Workflow,
  Shield,
  Cpu,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#7959F5]/20 text-[#22D3EE] border border-[#7959F5]/30 uppercase tracking-wider">
          Platform Capabilities
        </span>
        <h1 className="text-4xl font-extrabold text-white mt-4 tracking-tight">
          Everything You Need to Build, Chat, and Automate
        </h1>
        <p className="text-base text-[#9CA8C5] mt-3 leading-relaxed">
          Explore our suite of specialized modules engineered for developers, knowledge workers, and technical teams.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="space-y-16">
        {/* Module 1: AI Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#151C30]/60 border border-white/5 p-8 rounded-3xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#7959F5]/20 text-[#7959F5] flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">AI Chat & Streaming Assistant</h2>
            <p className="text-sm text-[#9CA8C5] leading-relaxed mb-6">
              Full multi-turn dialogue with real-time SSE streaming. Seamlessly switch between installed models such as Llama 3.2, Qwen 2.5 Coder, and DeepSeek. Keep full conversation histories linked to persistent projects.
            </p>
            <ul className="space-y-2 text-xs text-[#CBD5E1] mb-6">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                Low-latency Server-Sent Events (SSE) token streaming
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                Markdown rendering with syntax-highlighted code blocks
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                Automatic title generation and conversation archiving
              </li>
            </ul>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#22D3EE] hover:underline"
            >
              <span>Explore AI Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D1324] border border-white/5 font-mono text-xs text-[#CBD5E1]">
            <div className="text-[11px] text-[#64748B] mb-2">// Server-Sent Events stream simulation</div>
            <p className="text-[#22D3EE] mb-2">User: Explain JWT authentication architecture</p>
            <p className="text-white">
              AI: JSON Web Tokens consist of three base64-encoded segments:
              1. Header (alg & typ)
              2. Payload (claims & identity)
              3. Cryptographic Signature (HMAC-SHA256 or RSA)
            </p>
          </div>
        </div>

        {/* Module 2: Code Studio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#151C30]/60 border border-white/5 p-8 rounded-3xl">
          <div className="order-2 lg:order-1 p-5 rounded-2xl bg-[#0D1324] border border-white/5 font-mono text-xs text-[#CBD5E1]">
            <div className="text-[11px] text-[#64748B] mb-2">// Code Studio Generation</div>
            <span className="text-purple-400">async function</span> <span className="text-blue-400">fetchRAGEmbeddings</span>(text: string) &#123;
            <br />
            &nbsp;&nbsp;<span className="text-[#64748B]">// Local sentence-transformers vectorization</span>
            <br />
            &nbsp;&nbsp;<span className="text-purple-400">const</span> embedding = <span className="text-purple-400">await</span> model.<span className="text-blue-400">encode</span>(text);
            <br />
            &nbsp;&nbsp;<span className="text-purple-400">return</span> embedding;
            <br />
            &#125;
          </div>

          <div className="order-1 lg:order-2">
            <div className="w-12 h-12 rounded-2xl bg-[#22D3EE]/20 text-[#22D3EE] flex items-center justify-center mb-4">
              <Code2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Code Studio & Refactoring</h2>
            <p className="text-sm text-[#9CA8C5] leading-relaxed mb-6">
              Write, debug, explain, and optimize code in any major programming language. Integrated with your local code models for fast iteration without cloud delays.
            </p>
            <ul className="space-y-2 text-xs text-[#CBD5E1] mb-6">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7959F5]" />
                Generate snippets from natural language descriptions
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7959F5]" />
                In-depth explanation with complexity analysis
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7959F5]" />
                1-click copy-to-clipboard and language selection
              </li>
            </ul>
            <Link
              to="/code-studio"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#7959F5] hover:underline"
            >
              <span>Launch Code Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Module 3: Document AI & Workflows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-3xl bg-[#151C30]/60 border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Document AI & RAG</h3>
            <p className="text-xs text-[#9CA8C5] leading-relaxed mb-4">
              Drop PDFs and text files into your workspace. The platform chunks content, generates vector representations, and grounds AI responses with exact source references.
            </p>
            <Link to="/documents" className="text-xs text-[#22D3EE] font-semibold flex items-center gap-1 hover:underline">
              <span>View Document AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-8 rounded-3xl bg-[#151C30]/60 border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Workflow className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Visual Automation Workflows</h3>
            <p className="text-xs text-[#9CA8C5] leading-relaxed mb-4">
              Define triggers, AI reasoning steps, and destination outputs. Execute runs in the background and monitor logs in real-time.
            </p>
            <Link to="/workflows" className="text-xs text-[#22D3EE] font-semibold flex items-center gap-1 hover:underline">
              <span>View Workflows</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
