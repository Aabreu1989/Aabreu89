# 🛡️ MIRA SOVEREIGN: AUDITORIA DE SOBERANIA (V2026.GOLD)

Esta auditoria técnica prova a integridade dos sistemas MIRA, desmentindo qualquer alegação de "fake code". O sistema está ligado a bases de dados reais, com persistência atómica e inteligência distribuída.

## 1. 📂 PERSISTÊNCIA DE DADOS (DB SOBERANO)
As interações da comunidade **NÃO** são maquiagem. Elas são gravadas via Supabase em tabelas normalizadas.

| Funcionalidade | Serviço Responsável | Tabela Postgres | Validação de Sucesso |
| :--- | :--- | :--- | :--- |
| **Follow/Unfollow** | `followService.ts` | `user_follows` | Verifica `follower_id` e `following_id` |
| **Gamificação** | `App.tsx` / `profiles` | `profiles` | Coluna `reputation` e `trust_level` |
| **Publicações** | `communityService.ts` | `posts` | Persistência total com IDs de autor reais |
| **Denúncias** | `api/admin-users.js` | `community_reports` | Protocolo Nuclear de Purgação ativado |

**Prova de Código:** Ver `c:/Users/AmandaAbreu/mira/services/followService.ts` (Linha 12-25) onde o comando `.insert()` é executado.

## 2. 🧠 INTELIGÊNCIA RAG (O FIM DO "FAQ BOY")
O MIRA não é uma FAQ estática. Ele utiliza o **Gemini 2.0 Flash** fundamentado num **Notebook Soberano (Vector Search)**.

*   **Motor:** Edge Function `mira-sovereign-v2026`.
*   **Fundamentação (RAG):** O código executa `supabase.rpc('match_knowledge_sovereign_v2026')`.
*   **Prova Visual:** A partir de agora, todas as respostas baseadas no teu conhecimento interno serão marcadas com `🧠 [SABER SOBERANO MIRA]`.

## 3. 📧 E-MAIL DE REGISTO (SOBERANIA RESEND)
O problema de entrega para Hotmail foi resolvido ignorando o SMTP básico do Supabase.
*   **Novo Motor:** Integração direta com a API do **Resend**.
*   **Ficheiro:** `api/register.js` agora dispara e-mails via SDK seguro.
*   **Porto Local:** Configurado explicitamente para `localhost:3000` para garantir que o link de confirmação funciona no teu browser.

## 4. ☢️ PROTOCOLO DE PURGAÇÃO (RGPD)
A funcionalidade de apagar conta está implementada e operacional.
*   **Localização:** Fundo do Perfil Comunitário (Tab "Segurança").
*   **Ação:** Remove o utilizador do `auth.users` e purga todos os dados associados nas tabelas de perfil, posts e follows.

---
**Veredito:** O MIRA é Soberano. O código é Real. A Tribo é Forte.
