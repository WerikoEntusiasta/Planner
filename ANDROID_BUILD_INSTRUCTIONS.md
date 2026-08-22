# 📱 Build Automatizado de APK Android via GitHub Actions

Este repositório está configurado para gerar automaticamente o arquivo **APK Android** sempre que você fizer um `git push` para o GitHub (`main` ou `master`) ou acionar manualmente na aba **Actions**.

---

## 🚀 Como funciona o fluxo:

1. **Suba suas alterações para o GitHub:**
   ```bash
   git add .
   git commit -m "Nova versão com APK automático"
   git push origin main
   ```

2. **O GitHub Actions é disparado automaticamente:**
   - Ele baixa o repositório.
   - Instala as dependências e compila o frontend React + Tailwind + Vite.
   - Inicializa a camada Android com Capacitor.
   - Configura as permissões de Internet e tráfego de rede no `AndroidManifest.xml`.
   - Executa o Gradle e compila o binário **`app-debug.apk`**.

3. **Onde baixar o APK gerado:**
   - Acesse seu repositório no GitHub.
   - Clique na aba **Actions** (no topo).
   - Clique no workflow mais recente: **`Build Android APK`**.
   - No final da página (seção **Artifacts**), faça o download do arquivo **`creator-planner-debug-apk`**.
   - Descompacte o `.zip` e instale o arquivo `.apk` no seu celular Android!

---

## 🔄 Sincronização com o Banco de Dados (Web ⟷ Android):

- O aplicativo Android consome diretamente os mesmos endpoints da API backend em produção.
- Todas as aprovações, edições de carrosséis, status de postagens e observações de clientes criadas pelo app no celular são sincronizadas em tempo real com a versão Web Desktop.
