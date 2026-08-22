# 📱 Guia do Aplicativo Android (Geração de APK Automático via GitHub)

Este projeto está configurado com um pipeline de **CI/CD no GitHub Actions** que compila e gera automaticamente o arquivo **APK Android** sempre que você fizer um `git push` para o GitHub.

---

## 🚀 Como funciona o fluxo automático

1. **Subir o código para o GitHub:**
   ```bash
   git add .
   git commit -m "feat: atualizações e geração do app android"
   git push origin main
   ```

2. **Geração Automática do APK:**
   - O GitHub Actions executará o workflow `.github/workflows/build-android-apk.yml`.
   - Ele compila o frontend e o backend, inicializa o projeto Android com **Capacitor + Gradle** e gera o arquivo `app-debug.apk`.

3. **Como Baixar o APK no Celular:**
   - **Opção A (Releases):** Acesse a aba **Releases** no seu repositório do GitHub e baixe o `app-debug.apk` pronto.
   - **Opção B (Actions Artifacts):** Vá na aba **Actions** > selecione o último workflow concluído > baixe o artefato `Planner-Studio-Android-APK`.

---

## 🔄 Sincronização em Tempo Real com o Banco de Dados

O aplicativo Android conecta-se diretamente aos mesmos endpoints de API (`/api/...`) e banco de dados SQLite/servidor da versão web. 
- Criativos enviados, aprovados ou alterados no desktop aparecem instantaneamente no aplicativo no celular.
- Aprovações ou observações feitas no celular sincronizam imediatamente na versão web.
