# MIRA Troubleshooting Guide (V2026.FINAL)

Guia de resolução de problemas comuns na plataforma MIRA.

## 🔴 Problemas de Login / Registo

### 1. Não recebi o email de confirmação
- **Causa**: O serviço Resend pode estar sob alta carga ou o email foi para o Spam.
- **Solução**: Verifique a pasta de Spam/Lixo Eletrónico. Se não chegar em 5 minutos, tente recuperar a palavra-passe para forçar um novo envio.

### 2. Erro "Daily Quota" ou "Limite de Tentativas"
- **Causa**: Demasiadas tentativas de login falhadas de um mesmo IP.
- **Solução**: Aguarde 15 a 30 minutos antes de tentar novamente.

---

## 🧠 Erros no Chat MIRA

### 1. Aparece "ASSISTANT_WELCOME" em vez da mensagem
- **Causa**: Atraso na tradução ou falha no carregamento do ficheiro de idiomas.
- **Solução**: Limpe a conversa no botão "APAGAR" (ícone do lixo) no cabeçalho do chat.

### 2. O MIRA não responde ("Oscilação na rede")
- **Causa**: O motor Gemini AI pode estar temporariamente offline ou houve um timeout da Edge Function.
### 3. Erro "MIRA ENGINE FAILURE"
- **Causa**: Falha crítica na API do Google ou erro de autenticação interno (Código 503/429/500).
- **Solução**: Verifique se a sua ligação à internet está ativa. Este erro é reportado automaticamente à equipa técnica. Aguarde 2 minutos e tente novamente.

---

## 📸 Comunidade e Conteúdo

### 1. A foto do meu post aparece quebrada
- **Causa**: URL da imagem do Unsplash expirou ou houve falha no upload.
- **Solução**: Edite o seu post e escolha um novo visual entre os temas disponíveis.

### 2. O botão de "Guardar" não funciona
- **Causa**: Falha de sincronização offline.
- **Solução**: Verifique se o ícone de sincronização no rodapé parou de girar. Atualize a página e tente novamente.

---

## 🛠️ Suporte Técnico
Se o problema persistir, contacte a equipa técnica em `no-reply@miraimigrante.pt` informando o seu nome de utilizador e uma descrição do erro.
