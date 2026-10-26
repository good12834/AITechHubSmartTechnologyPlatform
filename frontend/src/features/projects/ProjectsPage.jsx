import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Trash2,
  Edit2,
  ExternalLink,
  MessageSquare,
  FileText,
  Code2,
  Clock,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import projectsApi from '../../services/projectsApi';
import PageHeader from '../../components/layout/PageHeader';
import { formatDate } from '../../utils/formatters';

export default function ProjectsPage() {
  const { activeProject, setActiveProject } = useWorkspace();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingProj, setEditingProj] = useState(null);

  const fetchProjects = async () => {
    try {
      const res = await projectsApi.listProjects();
      setProjects(res?.items || []);
    } catch (err) {
      console.warn('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!projectName.trim() || creating) return;

    setCreating(true);
    try {
      const created = await projectsApi.createProject({
        name: projectName.trim(),
        description: projectDesc.trim(),
      });
      setProjects([created, ...projects]);
      setProjectName('');
      setProjectDesc('');
      setCreateOpen(false);
    } catch (err) {
      alert('Failed to create project: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project? Associated items will be unlinked.')) return;
    try {
      await projectsApi.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      if (activeProject?.id === id) setActiveProject(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Management"
        description="Organize chats, code snippets, document knowledge bases, and workflow outputs into focused project workspaces."
        badge="Multi-Tenant Isolation"
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white text-xs font-bold shadow-lg shadow-[#7959F5]/25 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        }
      />

      {/* Search and Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter projects by title or description..."
          className="w-full bg-[#11182A] border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]"
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-3 border-[#7959F5] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-[#11182A] border border-white/5">
          <FolderKanban className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No projects found</h3>
          <p className="text-xs text-[#9CA8C5] mt-1 mb-4">
            Create your first project to start grouping chats and documents together.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7959F5] text-white text-xs font-semibold shadow-md shadow-[#7959F5]/30 hover:scale-105 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((proj) => {
            const isActive = activeProject?.id === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => setActiveProject(proj)}
                className={`group rounded-3xl p-6 cursor-pointer border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-[#151C30] border-[#7959F5] shadow-xl shadow-[#7959F5]/20 ring-1 ring-[#7959F5]'
                    : 'bg-[#151C30]/50 border-white/5 hover:border-white/10 hover:bg-[#151C30]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7959F5]/20 to-[#22D3EE]/20 text-[#22D3EE] flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#22D3EE] transition-colors">
                          {proj.name}
                        </h3>
                        {isActive && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Active Workspace
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(proj.id, e)}
                      className="p-1.5 text-[#64748B] hover:text-rose-400 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-[#9CA8C5] line-clamp-3 leading-relaxed mb-6">
                    {proj.description || 'No description provided for this project.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-[#64748B]">
                  <span>Updated {formatDate(proj.updated_at)}</span>
                  <span className="text-[#22D3EE] group-hover:underline font-semibold">
                    {isActive ? 'Selected' : 'Select'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#151C30] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <h3 className="text-sm font-bold text-white">Create New Project</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1 text-[#9CA8C5] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. E-Commerce Microservices Architecture"
                  className="w-full bg-[#11182A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Description & Scope
                </label>
                <textarea
                  rows={3}
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Objectives, technologies, and target milestones..."
                  className="w-full bg-[#11182A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5] resize-none"
                />
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
                  disabled={creating || !projectName.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white text-xs font-bold shadow-lg shadow-[#7959F5]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
