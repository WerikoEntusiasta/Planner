import React, { useState } from 'react';
import { X, Bookmark, Plus, ExternalLink, Folder, FolderPlus, Link as LinkIcon, Video, Image as ImageIcon, FileText, Sparkles, Trash2 } from 'lucide-react';
import { ReferenceItem } from '../types';

interface ReferenceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

const defaultReferences: ReferenceItem[] = [
  {
    id: 'ref_1',
    clientId: 'c1',
    folderName: 'Hooks Virais',
    title: 'Gancho de Retenção de 3 segundos',
    url: 'https://instagram.com/reels',
    notes: 'Começar o vídeo com um objeto em movimento na tela para prender atenção visual.',
    type: 'video',
    createdAt: '2026-06-01'
  },
  {
    id: 'ref_2',
    clientId: 'c1',
    folderName: 'Design & Capas',
    title: 'Estilo de Tipografia Bold Minimalista',
    url: 'https://pinterest.com',
    notes: 'Usar fontes sem serifa em tamanho 48px+ com sombras suaves no fundo escuro.',
    type: 'image',
    createdAt: '2026-06-02'
  },
  {
    id: 'ref_3',
    clientId: 'c1',
    folderName: 'Copywriting',
    title: 'Estrutura AIDA para Carrosséis de Venda',
    url: '',
    notes: 'Atenção no slide 1 -> Interesse no slide 2/3 -> Desejo no slide 4 -> Ação no slide 5.',
    type: 'text',
    createdAt: '2026-06-03'
  }
];

export default function ReferenceHubModal({ isOpen, onClose, clientId, clientName }: ReferenceHubModalProps) {
  const [references, setReferences] = useState<ReferenceItem[]>(() => {
    const saved = localStorage.getItem(`creator_planner_references_${clientId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return defaultReferences;
  });

  const [activeFolder, setActiveFolder] = useState<string>('Todas');
  const [showAddForm, setShowAddForm] = useState(false);

  // New item state
  const [newTitle, setNewTitle] = useState('');
  const [newFolder, setNewFolder] = useState('Hooks Virais');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newType, setNewType] = useState<'link' | 'video' | 'image' | 'post' | 'text'>('link');

  if (!isOpen) return null;

  const saveReferences = (updated: ReferenceItem[]) => {
    setReferences(updated);
    localStorage.setItem(`creator_planner_references_${clientId}`, JSON.stringify(updated));
  };

  const folders = Array.from(new Set(['Todas', ...references.map(r => r.folderName)]));

  const filteredReferences = activeFolder === 'Todas' 
    ? references 
    : references.filter(r => r.folderName === activeFolder);

  const handleCreateReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: ReferenceItem = {
      id: `ref_${Date.now()}`,
      clientId,
      folderName: newFolder.trim() || 'Geral',
      title: newTitle.trim(),
      url: newUrl.trim(),
      notes: newNotes.trim(),
      type: newType,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newItem, ...references];
    saveReferences(updated);

    setNewTitle('');
    setNewUrl('');
    setNewNotes('');
    setShowAddForm(false);
  };

  const handleDeleteItem = (id: string) => {
    const updated = references.filter(r => r.id !== id);
    saveReferences(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-panel-card border border-panel-border rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-panel-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue rounded-xl shadow-lg">
              <Bookmark size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Central de Referências & Inspirações
              </h3>
              <p className="text-xs text-zinc-400">
                Guarde links, vídeos, ideias visuais e ganchos em pastas para <span className="text-accent-blue font-bold">{clientName}</span>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-accent-blue hover:bg-blue-600 text-xs font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus size={14} /> Nova Inspiração
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleCreateReference} className="bg-zinc-950 p-4 rounded-xl border border-accent-blue/30 space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-accent-blue uppercase font-mono flex items-center gap-1">
              <Sparkles size={13} /> Salvar Nova Referência
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Título da Ideia:</label>
                <input
                  type="text"
                  placeholder="Ex: Transição dinâmica de cortes rápidos"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Nome da Pasta / Categoria:</label>
                <input
                  type="text"
                  placeholder="Ex: Hooks Virais / Edição / Design"
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Link / URL de Origem:</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/p/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Tipo de Mídia:</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none font-sans"
                >
                  <option value="video">Vídeo / Reel</option>
                  <option value="image">Imagem / Carrossel</option>
                  <option value="link">Link Externo</option>
                  <option value="text">Nota / Copy</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Anotações & Insights:</label>
              <textarea
                rows={2}
                placeholder="O que você achou de interessante nesta referência?"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full bg-zinc-900 border border-panel-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-accent-blue font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-accent-blue hover:bg-blue-600 text-xs font-bold text-white rounded-lg transition-all"
              >
                Salvar Referência
              </button>
            </div>
          </form>
        )}

        {/* Folders Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-panel-border/60">
          {folders.map((folder) => (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeFolder === folder
                  ? 'bg-accent-blue text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Folder size={13} /> {folder}
            </button>
          ))}
        </div>

        {/* References List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
          {filteredReferences.map((item) => {
            const getTypeIcon = (type: string) => {
              if (type === 'video') return <Video size={14} className="text-red-400" />;
              if (type === 'image') return <ImageIcon size={14} className="text-purple-400" />;
              if (type === 'text') return <FileText size={14} className="text-amber-400" />;
              return <LinkIcon size={14} className="text-blue-400" />;
            };

            return (
              <div
                key={item.id}
                className="bg-zinc-950 p-3.5 rounded-xl border border-panel-border hover:border-accent-blue/50 transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <h5 className="text-xs font-bold text-white group-hover:text-accent-blue transition-colors">
                      {item.title}
                    </h5>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {item.notes && (
                  <p className="text-[11px] text-zinc-300 bg-zinc-900 p-2 rounded-lg border border-panel-border/40">
                    "{item.notes}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                  <span className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-400 border border-panel-border">
                    {item.folderName}
                  </span>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-blue hover:underline flex items-center gap-1 font-bold"
                    >
                      Abrir Link <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-panel-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
