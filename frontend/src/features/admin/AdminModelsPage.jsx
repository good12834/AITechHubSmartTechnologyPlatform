import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Layers,
  Sparkles,
  Terminal,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import PageHeader from '../../components/layout/PageHeader';
import { formatBytes } from '../../utils/formatters';

export default function AdminModelsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchModels = async () => {
    try {
      const res = await adminApi.getModels();
      setData(res);
    } catch (err) {
      console.warn('Failed to load admin models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const models = data?.models || [];
  const isOnline = data?.provider_available ?? true;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Models & Catalog"
        description="Inspect registered LLM models, active parameters, memory footprint, and local Ollama server status."
        badge="Runtime Catalog"
        actions={
          <button
            onClick={fetchModels}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#9CA8C5] hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rescan Provider</span>
          </button>
        }
      />

      {/* Provider Status Pill */}
      <div className="p-4 rounded-2xl bg-[#11182A] border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#7959F5]/20 text-[#7959F5] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Ollama Local Service</h4>
            <p className="text-[11px] text-[#9CA8C5]">Endpoint: http://127.0.0.1:11434</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{isOnline ? 'Active & Serving' : 'Fallback Active'}</span>
          </span>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-24 text-center">
            <div className="w-8 h-8 border-3 border-[#22D3EE] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          models.map((m) => (
            <div
              key={m.name}
              className="p-6 rounded-3xl bg-[#151C30] border border-white/5 hover:border-[#7959F5]/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-mono text-xs font-bold text-white">{m.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#9CA8C5] bg-[#0D1324] px-2 py-0.5 rounded-md">
                    {m.provider}
                  </span>
                </div>

                <p className="text-xs text-[#9CA8C5] mb-4">
                  Family: <span className="font-mono text-white capitalize">{m.family || 'general'}</span>
                </p>

                {/* Capabilities Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {m.capabilities?.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-md bg-[#11182A] text-[10px] text-[#22D3EE] font-semibold uppercase border border-white/5"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Est. Size: {formatBytes(m.size_bytes || 2000000000)}</span>
                <span className="text-emerald-400 font-semibold">Ready</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Terminal Pull Guide */}
      <div className="p-6 rounded-3xl bg-[#0D1324] border border-white/5 font-mono text-xs text-[#CBD5E1]">
        <div className="flex items-center gap-2 mb-2 text-white font-bold">
          <Terminal className="w-4 h-4 text-[#22D3EE]" />
          <span>Install More Local Models via CLI</span>
        </div>
        <p className="text-[#9CA8C5] mb-3">
          To download and activate additional weights into your local Ollama daemon, run:
        </p>
        <div className="p-3 rounded-xl bg-[#151C30] text-[#22D3EE]">
          ollama pull llama3.2<br />
          ollama pull qwen2.5-coder:7b<br />
          ollama pull deepseek-r1:8b
        </div>
      </div>
    </div>
  );
}
