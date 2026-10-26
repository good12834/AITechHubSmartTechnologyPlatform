import React from 'react';

export default function PageHeader({ title, description, badge, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5 mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {badge && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#7959F5]/20 text-[#22D3EE] border border-[#7959F5]/30">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-[#9CA8C5] mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
