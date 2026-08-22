import React, { useState, useMemo } from 'react';
import { ClientObservation, ClientObservationCategory, Client, User } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { 
  X, Bookmark, Plus, Search, Trash2, Edit3, Check, Copy, 
  Image as ImageIcon, AlignLeft, AlertTriangle, Lightbulb, 
  Sparkles, Filter, ShieldCheck, Share2, Layers, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientObservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  activeClientId?: string;
  currentUser: User | null;
  observations: ClientObservation[];
  onSaveObservation: (observation: Partial<ClientObservation>) => Promise<boolean>;
  onDeleteObservation: (id: string) => Promise<boolean>;
}

export default function ClientObservationsModal({
  isOpen,
  onClose,
  clients,
  activeClientId,
  currentUser,
  observations,
  onSaveObservation,
  onDeleteObservation
}: ClientObservationsModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(activeClientId || (clients[0]?.id || 'all'));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form modal state for adding / editing observation
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingObs, setEditingObs] = useState<ClientObservation | null>(null);
  const [formClientId, setFormClientId] = useState<string>(activeClientId || (clients[0]?.id || ''));
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<ClientObservationCategory>('general');
  const [isSaving, setIsSaving] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  // Filter observations
  const filteredObservations = observations.filter(obs => {
    // Client filter
    if (selectedClientId !== 'all' && obs.clientId !== selectedClientId) {
      return false;
    }
    // Category filter
    if (selectedCategory !== 'all' && obs.category !== selectedCategory) {
      return false;
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = obs.title?.toLowerCase().includes(q);
      const matchContent = obs.content?.toLowerCase().includes(q);
      const matchCreative = obs.creativeTitle?.toLowerCase().includes(q);
      const matchClient = obs.clientName?.toLowerCase().includes(q);
      return matchTitle || matchContent || matchCreative || matchClient;
    }
    return true;
  });

  // Client counts
  const currentClientObj = clients.find(c => c.id === selectedClientId);
  const clientDisplayName = selectedClientId === 'all' ? 'Todas as Marcas' : (currentClientObj?.name || 'Marca Selecionada');

  // Open form for new observation
  const handleOpenNewForm = (presetCategory?: ClientObservationCategory) => {
    setEditingObs(null);
    setFormClientId(selectedClientId !== 'all' ? selectedClientId : (clients[0]?.id || ''));
    setFormTitle('');
    setFormContent('');
    setFormCategory(presetCategory || (selectedCategory !== 'all' ? (selectedCategory as ClientObservationCategory) : 'general'));
    setIsFormOpen(true);
  };

  // Open form to edit observation
  const handleOpenEditForm = (obs: ClientObservation) => {
    setEditingObs(obs);
    setFormClientId(obs.clientId);
    setFormTitle(obs.title);
    setFormContent(obs.content);
    setFormCategory(obs.category);
    setIsFormOpen(true);
  };

  // Save form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;

    setIsSaving(true);
    const client = clients.find(c => c.id === formClientId);

    const data: Partial<ClientObservation> = {
      id: editingObs?.id,
      clientId: formClientId || (clients[0]?.id || 'default'),
      clientName: client?.name || 'Cliente',
      title: formTitle.trim() || `Observação (${new Date().toLocaleDateString('pt-BR')})`,
      content: formContent.trim(),
      category: formCategory,
      creativeId: editingObs?.creativeId,
      creativeTitle: editingObs?.creativeTitle,
    };

    const success = await onSaveObservation(data);
    setIsSaving(false);
    if (success) {
      setIsFormOpen(false);
    }
  };

  // Copy single rule to clipboard
  const handleCopySingle = async (obs: ClientObservation) => {
    const text = `📌 [${getCategoryLabel(obs.category).toUpperCase()} - ${obs.clientName || 'Cliente'}]\n${obs.title ? `Título: ${obs.title}\n` : ''}${obs.content}`;
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(obs.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Copy all guidelines for client
  const handleCopyAll = async () => {
    if (filteredObservations.length === 0) return;
    
    let text = `📋 DIRETRIZES, OBSERVAÇÕES E APRENDIZADOS DE MARCA: ${clientDisplayName.toUpperCase()}\n`;
    text += `Total de Regras Registradas: ${filteredObservations.length}\n`;
    text += `==============================================\n\n`;

    filteredObservations.forEach((obs, index) => {
      text += `${index + 1}. [${getCategoryLabel(obs.category).toUpperCase()}] ${obs.title}\n`;
      text += `   📝 ${obs.content}\n`;
      if (obs.creativeTitle) {
        text += `   🏷️ Origem: Feedback no criativo "${obs.creativeTitle}"\n`;
      }
      text += `\n`;
    });

    const success = await copyToClipboard(text);
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 3000);
    }
  };

  function getCategoryBadge(cat: ClientObservationCategory) {
    switch (cat) {
      case 'visual':
        return {
          label: 'Ajuste de Mídia / Design',
          icon: <ImageIcon size={12} />,
          className: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
        };
      case 'caption':
        return {
          label: 'Ajuste de Legenda / Copy',
          icon: <AlignLeft size={12} />,
          className: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        };
      case 'do_not':
        return {
          label: 'O que Evitar / Nunca Fazer',
          icon: <AlertTriangle size={12} />,
          className: 'bg-red-500/15 text-red-400 border-red-500/30'
        };
      case 'tone':
        return {
          label: 'Tom de Voz & Estilo',
          icon: <Sparkles size={12} />,
          className: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
        };
      case 'general':
      default:
        return {
          label: 'Preferência Geral',
          icon: <Lightbulb size={12} />,
          className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        };
    }
  }

  function getCategoryLabel(cat: ClientObservationCategory) {
    switch (cat) {
      case 'visual': return 'Visual & Design';
      case 'caption': return 'Legenda & Copy';
      case 'do_not': return 'Não Fazer / Evitar';
      case 'tone': return 'Tom de Voz';
      case 'general': return 'Preferência Geral';
      default: return 'Observação';
    }
  }

  // Count by category
  const visualCount = observations.filter(o => o.category === 'visual' && (selectedClientId === 'all' || o.clientId === selectedClientId)).length;
  const captionCount = observations.filter(o => o.category === 'caption' && (selectedClientId === 'all' || o.clientId === selectedClientId)).length;
  const doNotCount = observations.filter(o => o.category === 'do_not' && (selectedClientId === 'all' || o.clientId === selectedClientId)).length;
  const generalCount = observations.filter(o => (o.category === 'general' || o.category === 'tone') && (selectedClientId === 'all' || o.clientId === selectedClientId)).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-[#121218] border border-[#24242D] max-w-4xl w-full rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 my-auto max-h-[92vh] flex flex-col"
      >
        {/* 1. MODAL HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#24242D] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0">
              <Bookmark size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold font-display text-white">
                  Observações & Preferências dos Clientes
                </h2>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  {observations.length} Regras Salvas
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Armazene os feedbacks de ajustes visuais e legendas para a equipe e a IA nunca mais cometerem os mesmos erros.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {filteredObservations.length > 0 && (
              <button
                type="button"
                onClick={handleCopyAll}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#24242D] text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Copiar todas as diretrizes para a área de transferência"
              >
                {copiedAll ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedAll ? 'Copiado!' : 'Copiar Diretrizes'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenNewForm()}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Plus size={14} />
              <span>Nova Observação</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-[#24242D] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. STATS PILLS & QUICK FILTERS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedCategory(selectedCategory === 'visual' ? 'all' : 'visual')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedCategory === 'visual'
                ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/50'
                : 'bg-[#17171F] border-[#24242D] hover:border-blue-500/40 text-zinc-400'
            }`}
          >
            <span className="text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 text-blue-400 mb-1">
              <ImageIcon size={11} /> Mídia & Visual
            </span>
            <div className="text-lg font-bold font-display text-white">{visualCount} regras</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory(selectedCategory === 'caption' ? 'all' : 'caption')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedCategory === 'caption'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                : 'bg-[#17171F] border-[#24242D] hover:border-amber-500/40 text-zinc-400'
            }`}
          >
            <span className="text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 text-amber-400 mb-1">
              <AlignLeft size={11} /> Legenda & Copy
            </span>
            <div className="text-lg font-bold font-display text-white">{captionCount} regras</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory(selectedCategory === 'do_not' ? 'all' : 'do_not')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedCategory === 'do_not'
                ? 'bg-red-500/20 border-red-500 text-red-300 ring-1 ring-red-500/50'
                : 'bg-[#17171F] border-[#24242D] hover:border-red-500/40 text-zinc-400'
            }`}
          >
            <span className="text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 text-red-400 mb-1">
              <AlertTriangle size={11} /> O que Evitar
            </span>
            <div className="text-lg font-bold font-display text-white">{doNotCount} regras</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory(selectedCategory === 'general' ? 'all' : 'general')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedCategory === 'general'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                : 'bg-[#17171F] border-[#24242D] hover:border-emerald-500/40 text-zinc-400'
            }`}
          >
            <span className="text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 text-emerald-400 mb-1">
              <Lightbulb size={11} /> Tom & Preferências
            </span>
            <div className="text-lg font-bold font-display text-white">{generalCount} regras</div>
          </button>
        </div>

        {/* 3. CONTROLS TOOLBAR: BRAND SELECTOR + SEARCH + CATEGORY FILTER */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#17171F] border border-[#24242D] p-3 rounded-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar em observações, ajustes ou posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121218] border border-[#24242D] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Brand filter */}
            {clients.length > 0 && (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-[#121218] border border-[#24242D] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="all">Todas as Marcas ({observations.length})</option>
                {clients.map(c => {
                  const count = observations.filter(o => o.clientId === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({count})
                    </option>
                  );
                })}
              </select>
            )}

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#121218] border border-[#24242D] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              <option value="all">Todas as Categorias</option>
              <option value="visual">🎨 Mídia & Visual</option>
              <option value="caption">✍️ Legenda & Copy</option>
              <option value="do_not">🚫 O que Evitar</option>
              <option value="tone">✨ Tom de Voz</option>
              <option value="general">💡 Preferência Geral</option>
            </select>
          </div>
        </div>

        {/* 4. OBSERVATIONS LIST */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px]">
          {filteredObservations.length === 0 ? (
            <div className="bg-[#17171F] border border-dashed border-[#24242D] rounded-2xl p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#121218] border border-[#24242D] flex items-center justify-center text-zinc-500 mx-auto">
                <Bookmark size={26} className="text-amber-400/60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white font-display">
                  Nenhuma observação salva nesta seleção
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Quando o cliente solicitar alterações em um criativo ou legenda na Central de Criativos, clique no botão <strong>"Salvar como Observação"</strong> para registrar a diretriz aqui automaticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenNewForm()}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-md shadow-amber-500/10"
              >
                <Plus size={15} />
                <span>Adicionar Primeira Diretriz</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredObservations.map((obs) => {
                const badge = getCategoryBadge(obs.category);
                const isCopied = copiedId === obs.id;

                return (
                  <div
                    key={obs.id}
                    className="bg-[#17171F] border border-[#24242D] hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all group"
                  >
                    <div className="space-y-2.5">
                      {/* Top Row: Category + Brand + Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 ${badge.className}`}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>

                          <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-[#24242D] text-[10px] font-mono text-zinc-400">
                            {obs.clientName || 'Cliente'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleCopySingle(obs)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Copiar texto da regra"
                          >
                            {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(obs)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Editar observação"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteObservation(obs.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Excluir observação"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-white font-display leading-snug">
                        {obs.title}
                      </h4>

                      {/* Content Body */}
                      <div className="p-3 bg-[#121218] border border-[#24242D] rounded-xl text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
                        {obs.content}
                      </div>

                      {/* Creative Origin link/tag if available */}
                      {obs.creativeTitle && (
                        <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5 bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-[#24242D]">
                          <span className="text-amber-400 font-bold">Origem:</span>
                          <span className="truncate text-zinc-400">Post "{obs.creativeTitle}"</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Date */}
                    <div className="pt-2 border-t border-[#24242D]/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Registrado em {new Date(obs.createdAt).toLocaleDateString('pt-BR')}</span>
                      {isCopied && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check size={11} /> Copiado!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. SUB-MODAL / DRAWER FOR CREATING / EDITING AN OBSERVATION */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#151520] border border-amber-500/40 max-w-lg w-full rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#24242D] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                    <Bookmark size={16} />
                  </div>
                  <h3 className="font-bold text-sm text-white font-display">
                    {editingObs ? 'Editar Observação do Cliente' : 'Nova Observação / Regra de Marca'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
                {/* Brand Selector */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-zinc-400 mb-1">
                    Marca / Cliente:
                  </label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full bg-[#121218] border border-[#24242D] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Category Selector */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-zinc-400 mb-1">
                    Categoria da Diretriz:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ClientObservationCategory)}
                    className="w-full bg-[#121218] border border-[#24242D] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="visual">🎨 Ajuste de Mídia / Design</option>
                    <option value="caption">✍️ Ajuste de Legenda / Copy</option>
                    <option value="do_not">🚫 O que Evitar / Nunca Fazer</option>
                    <option value="tone">✨ Tom de Voz & Estilo</option>
                    <option value="general">💡 Preferência Geral</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-zinc-400 mb-1">
                    Título / Resumo da Regra:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Não usar fundo branco em carrosséis"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-[#121218] border border-[#24242D] rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-zinc-400 mb-1">
                    Conteúdo / Detalhe da Observação: *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Descreva exatamente o que o cliente pediu ou ajustou para que a equipe e a IA sigam sempre este padrão..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    required
                    className="w-full bg-[#121218] border border-[#24242D] rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24242D]">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !formContent.trim()}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold transition-all cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Regra'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
