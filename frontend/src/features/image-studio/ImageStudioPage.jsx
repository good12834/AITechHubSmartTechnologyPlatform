import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Image as ImageIcon,
  Camera,
  Building2,
  Package,
  Paintbrush,
  Ruler,
  Film,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Trash2,
  Maximize2,
  X,
  Dices,
  Search,
  ChevronDown,
  ChevronUp,
  Cpu,
  Palette,
  Ratio,
  Wand2,
  Zap,
  Star,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Layers,
  SlidersHorizontal,
  Eye,
  BookOpen,
  Settings2,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import imageApi from '../../services/imageApi';
import { callMcpTool } from '../../services/mcpApi';
import PageHeader from '../../components/layout/PageHeader';
import { formatDate, timeAgo } from '../../utils/formatters';

// ── Constants ─────────────────────────────────────────────────────────────────

const STYLES = [
  { id: 'Photorealistic', name: 'Photorealistic', icon: Camera, desc: 'Ultra-detailed 8K DSLR photo', color: '#38BDF8' },
  { id: 'Cyberpunk Neon', name: 'Cyberpunk', icon: Building2, desc: 'Futuristic synthwave glow', color: '#7959F5' },
  { id: 'Anime & Manga', name: 'Anime', icon: Sparkles, desc: 'Vibrant Makoto Shinkai style', color: '#F472B6' },
  { id: '3D Isometric', name: '3D Iso', icon: Package, desc: 'Smooth clay & glass render', color: '#34D399' },
  { id: 'Oil Painting', name: 'Oil Paint', icon: Palette, desc: 'Rich classic canvas brushwork', color: '#F59E0B' },
  { id: 'Dark Fantasy', name: 'Dark Fantasy', icon: Wand2, desc: 'Moody gothic atmospheric', color: '#A855F7' },
  { id: 'Cinematic Film', name: 'Cinematic', icon: Film, desc: '35mm anamorphic movie still', color: '#EF4444' },
  { id: 'Minimalist Vector', name: 'Minimalist', icon: Ruler, desc: 'Clean geometric vector art', color: '#64748B' },
  { id: 'Watercolor', name: 'Watercolor', icon: Paintbrush, desc: 'Soft flowing watercolor washes', color: '#22D3EE' },
  { id: 'Pixel Art', name: 'Pixel Art', icon: LayoutGrid, desc: 'Retro pixel art aesthetic', color: '#84CC16' },
  { id: 'Steampunk', name: 'Steampunk', icon: Settings2, desc: 'Victorian clockwork machinery', color: '#D97706' },
  { id: 'Surrealist', name: 'Surrealist', icon: Eye, desc: 'Dreamlike Salvador Dalí vision', color: '#EC4899' },
];

const RATIOS = [
  { label: '1:1', name: 'Square', value: '1:1', dimensions: '1024×1024', preview: 'w-10 h-10' },
  { label: '16:9', name: 'Landscape', value: '16:9', dimensions: '1280×720', preview: 'w-14 h-8' },
  { label: '9:16', name: 'Portrait', value: '9:16', dimensions: '720×1280', preview: 'w-8 h-14' },
  { label: '4:3', name: 'Standard', value: '4:3', dimensions: '1024×768', preview: 'w-12 h-9' },
  { label: '21:9', name: 'Ultrawide', value: '21:9', dimensions: '1344×576', preview: 'w-16 h-7' },
];

const MODELS = [
  { id: 'flux-schnell', name: 'FLUX.1 Schnell', tag: 'Ultra-Fast', desc: 'State-of-the-art visual fidelity', color: '#22D3EE' },
  { id: 'stable-image-core', name: 'Stability Core', tag: 'Balanced', desc: 'Stable Image Core text-to-image', color: '#7959F5' },
  { id: 'sdxl', name: 'SDXL', tag: 'High-Res', desc: 'Cinematic details & complex scenes', color: '#F472B6' },
  { id: 'midjourney', name: 'MJ Vibe', tag: 'Artistic', desc: 'Dreamlike colors and compositions', color: '#F59E0B' },
  { id: 'anime', name: 'Anime Diffusion', tag: 'Illustration', desc: 'Expressive characters and scenery', color: '#84CC16' },
];

const LIGHTING_PRESETS = [
  { id: 'golden-hour', name: 'Golden Hour', suffix: 'golden hour lighting, warm sunset rays' },
  { id: 'neon-night', name: 'Neon Night', suffix: 'neon lit night, colorful city lights, rain reflections' },
  { id: 'studio', name: 'Studio', suffix: 'professional studio lighting, softbox, neutral background' },
  { id: 'volumetric', name: 'Volumetric', suffix: 'dramatic volumetric light rays, atmospheric haze' },
  { id: 'bioluminescent', name: 'Bioluminescent', suffix: 'bioluminescent glow, ethereal blue-green light' },
  { id: 'dramatic', name: 'Dramatic', suffix: 'dramatic chiaroscuro lighting, deep shadows, high contrast' },
];

const QUALITY_LEVELS = [
  { id: 'draft', name: 'Draft', desc: 'Fast preview', steps: 20 },
  { id: 'standard', name: 'Standard', desc: 'Balanced quality', steps: 35 },
  { id: 'ultra', name: 'Ultra', desc: 'Maximum fidelity', steps: 50 },
];

const INSPIRATIONS = [
  'Futuristic cybernetic city with floating holographic billboards, volumetric rain reflections, 8k resolution',
  'Bioluminescent magical enchanted forest at midnight with glowing floating lotus blossoms and fireflies',
  'Isometric 3D cute robot barista making espresso in a futuristic glass coffee laboratory, soft morning light',
  'Astronaut standing on an iridescent crystalline alien planet gazing up at three ringed moons, epic scale',
  'Hyper-detailed mechanical dragon with polished titanium armor, neon cyan core energy, dark moody cavern',
  'Cozy retro-futuristic solarpunk greenhouse apartment overlooking a floating city in the clouds at sunset',
  'Ethereal goddess woven from celestial constellations and swirling galaxies, majestic starlight aura',
  'Sleek electric hypercar driving through a neon-lit Tokyo highway at high speed, motion blur, rain drenched',
  'Ancient temple hidden inside a massive hollow ancient tree filled with fireflies and golden mist',
  'Deep ocean alien civilization with crystalline spires, bioluminescent creatures, ethereal blue light',
  'Arctic aurora borealis over a lone glass cabin, reflections on frozen lake, ultra wide angle',
  'Samurai warrior standing on cherry blossom mountain at dusk, katana gleaming, cinematic composition',
];

const GALLERY_VIEWS = [
  { id: 'masonry', icon: LayoutGrid, label: 'Grid' },
  { id: 'slideshow', icon: Eye, label: 'Slideshow' },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function ImageStudioPage() {
  const { selectedModel: workspaceModel } = useWorkspace();

  // Prompt state
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceNote, setEnhanceNote] = useState('');

  // Generation options
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedEngine, setSelectedEngine] = useState('flux-schnell');
  const [selectedLighting, setSelectedLighting] = useState('');
  const [qualityLevel, setQualityLevel] = useState('standard');
  const [seed, setSeed] = useState('');
  const [batchSize, setBatchSize] = useState(1);

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLighting, setShowLighting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterStyle, setActiveFilterStyle] = useState('all');
  const [galleryView, setGalleryView] = useState('masonry');
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Data
  const [generations, setGenerations] = useState([]);

  const promptRef = useRef(null);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchGenerations = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await imageApi.listGenerations();
      const list = res?.items || (Array.isArray(res) ? res : []);
      setGenerations(list);
    } catch (err) {
      console.warn('Failed to load image generations:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { fetchGenerations(); }, [fetchGenerations]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSurpriseMe = () => {
    const p = INSPIRATIONS[Math.floor(Math.random() * INSPIRATIONS.length)];
    setPrompt(p);
    setCharCount(p.length);
    promptRef.current?.focus();
  };

  const handleRandomSeed = () => setSeed(Math.floor(Math.random() * 10_000_000).toString());

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    setEnhanceNote('');
    try {
      const res = await callMcpTool('enhance_prompt', {
        prompt: prompt.trim(),
        style: selectedStyle,
      });
      if (res?.enhanced) {
        setPrompt(res.enhanced);
        setCharCount(res.enhanced.length);
        if (res.note) setEnhanceNote(res.note);
      }
    } catch (err) {
      console.warn('Enhance prompt failed:', err);
    } finally {
      setEnhancing(false);
    }
  };

  const buildFinalPrompt = () => {
    let final = prompt.trim();
    if (selectedLighting) {
      const lighting = LIGHTING_PRESETS.find(l => l.id === selectedLighting);
      if (lighting) final += `, ${lighting.suffix}`;
    }
    return final;
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || generating) return;
    setError('');
    setGenerating(true);
    try {
      const finalPrompt = buildFinalPrompt();
      const record = await imageApi.generateImage({
        prompt: finalPrompt,
        model: selectedEngine,
        style: selectedStyle,
        aspectRatio,
        seed: seed ? parseInt(seed, 10) : undefined,
        negativePrompt: negativePrompt.trim() || undefined,
        quality: qualityLevel,
      });
      if (record) {
        setGenerations((prev) => [record, ...prev]);
        setPrompt('');
        setSeed('');
        setCharCount(0);
        setEnhanceNote('');
      }
    } catch (err) {
      setError(err.message || 'Image generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await imageApi.deleteGeneration(id);
      setGenerations((prev) => prev.filter((g) => g.id !== id));
      if (previewItem?.id === id) setPreviewItem(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleCopyPrompt = (id, text, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUsePrompt = (item, e) => {
    if (e) e.stopPropagation();
    setPrompt(item.prompt);
    setCharCount((item.prompt || '').length);
    if (item.metadata?.style) setSelectedStyle(item.metadata.style);
    if (item.metadata?.aspect_ratio) setAspectRatio(item.metadata.aspect_ratio);
    if (item.metadata?.negative_prompt) setNegativePrompt(item.metadata.negative_prompt);
    if (item.model) setSelectedEngine(item.model);
    setPreviewItem(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = async (item, e) => {
    if (e) e.stopPropagation();
    const url = item.result_url || item.image_url || item.output;
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const isSvg = url.endsWith('.svg') || blob.type.includes('svg');
      link.download = `aitechhub-${item.id.slice(0, 8)}.${isSvg ? 'svg' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const getDisplayUrl = (gen) => gen?.result_url || gen?.image_url || gen?.output || null;

  const filteredGenerations = useMemo(() => generations.filter((gen) => {
    const matchSearch = !searchQuery.trim()
      || gen.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
      || gen.model?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStyle = activeFilterStyle === 'all'
      || gen.metadata?.style?.toLowerCase() === activeFilterStyle.toLowerCase();
    return matchSearch && matchStyle;
  }), [generations, searchQuery, activeFilterStyle]);

  // Slideshow nav
  const slidePrev = () => setSlideshowIndex(i => (i - 1 + filteredGenerations.length) % filteredGenerations.length);
  const slideNext = () => setSlideshowIndex(i => (i + 1) % filteredGenerations.length);

  // Lightbox nav
  const openPreview = (gen) => {
    const idx = filteredGenerations.findIndex(g => g.id === gen.id);
    setPreviewIndex(idx >= 0 ? idx : 0);
    setPreviewItem(gen);
  };
  const previewPrev = () => {
    const newIdx = (previewIndex - 1 + filteredGenerations.length) % filteredGenerations.length;
    setPreviewIndex(newIdx);
    setPreviewItem(filteredGenerations[newIdx]);
  };
  const previewNext = () => {
    const newIdx = (previewIndex + 1) % filteredGenerations.length;
    setPreviewIndex(newIdx);
    setPreviewItem(filteredGenerations[newIdx]);
  };

  const activeStyle = STYLES.find(s => s.id === selectedStyle);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-20">
      {/* ── Header ── */}
      <PageHeader
        title="Image Studio"
        description="Create stunning AI artwork with prompt enhancement, 12 artistic styles, lighting presets, and batch generation."
        badge="MCP-Enhanced · Neural Diffusion 2.0"
      />

      {/* ── Generator Panel ── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0D1324]/95 to-[#090E1C]/95 border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${activeStyle?.color || '#7959F5'}22 0%, transparent 70%)` }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#22D3EE]/8 rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleGenerate} className="relative z-10 space-y-6">

          {/* ── Prompt Area ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#CBD5E1] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                Creative Prompt
                <span className={`text-[10px] font-mono ml-1 ${charCount > 400 ? 'text-rose-400' : 'text-[#64748B]'}`}>
                  {charCount}/500
                </span>
              </label>
              <div className="flex items-center gap-2">
                {/* Enhance via MCP */}
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || enhancing}
                  title="Enhance prompt with AI (MCP)"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#7959F5]/20 to-[#22D3EE]/20 hover:from-[#7959F5]/40 hover:to-[#22D3EE]/40 border border-[#7959F5]/30 text-xs font-medium text-[#C084FC] hover:text-white transition-all disabled:opacity-40"
                >
                  {enhancing
                    ? <><div className="w-3 h-3 border border-[#C084FC] border-t-transparent rounded-full animate-spin" /><span>Enhancing…</span></>
                    : <><Wand2 className="w-3.5 h-3.5" /><span>AI Enhance</span></>}
                </button>
                <button
                  type="button"
                  onClick={handleSurpriseMe}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#C084FC] hover:text-white transition-all"
                >
                  <Dices className="w-3.5 h-3.5" />
                  Inspire Me
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                ref={promptRef}
                rows={4}
                value={prompt}
                maxLength={500}
                onChange={(e) => { setPrompt(e.target.value); setCharCount(e.target.value.length); }}
                placeholder="Describe your visual concept in vivid detail… e.g. A cybernetic nomad at the neon precipice of Neo-Tokyo in the rain, hyper-detailed reflections, 8k cinematic"
                className="w-full bg-[#080C16] border border-white/10 rounded-2xl p-4 pr-10 text-xs md:text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5] focus:ring-2 focus:ring-[#7959F5]/20 transition-all resize-none shadow-inner"
              />
              {prompt && (
                <button type="button" onClick={() => { setPrompt(''); setCharCount(0); }}
                  className="absolute top-3 right-3 text-[#64748B] hover:text-white bg-white/5 hover:bg-white/10 rounded-lg p-1 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {enhanceNote && (
              <p className="mt-1.5 text-[10px] text-amber-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />{enhanceNote}
              </p>
            )}
          </div>

          {/* ── Style Selector ── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-[#CBD5E1] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#C084FC]" />
                Artistic Style
              </span>
              <span className="text-[11px] text-[#9CA8C5]">{activeStyle?.desc}</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {STYLES.map((st) => {
                const isSel = selectedStyle === st.id;
                return (
                  <button key={st.id} type="button" onClick={() => setSelectedStyle(st.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
                      isSel
                        ? 'border-[var(--c)] shadow-lg ring-1 ring-[var(--c)] scale-[1.03]'
                        : 'bg-[#12192E]/60 border-white/5 text-[#9CA8C5] hover:border-white/20 hover:text-white hover:scale-[1.01]'
                    }`}
                    style={isSel ? { '--c': st.color, background: `${st.color}22` } : {}}
                  >
                    <span className="text-xl mb-1"><st.icon className="w-6 h-6" /></span>
                    <span className="text-[10px] font-medium leading-tight">{st.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Aspect Ratio + Model ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aspect Ratio */}
            <div className="rounded-2xl bg-[#12192E]/50 border border-white/5 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#CBD5E1] flex items-center gap-1.5">
                  <Ratio className="w-3.5 h-3.5 text-[#22D3EE]" />
                  Aspect Ratio
                </span>
                <span className="text-[11px] font-mono text-[#22D3EE]">
                  {RATIOS.find(r => r.value === aspectRatio)?.dimensions}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {RATIOS.map((r) => {
                  const isSel = aspectRatio === r.value;
                  return (
                    <button key={r.value} type="button" onClick={() => setAspectRatio(r.value)}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-center transition-all border ${
                        isSel
                          ? 'bg-[#22D3EE] text-slate-950 border-[#22D3EE] shadow-md'
                          : 'bg-[#0B1020] text-[#9CA8C5] border-white/5 hover:text-white hover:border-white/15'
                      }`}>
                      {/* Tiny ratio preview box */}
                      <div className={`border-2 mb-1 ${isSel ? 'border-slate-900' : 'border-current opacity-50'} ${r.preview}`} />
                      <div className="text-[10px] font-bold">{r.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Diffusion Engine */}
            <div className="rounded-2xl bg-[#12192E]/50 border border-white/5 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#CBD5E1] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#7959F5]" />
                  Diffusion Engine
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: MODELS.find(m => m.id === selectedEngine)?.color || '#C084FC' }}>
                  {MODELS.find(m => m.id === selectedEngine)?.tag}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {MODELS.map((m) => {
                  const isSel = selectedEngine === m.id;
                  return (
                    <button key={m.id} type="button" onClick={() => setSelectedEngine(m.id)}
                      className={`p-2 rounded-xl text-left transition-all border ${
                        isSel
                          ? 'border-[var(--mc)] shadow-md scale-[1.02]'
                          : 'bg-[#0B1020] text-[#9CA8C5] border-white/5 hover:text-white hover:border-white/15'
                      }`}
                      style={isSel ? { '--mc': m.color, background: `${m.color}22`, color: 'white' } : {}}>
                      <div className="text-xs font-bold truncate">{m.name}</div>
                      <div className="text-[10px] opacity-75 truncate">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Quality + Batch Row ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Quality */}
            <div className="rounded-2xl bg-[#12192E]/50 border border-white/5 p-3">
              <span className="text-[11px] font-semibold text-[#CBD5E1] flex items-center gap-1 mb-2">
                <Star className="w-3 h-3 text-amber-400" />Quality
              </span>
              <div className="flex gap-1.5">
                {QUALITY_LEVELS.map(q => (
                  <button key={q.id} type="button" onClick={() => setQualityLevel(q.id)}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                      qualityLevel === q.id
                        ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                        : 'bg-[#0B1020] border-white/5 text-[#9CA8C5] hover:text-white'
                    }`}>
                    {q.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch size */}
            <div className="rounded-2xl bg-[#12192E]/50 border border-white/5 p-3">
              <span className="text-[11px] font-semibold text-[#CBD5E1] flex items-center gap-1 mb-2">
                <Layers className="w-3 h-3 text-[#22D3EE]" />Batch
              </span>
              <div className="flex gap-1.5">
                {[1, 2, 4].map(n => (
                  <button key={n} type="button" onClick={() => setBatchSize(n)}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                      batchSize === n
                        ? 'bg-[#22D3EE]/20 border-[#22D3EE]/50 text-[#22D3EE]'
                        : 'bg-[#0B1020] border-white/5 text-[#9CA8C5] hover:text-white'
                    }`}>
                    ×{n}
                  </button>
                ))}
              </div>
            </div>

            {/* Lighting toggle */}
            <div className="col-span-2 md:col-span-1">
              <button type="button" onClick={() => setShowLighting(!showLighting)}
                className="w-full h-full rounded-2xl bg-[#12192E]/50 border border-white/5 p-3 flex items-center justify-between hover:border-white/15 transition-all">
                <span className="text-[11px] font-semibold text-[#CBD5E1] flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-[#F59E0B]" />
                  {selectedLighting ? LIGHTING_PRESETS.find(l => l.id === selectedLighting)?.name : 'Lighting Preset'}
                </span>
                {showLighting ? <ChevronUp className="w-3.5 h-3.5 text-[#9CA8C5]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9CA8C5]" />}
              </button>
            </div>
          </div>

          {/* ── Lighting Presets Panel ── */}
          {showLighting && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 rounded-2xl bg-[#090D18] border border-white/5 animate-fadeIn">
              <button type="button" onClick={() => setSelectedLighting('')}
                className={`py-2 px-3 rounded-xl text-xs font-medium text-center border transition-all ${
                  !selectedLighting ? 'bg-white/10 border-white/20 text-white' : 'bg-[#0B1020] border-white/5 text-[#9CA8C5] hover:text-white'
                }`}>None</button>
              {LIGHTING_PRESETS.map(l => (
                <button key={l.id} type="button" onClick={() => setSelectedLighting(l.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium text-center border transition-all ${
                    selectedLighting === l.id
                      ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                      : 'bg-[#0B1020] border-white/5 text-[#9CA8C5] hover:text-white'
                  }`}>{l.name}</button>
              ))}
            </div>
          )}

          {/* ── Advanced (Seed + Negative) ── */}
          <div>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-[#9CA8C5] hover:text-white transition-colors">
              <Sliders className="w-3.5 h-3.5 text-[#22D3EE]" />
              {showAdvanced ? 'Hide Advanced' : 'Advanced Settings (Seed & Negative Prompt)'}
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showAdvanced && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#090D18] border border-white/5 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    Negative Prompt (things to avoid)
                  </label>
                  <input type="text" value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)}
                    placeholder="e.g. blurry, distorted limbs, extra fingers, low quality"
                    className="w-full bg-[#12192E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#CBD5E1]">Seed Control</label>
                    <button type="button" onClick={handleRandomSeed}
                      className="text-[10px] text-[#22D3EE] hover:underline flex items-center gap-1">
                      <Dices className="w-3 h-3" />Randomize
                    </button>
                  </div>
                  <input type="number" value={seed} onChange={e => setSeed(e.target.value)}
                    placeholder="Leave empty for random seed"
                    className="w-full bg-[#12192E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]" />
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} className="text-rose-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Generate Button ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5">
            <div className="flex items-center gap-3 text-xs text-[#9CA8C5]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pipeline Ready · {qualityLevel} quality · ×{batchSize} batch</span>
            </div>
            <button type="submit" disabled={!prompt.trim() || generating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3.5 rounded-2xl bg-gradient-to-r from-[#7959F5] via-[#9061F9] to-[#22D3EE] text-white text-sm font-bold shadow-xl shadow-[#7959F5]/30 hover:shadow-2xl hover:shadow-[#7959F5]/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer">
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Synthesizing…</span></>
              ) : (
                <><Sparkles className="w-4 h-4" /><span>Generate Artwork</span></>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Gallery Section ── */}
      <div>
        {/* Gallery Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Studio Gallery
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[#CBD5E1] font-mono">
                  {generations.length}
                </span>
              </h3>
              <p className="text-xs text-[#9CA8C5]">Your AI-generated artwork</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search prompt…"
                className="w-36 sm:w-48 bg-[#0D1324] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]" />
            </div>
            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#12192E] border border-white/10">
              {GALLERY_VIEWS.map(v => (
                <button key={v.id} type="button" onClick={() => setGalleryView(v.id)}
                  title={v.label}
                  className={`p-1.5 rounded-lg transition-colors ${
                    galleryView === v.id ? 'bg-[#7959F5] text-white' : 'text-[#9CA8C5] hover:text-white'
                  }`}>
                  <v.icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            {/* Refresh */}
            <button onClick={fetchGenerations} disabled={loadingHistory} title="Refresh"
              className="p-2 rounded-xl bg-[#12192E] border border-white/10 text-[#9CA8C5] hover:text-white transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Style filter pills */}
        {generations.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 no-scrollbar">
            <button onClick={() => setActiveFilterStyle('all')}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeFilterStyle === 'all' ? 'bg-white/20 text-white' : 'bg-[#12192E] text-[#9CA8C5] hover:text-white border border-white/5'
              }`}>All</button>
            {STYLES.map(st => (
              <button key={st.id} onClick={() => setActiveFilterStyle(st.id)}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  activeFilterStyle === st.id
                    ? 'text-white shadow-md'
                    : 'bg-[#12192E] text-[#9CA8C5] hover:text-white border border-white/5'
                }`}
                style={activeFilterStyle === st.id ? { background: `${st.color}33`, border: `1px solid ${st.color}66` } : {}}>
                <st.icon className="w-3.5 h-3.5 mr-1" /> {st.name}
              </button>
            ))}
          </div>
        )}

        {/* Generating shimmer */}
        {generating && (
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-[#7959F5]/10 via-[#22D3EE]/10 to-[#7959F5]/10 border border-[#7959F5]/30 p-6 flex flex-col sm:flex-row items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7959F5] to-[#22D3EE] flex items-center justify-center shadow-lg shadow-[#7959F5]/30">
              <Sparkles className="w-8 h-8 text-white animate-spin" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-white">Synthesizing Visual Layers…</h4>
              <p className="text-xs text-[#9CA8C5] mt-1">
                Applying {qualityLevel} diffusion for <span className="text-[#22D3EE] font-semibold">{selectedStyle}</span> style ({aspectRatio})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#7959F5] animate-ping" />
              <span className="text-xs font-mono text-[#CBD5E1]">Rendering ×{batchSize}</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredGenerations.length === 0 && !generating ? (
          <div className="text-center py-20 rounded-3xl bg-[#0D1324] border border-white/5 p-8">
            <div className="w-16 h-16 rounded-3xl bg-[#151C30] border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#64748B]">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-white">
              {searchQuery ? 'No artwork matches your search' : 'No images generated yet'}
            </h4>
            <p className="text-xs text-[#9CA8C5] mt-1 max-w-sm mx-auto">
              {searchQuery ? 'Try a different keyword.' : 'Enter a creative prompt or click "Inspire Me".'}
            </p>
            {!searchQuery && (
              <button type="button" onClick={handleSurpriseMe}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#C084FC] hover:text-white transition-all">
                <Dices className="w-4 h-4" />Try an Inspiring Prompt
              </button>
            )}
          </div>
        ) : galleryView === 'slideshow' && filteredGenerations.length > 0 ? (
          /* ── Slideshow view ── */
          <div className="relative rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl" style={{ minHeight: '500px' }}>
            {(() => {
              const current = filteredGenerations[slideshowIndex % filteredGenerations.length];
              const url = getDisplayUrl(current);
              return (
                <>
                  <div className="relative flex items-center justify-center" style={{ minHeight: '500px' }}>
                    {url && <img src={url} alt={current.prompt}
                      className="max-h-[70vh] w-auto max-w-full object-contain mx-auto" />}
                  </div>
                  {/* Slideshow controls */}
                  <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                    <button type="button" onClick={slidePrev}
                      className="pointer-events-auto p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/15 transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={slideNext}
                      className="pointer-events-auto p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/15 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Caption bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-5">
                    <p className="text-xs text-white font-medium line-clamp-2">{current.prompt}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-[#22D3EE] font-mono">{current.model || 'flux-schnell'}</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleDownload(current)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => openPreview(current)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Dots */}
                    <div className="flex items-center justify-center gap-1.5 mt-3">
                      {filteredGenerations.slice(0, Math.min(filteredGenerations.length, 10)).map((_, i) => (
                        <button key={i} type="button" onClick={() => setSlideshowIndex(i)}
                          className={`rounded-full transition-all ${
                            i === slideshowIndex % filteredGenerations.length
                              ? 'w-4 h-1.5 bg-white'
                              : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                          }`} />
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          /* ── Masonry / Grid view ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGenerations.map((gen) => {
              const displayUrl = getDisplayUrl(gen);
              const isCopied = copiedId === gen.id;
              const styleColor = STYLES.find(s => s.id === gen.metadata?.style)?.color || '#7959F5';
              return (
                <div key={gen.id} onClick={() => openPreview(gen)}
                  className="group relative rounded-3xl bg-[#0D1324] border border-white/10 overflow-hidden shadow-xl hover:border-[#7959F5]/50 hover:shadow-2xl hover:shadow-[#7959F5]/20 transition-all cursor-pointer flex flex-col justify-between">
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-[#080C16]">
                    {displayUrl && (
                      <img src={displayUrl} alt={gen.prompt} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white border border-white/10"
                          style={{ borderColor: `${styleColor}44` }}>
                          {gen.metadata?.style || 'Artistic'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={e => handleDelete(gen.id, e)} title="Delete"
                            className="p-1.5 rounded-xl bg-black/60 backdrop-blur-md text-[#9CA8C5] hover:text-rose-400 hover:bg-rose-500/20 border border-white/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={e => { e.stopPropagation(); openPreview(gen); }} title="Fullscreen"
                            className="p-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-white/20 border border-white/10 transition-colors">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={e => handleDownload(gen, e)} title="Download"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-semibold hover:bg-white/30 border border-white/10 transition-all">
                          <Download className="w-3.5 h-3.5" /><span>Save</span>
                        </button>
                        <button type="button" onClick={e => handleCopyPrompt(gen.id, gen.prompt, e)} title="Copy Prompt"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold hover:bg-black/80 border border-white/10 transition-all">
                          {isCopied
                            ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
                            : <><Copy className="w-3.5 h-3.5" /><span>Prompt</span></>}
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Card meta */}
                  <div className="p-4">
                    <p className="text-xs font-medium text-white line-clamp-2 leading-relaxed">{gen.prompt}</p>
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#9CA8C5]">
                      <span className="font-mono font-medium truncate max-w-[120px]"
                        style={{ color: MODELS.find(m => m.id === gen.model)?.color || '#22D3EE' }}>
                        {gen.model || 'flux-schnell'}
                      </span>
                      <span>{timeAgo(gen.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox Modal ── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
          onClick={() => setPreviewItem(null)}>
          <div className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl bg-[#0D1324] border border-white/15 overflow-hidden shadow-2xl flex flex-col md:flex-row"
            onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>

            {/* Prev/Next arrows */}
            {filteredGenerations.length > 1 && (
              <>
                <button onClick={previewPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/15 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={previewNext}
                  className="absolute right-[44%] top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/15 transition-colors md:hidden">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image panel */}
            <div className="md:w-3/5 bg-black flex items-center justify-center p-4 min-h-64 relative">
              {getDisplayUrl(previewItem) && (
                <img src={getDisplayUrl(previewItem)} alt={previewItem.prompt}
                  className="max-h-[55vh] md:max-h-[82vh] w-auto max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300" />
              )}
            </div>

            {/* Info panel */}
            <div className="md:w-2/5 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 bg-[#0A0E1A] overflow-y-auto">
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {previewItem.metadata?.style && (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold border"
                      style={{
                        background: `${STYLES.find(s => s.id === previewItem.metadata?.style)?.color || '#7959F5'}22`,
                        borderColor: `${STYLES.find(s => s.id === previewItem.metadata?.style)?.color || '#7959F5'}44`,
                        color: STYLES.find(s => s.id === previewItem.metadata?.style)?.color || '#C084FC',
                      }}>
                      {(() => { const s = STYLES.find(x => x.id === previewItem.metadata?.style); return s ? <s.icon className="mr-1" /> : null; })()} {previewItem.metadata.style}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-xl bg-white/5 text-[#CBD5E1] text-xs font-mono border border-white/10">
                    {previewItem.metadata?.aspect_ratio || '1:1'}
                  </span>
                  {previewItem.metadata?.quality && (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-400/10 text-amber-300 text-xs font-medium border border-amber-400/20">
                      {previewItem.metadata.quality}
                    </span>
                  )}
                </div>

                {/* Prompt */}
                <div>
                  <h4 className="text-xs font-semibold text-[#9CA8C5] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />Prompt
                  </h4>
                  <p className="text-xs text-white leading-relaxed bg-[#12192E] p-3 rounded-xl border border-white/5 max-h-32 overflow-y-auto">
                    {previewItem.prompt}
                  </p>
                </div>

                {/* Negative */}
                {previewItem.metadata?.negative_prompt && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#9CA8C5] uppercase tracking-wider mb-1">Negative</h4>
                    <p className="text-xs text-rose-300 leading-relaxed bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                      {previewItem.metadata.negative_prompt}
                    </p>
                  </div>
                )}

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#12192E]/60 border border-white/5">
                    <span className="text-[10px] text-[#9CA8C5] block">Model</span>
                    <span className="font-mono text-white font-medium">{previewItem.model || 'flux-schnell'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#12192E]/60 border border-white/5">
                    <span className="text-[10px] text-[#9CA8C5] block">Seed</span>
                    <span className="font-mono text-[#22D3EE] font-medium">{previewItem.metadata?.seed || 'Random'}</span>
                  </div>
                  <div className="col-span-2 p-2.5 rounded-xl bg-[#12192E]/60 border border-white/5">
                    <span className="text-[10px] text-[#9CA8C5] block">Created</span>
                    <span className="text-white font-medium">{formatDate(previewItem.created_at)}</span>
                  </div>
                </div>

                {/* Navigation indicator */}
                {filteredGenerations.length > 1 && (
                  <p className="text-[10px] text-center text-[#64748B]">
                    {previewIndex + 1} / {filteredGenerations.length}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <button type="button" onClick={() => handleUsePrompt(previewItem)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white text-xs font-bold shadow-lg hover:opacity-90 transition-all cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5" />Iterate with this Prompt
                </button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={e => handleDownload(previewItem, e)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors">
                    <Download className="w-3.5 h-3.5" />Download
                  </button>
                  <button type="button" onClick={e => handleCopyPrompt(previewItem.id, previewItem.prompt, e)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors">
                    {copiedId === previewItem.id
                      ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
                      : <><Copy className="w-3.5 h-3.5" />Copy Prompt</>}
                  </button>
                  <button type="button" onClick={e => handleDelete(previewItem.id, e)} title="Delete"
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
