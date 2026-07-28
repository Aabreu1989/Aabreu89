# MIRA Deployment Guide (V2026.FINAL)

O MIRA é construído sobre uma infraestrutura moderna e escalável, utilizando **Next.js**, **Supabase** e **Gemini AI**. Este documento descreve os passos para configurar o ambiente de desenvolvimento e realizar o deploy em produção.

## 🛠️ Requisitos Prévios

- **Node.js**: v18.0 ou superior.
- **Supabase CLI**: Para gerir Edge Functions e Migrações.
- **Conta Vercel**: Para o frontend.
- **Google AI Studio Key**: Para o motor Gemini.

---

## 💻 Ambiente de Desenvolvimento (Local)

### 1. Clonar e Instalar
```bash
git clone https://github.com/Aabreu89/Mira.git
cd mira
npm install
```

### 2. Variáveis de Ambiente (.env)
Crie um arquivo `.env.local` na raiz com:
```env
NEXT_PUBLIC_SUPABASE_URL=seu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
GEMINI_API_KEY=sua_google_ai_key
RESEND_API_KEY=sua_resend_key
```

### 3. Executar o Servidor
```bash
npm run dev
```
O frontend estará em `http://localhost:3000`.

---

## 🚀 Produção

### 🌍 Frontend (Vercel)
1. Conecte o repositório GitHub à Vercel.
2. Adicione as mesmas variáveis de ambiente acima.
3. A Vercel detetará automaticamente as configurações de Next.js e fará o deploy.

### 🧠 Backend & Edge Functions (Supabase)
As funções de IA residem em `supabase/functions/gemini-assistant`.

**Deploy das Funções:**
```bash
supabase functions deploy gemini-assistant --project-ref seu_projeto_id
```

**Segredos (Secrets):**
Certifique-se de que os segredos estão configurados no Supabase:
```bash
supabase secrets set GEMINI_API_KEY=sua_chave
```

---

## 🔒 Segurança e Privacidade (RGPD)
- **Criptografia**: Todos os dados em trânsito usam SSL/TLS.
- **Anonimização**: As consultas ao chat são anonimizadas antes de serem enviadas ao Gemini.
- **Políticas RLS**: O banco de dados Supabase utiliza Row Level Security para garantir que utilizadores só acedam aos seus próprios dados.

---
*Documentação oficial mantida pela Administração MIRA.*
