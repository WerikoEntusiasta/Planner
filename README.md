# 🎯 Planner de Conteúdo Multicanal SaaS (Creator Planner)

[English Version Below](#-english-version)

O **Planner de Conteúdo Multicanal** é uma plataforma SaaS premium voltada para criadores de conteúdo, influenciadores e agências de marketing. O sistema permite planejar posts, roteirizar vídeos com inteligência artificial, gerenciar metas de engajamento e gerar links de aprovação rápida para clientes, tudo sob uma identidade visual ultra-moderna em tons de Roxo, Laranja, Preto e Branco.

---

## 🚀 Funcionalidades Principais

*   **Calendário de Postagens Inteligente**: Agendamento visual e prático de postagens segmentadas por plataforma (Instagram, TikTok, YouTube, LinkedIn).
*   **Editor de Posts e Scripts**: Ferramenta dedicada para criar ganchos (*hooks*), roteiros de vídeo e ideias visuais de forma estruturada.
*   **Metas de Crescimento**: Painel para acompanhar objetivos de seguidores, engajamento e publicações por cliente.
*   **Portal de Aprovação do Cliente**: Geração automática de links dinâmicos para que clientes possam aprovar posts ou solicitar ajustes em tempo real sem precisar fazer login.
*   **Central de Suporte ao Criador**: Interface direta para envio de chamados, dúvidas e relatos de bugs para o suporte técnico.
*   **SaaS Owner Control Center**: Painel de administração seguro para monitorar registros de usuários, responder chamados de suporte em tempo real e simular a experiência de qualquer cliente.

---

## 🛠️ Tecnologias Utilizadas

*   **Frontend**: React (v19) + Vite + TypeScript
*   **Estilização**: Tailwind CSS (v4)
*   **Animações**: Motion (`motion/react`)
*   **Gráficos**: Recharts
*   **Ícones**: Lucide React
*   **Containerização**: Docker & Docker Compose

---

## 📦 Como Instalar e Rodar Localmente

### Pré-requisitos
*   [Node.js (v20+)](https://nodejs.org/)
*   [Docker & Docker Compose](https://www.docker.com/) (opcional para rodar em container)

### Método 1: Localmente com Node.js

1.  **Clonar o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/creator-planner-saas.git
    cd creator-planner-saas
    ```

2.  **Instalar dependências:**
    ```bash
    npm install
    ```

3.  **Configurar variáveis de ambiente:**
    Copie o arquivo `.env.example` para `.env` e configure suas variáveis:
    ```bash
    cp .env.example .env
    ```

4.  **Iniciar em modo de desenvolvimento:**
    ```bash
    npm run dev
    ```
    Acesse o app em `http://localhost:3000`.

5.  **Gerar build de produção:**
    ```bash
    npm run build
    ```

---

### Método 2: Usando Docker Compose (Recomendado)

O projeto está totalmente preparado para ser executado de forma simples através do Docker Compose, empacotando o aplicativo com um servidor Nginx de alta performance configurado para Single Page Applications (SPA).

1.  **Configurar o arquivo `.env`:**
    Certifique-se de preencher o arquivo `.env` com base no `.env.example`.

2.  **Subir os serviços:**
    ```bash
    docker-compose up -d --build
    ```

3.  **Acessar a aplicação:**
    A aplicação estará disponível em `http://localhost:3000`.

4.  **Parar a execução:**
    ```bash
    docker-compose down
    ```

---

## 🔄 Integração Contínua (CI/CD) com Docker Hub

O projeto inclui um fluxo automatizado de GitHub Actions configurado para compilar a imagem Docker e enviá-la ao Docker Hub sempre que houver um `push` nas branches `main` ou `master`.

### Como Configurar no GitHub:

1.  Acesse as configurações do seu repositório no GitHub: **Settings > Secrets and variables > Actions**.
2.  Adicione as seguintes **Repository Secrets**:
    *   `DOCKERHUB_USERNAME`: Seu nome de usuário do Docker Hub.
    *   `DOCKERHUB_TOKEN`: Um token de acesso gerado na sua conta do Docker Hub (**Account Settings > Security > Personal Access Tokens**).

O arquivo de workflow está localizado em `.github/workflows/docker-push.yml`.

---

## 🔒 Segurança e Boas Práticas

Para garantir que nenhuma informação de risco ou credencial secreta vá parar no seu repositório do GitHub:
*   O arquivo `.gitignore` está previamente configurado para bloquear qualquer arquivo `.env` ou `.env.*` (exceto `.env.example`).
*   **Nunca** adicione chaves de API reais no código. Sempre utilize as variáveis de ambiente com `import.meta.env.VITE_...`.

---

---

# 🎯 Multichannel Content Planner SaaS (Creator Planner)

## 🚀 Key Features

*   **Smart Content Calendar**: Visual scheduling of post entries customized for Instagram, TikTok, YouTube, and LinkedIn.
*   **Post & Script Editor**: Dedicated tools to craft high-converting hooks, video scripts, and visual concepts.
*   **Client Approval Portal**: One-click approval link generator. Clients can approve content or request edits instantly without needing an account.
*   **Support Ticket Center**: Integrated hub for users to report bugs or file assistance requests.
*   **SaaS Owner Control Center**: Premium administration panel containing system metrics, real-time log telemetry, support ticket resolution, and a **Simulate User** toggle to experience the dashboard as any registered client.

---

## 📦 Running Locally with Docker Compose

1.  **Clone & Configure Environment:**
    ```bash
    git clone https://github.com/your-username/creator-planner-saas.git
    cd creator-planner-saas
    cp .env.example .env
    ```

2.  **Run with Docker Compose:**
    ```bash
    docker-compose up -d --build
    ```
    Access the application at `http://localhost:3000`.

---

## 🔄 CI/CD & Deploy to Docker Hub

This repository features an automated GitHub Actions pipeline under `.github/workflows/docker-push.yml` that builds and deploys production-ready container images directly to Docker Hub. Configure `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets in your repository settings to enable this feature safely.
