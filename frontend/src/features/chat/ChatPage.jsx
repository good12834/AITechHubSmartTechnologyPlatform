import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  MessageSquare,
  Search,
  Check,
  X,
  Cpu,
  Clock,
  RotateCcw,
  ChevronDown,
  BrainCircuit,
  SlidersHorizontal,
  Bot,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import chatApi from '../../services/chatApi';
import { streamChatResponse } from '../../utils/streamClient';
import ChatMessage from './ChatMessage';
import ChatComposer from './ChatComposer';
import robotImg from '../../assets/ai-robot.jpg';

// Sample conversation when user hasn't started one yet
const INITIAL_DEMO_MESSAGES = [
  {
    id: 'demo-1',
    role: 'user',
    content: 'Explain React hooks with an example.',
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'demo-2',
    role: 'assistant',
    model: 'Llama 3.2',
    content: `React Hooks are functions that let you use state and other React features in functional components. Here's a simple example using \`useState\`:

\`\`\`jsx
// Counter.jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

This creates a counter that updates when you click the button! The \`useState\` hook initializes \`count\` to \`0\` and returns a setter function \`setCount\` to trigger seamless component re-renders.`,
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
];

export default function ChatPage() {
  const { selectedModel, setSelectedModel, availableModels, isAiOnline } = useWorkspace();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState(INITIAL_DEMO_MESSAGES);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamDelta, setStreamDelta] = useState('');
  const [loadingConv, setLoadingConv] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const modelDropdownRef = useRef(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamDelta]);

  // Close model dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load conversations list
  useEffect(() => {
    async function fetchConvs() {
      try {
        const list = await chatApi.listConversations();
        setConversations(list);

        const targetId = location.state?.activeConversationId;
        if (targetId) {
          setActiveConvId(targetId);
        } else if (list.length > 0 && !activeConvId) {
          setActiveConvId(list[0].id);
        }
      } catch (err) {
        console.warn('Failed to load conversations:', err);
      }
    }
    fetchConvs();
  }, [location.state]);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages(INITIAL_DEMO_MESSAGES);
      return;
    }

    async function loadConvDetail() {
      setLoadingConv(true);
      try {
        const conv = await chatApi.getConversation(activeConvId);
        if (conv) {
          if (conv.messages && conv.messages.length > 0) {
            setMessages(conv.messages);
          } else {
            setMessages(INITIAL_DEMO_MESSAGES);
          }
          if (conv.model) setSelectedModel(conv.model);
        }
      } catch (err) {
        console.warn('Failed to load conversation details:', err);
      } finally {
        setLoadingConv(false);
      }
    }

    loadConvDetail();
  }, [activeConvId]);

  // Handle initial prompt passed from search bar
  useEffect(() => {
    if (location.state?.initialPrompt) {
      setInput(location.state.initialPrompt);
    }
  }, [location.state]);

  const handleCreateConversation = async () => {
    try {
      const newConv = await chatApi.createConversation({
        title: 'New Conversation',
        model: selectedModel,
      });
      setConversations([newConv, ...conversations]);
      setActiveConvId(newConv.id);
      setMessages([]);
      setShowHistoryDrawer(false);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await chatApi.deleteConversation(id);
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (activeConvId === id) {
        setActiveConvId(updated.length > 0 ? updated[0].id : null);
        if (updated.length === 0) {
          setMessages(INITIAL_DEMO_MESSAGES);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    setClearConfirmOpen(false);
  };

  const handleSaveTitle = async (id, e) => {
    e.stopPropagation();
    if (!newTitle.trim()) {
      setEditingTitleId(null);
      return;
    }
    try {
      const updated = await chatApi.updateConversation(id, { title: newTitle.trim() });
      setConversations(conversations.map((c) => (c.id === id ? updated : c)));
      setEditingTitleId(null);
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || isStreaming) return;

    // Ensure we have an active conversation persisted in MySQL
    let convId = activeConvId;
    if (!convId) {
      try {
        const newConv = await chatApi.createConversation({
          title: text.slice(0, 40),
          model: selectedModel,
        });
        setConversations([newConv, ...conversations]);
        setActiveConvId(newConv.id);
        convId = newConv.id;
      } catch (err) {
        console.error('Failed to init conversation:', err);
      }
    }

    // Append user message optimistically
    const userMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    setStreamDelta('');

    // Setup abort controller
    abortControllerRef.current = new AbortController();
    let accumulated = '';

    await streamChatResponse({
      conversationId: convId,
      content: text,
      model: selectedModel,
      signal: abortControllerRef.current.signal,
      onDelta: (chunk) => {
        accumulated += chunk;
        setStreamDelta(accumulated);
      },
      onDone: () => {
        if (accumulated) {
          const assistantMsg = {
            id: `temp-asst-${Date.now()}`,
            role: 'assistant',
            content: accumulated,
            model: selectedModel,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
        setStreamDelta('');
        setIsStreaming(false);

        // Refresh conversation title if it was first message
        if (convId) {
          chatApi.getConversation(convId).then((res) => {
            if (res) {
              setConversations((prev) =>
                prev.map((c) => (c.id === convId ? { ...c, title: res.title } : c))
              );
            }
          });
        }
      },
      onError: (err) => {
        console.error('Streaming error:', err);
        const errMsg = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Generation notice: ${err.message || 'Stream disrupted'}. Running local fallback model response.`,
          model: selectedModel,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
        setStreamDelta('');
        setIsStreaming(false);
      },
    });
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  const handleRegenerateLast = () => {
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length > 0) {
      const lastUser = userMessages[userMessages.length - 1];
      handleSendMessage(lastUser.content);
    }
  };

  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Hero Header Banner matching the mockup */}
      <div className="relative overflow-hidden rounded-3xl border border-[#1E2C48] bg-gradient-to-r from-[#0C152B] via-[#111D34] to-[#18233C] p-6 shadow-2xl">
        {/* Glow backlight rings */}
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-[#6046F5]/25 blur-3xl" />
        <div className="absolute right-10 top-0 h-48 w-48 rounded-full bg-[#A78BFA]/15 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Mascot & Title */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-[#6046F5]/50 shadow-xl shadow-[#6046F5]/30">
                <img
                  src={robotImg}
                  alt="AI Chat Mascot"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#6046F5] text-white shadow-md">
                <BrainCircuit className="h-3.5 w-3.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">AI Chat</h1>
                <span className="rounded-full bg-[#6046F5]/20 border border-[#6046F5]/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">
                  Ollama v3
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#94A3B8]">
                Streaming responses, model selection, chat history
              </p>
            </div>
          </div>

          {/* Model Switcher & Status pill */}
          <div className="flex items-center gap-3">
            {/* Model Selector Pill Dropdown */}
            <div className="relative" ref={modelDropdownRef}>
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-[#26375A] bg-[#111D34] px-4 py-2 text-xs font-bold text-white shadow-md hover:border-[#6046F5] hover:bg-[#152442] transition-all"
              >
                <span>Switch Model</span>
                <ChevronDown className={`h-3.5 w-3.5 text-[#A78BFA] transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {modelDropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-[#1E2C48] bg-[#0E172A] p-2 shadow-2xl">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Installed Ollama Models
                  </p>
                  <div className="space-y-1">
                    {availableModels.map((m) => {
                      const isSelected = m.name === selectedModel;
                      return (
                        <button
                          key={m.name}
                          type="button"
                          onClick={() => {
                            setSelectedModel(m.name);
                            setModelDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                            isSelected
                              ? 'bg-[#6046F5] text-white font-bold'
                              : 'text-[#94A3B8] hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Bot className="h-3.5 w-3.5 text-[#A78BFA]" />
                            <span>{m.name}</span>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Model Status Badge */}
            <div className="flex items-center gap-2.5 rounded-xl border border-[#26375A] bg-[#0A101F]/80 px-3.5 py-2">
              <Cpu className="h-3.5 w-3.5" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">{selectedModel || 'Llama 3.2'}</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isAiOnline ? 'Online' : 'Fallback'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Chat Workspace Container */}
      <div className="relative rounded-3xl border border-[#1E2C48] bg-[#0A1124] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[580px]">
        {/* Left / Drawer Chat History Sessions */}
        <div
          className={`${
            showHistoryDrawer ? 'flex' : 'hidden md:flex'
          } w-full md:w-72 flex-col justify-between border-r border-[#19233C] bg-[#0D1528] p-4 flex-shrink-0 transition-all`}
        >
          <div>
            {/* New Chat Button */}
            <button
              onClick={handleCreateConversation}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6046F5] to-[#7C3AED] py-2.5 text-xs font-bold text-white shadow-lg shadow-[#6046F5]/30 hover:scale-[1.01] active:scale-98 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </button>

            {/* Search sessions */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-[#1E2C48] bg-[#111D34] py-1.5 pl-8 pr-3 text-xs text-white placeholder-[#64748B] focus:border-[#6046F5] focus:outline-none"
              />
            </div>

            {/* Saved chats list */}
            <div className="mt-4 space-y-1 max-h-[380px] overflow-y-auto no-scrollbar">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Recent Sessions
              </p>
              {filteredConvs.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#64748B]">No conversations</div>
              ) : (
                filteredConvs.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  const isEditing = editingTitleId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => !isEditing && setActiveConvId(conv.id)}
                      className={`group relative flex items-center justify-between rounded-xl p-2.5 cursor-pointer text-xs transition-all ${
                        isActive
                          ? 'bg-[#152038] text-white border border-[#6046F5]/40 font-semibold'
                          : 'text-[#94A3B8] hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-[#A78BFA]' : 'text-[#64748B]'}`} />
                        {isEditing ? (
                          <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full rounded bg-[#0A101F] px-1.5 py-0.5 text-xs text-white border border-[#6046F5] focus:outline-none"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate">{conv.title}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isEditing ? (
                          <>
                            <button
                              onClick={(e) => handleSaveTitle(conv.id, e)}
                              className="p-1 hover:text-emerald-400"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTitleId(null);
                              }}
                              className="p-1 hover:text-rose-400"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTitleId(conv.id);
                                setNewTitle(conv.title);
                              }}
                              className="p-1 hover:text-[#A78BFA]"
                              title="Rename"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteConversation(conv.id, e)}
                              className="p-1 hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#19233C] text-[11px] text-[#64748B] flex items-center justify-between px-2">
            <span>MySQL Storage</span>
            <span className="text-emerald-400">Synced</span>
          </div>
        </div>

        {/* Main Conversation Stream Panel */}
        <div className="flex-1 flex flex-col justify-between bg-[#080F20]/50">
          {/* Conversation Top Action Bar */}
          <div className="flex items-center justify-between border-b border-[#19233C] bg-[#0A1124]/90 px-6 py-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                className="md:hidden rounded-lg p-1.5 text-[#94A3B8] hover:bg-white/5 hover:text-white"
                title="Toggle sessions"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-white">
                  {conversations.find((c) => c.id === activeConvId)?.title || 'AI Chat Assistant'}
                </span>
              </div>
            </div>

            {/* Header controls: History clock & Clear Trash */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                className="flex items-center gap-1.5 rounded-xl border border-[#1E2C48] bg-[#111D34] px-2.5 py-1.5 text-xs text-[#94A3B8] hover:border-[#6046F5] hover:text-white transition-colors"
                title="History"
              >
                <Clock className="h-3.5 w-3.5 text-[#A78BFA]" />
                <span className="hidden sm:inline text-[11px]">History</span>
              </button>

              <button
                type="button"
                onClick={() => setClearConfirmOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-[#1E2C48] bg-[#111D34] px-2.5 py-1.5 text-xs text-[#94A3B8] hover:border-rose-500/50 hover:text-rose-400 transition-colors"
                title="Clear current conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Clear</span>
              </button>
            </div>
          </div>

          {/* Messages List Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[600px]">
            {loadingConv ? (
              <div className="py-20 text-center">
                <div className="h-8 w-8 border-3 border-[#6046F5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-[#94A3B8]">Loading conversation messages...</p>
              </div>
            ) : messages.length === 0 && !streamDelta ? (
              <div className="py-16 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6046F5]/15 border border-[#6046F5]/30 text-[#A78BFA]">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-white">What would you like to build today?</h3>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                  Type a prompt below or select one of the quick actions to test streaming answers and syntax-highlighted code.
                </p>
                <div className="pt-3 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => handleSendMessage('Explain React hooks with an example.')}
                    className="rounded-xl border border-[#233355] bg-[#111D34] px-3.5 py-2 text-xs font-semibold text-white hover:border-[#6046F5] hover:bg-[#152442] transition-colors"
                  >
                    Explain React hooks
                  </button>
                  <button
                    onClick={() => handleSendMessage('Debug my code and check for memory leaks.')}
                    className="rounded-xl border border-[#233355] bg-[#111D34] px-3.5 py-2 text-xs font-semibold text-white hover:border-[#6046F5] hover:bg-[#152442] transition-colors"
                  >
                    Debug my code
                  </button>
                  <button
                    onClick={() => handleSendMessage('Summarize a document and extract action items.')}
                    className="rounded-xl border border-[#233355] bg-[#111D34] px-3.5 py-2 text-xs font-semibold text-white hover:border-[#6046F5] hover:bg-[#152442] transition-colors"
                  >
                    Summarize a document
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={msg.id || idx}
                    message={msg}
                    onRegenerate={msg.role === 'assistant' ? handleRegenerateLast : undefined}
                  />
                ))}

                {/* In-flight streaming message */}
                {isStreaming && streamDelta && (
                  <ChatMessage
                    message={{
                      role: 'assistant',
                      content: streamDelta,
                      model: selectedModel,
                      created_at: new Date().toISOString(),
                    }}
                    isStreaming={true}
                  />
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Bottom Message Composer & Quick Action Chips */}
          <div className="border-t border-[#19233C] bg-[#0A1124]/90 p-4 sm:p-5 backdrop-blur-md">
            <ChatComposer
              input={input}
              setInput={setInput}
              onSend={() => handleSendMessage()}
              isStreaming={isStreaming}
              onStop={handleStopStreaming}
              disabled={loadingConv}
              onQuickAction={(promptText) => {
                setInput(promptText);
                handleSendMessage(promptText);
              }}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clear History */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1E2C48] bg-[#0E172A] p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Clear Chat History?</h3>
            <p className="mt-2 text-xs text-[#94A3B8]">
              This will remove all current messages from the screen. New messages will continue in a fresh session.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setClearConfirmOpen(false)}
                className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-[#94A3B8] hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="rounded-xl bg-rose-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-600 transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
