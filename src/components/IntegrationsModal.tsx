import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Sparkles, Facebook, Instagram, ShieldCheck, HelpCircle, Copy, Check, Trash2, X, RefreshCw, KeyRound, Globe, ExternalLink, Settings, AlertTriangle } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface ConnectedAccount {
  id: string;
  provider: string;
  name: string;
  username: string;
  expiresAt: string;
  status: string;
}

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
}

export default function IntegrationsModal({ isOpen, onClose, userId, userEmail }: IntegrationsModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'accounts' | 'tutorial'>('accounts');
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedShared, setCopiedShared] = useState(false);
  const [copiedCurrent, setCopiedCurrent] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isOwner = userEmail === 'werikplaystore@gmail.com' || userEmail === 'admin@saas.com' || userEmail?.toLowerCase().includes('admin');

  const devCallbackUrl = `https://ais-dev-pcokqf6bsksu2yhzfk5fn3-215070016480.us-east5.run.app/api/auth/facebook/callback`;
  const sharedCallbackUrl = `https://ais-pre-pcokqf6bsksu2yhzfk5fn3-215070016480.us-east5.run.app/api/auth/facebook/callback`;
  const currentCallbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/facebook/callback` : '';

  const fetchAccounts = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const userToken = localStorage.getItem('planner_user_token') || '';
      const res = await fetch('/api/connected-accounts', {
        headers: {
          'x-user-id': userId,
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen, userId]);

  // Listen to OAuth success message from the popup
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Allow AI Studio domains, localhost, and the current window's origin (for custom Docker domains)
      if (
        !origin.endsWith('.run.app') && 
        !origin.includes('localhost') && 
        origin !== window.location.origin
      ) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setStatusMessage({
          type: 'success',
          text: `Sucesso! Conta "${event.data.accountName || 'Instagram'}" integrada com sucesso.`
        });
        fetchAccounts();
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [userId]);

  const handleConnectFacebook = async () => {
    try {
      setIsLoading(true);
      setStatusMessage(null);
      
      const res = await fetch(`/api/auth/facebook/url?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Erro ao gerar URL do OAuth do Facebook.');
      }

      // Open the Meta login window directly in a popup (safe within iframe)
      const popupWidth = 600;
      const popupHeight = 750;
      const left = window.top ? (window.top.outerWidth / 2) + (window.top.screenX || 0) - (popupWidth / 2) : 100;
      const top = window.top ? (window.top.outerHeight / 2) + (window.top.screenY || 0) - (popupHeight / 2) : 100;

      const authWindow = window.open(
        data.url,
        'fb_oauth_popup',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      if (!authWindow) {
        setStatusMessage({
          type: 'error',
          text: 'O bloqueador de pop-ups impediu a janela de conexão. Por favor, libere pop-ups para este site.'
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Erro inesperado ao conectar ao Facebook.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Deseja realmente desconectar esta conta do Instagram? Agendamentos diretos para este canal serão pausados.')) {
      return;
    }
    try {
      setIsLoading(true);
      const userToken = localStorage.getItem('planner_user_token') || '';
      const res = await fetch(`/api/connected-accounts/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Conta de mídia desconectada com sucesso.' });
        fetchAccounts();
      } else {
        throw new Error(data.error || 'Não foi possível desconectar a conta.');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, type: 'dev' | 'shared' | 'current') => {
    const success = await copyToClipboard(text);
    if (success) {
      if (type === 'dev') {
        setCopiedDev(true);
        setTimeout(() => setCopiedDev(false), 2000);
      } else if (type === 'shared') {
        setCopiedShared(true);
        setTimeout(() => setCopiedShared(false), 2000);
      } else if (type === 'current') {
        setCopiedCurrent(true);
        setTimeout(() => setCopiedCurrent(false), 2000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-panel-black rounded-2xl border border-panel-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 bg-gradient-to-r from-zinc-900 to-panel-card border-b border-panel-border/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
              <Settings size={20} className="animate-spin-slow" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-display font-black text-white flex items-center gap-2">
                {t('mediaConnectionsTitle', 'Conexões e Integrações de Mídia')}
                <span className="bg-emerald-500/15 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase">Meta API v18.0</span>
              </h3>
              <p className="text-xs text-zinc-400">{t('mediaConnectionsSub', 'Integre sua conta do Instagram/Facebook para agendamento e publicação automática.')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 border border-panel-border text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* TABS SELECTOR */}
        {isOwner && (
          <div className="flex border-b border-panel-border/60 bg-panel-card p-1">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'accounts'
                  ? 'bg-zinc-800 text-white border border-panel-border/70'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Instagram size={14} className="text-accent-purple" />
              {t('connectedAccounts', 'Contas Conectadas')} ({accounts.length})
            </button>
            <button
              onClick={() => setActiveTab('tutorial')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'tutorial'
                  ? 'bg-zinc-800 text-white border border-panel-border/70'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <HelpCircle size={14} className="text-accent-orange" />
              {t('facebookDevTutorial', 'Tutorial Facebook Developers')}
            </button>
          </div>
        )}

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-xs border flex items-center justify-between ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/5 border-red-500/20 text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-current" />
                <span className="font-medium text-left">{statusMessage.text}</span>
              </div>
              <button onClick={() => setStatusMessage(null)} className="text-[10px] hover:underline font-mono ml-4 uppercase">Fechar</button>
            </div>
          )}

          {(!isOwner || activeTab === 'accounts') ? (
            <div className="space-y-6">
              {/* MAIN METAS LINK TRIGGER */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-panel-card to-zinc-950 border border-panel-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1.5 text-left max-w-md">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-accent-purple/10 text-accent-purple border border-accent-purple/25 text-[10px] font-mono rounded font-bold">
                    {t('directScheduling', 'AGENDAMENTO DIRETO')}
                  </span>
                  <h4 className="text-sm font-bold text-white font-display">{t('linkInstagramBusiness', 'Vincule seu Instagram Business ou Creator')}</h4>
                  <p className="text-xs text-zinc-400 leading-normal">
                    {t('linkInstagramSub', 'Conecte sua conta profissional para permitir que o sistema publique seus posts, reels e stories de forma 100% automatizada no dia e horário escolhidos.')}
                  </p>
                </div>
                
                <button
                  onClick={handleConnectFacebook}
                  disabled={isLoading}
                  className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-orange hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      {t('connecting', 'Conectando...')}
                    </>
                  ) : (
                    <>
                      <Facebook size={15} />
                      {t('loginWithFacebookInstagram', 'Logar com Facebook / Instagram')}
                    </>
                  )}
                </button>
              </div>

              {/* LIST OF CONNECTED ACCOUNTS */}
              <div className="space-y-3">
                <h5 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest text-left">{t('activeIntegratedAccounts', 'Contas Integradas Ativas')}</h5>
                
                {isLoading && accounts.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-xs font-mono flex items-center justify-center gap-2">
                    <RefreshCw className="animate-spin" size={14} />
                    {t('loadingConnections', 'Carregando conexões...')}
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-panel-border/60 text-center space-y-2">
                    <p className="text-xs text-zinc-400">{t('noAccountsLinked', 'Nenhuma conta vinculada no momento.')}</p>
                    {isOwner ? (
                      <p className="text-[10px] text-zinc-500 font-mono">{t('useButtonOrTutorial', 'Use o botão acima para integrar ou acesse a aba "Tutorial" para configurar as chaves API.')}</p>
                    ) : (
                      <p className="text-[10px] text-zinc-500 font-mono">{t('useButtonToConnectPro', 'Use o botão acima para conectar sua conta profissional e ativar o agendador direto.')}</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accounts.map((acc) => (
                      <div key={acc.id} className="p-4 rounded-xl bg-zinc-950/50 border border-panel-border/80 flex items-center justify-between hover:border-accent-purple/30 transition-all">
                        <div className="flex items-center gap-3 text-left">
                          <div className="relative">
                            <span className="p-2.5 rounded-lg bg-zinc-900 border border-panel-border text-accent-purple block">
                              <Instagram size={18} />
                            </span>
                            <span className="absolute -bottom-1 -right-1 p-0.5 bg-blue-600 rounded-full text-white border border-panel-black">
                              <Facebook size={10} />
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{acc.name}</span>
                            <span className="text-[10px] font-mono text-zinc-400 block">@{acc.username}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded">
                            {t('activeStatus', 'Ativo')}
                          </span>
                          <button
                            onClick={() => handleDisconnect(acc.id)}
                            title={t('disconnectAccount', 'Desconectar Conta')}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-panel-border text-zinc-500 hover:text-red-400 hover:border-red-400/30 transition-all cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECURITY ASSURANCE BAR */}
              <div className="p-4 rounded-xl bg-zinc-950/20 border border-panel-border/40 flex items-start gap-3">
                <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-left space-y-0.5">
                  <p className="text-xs font-bold text-zinc-200">{t('dataSecurityAssured', 'Segurança de Dados Assegurada')}</p>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    {t('dataSecuritySub', 'Seus tokens de acesso do Facebook Graph API ficam encriptados localmente e são usados exclusivamente para disparar a postagem agendada. Nunca compartilhamos seus dados nem realizamos ações não programadas.')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              {/* META DEVELOPERS TUTORIAL INTEGRATED */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-accent-orange/5 border border-accent-orange/15 text-xs text-accent-orange space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <KeyRound size={14} />
                    CHAVES DE CONFIGURAÇÃO (FACEBOOK_APP_ID & FACEBOOK_APP_SECRET)
                  </div>
                  <p className="text-zinc-300 leading-normal">
                    Para fazer integrações reais e publicar direto no seu perfil do Instagram/Facebook, você precisará configurar seu próprio aplicativo de desenvolvedor Meta. Siga o passo a passo completo abaixo.
                  </p>
                </div>

                {/* THE 5 STEPS */}
                <div className="space-y-5">
                  
                  {/* STEP 1 */}
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 border border-panel-border text-xs font-bold font-mono text-zinc-300 flex items-center justify-center shrink-0">1</div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        Acesse o Portal Meta for Developers
                        <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-accent-purple hover:underline inline-flex items-center gap-1 font-normal text-[10px]">
                          developers.facebook.com <ExternalLink size={10} />
                        </a>
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Faça login com sua conta do Facebook que gerencia as Páginas e as Contas Comerciais do Instagram. Clique em <strong>Meus Aplicativos</strong> e depois no botão <strong>Criar aplicativo</strong>.
                      </p>
                    </div>
                  </div>

                  {/* STEP 2 */}
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 border border-panel-border text-xs font-bold font-mono text-zinc-300 flex items-center justify-center shrink-0">2</div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-xs font-bold text-white">Escolha o Tipo de Aplicativo Correto</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Selecione a opção de tipo de caso de uso <strong>Negócios (Business)</strong> ou <strong>Consumidor (Consumer)</strong>. Dê um nome amigável para o aplicativo (ex: <i>Meu Planner de Conteúdo</i>) e insira seu e-mail de contato do negócio.
                      </p>
                    </div>
                  </div>

                  {/* STEP 3 */}
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 border border-panel-border text-xs font-bold font-mono text-zinc-300 flex items-center justify-center shrink-0">3</div>
                    <div className="space-y-2 flex-1">
                      <h4 className="text-xs font-bold text-white">Adicione o Produto "Login do Facebook para Empresas"</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        No painel do seu aplicativo, encontre o produto <strong>Login do Facebook para Empresas</strong> (ou <i>Facebook Login</i>) e clique em <strong>Configurar</strong>. No menu lateral do produto, vá em <strong>Configurações</strong> e cole os URIs de Redirecionamento Válidos abaixo.
                      </p>
                      
                      {/* REDIRECT URIS LIST */}
                      <div className="space-y-2.5 mt-2 bg-zinc-950 p-4 rounded-xl border border-panel-border/80">
                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 space-y-1">
                          <label className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">★ URI de Acesso Atual (Recomendado para Docker / Seu Host):</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              readOnly 
                              value={currentCallbackUrl} 
                              className="bg-zinc-900 border border-emerald-500/20 text-[11px] font-mono text-emerald-300 px-2.5 py-1.5 rounded-lg flex-1 outline-none font-bold"
                            />
                            <button
                              onClick={() => handleCopy(currentCallbackUrl, 'current')}
                              className="px-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 flex items-center justify-center cursor-pointer transition-all shrink-0"
                              title="Copiar URL de redirecionamento do aplicativo atual"
                            >
                              {copiedCurrent ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                          <span className="text-[9px] text-zinc-500 block">Este é o endereço exato que você está usando agora na sua hospedagem ou contêiner Docker. Use este valor no campo "URIs de Redirecionamento Válidos".</span>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-panel-border/40">
                          <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase block">Alternativa: URI de Desenvolvimento AI Studio (Dev):</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              readOnly 
                              value={devCallbackUrl} 
                              className="bg-zinc-900 border border-panel-border text-[11px] font-mono text-zinc-400 px-2.5 py-1.5 rounded-lg flex-1 outline-none"
                            />
                            <button
                              onClick={() => handleCopy(devCallbackUrl, 'dev')}
                              className="px-3 rounded-lg bg-zinc-800 border border-panel-border text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
                            >
                              {copiedDev ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase block">Alternativa: URI de Aplicativo Compartilhado (Production/Shared):</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              readOnly 
                              value={sharedCallbackUrl} 
                              className="bg-zinc-900 border border-panel-border text-[11px] font-mono text-zinc-400 px-2.5 py-1.5 rounded-lg flex-1 outline-none"
                            />
                            <button
                              onClick={() => handleCopy(sharedCallbackUrl, 'shared')}
                              className="px-3 rounded-lg bg-zinc-800 border border-panel-border text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
                            >
                              {copiedShared ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 4 */}
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 border border-panel-border text-xs font-bold font-mono text-zinc-300 flex items-center justify-center shrink-0">4</div>
                    <div className="space-y-3 flex-1">
                      <div>
                        <h4 className="text-xs font-bold text-white">Configure Domínios, Site e Obtenha as Chaves</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                          Navegue até o menu lateral esquerdo: <strong>Configurações do App</strong> &gt; <strong>Básico</strong>.
                        </p>
                      </div>

                      {/* DOMAIN AND PLATFORM TROUBLESHOOTING CARD */}
                      <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2 text-[11px] text-zinc-300">
                        <div className="flex items-center gap-1.5 font-bold text-amber-400">
                          <AlertTriangle size={13} />
                          CORRIGINDO ERRO DE DOMÍNIO (NÃO É POSSÍVEL CARREGAR O URL)
                        </div>
                        <p className="leading-relaxed text-zinc-400">
                          Se o Facebook exibir o erro de <i>"O domínio deste URL não está incluído nos domínios da app"</i>, configure exatamente estes dois campos nesta mesma página:
                        </p>
                        <ul className="list-disc pl-4 space-y-1.5 text-zinc-300">
                          <li>
                            <strong>Domínios do App:</strong> Insira apenas o host do seu site (ex: <code className="bg-zinc-900 px-1 py-0.5 rounded font-mono text-amber-200">{typeof window !== 'undefined' ? window.location.hostname : 'seu-dominio.com'}</code>). <i>Atenção: Não coloque <code className="text-zinc-500">https://</code> nem barras extras aqui!</i>
                          </li>
                          <li>
                            <strong>Plataforma Site:</strong> No final da página Básico, clique em <strong>Adicionar plataforma</strong>, escolha <strong>Site (Website)</strong> e insira a URL completa (ex: <code className="bg-zinc-900 px-1 py-0.5 rounded font-mono text-amber-200">{typeof window !== 'undefined' ? window.location.origin : 'https://seu-dominio.com'}</code>) no campo <strong>URL do site</strong>.
                          </li>
                        </ul>
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Lá você também encontrará seu <strong>ID do Aplicativo</strong> (App ID) e sua <strong>Chave Secreta do Aplicativo</strong> (App Secret) para colocar no painel.
                      </p>
                    </div>
                  </div>

                  {/* STEP 5 */}
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 border border-panel-border text-xs font-bold font-mono text-zinc-300 flex items-center justify-center shrink-0">5</div>
                    <div className="space-y-2 flex-1">
                      <h4 className="text-xs font-bold text-white">Configure as Variáveis de Ambiente no AI Studio</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Abra o menu lateral esquerdo do painel do <strong>Google AI Studio</strong>, vá em <strong>Settings</strong> e adicione as duas seguintes variáveis de ambiente correspondentes às credenciais do seu app da Meta:
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                        <div className="p-3 rounded-xl bg-zinc-900 border border-panel-border">
                          <span className="text-[10px] font-mono font-bold text-accent-purple block mb-1">Chave 1:</span>
                          <span className="text-xs font-mono text-white block">FACEBOOK_APP_ID</span>
                          <span className="text-[9px] text-zinc-500 block mt-1">Insira o ID de 15 dígitos obtido no passo anterior.</span>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-900 border border-panel-border">
                          <span className="text-[10px] font-mono font-bold text-accent-orange block mb-1">Chave 2:</span>
                          <span className="text-xs font-mono text-white block">FACEBOOK_APP_SECRET</span>
                          <span className="text-[9px] text-zinc-500 block mt-1">Insira o código alfanumérico secreto do aplicativo.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-zinc-950 border-t border-panel-border flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
            <Globe size={11} className="text-zinc-600" />
            {t('activeCredentialIsolation', 'Isolamento de Credenciais Ativo')}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-900 border border-panel-border text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer"
          >
            {t('closePanel', 'Fechar Painel')}
          </button>
        </div>

      </div>
    </div>
  );
}
