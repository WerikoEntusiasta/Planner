import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Sparkles, MapPin } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { LANGUAGES, LanguageCode } from '../i18n/translations';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'landing';
  className?: string;
}

export default function LanguageSelector({ variant = 'compact', className = '' }: LanguageSelectorProps) {
  const { 
    language, 
    setLanguage, 
    isAutoDetected, 
    resetToAuto, 
    detectedLanguage, 
    currentLanguageOption,
    t 
  } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const detectedOption = LANGUAGES.find(l => l.code === detectedLanguage) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectManual = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const handleSelectAuto = () => {
    resetToAuto();
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl transition-all duration-200 ${
          variant === 'landing'
            ? 'px-3 py-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 text-xs font-medium shadow-md hover:border-zinc-500'
            : 'px-2.5 py-1.5 bg-zinc-900 border border-panel-border hover:bg-zinc-800 text-zinc-300 text-xs font-medium'
        }`}
        title={t('selectLanguage', 'Alterar Idioma / Switch Language')}
      >
        <span className="text-sm">{currentLanguageOption.flag}</span>
        <span className={`${variant === 'compact' ? 'hidden sm:inline' : 'inline'}`}>
          {currentLanguageOption.nativeName}
        </span>
        {isAutoDetected && (
          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25 rounded flex items-center gap-0.5">
            <Sparkles size={9} className="text-purple-400" />
            {t('autoDetectedBadge', 'Auto')}
          </span>
        )}
        <ChevronDown size={13} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-2xl z-50 overflow-hidden py-1.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-zinc-800/80 flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Globe size={13} className="text-purple-400" /> {t('selectLanguage', 'Idiomas / Languages')}
            </span>
            <span className="text-zinc-600 font-mono">{LANGUAGES.length}</span>
          </div>

          {/* Option for Automatic Detection */}
          <div className="p-1 border-b border-zinc-800/80">
            <button
              type="button"
              onClick={handleSelectAuto}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                isAutoDetected
                  ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40 shadow-inner'
                  : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
                  <Sparkles size={14} />
                </div>
                <div className="leading-tight">
                  <div className="font-bold text-white flex items-center gap-1">
                    {t('useAutoLanguage', 'Automático (País / Navegador)')}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                    <MapPin size={10} className="text-purple-400" />
                    <span>Detectado: {detectedOption.flag} {detectedOption.nativeName}</span>
                  </div>
                </div>
              </div>
              {isAutoDetected && <Check size={14} className="text-purple-400 shrink-0 ml-1" />}
            </button>
          </div>

          <div className="px-3 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
            Seleção Manual / Manual:
          </div>

          <div className="max-h-60 overflow-y-auto custom-scrollbar py-0.5 space-y-0.5 px-1">
            {LANGUAGES.map((lang) => {
              const isSelected = !isAutoDetected && language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectManual(lang.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                      : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div className="text-left leading-tight">
                      <div className="font-semibold text-zinc-200">{lang.nativeName}</div>
                      <div className="text-[10px] text-zinc-500">{lang.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-purple-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

