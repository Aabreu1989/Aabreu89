# 🏛️ MIRA METRIC SOURCES & EVIDENCE REPOSITORY
## Mapeamento de Fontes de Dados Primárias, Secundárias e Autoridades Normativas

---

## 📌 1. FONTES DE DADOS E TABELAS POSTGRESQL

| Código da Fonte | Tabela / Objeto | Tipo de Fonte | Nível de Acesso | Responsabilidade |
| :--- | :--- | :--- | :--- | :--- |
| **`SRC-DB-PROFILES`** | `public.profiles` | PostgreSQL Table | RLS / Service Role | Registo de utilizadores, avatares, roles e emails. |
| **`SRC-DB-ACTIVITY`** | `public.activity_logs` | PostgreSQL Table | Service Role (RPC) | Stream persistente de telemetria e ações de utilizadores. |
| **`SRC-DB-JOBS`** | `public.job_posts` | PostgreSQL Table | RLS (Public Read) | Vagas de emprego públicas agregadas de 117 portais. |
| **`SRC-DB-COURSES`** | `public.courses` | PostgreSQL Table | RLS (Public Read) | Cursos certificados oficiais (DGES 131 + IEFP 37). |
| **`SRC-DB-SERVICES`** | `public.services` | PostgreSQL Table | RLS (Public Read) | Balcões públicos CNAIM/CLAIM e Associações mapeadas. |
| **`SRC-DB-DOCS`** | `public.user_documents` | PostgreSQL Table | RLS (Owner) | Minutas e documentos jurídicos gerados por utilizadores. |
| **`SRC-DB-VOTES`** | `public.post_votes` | PostgreSQL Table | RLS (Auth) | Validações comunitárias de fact-checking e likes. |
| **`SRC-RPC-TRACK`** | `mira_track_event` | PostgreSQL Function | SECURITY DEFINER | Função RPC atómica para gravação de telemetria sem bypass RLS. |

---

## 🔒 2. AUTORIDADES NORMATIVAS E ARQUIVOS DE CONFIGURAÇÃO

| Código da Fonte | Ficheiro de Código | Papel no Sistema | Consumidores |
| :--- | :--- | :--- | :--- |
| **`SRC-CODE-BASELINES-BE`** | `lib/telemetryBaselines.js` | Autoridade de Baselines no Gateway | Serverless `/api/admin` |
| **`SRC-CODE-BASELINES-FE`** | `src/config/telemetryBaselines.ts` | Espelho de Baselines no Frontend | Fallbacks em `adminService.ts` |
| **`SRC-CODE-ADMIN-UTILS`** | `src/utils/adminUtils.ts` | Identidades Administrativas (`ADMIN_USER_IDS`) | `analyticsService.ts`, `adminService.ts` |
| **`SRC-CODE-GATEWAY`** | `api/admin.js` | Gateway de Agregação e API | Admin Hub, Dashboard |
| **`SRC-CODE-PDF-EXCEL`** | `src/services/exportService.ts` | Motor de Renderização de Relatórios | PDF 4 Páginas, Excel de Auditoria |
| **`SRC-DOC-MEMORIA`** | `MEMORIA.md` | Registo de Memória e Normas do Sistema | Equipa de Engenharia e Agentes |
| **`SRC-DOC-GOVERNANCE`** | `docs/governance/metrics/` | Caderno Canónico de Governança | Auditores Externos e Financiadores |
