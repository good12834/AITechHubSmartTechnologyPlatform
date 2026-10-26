import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Dark dashboard stat card matching the redesign:
 * uppercase micro-label, big bold value, gray sub-line, optional trend chip,
 * and an icon tile in the top-right corner.
 */
const ACCENT = {
  violet: { icon: 'text-[#C084FC]', glow: 'bg-[#8B5CF6]/10' },
  cyan: { icon: 'text-[#67E8F9]', glow: 'bg-[#22D3EE]/10' },
  emerald: { icon: 'text-emerald-400', glow: 'bg-emerald-400/10' },
  amber: { icon: 'text-amber-400', glow: 'bg-amber-400/10' },
};

export default function StatCard({
  title,
  value,
  change,
  trend,
  trendDir = 'up',
  icon: Icon,
  color = 'violet',
}) {
  const accent = ACCENT[color] || ACCENT.violet;
  const TrendIcon = trendDir === 'down' ? TrendingDown : trendDir === 'neutral' ? Minus : TrendingUp;
  const trendColor =
    trendDir === 'down' ? 'text-rose-400' : trendDir === 'neutral' ? 'text-[#8B95AE]' : 'text-emerald-400';

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#12121A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-colors hover:border-white/10">
      {/* soft accent glow in the corner */}
      <div aria-hidden="true" className={`pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full blur-2xl ${accent.glow}`} />

      <div className="relative flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B95AE]">{title}</span>
        {Icon && (
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] transition-colors group-hover:bg-white/[0.08]">
            <Icon className={`h-[18px] w-[18px] ${accent.icon}`} />
          </span>
        )}
      </div>

      <p className="relative mt-3 text-2xl font-extrabold tracking-tight text-white lg:text-[28px]">{value}</p>
      {change && <p className="relative mt-1 text-xs text-[#6B7385]">{change}</p>}

      {trend && (
        <div className={`relative mt-3 flex items-center gap-1.5 text-xs font-semibold ${trendColor}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
