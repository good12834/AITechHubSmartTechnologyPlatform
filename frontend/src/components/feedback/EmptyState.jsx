import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-[#151C30]/50 border border-white/5">
      {Icon && (
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#7959F5]/20 to-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE] mb-4 border border-white/5 shadow-inner">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#9CA8C5] max-w-md mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
