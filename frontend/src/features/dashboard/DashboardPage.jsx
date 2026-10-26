import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Code2,
  Bot,
  BarChart3,
  Clock,
  ChevronDown,
  FolderKanban,
  Cpu,
  HardDrive,
  MessageSquare,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import StatCard from '../../components/ui/StatCard';
import chatApi from '../../services/chatApi';
import projectsApi from '../../services/projectsApi';
import usageApi from '../../services/usageApi';
import { timeAgo } from '../../utils/formatters';

/* ------------------------------------------------------------------ */
/* Chart helpers                                                       */
/* ------------------------------------------------------------------ */

function niceCeil(n) {
  if (!n || n <= 0) return 10;
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const f = n / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function formatCompact(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

function formatDayLabel(day) {
  try {
    const d = new Date(`${day}T00:00:00`);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return day;
  }
}

const TYPE_LABELS = {
  chat_message: 'Chat',
  code_generation: 'Code',
  image_generation: 'Image',
  document_upload: 'Docs',
  document_processing: 'RAG',
  retrieval: 'Retrieve',
  workflow_run: 'Flows',
};

const KIND_META = {
  chat: { icon: MessageSquare, box: 'bg-[#8B5CF6]/15 text-[#C084FC]' },
  project: { icon: FolderKanban, box: 'bg-emerald-500/15 text-emerald-400' },
};

const QUICK_ACTIONS = [
  { label: 'Generate Content', to: '/chat', icon: Sparkles },
  { label: 'Train Chatbot', to: '/workflows', icon: Bot },
  { label: 'Code Assistant', to: '/code-studio', icon: Code2 },
  { label: 'View Analytics', to: '/usage', icon: BarChart3 },
];

/* ------------------------------------------------------------------ */
/* Shared panel shell                                                  */
/* ------------------------------------------------------------------ */

function Panel({ title, subtitle, right, className = '', children }) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#12121A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-6 ${className}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#8B5CF6]/10 blur-3xl" />
      <div className="relative mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[#6B7385]">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

function ChartLoading() {
  return (
    <div className="flex h-[280px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8B5CF6] border-t-transparent" />
    </div>
  );
}

function ChartEmpty({ message }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.06]">
      <Activity className="h-5 w-5 text-[#4A5065]" />
      <p className="text-xs text-[#6B7385]">{message}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Usage Trends — dual-axis line chart (requests + tokens)             */
/* ------------------------------------------------------------------ */

function UsageTrendsChart({ points, loading }) {
  if (loading) return <ChartLoading />;
  if (!points.length || !points.some((p) => p.requests > 0 || p.tokens > 0)) {
    return <ChartEmpty message="No usage recorded for this period yet." />;
  }

  const W = 680;
  const H = 280;
  const padL = 48;
  const padR = 52;
  const padT = 18;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const reqMax = niceCeil(Math.max(1, ...points.map((p) => p.requests)));
  const tokMax = niceCeil(Math.max(1, ...points.map((p) => p.tokens)));

  const xAt = (i) => padL + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const yReq = (v) => padT + innerH - (v / reqMax) * innerH;
  const yTok = (v) => padT + innerH - (v / tokMax) * innerH;

  const pathFor = (key, yFn) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yFn(p[key]).toFixed(1)}`).join(' ');

  const gridFracs = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));
  const showDots = points.length <= 31;
  const lastX = xAt(points.length - 1);
  const baseY = padT + innerH;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Usage trends chart">
        <defs>
          <linearGradient id="reqArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid + dual axes */}
        {gridFracs.map((f) => {
          const gy = padT + innerH - f * innerH;
          return (
            <g key={f}>
              <line x1={padL} x2={W - padR} y1={gy} y2={gy} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={padL - 8} y={gy + 4} textAnchor="end" fontSize="10" fill="#5A6275">
                {formatCompact(reqMax * f)}
              </text>
              <text x={W - padR + 8} y={gy + 4} textAnchor="start" fontSize="10" fill="#5A6275">
                {formatCompact(tokMax * f)}
              </text>
            </g>
          );
        })}

        {/* area under requests line */}
        <path
          d={`${pathFor('requests', yReq)} L ${lastX.toFixed(1)} ${baseY} L ${xAt(0).toFixed(1)} ${baseY} Z`}
          fill="url(#reqArea)"
        />

        {/* lines */}
        <path d={pathFor('tokens', yTok)} fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathFor('requests', yReq)} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* dots */}
        {showDots &&
          points.map((p, i) => (
            <g key={`dot-${i}`}>
              <circle cx={xAt(i)} cy={yTok(p.tokens)} r="3.5" fill="#08080D" stroke="#34D399" strokeWidth="2" />
              <circle cx={xAt(i)} cy={yReq(p.requests)} r="3.5" fill="#08080D" stroke="#8B5CF6" strokeWidth="2" />
            </g>
          ))}

        {/* x labels */}
        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <text key={`x-${i}`} x={xAt(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="#5A6275">
              {p.label}
            </text>
          ) : null
        )}
      </svg>

      <div className="mt-2 flex items-center justify-center gap-5 text-[11px] text-[#8B95AE]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" />
          Requests (left axis)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#34D399]" />
          Tokens (right axis)
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Model Performance — vertical bar chart by usage type                */
/* ------------------------------------------------------------------ */

function TypeBarsChart({ bars, loading }) {
  if (loading) return <ChartLoading />;
  if (!bars.length) return <ChartEmpty message="No activity recorded for this period yet." />;

  const W = 420;
  const H = 280;
  const padL = 44;
  const padR = 12;
  const padT = 18;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxV = niceCeil(Math.max(1, ...bars.map((b) => b.value)));
  const slot = innerW / bars.length;
  const barW = Math.min(56, slot * 0.5);
  const gridFracs = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Usage by type bar chart">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <pattern id="barStripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#6D28D9" />
          <rect width="3.5" height="8" fill="#C4B5FD" />
        </pattern>
      </defs>

      {gridFracs.map((f) => {
        const gy = padT + innerH - f * innerH;
        return (
          <g key={f}>
            <line x1={padL} x2={W - padR} y1={gy} y2={gy} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={padL - 8} y={gy + 4} textAnchor="end" fontSize="10" fill="#5A6275">
              {formatCompact(maxV * f)}
            </text>
          </g>
        );
      })}

      {bars.map((b, i) => {
        const h = Math.max(2, (b.value / maxV) * innerH);
        const x = padL + slot * i + (slot - barW) / 2;
        const y = padT + innerH - h;
        const striped = i === bars.length - 1 && bars.length > 2;
        return (
          <g key={b.key}>
            <rect x={x} y={y} width={barW} height={h} rx="8" fill={striped ? 'url(#barStripe)' : 'url(#barGrad)'} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="#C4B5FD">
              {formatCompact(b.value)}
            </text>
            <text x={x + barW / 2} y={H - 12} textAnchor="middle" fontSize="10" fill="#8B95AE">
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { user } = useAuth();
  const { selectedModel, isAiOnline, availableModels } = useWorkspace();

  const [conversations, setConversations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [usageLimits, setUsageLimits] = useState(null);
  const [usageSummary, setUsageSummary] = useState({});
  const [rangeDays, setRangeDays] = useState(7);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Core dashboard data (conversations, projects, plan limits)
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [convList, projList, limits] = await Promise.allSettled([
          chatApi.listConversations(),
          projectsApi.listProjects({ per_page: 5 }),
          usageApi.getLimits(),
        ]);

        if (convList.status === 'fulfilled') setConversations(convList.value.slice(0, 20));
        if (projList.status === 'fulfilled') setProjects(projList.value?.items || []);
        if (limits.status === 'fulfilled') setUsageLimits(limits.value);
      } catch (err) {
        console.warn('Dashboard data fetch error:', err);
      }
    }

    loadDashboardData();
  }, []);

  // Usage summary for the charts (refetches when range changes)
  useEffect(() => {
    let cancelled = false;
    async function loadSummary() {
      setSummaryLoading(true);
      try {
        const res = await usageApi.getSummary(rangeDays);
        if (!cancelled) setUsageSummary(res?.summary || {});
      } catch {
        if (!cancelled) setUsageSummary({});
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    }
    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [rangeDays]);

  // Chart data: daily requests + tokens
  const trendPoints = useMemo(
    () =>
      Object.entries(usageSummary)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, entry]) => ({
          label: formatDayLabel(day),
          requests: entry?.total_quantity || 0,
          tokens: entry?.total_tokens || 0,
        })),
    [usageSummary]
  );

  // Chart data: totals by usage type
  const typeBars = useMemo(() => {
    const totals = {};
    Object.values(usageSummary).forEach((entry) => {
      Object.entries(entry?.by_type || {}).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + (v || 0);
      });
    });
    return Object.entries(totals)
      .map(([k, v]) => ({ key: k, label: TYPE_LABELS[k] || k.replace(/_/g, ' '), value: v }))
      .filter((b) => b.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [usageSummary]);

  // Recent activity feed derived from real conversations + projects
  const activityEvents = useMemo(() => {
    const chatEvents = conversations.map((c) => ({
      id: `chat-${c.id}`,
      kind: 'chat',
      title: c.title || 'Untitled conversation',
      sub: c.model ? `AI Chat · ${c.model}` : 'AI Chat',
      at: c.updated_at || c.created_at,
    }));
    const projectEvents = projects.map((p) => ({
      id: `proj-${p.id}`,
      kind: 'project',
      title: p.name || 'Untitled project',
      sub: p.description ? `Project · ${p.description.slice(0, 48)}` : 'Project updated',
      at: p.updated_at || p.created_at,
    }));
    return [...chatEvents, ...projectEvents]
      .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
      .slice(0, 5);
  }, [conversations, projects]);

  // Model usage derived from recent conversations
  const modelStats = useMemo(() => {
    const counts = {};
    conversations.forEach((c) => {
      if (c.model) counts[c.model] = (counts[c.model] || 0) + 1;
    });
    const list = availableModels.slice(0, 4).map((m) => ({
      name: m.name,
      active: m.name === selectedModel,
      count: counts[m.name] || 0,
    }));
    const maxCount = Math.max(1, ...list.map((m) => m.count));
    return list.map((m) => ({ ...m, share: m.count / maxCount }));
  }, [availableModels, conversations, selectedModel]);

  // Stat card numbers
  const messagesToday = usageLimits?.usage_today?.chat_messages_today ?? 0;
  const messagesLimit = usageLimits?.limits?.messages_per_day ?? 50;
  const limitPct = messagesLimit > 0 ? Math.min(100, Math.round((messagesToday / messagesLimit) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-[#8B95AE]">
            Welcome back{user?.username ? `, ${user.username}` : ''}! Here&apos;s what&apos;s happening in your workspace today.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B95AE]" />
            <select
              aria-label="Select date range"
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
              className="cursor-pointer appearance-none rounded-xl border border-white/[0.08] bg-[#12121A] py-2.5 pl-9 pr-8 text-xs font-semibold text-white transition-colors focus:border-[#8B5CF6] focus:outline-none"
            >
              <option value={7} className="bg-[#12121A] text-white">Last 7 days</option>
              <option value={30} className="bg-[#12121A] text-white">Last 30 days</option>
              <option value={90} className="bg-[#12121A] text-white">Last 90 days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B95AE]" />
          </div>
          <Link
            to="/usage"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#8B5CF6]/30 transition-all hover:-translate-y-px hover:shadow-[#8B5CF6]/50"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>View Reports</span>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Daily Messages"
          value={messagesToday}
          change={`of ${messagesLimit} daily limit`}
          trend={`${limitPct}% used`}
          trendDir={limitPct >= 80 ? 'down' : 'up'}
          icon={MessageSquare}
          color="violet"
        />
        <StatCard
          title="Saved Projects"
          value={projects.length}
          change="Organized workspaces"
          trend={`${conversations.length} chats`}
          trendDir="neutral"
          icon={FolderKanban}
          color="emerald"
        />
        <StatCard
          title="Active Model"
          value={(selectedModel || '').split(':')[0]}
          change={selectedModel}
          trend={isAiOnline ? 'Online' : 'Fallback'}
          trendDir={isAiOnline ? 'up' : 'down'}
          icon={Cpu}
          color="cyan"
        />
        <StatCard
          title="Storage Allocation"
          value={`${usageLimits?.limits?.storage_mb ?? 100} MB`}
          change="Plan allowance"
          trend={usageLimits?.plan ? `${usageLimits.plan} plan` : 'Free plan'}
          trendDir="neutral"
          icon={HardDrive}
          color="amber"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel
          title="Usage Trends"
          subtitle="Daily requests and token consumption"
          className="lg:col-span-3"
          right={
            <div className="hidden items-center gap-4 text-[11px] text-[#8B95AE] sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                Requests
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                Tokens
              </span>
            </div>
          }
        >
          <UsageTrendsChart points={trendPoints} loading={summaryLoading} />
        </Panel>

        <Panel title="Model Performance" subtitle="Usage by activity type" className="lg:col-span-2">
          <TypeBarsChart bars={typeBars} loading={summaryLoading} />
        </Panel>
      </div>



      {/* Activity + models row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel title="Recent Activity" subtitle="Latest workspace events" className="lg:col-span-2">
          {activityEvents.length === 0 ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.06]">
              <Activity className="h-5 w-5 text-[#4A5065]" />
              <p className="text-xs text-[#6B7385]">No recent activity yet — start a chat to see events here.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {activityEvents.map((ev) => {
                const meta = KIND_META[ev.kind] || KIND_META.chat;
                const Icon = meta.icon;
                return (
                  <li key={ev.id} className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${meta.box}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">{ev.title}</p>
                      <p className="truncate text-[11px] text-[#6B7385]">{ev.sub}</p>
                    </div>
                    <span className="flex-shrink-0 text-[11px] text-[#5A6275]">{timeAgo(ev.at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Top AI Models" subtitle="Models used in recent conversations" className="lg:col-span-3">
          <ul className="space-y-3">
            {modelStats.map((m) => (
              <li
                key={m.name}
                className="rounded-xl border border-white/[0.05] bg-[#17171F] p-4 transition-colors hover:border-[#8B5CF6]/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#C084FC]">
                      <Cpu className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">{m.name}</p>
                      <span
                        className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          m.active
                            ? 'border border-[#8B5CF6]/30 bg-[#8B5CF6]/20 text-[#C084FC]'
                            : 'border border-white/10 bg-white/5 text-[#6B7385]'
                        }`}
                      >
                        {m.active ? 'Active' : 'Idle'}
                      </span>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-right text-[11px] font-semibold text-white">
                    {m.count} {m.count === 1 ? 'chat' : 'chats'}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#C084FC] transition-all duration-500"
                    style={{ width: `${m.count > 0 ? Math.max(6, m.share * 100) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Quick actions */}
      <Panel title="Quick Actions" subtitle="Jump straight into your most-used tools">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#17171F] px-4 py-6 text-center transition-all hover:-translate-y-0.5 hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/[0.06]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#C084FC] transition-transform group-hover:scale-110">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-xs font-semibold text-white">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </Panel>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between gap-2 rounded-2xl border border-white/[0.05] bg-[#12121A]/70 px-6 py-4 text-[11px] text-[#5A6275] sm:flex-row">
        <span>© 2026 AI TechHub. All Rights Reserved.</span>
        <span>
          Designed &amp; Developed by <span className="font-semibold text-[#C084FC]">AI TechHub Smart Tech</span>
        </span>
      </footer>
    </div>
  );
}

