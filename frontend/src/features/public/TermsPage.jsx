import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-12">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#7959F5]/20 text-[#22D3EE] border border-[#7959F5]/30 uppercase tracking-wider">
          Legal Agreement
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-[#9CA8C5] mt-2">Effective date: October 2026</p>
      </div>

      <div className="space-y-6 text-sm text-[#CBD5E1] leading-relaxed">
        <div className="p-6 rounded-2xl bg-[#151C30] border border-white/5 space-y-4">
          <h2 className="text-base font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using AI TechHub, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
          </p>

          <h2 className="text-base font-bold text-white">2. Acceptable Use of AI Features</h2>
          <p>
            You agree not to use AI TechHub to generate malicious code, engage in automated denial-of-service, or process unauthorized classified material. AI-generated code should be reviewed before execution in production environments.
          </p>

          <h2 className="text-base font-bold text-white">3. Intellectual Property Rights</h2>
          <p>
            You retain all rights and intellectual property in and to any text, documents, code, or images you upload or generate using your account.
          </p>

          <h2 className="text-base font-bold text-white">4. Disclaimer of AI Output Warranty</h2>
          <p>
            Language model outputs may occasionally contain factual errors or hallucinated syntax. AI TechHub provides inference tools as-is without warranties of merchantability or fitness for a particular purpose.
          </p>
        </div>
      </div>
    </div>
  );
}
