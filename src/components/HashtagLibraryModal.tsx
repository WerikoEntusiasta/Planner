import React, { useState } from 'react';
import { X, Hash, Copy, Check, Plus, FolderPlus, Layers, Sparkles } from 'lucide-react';
import { HashtagGroup } from '../types';

interface HashtagLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHashtags?: (tags: string[]) => void;
}

const defaultHashtagGroups: HashtagGroup[] = [
  {
    id: 'grp_1',
    name: 'Marketing Digital & Vendas',
    category: 'Geral',
    tags: ['MarketingDigital', 'SocialMedia', 'Empreendedorismo', 'VendasOnline', 'EstrategiaDigital', 'Copywriting', 'GestaoDeTráfego']
  },
  {
    id: 'grp_2',
    name: 'E-commerce & Produtos',
    category: 'Negócios',
    tags: ['ECommerce', 'LojaVirtual', 'Vendas', 'ProdutosOnline', 'ComprasCustom', 'NegociosLocais', 'ModaFeminina']
  },
  {
    id: 'grp_3',
    name: 'Instagram Reels & Viral',
    category: 'Crescimento',
    tags: ['ReelsBrasil', 'ConteudoViral', 'DicasDeInstagram', 'CriadorDeConteudo', 'VídeoCurto', 'AlcanceOrgânico']
  },
  {
    id: 'grp_4',
    name: 'Saúde, Fitness & Bem-Estar',
    category: 'Nicho',
    tags: ['VidaSaudavel', 'FitnessMotivacao', 'NutricaoEsportiva', 'TreinoDiario', 'BemEstar', 'QualidadeDeVida']
  }
];

export default function HashtagLibraryModal({ isOpen, onClose, onSelectHashtags }: HashtagLibraryModalProps) {
  const [groups, setGroups] = useState<HashtagGroup[]>(() => {
    const saved = localStorage.getItem('creator_planner_hashtag_groups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return defaultHashtagGroups;
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Geral');
  const [newGroupTags, setNewGroupTags] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (group: HashtagGroup) => {
    const formatted = group.tags.map(t => `#${t.replace(/^#/, '')}`).join(' ');
    navigator.clipboard.writeText(formatted);
    setCopiedId(group.id);
    if (onSelectHashtags) {
      onSelectHashtags(group.tags);
    }
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupTags.trim()) return;

    const parsedTags = newGroupTags
      .split(/[\s,]+/)
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const newGroup: HashtagGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      category: newGroupCategory,
      tags: parsedTags
    };

    const updated = [newGroup, ...groups];
    setGroups(updated);
    localStorage.setItem('creator_planner_hashtag_groups', JSON.stringify(updated));

    setNewGroupName('');
    setNewGroupTags('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-panel-card border border-panel-border rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center justify-between border-b border-panel-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-purple/10 border border-accent-purple/20 rounded-xl text-accent-purple">
              <Hash size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Biblioteca de Hashtags & Grupos Salvos
              </h3>
              <p className="text-xs text-zinc-400">
                Acesse blocos de hashtags otimizados para copiar com 1 clique.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-xl transition-all border border-panel-border flex items-center gap-1.5"
          >
            <FolderPlus size={14} className="text-accent-purple" />
            {showAddForm ? 'Fechar Formulário' : 'Novo Grupo'}
          </button>
        </div>

        {/* Add Group Form */}
        {showAddForm && (
          <form onSubmit={handleCreateGroup} className="bg-zinc-950 p-4 rounded-xl border border-accent-purple/30 space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-accent-purple flex items-center gap-1.5 uppercase font-mono">
              <Plus size={14} /> Criar Novo Grupo de Hashtags
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Nome do Grupo:</label>
                <input
                  type="text"
                  placeholder="Ex: Hashtags de Lançamento"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent-purple"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Categoria:</label>
                <select
                  value={newGroupCategory}
                  onChange={(e) => setNewGroupCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="Geral">Geral</option>
                  <option value="Negócios">Negócios</option>
                  <option value="Crescimento">Crescimento</option>
                  <option value="Nicho">Nicho</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Hashtags (separadas por vírgula ou espaço):</label>
              <textarea
                rows={2}
                placeholder="MarketingDigital, SocialMedia, DicasDeVendas..."
                value={newGroupTags}
                onChange={(e) => setNewGroupTags(e.target.value)}
                className="w-full bg-zinc-900 border border-panel-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-accent-purple font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-accent-purple hover:bg-purple-600 text-xs font-bold text-white rounded-lg transition-all"
              >
                Salvar Grupo
              </button>
            </div>
          </form>
        )}

        {/* List of Groups */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-zinc-950 p-4 rounded-xl border border-panel-border hover:border-zinc-700 transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono">{group.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-panel-border">
                    {group.category}
                  </span>
                </div>

                <button
                  onClick={() => handleCopy(group)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    copiedId === group.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 border border-accent-purple/30'
                  }`}
                >
                  {copiedId === group.id ? (
                    <>
                      <Check size={13} /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copiar Todos ({group.tags.length})
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {group.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono text-zinc-300 bg-zinc-900 border border-panel-border/60 px-2 py-0.5 rounded-md"
                  >
                    #{tag.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-panel-border flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1 font-mono">
            <Sparkles size={13} className="text-accent-purple" /> {groups.length} grupos cadastrados
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
