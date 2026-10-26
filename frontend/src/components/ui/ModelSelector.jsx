import React from 'react';
import { Cpu, Check } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function ModelSelector({ value, onChange }) {
  const { availableModels, selectedModel, setSelectedModel } = useWorkspace();
  const current = value || selectedModel;

  const handleSelect = (modelName) => {
    if (onChange) {
      onChange(modelName);
    } else {
      setSelectedModel(modelName);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {availableModels.map((m) => {
        const isSelected = m.name === current;
        return (
          <button
            key={m.name}
            type="button"
            onClick={() => handleSelect(m.name)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isSelected
                ? 'bg-gradient-to-r from-[#7959F5] to-[#7959F5]/80 text-white shadow-md shadow-[#7959F5]/30 border border-white/20'
                : 'bg-[#151C30] text-[#9CA8C5] hover:text-white hover:bg-[#1A243D] border border-white/5'
            }`}
          >
            <Cpu className={`w-3.5 h-3.5 ${isSelected ? 'text-[#22D3EE]' : 'text-[#64748B]'}`} />
            <span>{m.name}</span>
            {m.capabilities?.includes('code') && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/20 text-[#22D3EE]">
                Code
              </span>
            )}
            {m.capabilities?.includes('vision') && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300">
                Vision
              </span>
            )}
            {isSelected && <Check className="w-3.5 h-3.5 text-white ml-0.5" />}
          </button>
        );
      })}
    </div>
  );
}
