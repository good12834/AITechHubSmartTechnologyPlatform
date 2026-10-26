import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Search,
  Trash2,
  RefreshCw,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import documentsApi from '../../services/documentsApi';
import FileUploader from '../../components/ui/FileUploader';
import PageHeader from '../../components/layout/PageHeader';
import MarkdownRenderer from '../../components/ui/MarkdownRenderer';
import { formatBytes, formatDate } from '../../utils/formatters';

export default function DocumentsPage() {
  const { selectedModel } = useWorkspace();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState(null);

  // Q&A state
  const [question, setQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  const [qaError, setQaError] = useState('');

  // Semantic search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchDocs = async () => {
    try {
      const res = await documentsApi.listDocuments();
      const items = res?.items || [];
      setDocuments(items);
      if (items.length > 0 && !activeDoc) {
        setActiveDoc(items[0]);
      }
    } catch (err) {
      console.warn('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      const uploaded = await documentsApi.uploadDocument(file);
      setDocuments([uploaded, ...documents]);
      setActiveDoc(uploaded);
      // Poll or reload in 2 seconds to check processed chunks
      setTimeout(fetchDocs, 2000);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document and all its indexed chunks?')) return;
    try {
      await documentsApi.deleteDocument(id);
      const updated = documents.filter((d) => d.id !== id);
      setDocuments(updated);
      if (activeDoc?.id === id) {
        setActiveDoc(updated.length > 0 ? updated[0] : null);
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleProcess = async (id, e) => {
    e.stopPropagation();
    try {
      await documentsApi.processDocument(id);
      fetchDocs();
    } catch (err) {
      alert('Reprocess failed: ' + err.message);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || !activeDoc) return;

    setQaError('');
    setAsking(true);
    setQaAnswer(null);

    try {
      const res = await documentsApi.askDocument(activeDoc.id, question, selectedModel);
      setQaAnswer(res);
    } catch (err) {
      setQaError(err.message || 'Failed to query document.');
    } finally {
      setAsking(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await documentsApi.searchChunks(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document AI & RAG"
        description="Upload documents, extract knowledge chunks, and query grounded answers with precision citations."
        badge="Retrieval Augmented Generation"
      />

      {/* Upload Zone */}
      <div className="rounded-3xl bg-[#11182A] border border-white/5 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#22D3EE]" />
          <span>Upload New Knowledge File</span>
        </h3>
        <FileUploader onFileSelect={handleFileUpload} />
      </div>

      {/* Two Column Grid: Document List & RAG Q&A Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Documents Directory */}
        <div className="lg:col-span-5 rounded-3xl bg-[#11182A] border border-white/5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <span className="text-sm font-bold text-white">Indexed Documents ({documents.length})</span>
              <button
                onClick={fetchDocs}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#9CA8C5] hover:text-white"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#64748B]">
                No files uploaded yet. Drag a PDF or text document above.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                {documents.map((doc) => {
                  const isSelected = activeDoc?.id === doc.id;
                  const isReady = doc.status === 'ready' || doc.status === 'processed';

                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setActiveDoc(doc);
                        setQaAnswer(null);
                      }}
                      className={`group p-3.5 rounded-2xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-[#151C30] border-[#22D3EE]/50 shadow-md shadow-[#22D3EE]/10'
                          : 'bg-[#151C30]/40 border-white/5 hover:border-white/10 hover:bg-[#151C30]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 truncate">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7959F5]/20 to-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE] flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <h4 className="text-xs font-bold text-white truncate">{doc.filename}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-[#9CA8C5] mt-1">
                              <span>{formatBytes(doc.size_bytes)}</span>
                              <span>•</span>
                              <span>{doc.chunk_count || 0} chunks</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleProcess(doc.id, e)}
                            className="p-1 text-[#64748B] hover:text-[#22D3EE] opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Re-index"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(doc.id, e)}
                            className="p-1 text-[#64748B] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold uppercase ${
                            isReady
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {doc.status}
                        </span>
                        <span className="text-[#64748B]">{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Grounded Q&A Assistant */}
        <div className="lg:col-span-7 rounded-3xl bg-[#11182A] border border-white/5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7959F5]" />
                <h3 className="text-sm font-bold text-white">Ask Active Document</h3>
              </div>
              {activeDoc && (
                <span className="text-xs text-[#22D3EE] font-mono bg-[#151C30] px-2.5 py-1 rounded-xl border border-white/5 truncate max-w-xs">
                  {activeDoc.filename}
                </span>
              )}
            </div>

            {/* Question Form */}
            <form onSubmit={handleAskQuestion} className="space-y-3 mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={
                    activeDoc
                      ? `Ask questions about "${activeDoc.filename}"...`
                      : 'Select a document from the left to ask questions'
                  }
                  disabled={!activeDoc || asking}
                  className="w-full bg-[#0D1324] border border-white/10 rounded-2xl pl-4 pr-24 py-3 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || !activeDoc || asking}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white text-xs font-bold shadow-md shadow-[#7959F5]/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                >
                  {asking ? 'Thinking...' : 'Ask RAG'}
                </button>
              </div>
            </form>

            {qaError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 mb-4">
                {qaError}
              </div>
            )}

            {/* Answer Display */}
            {asking ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#22D3EE] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#9CA8C5]">
                  Retrieving matching chunks & generating grounded answer...
                </p>
              </div>
            ) : qaAnswer ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#0D1324] border border-white/5">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#22D3EE]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Grounded Answer:</span>
                  </div>
                  <MarkdownRenderer content={qaAnswer.answer} />
                </div>

                {/* Citations list */}
                {qaAnswer.citations && qaAnswer.citations.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-[#9CA8C5] mb-2 uppercase tracking-wider">
                      Source References & Excerpts
                    </h5>
                    <div className="space-y-2">
                      {qaAnswer.citations.map((cite, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-[#151C30]/50 border border-white/5 text-xs text-[#CBD5E1]"
                        >
                          <div className="flex items-center justify-between text-[10px] text-[#7959F5] font-semibold mb-1">
                            <span>Chunk #{cite.chunk_index + 1}</span>
                            <span>Score: {cite.score}</span>
                          </div>
                          <p className="line-clamp-3 font-mono text-[11px] text-[#9CA8C5] leading-relaxed">
                            {cite.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-[#64748B]">
                Select a document and ask any question to retrieve answers with citations.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
