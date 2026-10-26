import React from 'react';
import { ShieldCheck, Lock, EyeOff, Server } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-12">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
          Security & Transparency
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
          Privacy Policy & Data Handling
        </h1>
        <p className="text-sm text-[#9CA8C5] mt-2">Last updated: October 2026</p>
      </div>

      <div className="space-y-8 text-sm text-[#CBD5E1] leading-relaxed">
        <section className="p-6 rounded-2xl bg-[#151C30] border border-white/5">
          <div className="flex items-center gap-3 text-white font-bold text-base mb-3">
            <Lock className="w-5 h-5 text-[#22D3EE]" />
            <h2>1. Local-First Architecture Principle</h2>
          </div>
          <p>
            AI TechHub operates on a local-first philosophy. When configured with an Ollama runtime on your local machine (127.0.0.1:11434), your prompts, uploaded documents, generated code, and reasoning steps are processed strictly on your hardware. No prompts or document chunks are sent to third-party AI hosted vendors without your explicit consent.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[#151C30] border border-white/5">
          <div className="flex items-center gap-3 text-white font-bold text-base mb-3">
            <Server className="w-5 h-5 text-[#7959F5]" />
            <h2>2. Document Storage & Vector Embeddings</h2>
          </div>
          <p>
            Files uploaded to the Document AI module are stored in private directories with randomized non-guessable storage identifiers. Extracted text chunks and embedding vectors are saved in your personal database namespace. Strict cross-tenant authorization checks prevent any unauthorized user from reading, searching, or querying your documents.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[#151C30] border border-white/5">
          <div className="flex items-center gap-3 text-white font-bold text-base mb-3">
            <EyeOff className="w-5 h-5 text-emerald-400" />
            <h2>3. Authentication & Credential Security</h2>
          </div>
          <p>
            User passwords are encrypted using Argon2id with memory-hard cost factors. Access is granted using short-lived JWT tokens and secure refresh mechanisms. We never store plain-text passwords or API secrets in browser local storage.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[#151C30] border border-white/5">
          <div className="flex items-center gap-3 text-white font-bold text-base mb-3">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2>4. Data Deletion & Retention</h2>
          </div>
          <p>
            You retain 100% ownership of your chats, documents, code, and workflow automations. Deleting a conversation or document permanently purges all associated messages, extracted text chunks, and vector embeddings from the database and filesystem.
          </p>
        </section>
      </div>
    </div>
  );
}
