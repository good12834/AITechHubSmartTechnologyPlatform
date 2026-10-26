import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, Shield, Zap } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#7959F5]/20 text-[#22D3EE] border border-[#7959F5]/30 uppercase tracking-wider">
          Fair & Transparent
        </span>
        <h1 className="text-4xl font-extrabold text-white mt-4 tracking-tight">
          Run Free on Local Hardware, Or Scale in the Cloud
        </h1>
        <p className="text-base text-[#9CA8C5] mt-3">
          AI TechHub is designed local-first. You never pay API fees when running Ollama on your own machine.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
        {/* Free / Local Plan */}
        <div className="rounded-3xl bg-[#151C30] border border-white/10 p-8 flex flex-col justify-between hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9CA8C5]">Local Community</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                Self-Hosted
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="text-xs text-[#9CA8C5]">/ forever</span>
            </div>
            <p className="text-xs text-[#9CA8C5] leading-relaxed mb-6">
              Perfect for developers running Ollama locally. Unlimited tokens through your own hardware.
            </p>
            <ul className="space-y-3 text-xs text-[#CBD5E1] mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Unlimited Local Ollama inference</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>50 Daily web requests quota</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Document AI & RAG (100MB storage)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Code Studio & Workflows</span>
              </li>
            </ul>
          </div>
          <Link
            to="/register"
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs text-center transition-all block"
          >
            Get Started Free
          </Link>
        </div>

        {/* Pro Plan (Highlighted) */}
        <div className="rounded-3xl bg-gradient-to-b from-[#151C30] via-[#151C30] to-[#7959F5]/20 border-2 border-[#7959F5] p-8 flex flex-col justify-between shadow-2xl shadow-[#7959F5]/20 relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#7959F5] text-white text-[11px] font-bold shadow-md">
            Most Popular
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">Professional</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7959F5]/30 text-[#22D3EE]">
                Cloud + Local
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-black text-white">$19</span>
              <span className="text-xs text-[#9CA8C5]">/ month</span>
            </div>
            <p className="text-xs text-[#9CA8C5] leading-relaxed mb-6">
              For professionals demanding hosted fallback, large document indexing, and fast image generations.
            </p>
            <ul className="space-y-3 text-xs text-[#CBD5E1] mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#22D3EE]" />
                <span>Everything in Local, plus:</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#22D3EE]" />
                <span>1,000 Daily AI cloud messages</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#22D3EE]" />
                <span>100 Image Studio generations/day</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#22D3EE]" />
                <span>5 GB Document storage & FAISS RAG</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#22D3EE]" />
                <span>Priority model concurrency</span>
              </li>
            </ul>
          </div>
          <Link
            to="/register"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white font-bold text-xs text-center shadow-lg shadow-[#7959F5]/30 hover:scale-[1.02] transition-all block"
          >
            Upgrade to Pro
          </Link>
        </div>

        {/* Enterprise Plan */}
        <div className="rounded-3xl bg-[#151C30] border border-white/10 p-8 flex flex-col justify-between hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9CA8C5]">Enterprise</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                Custom Cluster
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-black text-white">$99</span>
              <span className="text-xs text-[#9CA8C5]">/ month</span>
            </div>
            <p className="text-xs text-[#9CA8C5] leading-relaxed mb-6">
              Dedicated GPU cluster orchestration, multi-user role management, and complete audit logging.
            </p>
            <ul className="space-y-3 text-xs text-[#CBD5E1] mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Unlimited team members & projects</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Full Admin portal & audit logging</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>50 GB Document storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Dedicated Ollama / vLLM cluster support</span>
              </li>
            </ul>
          </div>
          <Link
            to="/register"
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs text-center transition-all block"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  );
}
