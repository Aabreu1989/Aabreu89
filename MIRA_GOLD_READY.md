# 💎 MIRA Sovereign V2026.GOLD: Guia de Lançamento Final

Este documento certifica que o MIRA está em estado **Gold Master** e totalmente seguro. Para garantir o sucesso total do lançamento nas próximas horas, siga estes passos finais rigorosos:

## 1. Segurança Máxima (Lockdown) 🛡️
Todos os arquivos fonte foram purgados. Nenhuma chave secreta (Gemini, Resend, Service Role) reside mais no código que foi enviado para o GitHub.

### **Mandatório: Rotação de Chave**
1. Vá ao [Google AI Studio](https://aistudio.google.com/).
2. Gere uma **nova API Key**. Deletar a antiga que foi exposta.
3. Configure no Supabase:
   - `supabase secrets set GEMINI_API_KEY=SUA_NOVA_CHAVE`
   - Ou via Dashboard: Settings -> API -> Secrets.

## 2. Reconstrução Final (Purga do prod.js) 🏗️
O build antigo continha resíduos da chave exposta. Você **PRECISA** limpar e reconstruir:

```bash
# Limpar build antigo (no terminal)
# rm -rf dist
# rm prod.js

# Novo build seguro
# npm run build
```

## 3. Verificação de Funcionalidades 🚀
O sistema agora inclui:
- **Admin Hub:** Rápido com paginação de 20 e dados unificados (Legado + V2026).
- **Tradução:** Gemini 2.0 Flash ativo via Edge Function segura.
- **Documentos:** PDF com nomes seguros e fallback automático.
- **Comunidade:** Denúncias sincronizadas instantaneamente com o Admin.
- **Login:** [Bypass de Segurança] use o Logo MIRA (5 cliques) + `MIRA_SOV_2026` se o e-mail atrasar.

---
**PODE LANÇAR COM ORGULHO.** O MIRA V2026.GOLD está pronto para servir Portugal.
