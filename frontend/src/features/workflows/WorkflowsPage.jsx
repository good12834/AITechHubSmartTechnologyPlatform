import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  Database,
  Trash2,
  X,
  Layers,
} from 'lucide-react';
import workflowsApi from '../../services/workflowsApi';
import PageHeader from '../../components/layout/PageHeader';
import { formatDate } from '../../utils/formatters';

const TRIGGERS = [
  { id: 'document_uploaded', label: 'Document Uploaded', desc: 'Fires when a new PDF or TXT file is added' },
  { id: 'manual', label: 'Manual Trigger', desc: 'Executed on-demand from the dashboard or API' },
  { id: 'daily_schedule', label: 'Daily Scheduled Run', desc: 'Automated 24h cron execution' },
];

const ACTIONS = [
  { id: 'summarize', label: 'AI Summarization', desc: 'Generate executive summary & key takeaways' },
  { id: 'extract_code', label: 'Extract & Validate Code', desc: 'Parse code blocks and check syntax' },
  { id: 'entity_recognition', label: 'Extract Key Entities', desc: 'Identify organizations, people, and topics' },
  { id: 'sentiment_analysis', label: 'Analyze Sentiment & Tone', desc: 'Evaluate emotional polarity & tone' },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState(TRIGGERS[0].id);
  const [action, setAction] = useState(ACTIONS[0].id);
  const [creating, setCreating] = useState(false);

  const fetchWorkflows = async () => {
    try {
      const res = await workflowsApi.listWorkflows();
      const items = res?.items || [];
      setWorkflows(items);
      if (items.length > 0 && !activeWorkflow) {
        setActiveWorkflow(items[0]);
      }
    } catch (err) {
      console.warn('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Fetch runs when active workflow changes
  useEffect(() => {
    if (!activeWorkflow) {
      setRuns([]);
      return;
    }

    async function loadRuns() {
      setRunsLoading(true);
      try {
        const runItems = await workflowsApi.listRuns(activeWorkflow.id);
        setRuns(runItems || []);
      } catch (err) {
        console.warn('Failed to load runs:', err);
      } finally {
        setRunsLoading(false);
      }
    }

    loadRuns();
  }, [activeWorkflow]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || creating) return;

    setCreating(true);
    try {
      const definition = [
        { type: 'trigger', id: trigger },
        { type: 'action', id: action },
        { type: 'destination', id: 'save_to_project' },
      ];
      const created = await workflowsApi.createWorkflow({
        name: name.trim(),
        description: description.trim(),
        definition,
      });
      setWorkflows([created, ...workflows]);
      setActiveWorkflow(created);
      setCreateOpen(false);
      setName('');
      setDescription('');
    } catch (err) {
      alert('Failed to create workflow: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRun = async (workflowId) => {
    try {
      const run = await workflowsApi.runWorkflow(workflowId, { manual: true });
      setRuns([run, ...runs]);
      alert('Workflow execution dispatched to Celery background worker!');
    } catch (err) {
      alert('Failed to run workflow: ' + err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this workflow and its execution logs?')) return;
    try {
      await workflowsApi.deleteWorkflow(id);
      const updated = workflows.filter((w) => w.id !== id);
      setWorkflows(updated);
      if (activeWorkflow?.id === id) {
        setActiveWorkflow(updated.length > 0 ? updated[0] : null);
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Workflows"
        description="Automate repetitive pipelines: trigger on events, process with local models, and output results."
        badge="Autonomous Pipelines"
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white text-xs font-bold shadow-lg shadow-[#7959F5]/25 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </button>
        }
      />

      {/* Two Column Layout: Workflows List & Workflow Execution Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Workflows Directory */}
        <div className="lg:col-span-5 rounded-3xl bg-[#11182A] border border-white/5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <span className="text-sm font-bold text-white">Configured Pipelines ({workflows.length})</span>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-3 border-[#7959F5] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#64748B]">
                No workflows configured yet. Click Create Workflow above.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {workflows.map((wf) => {
                  const isSelected = activeWorkflow?.id === wf.id;
                  return (
                    <div
                      key={wf.id}
                      onClick={() => setActiveWorkflow(wf)}
                      className={`group p-4 rounded-2xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-[#151C30] border-[#7959F5] shadow-md shadow-[#7959F5]/20'
                          : 'bg-[#151C30]/40 border-white/5 hover:border-white/10 hover:bg-[#151C30]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                            <Workflow className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-[#22D3EE] transition-colors">
                              {wf.name}
                            </h4>
                            <p className="text-[11px] text-[#9CA8C5] line-clamp-1 mt-0.5">
                              {wf.description || 'No description provided'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRun(wf.id)}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Run Now"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(wf.id, e)}
                            className="p-1.5 text-[#64748B] hover:text-rose-400 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-[#64748B]">
                        <span className="text-[#22D3EE] font-semibold uppercase">
                          {wf.status || 'Active'}
                        </span>
                        <span>Updated {formatDate(wf.updated_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Workflow Visual Pipeline & Run Logs */}
        <div className="lg:col-span-7 rounded-3xl bg-[#11182A] border border-white/5 p-6 flex flex-col justify-between">
          {activeWorkflow ? (
            <div className="space-y-6">
              {/* Header with Run Trigger */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-base font-bold text-white">{activeWorkflow.name}</h3>
                  <p className="text-xs text-[#9CA8C5] mt-0.5">
                    {activeWorkflow.description || 'Continuous automation pipeline'}
                  </p>
                </div>
                <button
                  onClick={() => handleRun(activeWorkflow.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Pipeline</span>
                </button>
              </div>

              {/* Visual Pipeline Steps */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#9CA8C5] mb-3">
                  Pipeline Execution Graph
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#0D1324] border border-white/10 text-center">
                    <span className="text-[10px] font-bold uppercase text-[#22D3EE] tracking-wide block mb-1">
                      1. Trigger
                    </span>
                    <p className="text-xs font-semibold text-white">Document Ingest</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Event Driven</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#0D1324] border border-[#7959F5]/40 text-center shadow-md shadow-[#7959F5]/10">
                    <span className="text-[10px] font-bold uppercase text-[#7959F5] tracking-wide block mb-1">
                      2. AI Transform
                    </span>
                    <p className="text-xs font-semibold text-white">Model Reasoning</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Local LLM</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#0D1324] border border-white/10 text-center">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wide block mb-1">
                      3. Destination
                    </span>
                    <p className="text-xs font-semibold text-white">Project Output</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Persistent MySQL</p>
                  </div>
                </div>
              </div>

              {/* Run History Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#9CA8C5] mb-3">
                  Execution Run Logs ({runs.length})
                </h4>

                {runsLoading ? (
                  <div className="py-8 text-center text-xs text-[#9CA8C5]">Loading run logs...</div>
                ) : runs.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#0D1324] border border-white/5 text-center text-xs text-[#64748B]">
                    No recorded executions yet. Click <strong>Run Pipeline</strong> to trigger one.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {runs.map((r) => {
                      const isComplete = r.status === 'completed';
                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#0D1324] border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-400" />
                            )}
                            <div>
                              <span className="font-mono text-white font-semibold">
                                Run #{r.id.slice(0, 8)}
                              </span>
                              <p className="text-[10px] text-[#9CA8C5]">{formatDate(r.created_at)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                isComplete
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {r.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-[#64748B]">
              Select or create a workflow to view its automation graph.
            </div>
          )}
        </div>
      </div>

      {/* Create Workflow Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#151C30] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <h3 className="text-sm font-bold text-white">Create Automation Workflow</h3>
              <button onClick={() => setCreateOpen(false)} className="p-1 text-[#9CA8C5] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">Workflow Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Document Summary & Entity Extraction Pipeline"
                  className="w-full bg-[#11182A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize uploaded specifications and save outputs..."
                  className="w-full bg-[#11182A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">Trigger Condition</label>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  className="w-full bg-[#11182A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7959F5]"
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} — {t.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">AI Action Step</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full bg-[#11182A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7959F5]"
                >
                  {ACTIONS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9CA8C5] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white text-xs font-bold shadow-lg shadow-[#7959F5]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Deploy Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
