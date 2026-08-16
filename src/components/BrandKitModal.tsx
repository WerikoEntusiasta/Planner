import React, { useState, useEffect } from 'react';
import { X, Palette, Link as LinkIcon, Users, Type, Sparkles, Check, Bookmark } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { BrandKit } from '../types';

interface BrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

export default function BrandKitModal({ isOpen, onClose, clientId, clientName }: BrandKitModalProps) {
  const { t } = useLanguage();
  
  const [brandKit, setBrandKit] = useState<BrandKit>({
    clientId,
    brandName: clientName || 'Marca',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#8B5CF6',
    toneOfVoice: 'Profissional, Acessível e Direto',
    targetAudience: 'Jovens adultos, Empreendedores e Criadores de Conteúdo',
    tagline: 'Sua marca com autoridade digital',
    driveFolderUrl: 'https://drive.google.com'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (clientId) {
      const saved = localStorage.getItem(`creator_planner_brandkit_${clientId}`);
      if (saved) {
        try {
          setBrandKit(JSON.parse(saved));
        } catch (e) {}
      } else {
        setBrandKit({
          clientId,
          brandName: clientName,
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          accentColor: '#8B5CF6',
          toneOfVoice: 'Profissional, Acessível e Direto',
          targetAudience: 'Jovens adultos, Empreendedores e Criadores de Conteúdo',
          tagline: 'Sua marca com autoridade digital',
          driveFolderUrl: ''
        });
      }
    }
  }, [clientId, clientName, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem(`creator_planner_brandkit_${clientId}`, JSON.stringify(brandKit));
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-panel-card border border-panel-border rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 border-b border-panel-border pb-4">
          <div className="p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-xl text-accent-blue">
            <Palette size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              Kit de Marca & Identidade Visual
            </h3>
            <p className="text-xs text-zinc-400">
              Diretrizes e paleta de cores para <span className="text-accent-blue font-bold">{clientName}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Nome e Tagline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase font-semibold text-zinc-300 mb-1">
                Nome da Marca:
              </label>
              <input
                type="text"
                value={brandKit.brandName}
                onChange={(e) => setBrandKit({ ...brandKit, brandName: e.target.value })}
                className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase font-semibold text-zinc-300 mb-1">
                Slogan / Tagline:
              </label>
              <input
                type="text"
                value={brandKit.tagline}
                onChange={(e) => setBrandKit({ ...brandKit, tagline: e.target.value })}
                placeholder="Ex: Transformando negócios no digital"
                className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
              />
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase font-semibold text-zinc-300">
              Paleta de Cores Institucionais:
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-panel-border space-y-1.5">
                <span className="text-[10px] text-zinc-400 block font-mono uppercase">Primária</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandKit.primaryColor}
                    onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={brandKit.primaryColor}
                    onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })}
                    className="w-full bg-transparent text-xs font-mono text-zinc-200 uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-xl border border-panel-border space-y-1.5">
                <span className="text-[10px] text-zinc-400 block font-mono uppercase">Secundária</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandKit.secondaryColor}
                    onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={brandKit.secondaryColor}
                    onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                    className="w-full bg-transparent text-xs font-mono text-zinc-200 uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-xl border border-panel-border space-y-1.5">
                <span className="text-[10px] text-zinc-400 block font-mono uppercase">Destaque</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandKit.accentColor}
                    onChange={(e) => setBrandKit({ ...brandKit, accentColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={brandKit.accentColor}
                    onChange={(e) => setBrandKit({ ...brandKit, accentColor: e.target.value })}
                    className="w-full bg-transparent text-xs font-mono text-zinc-200 uppercase focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tone & Audience */}
          <div>
            <label className="block text-[11px] font-mono uppercase font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Type size={13} className="text-accent-purple" /> Tom de Voz do Conteúdo:
            </label>
            <input
              type="text"
              value={brandKit.toneOfVoice}
              onChange={(e) => setBrandKit({ ...brandKit, toneOfVoice: e.target.value })}
              placeholder="Ex: Educativo, descontraído, autoritário"
              className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Users size={13} className="text-accent-emerald" /> Público-Alvo / Persona:
            </label>
            <input
              type="text"
              value={brandKit.targetAudience}
              onChange={(e) => setBrandKit({ ...brandKit, targetAudience: e.target.value })}
              placeholder="Ex: Jovens profissionais de 25-35 anos buscando liderança"
              className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
            />
          </div>

          {/* Drive or Assets Link */}
          <div>
            <label className="block text-[11px] font-mono uppercase font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <LinkIcon size={13} className="text-accent-orange" /> Link da Pasta de Arquivos / Drive:
            </label>
            <input
              type="url"
              value={brandKit.driveFolderUrl || ''}
              onChange={(e) => setBrandKit({ ...brandKit, driveFolderUrl: e.target.value })}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue font-mono"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-panel-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-accent-blue hover:bg-blue-600 rounded-xl transition-all shadow-lg shadow-accent-blue/20 flex items-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check size={14} className="text-emerald-400" /> Salvo com Sucesso!
              </>
            ) : (
              <>
                <Bookmark size={14} /> Salvar Kit de Marca
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
