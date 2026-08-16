/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Post, WeeklyGoal } from './types';

// Helper to get formatted dates relative to June 2026 (the active month of current local time)
export const initialPosts: Post[] = [
  {
    id: 'p1',
    clientId: 'c_default',
    title: '7 sinais de que você está cometendo erros graves de marketing de conteúdo',
    platform: 'instagram',
    format: 'carousel',
    funnelStage: 'TOFU',
    status: 'scheduled',
    scheduledDate: '2026-06-15',
    scheduledTime: '10:00',
    description: 'Postagem em carrossel visualmente rica exibindo os erros comuns e o que fazer em cada um deles para reter a audiência.',
    hashtags: ['MarketingDigital', 'ConteudoDigital', 'RedesSociais', 'Carrossel'],
    hookText: 'Você está produzindo conteúdo mas ninguém engaja? O problema pode estar em um destes 7 hábitos...',
    scriptText: 'Card 1: Título Chamativo. Card 2: Falta de gancho claro na capa. Card 3: Formatação cheia de texto legível por robôs. Card 4: Falta de CTA convincente. Card 5: Como consertar cada um deles agora. Card 6: Salve o post para consultar depois!',
    visualIdea: 'Slide 1 com fundo preto e tipografia lilás e preta de alto contraste. Elementos gráficos setas laranjas pontiagudas.'
  },
  {
    id: 'p2',
    clientId: 'c_default',
    title: 'Como transformamos 1 episódio de Podcast em 12 vídeos curtos virais',
    platform: 'tiktok',
    format: 'shorts',
    funnelStage: 'MOFU',
    status: 'production',
    scheduledDate: '2026-06-14',
    scheduledTime: '12:30',
    description: 'A estratégia completa de reaproveitamento de conteúdo inteligente construída para dominar o algoritmo de vídeos curtos.',
    hashtags: ['TikTokTips', 'CortesePodcasts', 'CreatorEconomy', 'Estrategia'],
    hookText: 'Pare de sofrer para criar roteiros todo santo dia. Faça isso com apenas um único vídeo longo...',
    scriptText: 'Ganchos rápidos de até 3 segundos selecionando as 3 melhores falas polêmicas ou curiosas. Edição dinâmica com legendas ampliadas e efeitos sonoros nos cortes críticos.',
    visualIdea: 'Cenário minimalista, corte rápido nas expressões faciais, barra de progresso laranja no rodapé do vídeo.'
  },
  {
    id: 'p3',
    clientId: 'c_default',
    title: 'Análise de Ferramenta AI: Ferramentas gratuitas que os profissionais de marketing usam',
    platform: 'youtube',
    format: 'video',
    funnelStage: 'TOFU',
    status: 'scheduled',
    scheduledDate: '2026-06-18',
    scheduledTime: '18:00',
    description: 'Um vídeo completo detalhando 5 ferramentas incríveis de IA para criadores de conteúdo que poupam até 15 horas semanais.',
    hashtags: ['IADepoisDoTrabalho', 'Criatividade', 'FerramentasMilagrosas', 'YouTubeBrasil'],
    hookText: 'Se você ainda passa horas editando vídeos ou criando capas de carrosséis, você está no caminho errado.',
    scriptText: 'Intro rápida de transição em roxo. Ferramenta 1: Geração automática de legenda. Ferramenta 2: Limpeza de ruído de áudio. Ferramenta 3: Extrator de paleta de cores. Ferramenta 4: Roteirizador inteligente (Gemini). Ferramenta 5: Editor de capas.',
    visualIdea: 'Thumb de alta resolução com tons preto e laranja vivo escrito IA GRÁTIS.'
  },
  {
    id: 'p4',
    clientId: 'c_default',
    title: 'Por que "não tenho tempo para criar conteúdo" é um problema de processos estruturais',
    platform: 'instagram',
    format: 'reels',
    funnelStage: 'BOFU',
    status: 'published',
    scheduledDate: '2026-06-13',
    scheduledTime: '15:00',
    description: 'Mostrando a realidade da falta de um template de organização ágil de postagens. Direto ao ponto sobre como consertar.',
    hashtags: ['Produtividade', 'RotinaCreator', 'VendasNoInstagram', 'Bastidores'],
    hookText: 'Não te falta tempo, te falta um sistema limpo de calendário visual...',
    scriptText: 'Mostre a tela do computador aberta neste planner. Destaque como organizar posts por funil (TOFU/MOFU/BOFU) resolve a dúvida de "o que postar hoje". Ofereça o template de bônus no direct.',
    visualIdea: 'Gravação feita em primeira pessoa apontando para o painel de forma enérgica e profissional.'
  },
  {
    id: 'p5',
    clientId: 'c_default',
    title: 'Como monetizar uma audiência de apenas 1.000 seguidores fiéis',
    platform: 'tiktok',
    format: 'shorts',
    funnelStage: 'BOFU',
    status: 'production',
    scheduledDate: '2026-06-16',
    scheduledTime: '19:15',
    description: 'Uma lição curta desmistificando a corrida de vaidade por números, provando que conversão em infoprodutos é sobre conexões.',
    hashtags: ['SeguidoresReais', 'MonetizarRedes', 'Infoprodutos', 'CreatorMarketing'],
    hookText: 'Apenas 1000 pessoas são capazes de sustentar sua operação inteira se você souber fazer isso...',
    scriptText: 'Explicação da matemática: 50 clientes recorrentes pagando R$ 100 no mês. Como estruturar o produto com soluções diretas e ganchos em stories fechados.',
    visualIdea: 'Texto simples e dinâmico sobre fundo roxo estático com transições fortes.'
  },
  {
    id: 'p6',
    clientId: 'c_default',
    title: 'Roteiro de 3 passos para prender a atenção de qualquer um nos primeiros segundos',
    platform: 'youtube',
    format: 'shorts',
    funnelStage: 'TOFU',
    status: 'draft',
    scheduledDate: '2026-06-10',
    scheduledTime: '11:00',
    description: 'O método científico para ganchos virais que ativam dopamina visual imediatamente.',
    hashtags: ['GanchosVirais', 'RoteiroEficaz', 'YouTubeShorts', 'EdicaoCriativa'],
    hookText: 'Seu público foge nos primeiros 3 segundos do vídeo? O segredo é essa fórmula de 3 passos simples...',
    scriptText: 'Passo 1: Negar o senso comum de forma radical. Passo 2: Mostrar o resultado final incrível em menos de 1 segundo. Passo 3: Criar um looping de perguntas que só encerram no final do vídeo.',
    visualIdea: 'Destaques laranjas em caixas pretas piscando na tela ao ritmo das batidas corporais.'
  },
  {
    id: 'p7',
    clientId: 'c_default',
    title: 'A rotina secreta por trás do meu império de conteúdo de 1 pessoa apenas',
    platform: 'instagram',
    format: 'stories',
    funnelStage: 'MOFU',
    status: 'published',
    scheduledDate: '2026-06-14',
    scheduledTime: '08:00',
    description: 'Sequência de Stories de bastidores revelando as ferramentas de automação e o foco de blocos de horários de gravação.',
    hashtags: ['BastidoresDoNegocio', 'Solopreneur', 'SistemasUteis'],
    hookText: 'Muitos acham que tenho uma agência inteira por trás de mim. Hoje vou abrir o capô e mostrar a verdade...',
    scriptText: 'Story 1: Foto do café matinal com a lista de metas. Story 2: Prints do planner organizando a semana. Story 3: Caixa de pergunta "Qual sua maior trava para postar?". Story 4: Vídeo rápido respondendo a primeira caixinha.',
    visualIdea: 'Série de fotos e vídeos rápidos gravados por celular, usando fontes de estilo mono de alta sofisticação.'
  },
  {
    id: 'p8',
    clientId: 'c_default',
    title: 'Estratégia completa de SEO de canais para ranqueamento infinito no YouTube',
    platform: 'youtube',
    format: 'video',
    funnelStage: 'MOFU',
    status: 'scheduled',
    scheduledDate: '2026-06-21',
    scheduledTime: '17:45',
    description: 'Como configurar palavras-chave, metadados e playlists para continuar recebendo milhares de visualizações por anos.',
    hashtags: ['SEOYouTube', 'CrescerNoYouTube', 'CanalDeSucesso', 'ViewsImparaveis'],
    hookText: 'Seus vídeos morrem 48 horas depois que você clica em publicar? Pare de depender só do Feed Recomendado...',
    scriptText: 'Pesquisa avançada de cauda longa, inserção de termos-chave estritamente no título e descrição naturalizada, criação de capas temáticas que geram alta taxa de cliques (CTR).',
    visualIdea: 'Exposição de gráficos crescentes roxos cruzando a tela com barras de metas batidas.'
  },
  {
    id: 'p9',
    clientId: 'c_default',
    title: 'Os 3 gatilhos mentais mais potentes que convertem meros espectadores em clientes',
    platform: 'instagram',
    format: 'carousel',
    funnelStage: 'BOFU',
    status: 'draft',
    scheduledDate: '2026-06-19',
    scheduledTime: '13:00',
    description: 'Postagem educacional explicando Praticidade Exclusiva, Conexão e Lógica Reversa.',
    hashtags: ['GatilhosMentais', 'CopywritingRapido', 'ConversaoAlta', 'CarrosseisEstrategicos'],
    hookText: 'Por que algumas pessoas têm furos na carteira enquanto os outros faturam múltiplos dígitos nos stories?',
    scriptText: 'Slide 1: Capa preta disruptiva. Slide 2: Explicação sobre o gatilho da especificidade extrema. Slide 3: Prova documental vs Simulação. Slide 4: O método anti-obviedade. Slide 5: Oferta do link na Bio.',
    visualIdea: 'Letras laranjas proeminentes em fundos escuros, visual limpo, espaçoso e muito chique.'
  }
];

export const initialGoals: WeeklyGoal[] = [
  { id: 'g1', clientId: 'c_default', title: 'Publicar Reels estratégicos de atração', targetCount: 3, currentCount: 2, platform: 'instagram', completed: false },
  { id: 'g2', clientId: 'c_default', title: 'Manter sequência de visualizações diárias', targetCount: 5, currentCount: 5, platform: 'tiktok', completed: true },
  { id: 'g3', clientId: 'c_default', title: 'Subir vídeo tutorial no YouTube Longo', targetCount: 1, currentCount: 0, platform: 'youtube', completed: false },
  { id: 'g4', clientId: 'c_default', title: 'Carrossel educativo de aprofundamento', targetCount: 2, currentCount: 1, platform: 'instagram', completed: false }
];
