import React, { useState } from 'react';
import { X, Target, Plus, Check, Trash2, Layers, Calendar, Rocket, Sparkles, FileText, Mail, Monitor, Megaphone, ArrowRight } from 'lucide-react';
import { Campaign, CampaignItem } from '../types';

interface CampaignsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

const initialCampaigns: Campaign[] = [
  {
    id: 'camp_1',
    clientId: 'c1',
    name: 'Campanha de Lançamento de Inverno 2026',
    objective: 'Gerar desejo e pré-vendas com 15% de desconto exclusivo para a lista VIP.',
    startDate: '2026-06-15',
    endDate: '2026-06-30',
    status: 'active',
    items: [
      { id: 'ci_1', title: 'Teaser Reels de Aquecimento', type: 'post', status: 'ready', notes: 'Ganchos focados no desejo' },
      { id: 'ci_2', title: 'Sequência de 5 Stories com Enquete', type: 'story', status: 'in_progress', notes: 'Abrir caixinha de perguntas' },
      { id: 'ci_3', title: 'Email de Pré-venda Lista VIP', type: 'email', status: 'pending', notes: 'Enviar no domingo às 19h' },
      { id: 'ci_4', title: 'Landing Page de Captura', type: 'landing_page', status: 'ready', notes: 'Ajustar cronômetro' },
      { id: 'ci_5', title: 'Anúncios Meta Ads (Carrossel)', type: 'ad', status: 'pending', notes: 'Público de interesse e Lookalike' }
    ]
  }
];

export default function CampaignsModal({ isOpen, onClose, clientId, clientName }: CampaignsModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem(`creator_planner_campaigns_${clientId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return initialCampaigns;
  });

  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(campaigns[0] || null);
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);

  // New campaign state
  const [newCampName, setNewCampName] = useState('');
  const [newCampObj, setNewCampObj] = useState('');
  const [newCampStart, setNewCampStart] = useState('2026-06-20');
  const [newCampEnd, setNewCampEnd] = useState('2026-06-30');

  // New item state
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<'post' | 'story' | 'email' | 'landing_page' | 'ad'>('post');

  if (!isOpen) return null;

  const saveCampaignsToStorage = (updated: Campaign[]) => {
    setCampaigns(updated);
    localStorage.setItem(`creator_planner_campaigns_${clientId}`, JSON.stringify(updated));
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) return;

    const newCamp: Campaign = {
      id: `camp_${Date.now()}`,
      clientId,
      name: newCampName.trim(),
      objective: newCampObj.trim(),
      startDate: newCampStart,
      endDate: newCampEnd,
      status: 'active',
      items: [
        { id: `ci_${Date.now()}_1`, title: 'Post Principal de Lançamento', type: 'post', status: 'pending' },
        { id: `ci_${Date.now()}_2`, title: 'Sequência de Stories da Campanha', type: 'story', status: 'pending' }
      ]
    };

    const updated = [newCamp, ...campaigns];
    saveCampaignsToStorage(updated);
    setActiveCampaign(newCamp);
    setNewCampName('');
    setNewCampObj('');
    setShowNewCampaignForm(false);
  };

  const handleAddItemToCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !newItemTitle.trim()) return;

    const newItem: CampaignItem = {
      id: `ci_${Date.now()}`,
      title: newItemTitle.trim(),
      type: newItemType,
      status: 'pending'
    };

    const updated = campaigns.map(c => {
      if (c.id === activeCampaign.id) {
        return { ...c, items: [...c.items, newItem] };
      }
      return c;
    });

    saveCampaignsToStorage(updated);
    const updatedActive = updated.find(c => c.id === activeCampaign.id) || null;
    setActiveCampaign(updatedActive);
    setNewItemTitle('');
  };

  const handleToggleItemStatus = (itemId: string) => {
    if (!activeCampaign) return;

    const updated = campaigns.map(c => {
      if (c.id === activeCampaign.id) {
        const newItems = c.items.map(item => {
          if (item.id === itemId) {
            const nextStatus: 'pending' | 'in_progress' | 'ready' = 
              item.status === 'pending' ? 'in_progress' :
              item.status === 'in_progress' ? 'ready' : 'pending';
            return { ...item, status: nextStatus };
          }
          return item;
        });
        return { ...c, items: newItems };
      }
      return c;
    });

    saveCampaignsToStorage(updated);
    setActiveCampaign(updated.find(c => c.id === activeCampaign.id) || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-panel-card border border-panel-border rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-panel-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange rounded-xl shadow-lg">
              <Rocket size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Gestão de Campanhas Multicanal
              </h3>
              <p className="text-xs text-zinc-400">
                Organize lançamentos, ofertas e promoções com posts, stories, e-mails e anúncios integrados para <span className="text-accent-orange font-bold">{clientName}</span>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNewCampaignForm(!showNewCampaignForm)}
            className="px-3 py-1.5 bg-accent-orange hover:bg-orange-600 text-xs font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus size={14} /> Nova Campanha
          </button>
        </div>

        {/* New Campaign Form */}
        {showNewCampaignForm && (
          <form onSubmit={handleCreateCampaign} className="bg-zinc-950 p-4 rounded-xl border border-accent-orange/30 space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-accent-orange uppercase font-mono flex items-center gap-1">
              <Sparkles size={13} /> Criar Estrutura de Nova Campanha
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Nome da Campanha:</label>
                <input
                  type="text"
                  placeholder="Ex: Black Friday 2026 / Lançamento do Produto X"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-orange font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Objetivo da Campanha:</label>
                <input
                  type="text"
                  placeholder="Ex: Vender 100 unidades / Faturar R$ 50k"
                  value={newCampObj}
                  onChange={(e) => setNewCampObj(e.target.value)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-orange font-sans"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Data Início:</label>
                <input
                  type="date"
                  value={newCampStart}
                  onChange={(e) => setNewCampStart(e.target.value)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Data Fim:</label>
                <input
                  type="date"
                  value={newCampEnd}
                  onChange={(e) => setNewCampEnd(e.target.value)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNewCampaignForm(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-accent-orange hover:bg-orange-600 text-xs font-bold text-white rounded-lg transition-all"
              >
                Salvar Campanha
              </button>
            </div>
          </form>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[380px]">
          {/* Campaign Selector Column */}
          <div className="space-y-2 border-r border-panel-border/60 pr-2">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
              Campanhas Cadastradas ({campaigns.length})
            </span>
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  onClick={() => setActiveCampaign(camp)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                    activeCampaign?.id === camp.id
                      ? 'bg-zinc-900 border-accent-orange text-white shadow-md'
                      : 'bg-zinc-950/60 border-panel-border/80 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold font-sans line-clamp-1">{camp.name}</h5>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase">
                      {camp.items.length} Peças
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 line-clamp-1">{camp.objective || 'Sem objetivo cadastrado'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Campaign Items & Details */}
          <div className="md:col-span-2 space-y-4">
            {activeCampaign ? (
              <div className="space-y-4">
                <div className="bg-zinc-950 p-4 rounded-xl border border-panel-border space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{activeCampaign.name}</h4>
                    <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                      <Calendar size={12} /> {activeCampaign.startDate} até {activeCampaign.endDate}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 italic">"{activeCampaign.objective}"</p>
                </div>

                {/* Add Item Form */}
                <form onSubmit={handleAddItemToCampaign} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Copy do E-mail de Disparo / Arte do Anúncio..."
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-panel-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-orange font-sans"
                  />
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as any)}
                    className="bg-zinc-950 border border-panel-border rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="post">Post</option>
                    <option value="story">Stories</option>
                    <option value="email">E-mail</option>
                    <option value="landing_page">Landing Page</option>
                    <option value="ad">Anúncio (Ads)</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-accent-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </form>

                {/* Items Checklist */}
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {activeCampaign.items.map((item) => {
                    const getTypeIcon = (type: string) => {
                      if (type === 'email') return <Mail size={13} className="text-blue-400" />;
                      if (type === 'landing_page') return <Monitor size={13} className="text-purple-400" />;
                      if (type === 'ad') return <Megaphone size={13} className="text-emerald-400" />;
                      return <FileText size={13} className="text-orange-400" />;
                    };

                    return (
                      <div
                        key={item.id}
                        className="bg-zinc-950 p-3 rounded-xl border border-panel-border flex items-center justify-between gap-3 hover:border-zinc-700 transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          {getTypeIcon(item.type)}
                          <div>
                            <span className="text-xs font-bold text-white block">{item.title}</span>
                            <span className="text-[9px] font-mono text-zinc-500 uppercase">{item.type}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleItemStatus(item.id)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 ${
                            item.status === 'ready'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : item.status === 'in_progress'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-zinc-800 text-zinc-400 border border-panel-border'
                          }`}
                        >
                          {item.status === 'ready' && <Check size={11} />}
                          {item.status === 'ready' ? 'Pronto' : item.status === 'in_progress' ? 'Em Produção' : 'Pendente'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
                Selecione ou crie uma campanha ao lado.
              </div>
            )}
          </div>
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
