import React from 'react';
import { Shield, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface LegalTextsDialogProps {
  isOpen: boolean;
  type: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export default function LegalTextsDialog({ isOpen, type, onClose }: LegalTextsDialogProps) {
  const { t } = useLanguage();
  if (!isOpen || !type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-panel-card border border-panel-border rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-panel-border/60 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple">
                {isPrivacy ? <Shield size={18} /> : <FileText size={18} />}
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-white">
                  {isPrivacy ? t('privacyPolicy', 'Política de Privacidade') : t('termsOfUse', 'Termos de Uso')}
                </h3>
                <p className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                  {isPrivacy ? t('privacySub', 'Em conformidade com a LGPD (Lei 13.709/2018)') : t('termsSub', 'Condições gerais de uso da plataforma')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Legal Document Content */}
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 text-zinc-300 text-xs leading-relaxed font-sans">
            {isPrivacy ? (
              // Privacy Policy (LGPD)
              <div className="space-y-4">
                <p className="text-zinc-400 font-mono text-[10px] border-b border-panel-border/30 pb-2">
                  {t('legalLastUpdated', 'Última atualização: 10 de Julho de 2026')}
                </p>
                
                <section className="space-y-1.5">
                  <h4 className="font-bold text-white text-[13px]">{t('privacySec1Title', '1. Apresentação e Consentimento')}</h4>
                  <p>
                    {t('privacySec1P1', 'Esta Política de Privacidade descreve como a plataforma do Planner de Conteúdo coleta, armazena, utiliza e protege os seus dados pessoais, em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD) - Lei nº 13.709/2018.')}
                  </p>
                  <p>
                    {t('privacySec1P2', 'Ao criar uma conta na plataforma, você fornece o seu consentimento livre, informado e inequívoco para que realizemos o tratamento de seus dados estritamente para o funcionamento e melhoria do serviço de gerenciamento e planejamento de postagens.')}
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-white text-[13px]">{t('privacySec2Title', '2. Quais Dados Coletamos?')}</h4>
                  <p>
                    {t('privacySec2Intro', 'Nós coletamos apenas os dados essenciais para identificação e funcionamento da sua assinatura e gerenciador de clientes:')}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                    <li>{t('privacySec2B1', 'Dados Cadastrais: Nome completo ou da marca, e-mail corporativo de acesso e número de telefone/WhatsApp.')}</li>
                    <li>{t('privacySec2B2', 'Dados de Planejamento: Nomes das marcas de clientes cadastradas, títulos e rascunhos de publicações, cronograma de agendamento (data e hora), ideias visuais e scripts de criativos.')}</li>
                    <li>{t('privacySec2B3', 'Dados de Sessão: Registros básicos de autenticação para validar sua sessão e resguardar a integridade do seu workspace de acessos não autorizados.')}</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-white text-[13px]">{t('privacySec3Title', '3. Finalidade do Tratamento')}</h4>
                  <p>
                    {t('privacySec3Intro', 'Os dados coletados são tratados com as seguintes finalidades legítimas (Art. 7º, I e V da LGPD):')}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                    <li>{t('privacySec3B1', 'Garantir a segurança no login de sua conta e impedir acessos indesejados.')}</li>
                    <li>{t('privacySec3B2', 'Sincronizar e manter em segurança suas publicações e metas em nosso banco de dados SQLite privado.')}</li>
                    <li>{t('privacySec3B3', 'Permitir o gerenciamento de permissões e convites para sua equipe no painel de controle.')}</li>
                    <li>{t('privacySec3B4', 'Fornecer suporte técnico e responder a chamados através dos canais oficiais.')}</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-white text-[13px]">{t('privacySec4Title', '4. Seus Direitos (Artigo 18 da LGPD)')}</h4>
                  <p>
                    {t('privacySec4Intro', 'Você possui pleno controle sobre suas informações. Através do nosso menu de Privacidade (LGPD), você pode, a qualquer momento e de forma facilitada:')}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                    <li>{t('privacySec4B1', 'Confirmar a existência: Saber exatamente se tratamos seus dados e quais estão ativos.')}</li>
                    <li>{t('privacySec4B2', 'Acessar e Exportar: Baixar gratuitamente uma cópia de todos os seus dados em formato estruturado (JSON) para portabilidade.')}</li>
                    <li>{t('privacySec4B3', 'Corrigir e Atualizar: Retificar dados incompletos ou inexatos diretamente em seu perfil.')}</li>
                    <li>{t('privacySec4B4', 'Revogar Consentimento e Exclusão: Eliminar de forma definitiva sua conta e todos os dados associados de nossa infraestrutura através da opção "Direito ao Esquecimento".')}</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-white text-[13px]">{t('privacySec5Title', '5. Segurança e Armazenamento Privado')}</h4>
                  <p>
                    {t('privacySec5Text', 'Adotamos as melhores práticas técnicas e organizacionais de segurança para proteger seus dados contra perda, extravio, alteração ou vazamento. Suas publicações e históricos residem em um banco de dados relacional SQLite privado dentro do ambiente Docker, garantindo que nenhum outro cliente ou invasor tenha acesso às suas estratégias de conteúdo.')}
                  </p>
                </section>
              </div>
            ) : (
              // Terms of Use
              <div className="space-y-4">
                <p className="text-zinc-400 font-mono text-[10px] border-b border-panel-border/30 pb-2">
                  {t('legalLastUpdated', 'Última atualização: 10 de Julho de 2026')}
                </p>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-white text-[13px]">{t('termsSec1Title', '1. Aceitação dos Termos')}</h4>
                  <p>
                    {t('termsSec1Text', 'Ao acessar ou utilizar a plataforma do Planner de Conteúdo, você declara estar ciente e concordar integralmente com as condições estipuladas nestes Termos de Uso. Caso não concorde com qualquer disposição aqui descrita, não conclua o seu cadastro.')}
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-white text-[13px]">{t('termsSec2Title', '2. Descrição do Serviço')}</h4>
                  <p>
                    {t('termsSec2Text', 'A plataforma consiste em uma ferramenta de software de planejamento, estruturação de funis de marketing (TOFU, MOFU, BOFU), redação de criativos, controle de status (rascunho, agendado, produzido) e inteligência analítica para múltiplos canais digitais (Instagram, TikTok e YouTube).')}
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-white text-[13px]">{t('termsSec3Title', '3. Responsabilidade das Contas e Acesso')}</h4>
                  <p>
                    {t('termsSec3Intro', 'Cada usuário é exclusivamente responsável por:')}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                    <li>{t('termsSec3B1', 'Manter o sigilo de suas credenciais de login (e-mail e senha).')}</li>
                    <li>{t('termsSec3B2', 'Garantir a veracidade e conformidade legal das informações cadastradas de seus respectivos clientes e marcas de terceiros.')}</li>
                    <li>{t('termsSec3B3', 'Utilizar a ferramenta de acordo com a legislação brasileira de propriedade intelectual e direitos de privacidade de dados.')}</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-white text-[13px]">{t('termsSec4Title', '4. Limites de Uso e Proibições')}</h4>
                  <p>
                    {t('termsSec4Text', 'É estritamente vedada qualquer tentativa de engenharia reversa no servidor, violação de endpoints de API para obtenção de dados de terceiros ou qualquer prática de spam e disseminação de conteúdo abusivo ou violento que desrespeite as diretrizes de rede social parceiras.')}
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-white text-[13px]">{t('termsSec5Title', '5. Rescisão e Desistência')}</h4>
                  <p>
                    {t('termsSec5Text', 'Você pode encerrar sua conta a qualquer momento de forma simplificada, em total conformidade com a LGPD, solicitando a exclusão de dados pelo painel de Privacidade. Não haverá qualquer retenção injustificada ou penalidade após a exclusão do cadastro.')}
                  </p>
                </section>
              </div>
            )}
          </div>

          {/* Footer action */}
          <div className="border-t border-panel-border/60 pt-4 mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all cursor-pointer"
            >
              {t('gotItAndClose', 'Entendi e Fechar')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
