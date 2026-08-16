/**
 * SEO Data Dictionary & Schema Generators for Planner Amplifica
 * Supporting pt-BR and en routes with rich keywords, structured JSON-LD schemas, FAQs, and metadata.
 */

export interface SeoPageMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  lang: 'pt-BR' | 'en';
  alternateUrl?: {
    pt: string;
    en: string;
  };
  h1: string;
  subtitle: string;
  category?: string;
  ogType?: 'website' | 'article';
  publishedDate?: string;
  author?: string;
  faqs?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; item: string }>;
  contentBlocks?: Array<{
    h2: string;
    text: string;
    bullets?: string[];
  }>;
}

export const BASE_URL = 'https://planner.amplificagroup.com';

export const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Planner Amplifica',
  legalName: 'Amplifica Group',
  url: BASE_URL,
  logo: `${BASE_URL}/icon-192.png`,
  sameAs: [
    'https://instagram.com/amplificagroup',
    'https://linkedin.com/company/amplificagroup',
    'https://youtube.com/@amplificagroup'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+55-17-99195-1381',
    contactType: 'customer support',
    areaServed: ['BR', 'US', 'Global'],
    availableLanguage: ['Portuguese', 'English']
  }
};

export const SOFTWARE_APP_SCHEMA = (lang: 'pt-BR' | 'en' = 'pt-BR') => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Planner Amplifica',
  operatingSystem: 'All (Web, Cloud)',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: lang === 'pt-BR' ? 'BRL' : 'USD'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '1280'
  },
  description:
    lang === 'pt-BR'
      ? 'O Planner Amplifica é a plataforma completa de calendário editorial, planejamento de redes sociais e roteirização com inteligência artificial para agências, criadores e equipes de marketing.'
      : 'Planner Amplifica is the leading AI-powered content planner, social media calendar, and editorial workflow software for creators, agencies, and marketing teams.'
});

export const WEBSITE_SEARCH_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Planner Amplifica',
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/blog?s={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
};

// Map of all Landing Pages (PT & EN)
export const LANDING_PAGES_SEO: Record<string, SeoPageMetadata> = {
  // Português Landings
  'planner-de-conteudo': {
    lang: 'pt-BR',
    title: 'Planner de Conteúdo Online Grátis com IA | Planner Amplifica',
    description: 'Organize suas postagens, crie roteiros otimizados com inteligência artificial e controle seu calendário editorial em um único lugar. Teste grátis o Planner Amplifica!',
    keywords: ['planner de conteudo', 'planner de conteudo online', 'ferramenta de planejamento de conteudo', 'planner de rede social', 'planejamento editorial'],
    canonical: `${BASE_URL}/planner-de-conteudo`,
    alternateUrl: {
      pt: `${BASE_URL}/planner-de-conteudo`,
      en: `${BASE_URL}/content-planner`
    },
    h1: 'Planner de Conteúdo Inteligente para Redes Sociais',
    subtitle: 'Simplifique seu fluxo editorial do conceito à aprovação do cliente com assistência avançada de IA.',
    faqs: [
      {
        question: 'O que é um planner de conteúdo?',
        answer: 'Um planner de conteúdo é uma ferramenta estratégica que ajuda criadores, agências e profissionais de marketing a planejar, roteirizar, agendar e analisar postagens para redes sociais e canais digitais de forma organizada.'
      },
      {
        question: 'Como a IA do Planner Amplifica ajuda no planejamento?',
        answer: 'A IA gera ideias de ganchos (hooks), roteiros completos por estágio de funil (TOFU, MOFU, BOFU) e sugestões de legendas e hashtags sob medida para o seu público.'
      },
      {
        question: 'Posso usar o Planner Amplifica gratuitamente?',
        answer: 'Sim, oferecemos um plano totalmente gratuito para que você possa estruturar seu calendário e testar os recursos da plataforma.'
      }
    ],
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Planner de Conteúdo', item: `${BASE_URL}/planner-de-conteudo` }
    ],
    contentBlocks: [
      {
        h2: 'Por que utilizar um Planner de Conteúdo profissional?',
        text: 'A consistência é a chave para o crescimento nas redes sociais. Com o Planner Amplifica, você elimina o bloqueio criativo, distribui estrategicamente seus posts entre atração, nutrição e conversão e acelera a aprovação com clientes.'
      },
      {
        h2: 'Recursos essenciais para sua estratégia',
        text: 'Acesse recursos completos desenvolvidos para escalar sua produtividade:',
        bullets: [
          'Visão em Calendário, Kanban e Grid Visual do Instagram',
          'Roteirização automática de Reels, YouTube Shorts e TikTok',
          'Gestão de múltiplos clientes e aprovação com 1 clique',
          'Biblioteca de hashtags inteligentes e kit de marca'
        ]
      }
    ]
  },

  'calendario-editorial': {
    lang: 'pt-BR',
    title: 'Calendário Editorial com IA para Redes Sociais | Planner Amplifica',
    description: 'Crie e gerencie seu calendário editorial de marketing de forma visual, produtiva e colaborativa. Integre equipe e clientes com facilidade.',
    keywords: ['calendario editorial', 'calendario de postagens', 'calendario de marketing', 'organizador de posts', 'cronograma de conteudo'],
    canonical: `${BASE_URL}/calendario-editorial`,
    alternateUrl: {
      pt: `${BASE_URL}/calendario-editorial`,
      en: `${BASE_URL}/editorial-calendar`
    },
    h1: 'Calendário Editorial de Conteúdo e Redes Sociais',
    subtitle: 'Tenha total clareza sobre todas as publicações agendadas na sua empresa ou agência.',
    faqs: [
      {
        question: 'O que deve constar em um calendário editorial?',
        answer: 'Um calendário editorial completo deve conter a data de publicação, plataforma, formato (carrossel, vídeo, stories), estágio do funil de vendas, responsável pela produção e status do conteúdo.'
      }
    ],
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/` },
      { name: 'Calendário Editorial', item: `${BASE_URL}/calendario-editorial` }
    ]
  },

  'calendario-de-conteudo': {
    lang: 'pt-BR',
    title: 'Calendário de Conteúdo Online e Grátis | Planner Amplifica',
    description: 'Monte seu calendário de conteúdo estratégico para Instagram, YouTube, TikTok e LinkedIn. Planeje seu ano inteiro em minutos.',
    keywords: ['calendario de conteudo', 'calendario de conteudo grátis', 'planejar postagens', 'cronograma de redes sociais'],
    canonical: `${BASE_URL}/calendario-de-conteudo`,
    alternateUrl: {
      pt: `${BASE_URL}/calendario-de-conteudo`,
      en: `${BASE_URL}/content-calendar`
    },
    h1: 'Calendário de Conteúdo Visual e Intuitivo',
    subtitle: 'Arraste, solte e organize todas as suas ideias de publicações no calendário dinâmico.',
    faqs: [
      {
        question: 'Como organizar o calendário de conteúdo para mídias sociais?',
        answer: 'Defina frequências semanais para cada plataforma, divida os tópicos por pilares de conteúdo e utilize a visão em calendário do Planner Amplifica para equilibrar os formatos ao longo dos dias.'
      }
    ]
  },

  'planner-instagram': {
    lang: 'pt-BR',
    title: 'Planner para Instagram com Prévia de Feed e IA | Planner Amplifica',
    description: 'Planeje seus Carrosséis, Reels e Stories no Instagram. Visualize o feed harmonioso antes de publicar e crie ganchos magnéticos com IA.',
    keywords: ['planner instagram', 'organizador de feed instagram', 'planejar reels', 'calendario instagram', 'previa de feed'],
    canonical: `${BASE_URL}/planner-instagram`,
    alternateUrl: {
      pt: `${BASE_URL}/planner-instagram`,
      en: `${BASE_URL}/social-media-planner`
    },
    h1: 'Planner Completo para Instagram (Feed, Reels & Stories)',
    subtitle: 'Maximize o engajamento do seu perfil no Instagram com estratégia de conteúdo visual e roteiros envolventes.',
    faqs: [
      {
        question: 'Posso prever a estética do meu feed do Instagram?',
        answer: 'Sim, a visualização em Grid permite arrastar e organizar seus posts para garantir um feed esteticamente atraente e coeso.'
      }
    ]
  },

  'planner-redes-sociais': {
    lang: 'pt-BR',
    title: 'Planner de Redes Sociais Multicanal | Planner Amplifica',
    description: 'Centralize o planejamento do Instagram, TikTok, YouTube, LinkedIn e Facebook em um só painel de controle.',
    keywords: ['planner redes sociais', 'gerenciador de mídias sociais', 'plano de mídias sociais', 'ferramenta social media'],
    canonical: `${BASE_URL}/planner-redes-sociais`,
    alternateUrl: {
      pt: `${BASE_URL}/planner-redes-sociais`,
      en: `${BASE_URL}/social-media-planner`
    },
    h1: 'Planner de Redes Sociais Multicanal',
    subtitle: 'A solução definitiva para gerenciar múltiplos canais de comunicação com alta produtividade.',
    faqs: [
      {
        question: 'Quais redes sociais são suportadas?',
        answer: 'Você pode planejar conteúdos adaptados para Instagram, YouTube, TikTok, LinkedIn, Facebook e envio de e-mail marketing/newsletter.'
      }
    ]
  },

  'planner-com-ia': {
    lang: 'pt-BR',
    title: 'Planner de Conteúdo com IA Generativa | Planner Amplifica',
    description: 'Gere ideias, ganchos virais e roteiros completos com inteligência artificial integrada ao seu calendário editorial.',
    keywords: ['planner com ia', 'ia para criar conteudo', 'gerador de roteiros ia', 'ia para redes sociais', 'ia marketing de conteudo'],
    canonical: `${BASE_URL}/planner-com-ia`,
    alternateUrl: {
      pt: `${BASE_URL}/planner-com-ia`,
      en: `${BASE_URL}/ai-content-planner`
    },
    h1: 'Planner de Conteúdo Potencializado por Inteligência Artificial',
    subtitle: 'Sua assistente de criação de conteúdo 24 horas por dia, 7 dias por semana.',
    faqs: [
      {
        question: 'A inteligência artificial cria o roteiro inteiro?',
        answer: 'Sim, nossa IA gera o gancho visual/verbal, o desenvolvimento em tópicos e a chamada para ação (CTA), além de legendas e hashtags.'
      }
    ]
  },

  'gestao-de-conteudo': {
    lang: 'pt-BR',
    title: 'Sistema de Gestão de Conteúdo e Aprovação de Clientes | Planner Amplifica',
    description: 'Gerencie múltiplos clientes, aprove campanhas rapidamente e acompanhe o pipeline de produção do seu time em tempo real.',
    keywords: ['gestao de conteudo', 'software de gestao de redes sociais', 'aprovacao de clientes social media', 'workflow de producao'],
    canonical: `${BASE_URL}/gestao-de-conteudo`,
    alternateUrl: {
      pt: `${BASE_URL}/gestao-de-conteudo`,
      en: `${BASE_URL}/content-planning-software`
    },
    h1: 'Software de Gestão de Conteúdo para Agências e Equipes',
    subtitle: 'Acelere o fluxo de trabalho e elimine trocas infindáveis de e-mails na aprovação de peças.',
    faqs: [
      {
        question: 'Como funciona a aprovação para clientes?',
        answer: 'Você gera um link público de visualização e o cliente pode aprovar ou solicitar ajustes com apenas um clique, sem necessidade de login.'
      }
    ]
  },

  // English Landings
  'content-planner': {
    lang: 'en',
    title: 'AI Content Planner & Social Media Calendar | Planner Amplifica',
    description: 'Plan, script, and streamline your content strategy across Instagram, YouTube, and TikTok with AI assistance. Try Planner Amplifica for free!',
    keywords: ['content planner', 'social media planner', 'ai content generator', 'content planning tool', 'editorial calendar software'],
    canonical: `${BASE_URL}/en/content-planner`,
    alternateUrl: {
      pt: `${BASE_URL}/planner-de-conteudo`,
      en: `${BASE_URL}/en/content-planner`
    },
    h1: 'AI-Powered Content Planner for Creators & Agencies',
    subtitle: 'Organize your multichannel content schedule and generate viral hooks with advanced AI.',
    faqs: [
      {
        question: 'What is an AI Content Planner?',
        answer: 'An AI content planner is a software solution that leverages artificial intelligence to help marketing teams and creators brainstorm ideas, structure video scripts, manage calendars, and optimize social media workflows.'
      },
      {
        question: 'Is there a free plan available?',
        answer: 'Yes, Planner Amplifica offers a free plan so you can start organizing your content immediately with essential AI features.'
      }
    ],
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}/en` },
      { name: 'Content Planner', item: `${BASE_URL}/en/content-planner` }
    ]
  },

  'content-calendar': {
    lang: 'en',
    title: 'Online Content Calendar Tool | Planner Amplifica',
    description: 'Visual content calendar to manage social media posts, blog schedules, and video releases in one clean dashboard.',
    keywords: ['content calendar', 'marketing calendar', 'social media calendar', 'editorial schedule'],
    canonical: `${BASE_URL}/en/content-calendar`,
    alternateUrl: {
      pt: `${BASE_URL}/calendario-de-conteudo`,
      en: `${BASE_URL}/en/content-calendar`
    },
    h1: 'Visual Content Calendar Software',
    subtitle: 'Drag and drop your upcoming posts across all your social platforms effortless.',
    faqs: [
      {
        question: 'How does the content calendar work?',
        answer: 'It provides interactive calendar views, Kanban boards, and grid previews where you can schedule, edit, and approve content entries.'
      }
    ]
  },

  'editorial-calendar': {
    lang: 'en',
    title: 'Editorial Calendar Software for Marketing Teams | Planner Amplifica',
    description: 'Collaborative editorial calendar for teams and agencies. Keep authors, editors, and clients aligned on every publishing goal.',
    keywords: ['editorial calendar', 'editorial planning software', 'team content calendar', 'publishing schedule'],
    canonical: `${BASE_URL}/en/editorial-calendar`,
    alternateUrl: {
      pt: `${BASE_URL}/calendario-editorial`,
      en: `${BASE_URL}/en/editorial-calendar`
    },
    h1: 'Collaborative Editorial Calendar Software',
    subtitle: 'Empower your marketing team with a centralized publishing roadmap.',
    faqs: [
      {
        question: 'Can I invite clients to review the calendar?',
        answer: 'Yes, you can share one-click approval links with clients so they can review and approve posts without registering.'
      }
    ]
  },

  'social-media-planner': {
    lang: 'en',
    title: 'Multi-Channel Social Media Planner | Planner Amplifica',
    description: 'All-in-one social media planning tool for Instagram Reels, YouTube Shorts, TikTok, and LinkedIn.',
    keywords: ['social media planner', 'social media management tool', 'instagram planner', 'tiktok content calendar'],
    canonical: `${BASE_URL}/en/social-media-planner`,
    alternateUrl: {
      pt: `${BASE_URL}/planner-redes-sociais`,
      en: `${BASE_URL}/en/social-media-planner`
    },
    h1: 'Multi-Channel Social Media Planner',
    subtitle: 'Master your multi-platform presence with structured funnel strategies and video scripting.',
    faqs: [
      {
        question: 'Which social platforms are supported?',
        answer: 'Planner Amplifica supports Instagram, YouTube, TikTok, LinkedIn, Facebook, and Email Marketing campaigns.'
      }
    ]
  },

  'ai-content-planner': {
    lang: 'en',
    title: 'AI Content Planner & Script Generator | Planner Amplifica',
    description: 'Use artificial intelligence to generate catchy hooks, video scripts, and structured funnel post ideas automatically.',
    keywords: ['ai content planner', 'ai script writer', 'ai social media generator', 'ai marketing assistant'],
    canonical: `${BASE_URL}/en/ai-content-planner`,
    alternateUrl: {
      pt: `${BASE_URL}/planner-com-ia`,
      en: `${BASE_URL}/en/ai-content-planner`
    },
    h1: 'AI Content Planner & Script Generator',
    subtitle: 'Never run out of post ideas or struggle with video scriptwriting again.',
    faqs: [
      {
        question: 'How does the AI assistant help write scripts?',
        answer: 'Simply enter your topic or target audience, and the AI generates hook options, bulleted speaking points, and clear call-to-actions (CTAs).'
      }
    ]
  },

  'content-planning-software': {
    lang: 'en',
    title: 'Content Planning Software for Agencies | Planner Amplifica',
    description: 'Streamline agency operations, manage multiple client brands, and automate content approval workflows.',
    keywords: ['content planning software', 'agency content software', 'social media workflow', 'client approval tool'],
    canonical: `${BASE_URL}/en/content-planning-software`,
    alternateUrl: {
      pt: `${BASE_URL}/gestao-de-conteudo`,
      en: `${BASE_URL}/en/content-planning-software`
    },
    h1: 'Enterprise Content Planning & Workflow Software',
    subtitle: 'Built for agencies and scale-up marketing teams handling complex multi-brand pipelines.',
    faqs: [
      {
        question: 'Does it support multi-client brand management?',
        answer: 'Yes, you can create isolated client workspaces, brand kits, custom hashtags, and independent approval portals.'
      }
    ]
  },

  'marketing-calendar': {
    lang: 'en',
    title: 'All-in-One Marketing Calendar | Planner Amplifica',
    description: 'Align product launches, email campaigns, and social media posts inside a unified marketing calendar.',
    keywords: ['marketing calendar', 'campaign planner', 'omnichannel marketing tool', 'launch planner'],
    canonical: `${BASE_URL}/en/marketing-calendar`,
    alternateUrl: {
      pt: `${BASE_URL}/calendario-de-conteudo`,
      en: `${BASE_URL}/en/marketing-calendar`
    },
    h1: 'Unified Omnichannel Marketing Calendar',
    subtitle: 'Bring your entire marketing strategy together into a cohesive timeline.',
    faqs: [
      {
        question: 'Can I organize campaign launches?',
        answer: 'Yes, our Campaigns module allows grouping posts by campaign objectives, target dates, and channels.'
      }
    ]
  }
};

// Feature Pages SEO
export const FEATURES_SEO: Record<string, SeoPageMetadata> = {
  'planejamento-com-ia': {
    lang: 'pt-BR',
    title: 'Planejamento de Conteúdo com IA | Planner Amplifica',
    description: 'Crie posts completos, roteiros e ganchos de alta conversão usando inteligência artificial integrada.',
    keywords: ['planejamento com ia', 'roteiro ia instagram', 'gerador de ideias com ia'],
    canonical: `${BASE_URL}/funcionalidade/planejamento-com-ia`,
    h1: 'Planejamento de Conteúdo com Inteligência Artificial',
    subtitle: 'Automatize a geração de ideias, ganchos magnéticos e ganchos em vídeo com assistente de IA.'
  },
  'calendario': {
    lang: 'pt-BR',
    title: 'Calendário Interativo de Conteúdo | Planner Amplifica',
    description: 'Visão mensal e semanal para organizar todas as publicações com suporte a drag and drop.',
    keywords: ['calendario de posts', 'cronograma de mídias sociais'],
    canonical: `${BASE_URL}/funcionalidade/calendario`,
    h1: 'Calendário Editorial Interativo',
    subtitle: 'Arraste, reorganize e planeje suas postagens com facilidade.'
  },
  'equipe': {
    lang: 'pt-BR',
    title: 'Gestão de Equipe e Colaboração | Planner Amplifica',
    description: 'Atribua papéis de redator, designer e gestor em cada postagem com permissões personalizadas.',
    keywords: ['gestao de equipe redes sociais', 'colaboracao em marketing'],
    canonical: `${BASE_URL}/funcionalidade/equipe`,
    h1: 'Gestão e Colaboração de Equipe em Tempo Real',
    subtitle: 'Delegue tarefas de criação, revisão e agendamento para seu time.'
  },
  'clientes': {
    lang: 'pt-BR',
    title: 'Gestão de Múltiplos Clientes para Agências | Planner Amplifica',
    description: 'Separe contas e marcas em ambientes isolados com marca própria.',
    keywords: ['gestao de clientes agência', 'múltiplos clientes social media'],
    canonical: `${BASE_URL}/funcionalidade/clientes`,
    h1: 'Gestão Multi-Cliente para Agências de Marketing',
    subtitle: 'Mantenha os arquivos e planejamentos de cada cliente totalmente organizados.'
  },
  'aprovacao': {
    lang: 'pt-BR',
    title: 'Portal de Aprovação de Clientes sem Login | Planner Amplifica',
    description: 'Envie um link seguro para o cliente aprovar ou solicitar alterações com um clique.',
    keywords: ['aprovacao de posts', 'link de aprovacao cliente'],
    canonical: `${BASE_URL}/funcionalidade/aprovacao`,
    h1: 'Aprovação de Conteúdo Instantânea com Clientes',
    subtitle: 'Acabe com aprovações por e-mail ou WhatsApp com nosso portal dedicado.'
  },
  'campanhas': {
    lang: 'pt-BR',
    title: 'Gestão de Campanhas Multicanal | Planner Amplifica',
    description: 'Agrupe posts por campanhas promocionais, lançamentos e datas comemorativas.',
    keywords: ['gestao de campanhas', 'planejador de lancamentos'],
    canonical: `${BASE_URL}/funcionalidade/campanhas`,
    h1: 'Planejamento de Campanhas Multicanal',
    subtitle: 'Mantenha todos os ativos da sua campanha em sinergia.'
  },
  'analytics': {
    lang: 'pt-BR',
    title: 'Dashboard de Analytics e Qualidade Editorial | Planner Amplifica',
    description: 'Métricas de atingimento de metas, balanceamento de funil e nota de qualidade dos roteiros.',
    keywords: ['analytics de redes sociais', 'dashboard de conteudo'],
    canonical: `${BASE_URL}/funcionalidade/analytics`,
    h1: 'Dashboard de Desempenho e Qualidade Editorial',
    subtitle: 'Acompanhe métricas vitais para a consistência da sua marca.'
  },
  'biblioteca': {
    lang: 'pt-BR',
    title: 'Central de Referências, Mídia e Hashtags | Planner Amplifica',
    description: 'Guarde ideias, referências de concorrência e grupos de hashtags otimizadas.',
    keywords: ['biblioteca de referencias', 'gerenciador de hashtags'],
    canonical: `${BASE_URL}/funcionalidade/biblioteca`,
    h1: 'Central de Referências & Inspirações',
    subtitle: 'Nunca mais perca uma ideia viral ou referência importante.'
  },
  'templates': {
    lang: 'pt-BR',
    title: 'Templates de Conteúdo e Roteiro | Planner Amplifica',
    description: 'Modelos prontos de calendários editoriais e estruturas de roteiro testadas.',
    keywords: ['templates de conteudo', 'modelos de calendario de redes sociais'],
    canonical: `${BASE_URL}/funcionalidade/templates`,
    h1: 'Templates Prontos para Usar',
    subtitle: 'Comece em minutos com estruturas de sucesso já configuradas.'
  },
  'publicacao': {
    lang: 'pt-BR',
    title: 'Esteira de Publicação e Cronograma | Planner Amplifica',
    description: 'Acompanhe o fluxo do post desde a ideia, roteiro, gravação até o agendamento final.',
    keywords: ['esteira de publicacao', 'cronograma de redes sociais'],
    canonical: `${BASE_URL}/funcionalidade/publicacao`,
    h1: 'Esteira de Produção & Pipeline de Postagens',
    subtitle: 'Visualização completa do status de produção de cada peça.'
  },
  'integracoes': {
    lang: 'pt-BR',
    title: 'Integrações de Redes Sociais e IA | Planner Amplifica',
    description: 'Conecte suas contas do Instagram, YouTube, TikTok e APIs para sincronização.',
    keywords: ['integraçoes redes sociais', 'api de agendamento'],
    canonical: `${BASE_URL}/funcionalidade/integracoes`,
    h1: 'Integrações Nativas & APIs',
    subtitle: 'Sincronize com suas ferramentas favoritas sem atrito.'
  },
  'workflow': {
    lang: 'pt-BR',
    title: 'Workflow Editorial Automatizado | Planner Amplifica',
    description: 'Automação de notificações, lembretes de gravação e mudança de status.',
    keywords: ['workflow editorial', 'automacao de mídias sociais'],
    canonical: `${BASE_URL}/funcionalidade/workflow`,
    h1: 'Workflow Editorial & Automações',
    subtitle: 'Automatize tarefas repetitivas e ganhe mais tempo estratégico.'
  }
};

// Comparison Pages SEO (Planner Amplifica vs Competitors)
export const COMPARISONS_SEO: Record<string, SeoPageMetadata> = {
  'planner-amplifica-vs-notion': {
    lang: 'pt-BR',
    title: 'Planner Amplifica vs Notion: Qual o Melhor para Mídias Sociais? | Comparativo 2026',
    description: 'Veja por que o Planner Amplifica é mais rápido, intuitivo e completo para gestão de mídias sociais do que criar templates complexos no Notion.',
    keywords: ['planner amplifica vs notion', 'notion para redes sociais', 'alternativa ao notion para social media'],
    canonical: `${BASE_URL}/comparar/planner-amplifica-vs-notion`,
    h1: 'Planner Amplifica vs Notion',
    subtitle: 'Compare e descubra qual ferramenta entrega maior produtividade para sua equipe.',
    faqs: [
      {
        question: 'Qual a vantagem do Planner Amplifica sobre o Notion?',
        answer: 'O Planner Amplifica já vem 100% configurado para mídias sociais com IA para roteiros, aprovação de cliente sem login, visão em grid de feed e métricas de funil prontas, sem necessidade de construir bancos de dados do zero.'
      }
    ]
  },
  'planner-amplifica-vs-trello': {
    lang: 'pt-BR',
    title: 'Planner Amplifica vs Trello para Redes Sociais | Comparativo 2026',
    description: 'O Trello é genérico para tarefas; o Planner Amplifica é especializado com calendário visual, roteirizador de IA e aprovação de clientes.',
    keywords: ['planner amplifica vs trello', 'trello para mídias sociais', 'alternativa ao trello para instagram'],
    canonical: `${BASE_URL}/comparar/planner-amplifica-vs-trello`,
    h1: 'Planner Amplifica vs Trello',
    subtitle: 'Especialização para mídias sociais vs quadros genéricos de tarefas.'
  },
  'planner-amplifica-vs-clickup': {
    lang: 'pt-BR',
    title: 'Planner Amplifica vs ClickUp: Comparativo Completo para Criadores',
    description: 'Evite a complexidade excessiva do ClickUp. O Planner Amplifica foca exatamente no que sua agência precisa para criar e aprovar conteúdo.',
    keywords: ['planner amplifica vs clickup', 'clickup social media', 'alternativa simples ao clickup'],
    canonical: `${BASE_URL}/comparar/planner-amplifica-vs-clickup`,
    h1: 'Planner Amplifica vs ClickUp',
    subtitle: 'Simplicidade focada em conteúdo vs complexidade pesada de projetos.'
  },
  'planner-amplifica-vs-buffer': {
    lang: 'pt-BR',
    title: 'Planner Amplifica vs Buffer: Gestão Editorial vs Simples Agendamento',
    description: 'Enquanto o Buffer faz apenas agendamento simples, o Planner Amplifica cuida de todo o processo: estratégia de funil, roteiro com IA e aprovação de clientes.',
    keywords: ['planner amplifica vs buffer', 'alternativa ao buffer', 'buffer x planner amplifica'],
    canonical: `${BASE_URL}/comparar/planner-amplifica-vs-buffer`,
    h1: 'Planner Amplifica vs Buffer',
    subtitle: 'Plataforma completa de criação e estratégia vs agendador básico.'
  },
  'planner-amplifica-vs-hootsuite': {
    lang: 'pt-BR',
    title: 'Planner Amplifica vs Hootsuite | Economia e Foco no Mercado Brasileiro',
    description: 'Substitua custos altíssimos em dólar do Hootsuite por uma plataforma moderna em português com suporte a roteiros e inteligência artificial.',
    keywords: ['planner amplifica vs hootsuite', 'alternativa barata ao hootsuite'],
    canonical: `${BASE_URL}/comparar/planner-amplifica-vs-hootsuite`,
    h1: 'Planner Amplifica vs Hootsuite',
    subtitle: 'Tecnologia moderna com suporte em português vs legado caro em dólar.'
  },
  'planner-amplifica-vs-later': {
    lang: 'pt-BR',
    title: 'Planner Amplifica vs Later | Comparativo para Instagram e TikTok',
    description: 'Compare recursos de prévia de feed, criação de roteiro em vídeo e aprovação com cliente entre o Planner Amplifica e o Later.',
    keywords: ['planner amplifica vs later', 'alternativa ao later instagram'],
    canonical: `${BASE_URL}/comparar/planner-amplifica-vs-later`,
    h1: 'Planner Amplifica vs Later',
    subtitle: 'Planejamento multicanal estratégico vs agendamento focado apenas no visual.'
  },
  'planner-amplifica-vs-metricool': {
    lang: 'pt-BR',
    title: 'Planner Amplifica vs Metricool | Estratégia de Conteúdo e Roteirização',
    description: 'Descubra como o Planner Amplifica combina métricas vitais com inteligência artificial para escrita de roteiros e aprovação de clientes.',
    keywords: ['planner amplifica vs metricool', 'alternativa ao metricool'],
    canonical: `${BASE_URL}/comparar/planner-amplifica-vs-metricool`,
    h1: 'Planner Amplifica vs Metricool',
    subtitle: 'Foco total na produção e estratégia de roteiro com IA vs reports de métricas.'
  }
};

// Programmatic Niche SEO Data (Ideias por Profissão/Nicho)
export const PROGRAMMATIC_NICHES = [
  {
    slug: 'nutricionistas',
    lang: 'pt-BR' as const,
    nicheName: 'Nutricionistas',
    title: 'Ideias de Posts e Roteiros para Nutricionistas | Planner Amplifica',
    description: 'Descubra 50+ ideias de posts de alto engajamento para nutricionistas. Planeje conteúdos de alimentação saudável, mitos e consultas no Instagram.',
    keywords: ['ideias de posts para nutricionistas', 'conteudo instagram nutricionista', 'mídias sociais para nutricionistas'],
    h1: 'Ideias de Conteúdo e Roteiros para Nutricionistas',
    sampleHooks: [
      '3 Mitos sobre o Carboidrato à Noite que Estão Travando seu Emagrecimento',
      'O que Comprar no Supermercado: Guia Prático para uma Semana Saudável',
      'Como Montar um Prato Equilibrado Sem Passar Fome'
    ]
  },
  {
    slug: 'advogados',
    lang: 'pt-BR' as const,
    nicheName: 'Advogados & Escritórios de Advocacia',
    title: 'Ideias de Conteúdo para Advogados e Direito no Instagram | Planner Amplifica',
    description: 'Estratégia de conteúdo jurídico ético para advogados. Ideias de Reels, Carrosséis informativos e atração de clientes qualificados.',
    keywords: ['ideias de posts para advogados', 'marketing juridico instagram', 'conteudo redes sociais advocacia'],
    h1: 'Ideias de Conteúdo e Roteiros para Advogados',
    sampleHooks: [
      '5 Direitos do Trabalhador que Pouca Gente Conhece',
      'O que Fazer se o seu Voo For Cancelado no Aeroporto?',
      'Divórcio Amigável: Como Funciona na Prática e Quanto Tempo Demora'
    ]
  },
  {
    slug: 'dentistas',
    lang: 'pt-BR' as const,
    nicheName: 'Dentistas & Clínicas Odontológicas',
    title: 'Ideias de Posts e Reels para Dentistas | Planner Amplifica',
    description: 'Atraia mais pacientes para seu consultório odontológico com ideias de posts sobre clareamento, lentes de contato e saúde bucal.',
    keywords: ['ideias de posts para dentistas', 'marketing para odontologia', 'conteudo instagram dentista'],
    h1: 'Ideias de Conteúdo e Roteiros para Dentistas',
    sampleHooks: [
      'Clareamento Dental Dói? A Verdade que Ninguém te Conta',
      'Como Funciona a Aplicação de Lentes de Contato Dental Passo a Passo',
      '3 Hábitos Diários que Estão Destruindo seu Esmalte Dental'
    ]
  },
  {
    slug: 'psicologos',
    lang: 'pt-BR' as const,
    nicheName: 'Psicólogos & Terapeutas',
    title: 'Ideias de Posts para Psicólogos no Instagram | Planner Amplifica',
    description: 'Conteúdos acolhedores e estratégicos para psicólogos aumentarem seus agendamentos de sessões e consultas.',
    keywords: ['ideias de posts para psicólogos', 'marketing para psicologos', 'instagram para psicologos'],
    h1: 'Ideias de Conteúdo e Roteiros para Psicólogos',
    sampleHooks: [
      'Sinais Silenciosos de que Você Pode Estar Com Burnout',
      'Como Lidar com a Ansiedade Antes de uma Reunião Importante',
      'A Diferença entre Tristeza Passageira e Depressão'
    ]
  },
  {
    slug: 'imobiliarias',
    lang: 'pt-BR' as const,
    nicheName: 'Imobiliárias & Corretores de Imóveis',
    title: 'Ideias de Conteúdo para Corretor de Imóveis e Imobiliárias | Planner Amplifica',
    description: 'Aumente suas vendas de imóveis com vídeos de tour virtual, dicas de financiamento e valorização de bairros.',
    keywords: ['ideias de posts para imobiliarias', 'corretor de imoveis instagram', 'marketing imobiliario'],
    h1: 'Ideias de Conteúdo para Imobiliárias e Corretores',
    sampleHooks: [
      'Tour em um Apartamento de 3 Quartos Pronto para Morar no Bairro X',
      'O que Analisar Antes de Assinar o Contrato de Financiamento Imobiliário',
      '5 Detalhes que Valorizam o Valor de Revenda do seu Imóvel'
    ]
  },
  {
    slug: 'clinicas',
    lang: 'pt-BR' as const,
    nicheName: 'Clínicas Médicas & Estéticas',
    title: 'Ideias de Posts para Clínicas Médicas e Estéticas | Planner Amplifica',
    description: 'Planejamento de conteúdo ético e focado em autoridade médica para clínicas e procedimentos estéticos.',
    keywords: ['ideias de posts para clinicas', 'marketing medico instagram', 'conteudo clinica estetica'],
    h1: 'Ideias de Conteúdo para Clínicas Médicas e Estéticas',
    sampleHooks: [
      'Botox vs Preenchimento com Ácido Hialurônico: Qual a Diferença?',
      'Cuidados Pré e Pós Procedimento Estético que Fazem Toda a Diferença',
      'Por que a Consulta de Avaliação Personalizada é Indispensável'
    ]
  },
  // English Programmatic Niches
  {
    slug: 'dentists',
    lang: 'en' as const,
    nicheName: 'Dentists & Dental Practices',
    title: 'Social Media Content Ideas for Dentists | Planner Amplifica',
    description: 'Discover 50+ engaging social media post ideas for dental clinics. Script Instagram Reels, Shorts, and patient education content easily.',
    keywords: ['content ideas for dentists', 'dental social media marketing', 'instagram for dentists'],
    h1: 'Content Ideas & Script Templates for Dentists',
    sampleHooks: [
      '3 Teeth Whitening Myths You Should Stop Believing',
      'What Happens During Your First Dental Implant Consultation',
      'How to Prevent Gum Disease with 2 Minutes a Day'
    ]
  },
  {
    slug: 'lawyers',
    lang: 'en' as const,
    nicheName: 'Lawyers & Law Firms',
    title: 'Content Ideas & Social Media Strategy for Lawyers | Planner Amplifica',
    description: 'Ethical legal marketing content ideas. Script short-form educational videos and LinkedIn posts that gain client trust.',
    keywords: ['content ideas for lawyers', 'law firm social media', 'legal marketing strategy'],
    h1: 'Content Ideas & Script Templates for Lawyers',
    sampleHooks: [
      '5 Employee Rights Most People Know Nothing About',
      'What to Do Immediately After a Car Accident',
      'How Estate Planning Protects Your Family Assets'
    ]
  },
  {
    slug: 'realtors',
    lang: 'en' as const,
    nicheName: 'Realtors & Real Estate Agents',
    title: 'Real Estate Social Media Post Ideas & Video Scripts | Planner Amplifica',
    description: 'Grow your property listings and buyer leads with video property walkthroughs and market updates.',
    keywords: ['content ideas for realtors', 'real estate social media ideas', 'instagram for real estate agents'],
    h1: 'Content Ideas & Video Scripts for Real Estate Agents',
    sampleHooks: [
      'Home Tour: Inside a $750k Modern Home with Pool',
      '3 Mistakes First-Time Buyers Always Make When Getting a Mortgage',
      'Top 5 Upgrades That Instantly Increase Home Resale Value'
    ]
  },
  {
    slug: 'coaches',
    lang: 'en' as const,
    nicheName: 'Business & Life Coaches',
    title: 'Social Media Content Ideas for Coaches | Planner Amplifica',
    description: 'Attract high-ticket coaching clients with educational carousels, authority hooks, and client win stories.',
    keywords: ['content ideas for coaches', 'coaching social media strategy', 'instagram for business coaches'],
    h1: 'Content Ideas & Scripts for Coaches & Mentors',
    sampleHooks: [
      'How I Helped My Client Double Their Monthly Revenue in 90 Days',
      'The #1 Mindset Shift Holding You Back From Scaling Your Business',
      '3 Daily Habits of High-Performing Entrepreneurs'
    ]
  },
  {
    slug: 'fitness-trainers',
    lang: 'en' as const,
    nicheName: 'Fitness Trainers & Gym Owners',
    title: 'Content Ideas for Fitness Trainers & Personal Coaches | Planner Amplifica',
    description: 'Script workout tutorials, nutrition tips, and transformation stories that sell online training programs.',
    keywords: ['content ideas for fitness trainers', 'personal trainer instagram ideas', 'fitness social media marketing'],
    h1: 'Content Ideas & Workout Scripts for Personal Trainers',
    sampleHooks: [
      'Stop Doing Squats Like This If You Have Knee Pain',
      'What I Eat in a Day to Stay Under 10% Body Fat',
      'Full Body Dumbbell Workout You Can Do in 20 Minutes at Home'
    ]
  }
];

// Templates SEO Data
export const TEMPLATES_SEO = [
  {
    slug: 'calendario-editorial',
    lang: 'pt-BR' as const,
    title: 'Template de Calendário Editorial Grátis | Planner Amplifica',
    description: 'Baixe e utilize o modelo pronto de calendário editorial. Estruturado para redes sociais, blogs e vídeos.',
    keywords: ['template calendario editorial', 'modelo de calendario de conteudo', 'download calendario de postagens'],
    h1: 'Template Prático de Calendário Editorial',
    downloadTitle: 'Modelo de Calendário Editorial Interativo'
  },
  {
    slug: 'planner-instagram',
    lang: 'pt-BR' as const,
    title: 'Template de Planner para Instagram Grátis | Planner Amplifica',
    description: 'Template completo para planejar seus Carrosséis, Reels e Stories com organização por funil.',
    keywords: ['template planner instagram', 'modelo de planejamento instagram'],
    h1: 'Template de Planner para Instagram',
    downloadTitle: 'Modelo de Planejamento Visual para Instagram'
  },
  {
    slug: 'planejamento-mensal',
    lang: 'pt-BR' as const,
    title: 'Template de Planejamento Mensal de Conteúdo | Planner Amplifica',
    description: 'Organize suasmetas mensais de vendas e engajamento em uma planilha ou aplicativo interativo.',
    keywords: ['template planejamento mensal', 'modelo de plano de mídias sociais'],
    h1: 'Template de Planejamento Mensal de Conteúdo',
    downloadTitle: 'Modelo de Cronograma Mensal'
  },
  {
    slug: 'calendario-marketing',
    lang: 'pt-BR' as const,
    title: 'Template de Calendário de Marketing Multicanal | Planner Amplifica',
    description: 'Template para sincronizar lançamentos, e-mails, anúncios e mídias sociais.',
    keywords: ['template calendario de marketing', 'modelo de marketing digital'],
    h1: 'Template de Calendário de Marketing Multicanal',
    downloadTitle: 'Modelo de Calendário de Marketing'
  },
  // English Templates
  {
    slug: 'content-calendar-template',
    lang: 'en' as const,
    title: 'Free Content Calendar Template | Planner Amplifica',
    description: 'Download or use our free interactive content calendar template for social media management.',
    keywords: ['content calendar template', 'free social media template', 'editorial calendar download'],
    h1: 'Free Interactive Content Calendar Template',
    downloadTitle: 'Social Media Content Calendar Template'
  },
  {
    slug: 'marketing-calendar-template',
    lang: 'en' as const,
    title: 'Marketing Calendar Template for Teams | Planner Amplifica',
    description: 'Organize campaigns, newsletters, and social media posts with our ready-to-use marketing calendar.',
    keywords: ['marketing calendar template', 'campaign planning template'],
    h1: 'Omnichannel Marketing Calendar Template',
    downloadTitle: 'Marketing Campaign Schedule Template'
  },
  {
    slug: 'editorial-calendar-template',
    lang: 'en' as const,
    title: 'Editorial Calendar Template for Writers & Agencies | Planner Amplifica',
    description: 'Keep your team aligned with our comprehensive publishing and editorial roadmap template.',
    keywords: ['editorial calendar template', 'publishing schedule template'],
    h1: 'Free Editorial Calendar Template',
    downloadTitle: 'Editorial Roadmap Template'
  },
  {
    slug: 'monthly-content-planner',
    lang: 'en' as const,
    title: 'Monthly Content Planner Template | Planner Amplifica',
    description: 'Structure your 30-day content strategy with ease using our monthly planner template.',
    keywords: ['monthly content planner', '30 day social media plan'],
    h1: 'Monthly Social Media Content Planner Template',
    downloadTitle: '30-Day Content Matrix Template'
  }
];

// Blog Posts Sample Data for Full SEO Blog Structure
export const BLOG_POSTS = [
  {
    slug: 'como-criar-um-calendario-editorial-de-sucesso',
    lang: 'pt-BR' as const,
    title: 'Como Criar um Calendário Editorial de Sucesso do Zero em 2026',
    description: 'Guia completo passo a passo para estruturar seu calendário de postagens, economizar 10+ horas por semana e multiplicar seus resultados nas redes sociais.',
    category: 'Calendar',
    author: 'Equipe Planner Amplifica',
    publishedDate: '2026-06-10',
    readTime: '6 min de leitura',
    keywords: ['como criar calendario editorial', 'passo a passo calendario de conteudo', 'dicas de redes sociais'],
    h1: 'Como Criar um Calendário Editorial de Sucesso do Zero',
    summary: 'Aprenda a organizar suas postagens, equilibrar o funil de vendas e manter a consistência em todos os canais digitais sem esgotamento mental.',
    toc: [
      { id: 'o-que-e', title: '1. O que é um Calendário Editorial?' },
      { id: 'beneficios', title: '2. Benefícios da Consistência de Postagens' },
      { id: 'passo-a-passo', title: '3. Passo a Passo para Criar o Seu' },
      { id: 'ia-no-processo', title: '4. Como a Inteligência Artificial Acelera a Produção' }
    ],
    faqs: [
      {
        question: 'Com qual frequência devo publicar nas redes sociais?',
        answer: 'A frequência ideal varia de acordo com o canal. No Instagram, recomenda-se de 3 a 5 Reels por semana e Stories diários. O mais importante é a consistência mantida pelo seu calendário editorial.'
      }
    ],
    content: `
      <h2 id="o-que-e" class="text-xl font-bold text-white mt-6 mb-3">1. O que é um Calendário Editorial?</h2>
      <p class="text-zinc-300 text-sm leading-relaxed mb-4">Um calendário editorial é o mapa estratégico de todo o conteúdo que sua marca ou cliente irá publicar ao longo de semanas ou meses. Ele define datas, formatos, mensagens centrais, responsáveis e o estágio de funil de cada postagem.</p>

      <h2 id="beneficios" class="text-xl font-bold text-white mt-6 mb-3">2. Benefícios da Consistência de Postagens</h2>
      <p class="text-zinc-300 text-sm leading-relaxed mb-4">Postar de forma errática prejudica a entrega dos algoritmos do Instagram, TikTok e YouTube. Ao manter um cronograma estruturado, você constrói autoridade constante, melhora a retenção da audiência e garante que conteúdos de conversão direta sejam veiculados nas datas corretas.</p>

      <h2 id="passo-a-passo" class="text-xl font-bold text-white mt-6 mb-3">3. Passo a Passo para Criar o Seu</h2>
      <ul class="list-disc list-inside text-zinc-300 text-sm space-y-2 mb-4">
        <li><strong>Defina os Pilares do seu Negócio:</strong> Separe seus conteúdos em educação, entretenimento, bastidores e venda direta.</li>
        <li><strong>Mapeie o Funil de Vendas:</strong> Distribua seus posts em TOFU (Atração), MOFU (Nutrição) e BOFU (Conversão).</li>
        <li><strong>Utilize uma Ferramenta Dedicada:</strong> Esqueça planilhas travadas. Utilize o Planner Amplifica para visualizar o calendário, redigir ganchos com IA e aprovar com o cliente.</li>
      </ul>

      <h2 id="ia-no-processo" class="text-xl font-bold text-white mt-6 mb-3">4. Como a Inteligência Artificial Acelera a Produção</h2>
      <p class="text-zinc-300 text-sm leading-relaxed mb-4">Com o uso de IA Generativa no seu fluxo, você pode gerar 10 opções de ganchos em segundos, transformar uma ideia de artigo em roteiro de Reel e otimizar hashtags por canal instantaneamente.</p>
    `
  },
  {
    slug: 'ia-para-redes-sociais-roteiros-e-ganchos',
    lang: 'pt-BR' as const,
    title: 'Como Usar IA para Redes Sociais: Roteiros Virais e Ganchos Magnéticos',
    description: 'Descubra como os melhores criadores estão usando IA para roteirizar vídeos curtos no Instagram e TikTok em segundos.',
    category: 'AI',
    author: 'Equipe Planner Amplifica',
    publishedDate: '2026-06-12',
    readTime: '5 min de leitura',
    keywords: ['ia para redes sociais', 'ganchos virais com ia', 'roteiro de reels com ia'],
    h1: 'Como Usar IA para Redes Sociais: Roteiros Virais e Ganchos Magnéticos',
    summary: 'Aprenda prompts e técnicas para extrair o máximo poder da Inteligência Artificial Generativa na sua criação de mídias sociais.',
    toc: [
      { id: 'anatomia-gancho', title: '1. A Anatomia do Gancho Viral' },
      { id: 'roteirizacao-ia', title: '2. Roteirizando Reels e Shorts com IA' },
      { id: 'ferramenta-ideal', title: '3. A Ferramenta Ideal de Planejamento' }
    ],
    faqs: [
      {
        question: 'A IA substitui a criatividade humana?',
        answer: 'Não. A IA atua como uma copiloto de alta velocidade que sugere ganchos e estruturas. A voz única, o contexto humano e a experiência do criador são insubstituíveis.'
      }
    ],
    content: `
      <h2 id="anatomia-gancho" class="text-xl font-bold text-white mt-6 mb-3">1. A Anatomia do Gancho Viral</h2>
      <p class="text-zinc-300 text-sm leading-relaxed mb-4">Os primeiros 3 segundos de um vídeo decidem se o usuário continuará assistindo ou se passará para o próximo post. Um bom gancho causa curiosidade imediata, quebra de expectativa ou identifica uma dor urgente do espectador.</p>

      <h2 id="roteirizacao-ia" class="text-xl font-bold text-white mt-6 mb-3">2. Roteirizando Reels e Shorts com IA</h2>
      <p class="text-zinc-300 text-sm leading-relaxed mb-4">Ao invés de encarar a página em branco, peça para a IA estruturar seu vídeo em 3 blocos: 1) Gancho Verbal e Visual; 2) Conteúdo Principal em 3 Pontos Diretos; 3) Chamada para Ação Clara (CTA).</p>
    `
  },
  // English Blog Sample
  {
    slug: 'how-to-build-a-winning-content-calendar',
    lang: 'en' as const,
    title: 'How to Build a Winning Content Calendar in 2026 | Guide',
    description: 'Step-by-step masterclass on creating an editorial content calendar that saves time and scales your audience growth.',
    category: 'Calendar',
    author: 'Planner Amplifica Team',
    publishedDate: '2026-06-11',
    readTime: '5 min read',
    keywords: ['how to build a content calendar', 'social media editorial calendar', 'content marketing roadmap'],
    h1: 'How to Build a Winning Content Calendar',
    summary: 'Master your publishing frequency, balance your marketing funnels, and organize your team using modern AI software.',
    toc: [
      { id: 'what-is-it', title: '1. What is a Social Media Content Calendar?' },
      { id: 'key-steps', title: '2. Key Steps to Build Yours' }
    ],
    content: `
      <h2 id="what-is-it" class="text-xl font-bold text-white mt-6 mb-3">1. What is a Social Media Content Calendar?</h2>
      <p class="text-zinc-300 text-sm leading-relaxed mb-4">A content calendar is an actionable schedule mapping out what, when, and where you will publish digital media entries across your channels.</p>
    `
  }
];
