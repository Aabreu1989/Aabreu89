# 🔗 MIRA METRIC DATA LINEAGE & ARCHITECTURE
## Linhagem de Dados Ponta a Ponta: Ingestão, Persistência, Gateway e Consumidores

---

## 🏛️ 1. DIAGRAMA ARQUITETURAL DE LINHAGEM

```
[ FRONTEND CLIENT ]
   │
   ├── Ecrã / Interação (Click, View, Query, Install, Doc)
   │
   ├── analyticsService.track(action, userId, category, metadata)
   │      │
   │      ├── Marcação de Metadados: is_admin_activity = boolean
   │      └── Normalização de Categoria & Validação de UUID
   │
   ▼
[ SUPABASE RPC GATEWAY ]
   │
   └── RPC mira_track_event (SECURITY DEFINER)
          │
          └── INSERT INTO public.activity_logs (action, user_id, category, metadata)
                 │
                 ▼
[ POSTGRESQL ENGINE ] ◄────────── [ TABELAS MESTRE ]
   │                                 • public.profiles (1.048)
   │                                 • public.job_posts (17.356 ativas)
   │                                 • public.courses (168)
   │                                 • public.services (127)
   │                                 • public.user_documents
   │
   ▼
[ SERVERLESS AGGREGATION GATEWAY ]
   │
   ├── api/admin.js (Action: sync-status & sync-status-period)
   │      │
   │      ├── Ingestão dos Baselines Imutáveis (lib/telemetryBaselines.js)
   │      ├── Queries de Incremento com Isolamento Safe OR (user_id IS NULL OR NOT IN ADMIN)
   │      └── Execução de consolidatePlatformMetrics(db)
   │
   ▼
[ CONSUMIDORES FINAIS ]
   │
   ├── 1. ADMIN HUB DASHBOARD (src/components/AdminPanel.tsx)
   │      └── Aba Métricas: Valores Canónicos Consolidados
   │      └── Aba Observabilidade: Tráfego Operacional Real-Time (24h/7d/30d)
   │
   ├── 2. RELATÓRIO OFICIAL PDF (src/services/exportService.ts)
   │      └── 4 Páginas Executivas para Candidaturas a Fundos Sociais
   │
   └── 3. EXCEL MULTI-ABA DE AUDITORIA (src/services/exportService.ts)
          └── Dossiê de Dados Abertos para Auditores Externos
```

---

## 🧭 2. MAPEAMENTO POR CAMADA DE PROCESSAMENTO

| Camada | Tecnologia / Ficheiro | Responsabilidade |
| :--- | :--- | :--- |
| **1. Origem / Disparo** | React UI (`App.tsx`, `AssistantView.tsx`, `JobBoard.tsx`) | Captura o ato do utilizador e envia para `analyticsService`. |
| **2. Enriquecimento** | `src/services/analyticsService.ts` | Valida parâmetros, categoriza prompts de IA e anota flags de admin. |
| **3. Ingestão Segura** | PostgreSQL RPC `mira_track_event` | Gravação atómica em `activity_logs` garantindo execução sem falha de RLS. |
| **4. Banco Primário** | PostgreSQL Supabase | Persistência física dos registos estruturados. |
| **5. Consolidação** | `api/admin.js` & `lib/telemetryBaselines.js` | Aplica o modelo aditivo de baselines $+$ eventos elegíveis pós-cutoff. |
| **6. Apresentação** | `AdminPanel.tsx` & `exportService.ts` | Formatação numérica, tipografia e renderização de tabelas e cartões KPI. |

---

## 📊 3. MODELO CONCEITUAL DIMENSIONAL PARA BI

Para total compatibilidade com ferramentas de Business Intelligence e Auditoria (ex.: Power BI, Metabase):

```
                  ┌──────────────────────┐
                  │      DIM_DATE        │
                  ├──────────────────────┤
                  │ date_id (PK)         │
                  │ full_date            │
                  │ year / month / day   │
                  │ is_post_cutoff       │
                  └──────────┬───────────┘
                             │
                             ▼
┌───────────────────┐  ┌───────────────────────────────┐  ┌───────────────────┐
│     DIM_USER      │  │          FACT_EVENTS          │  │     DIM_EVENT     │
├───────────────────┤  ├───────────────────────────────┤  ├───────────────────┤
│ user_id (PK)      │◄─┤ event_id (PK)                 │─►│ action_name (PK)  │
│ profile_name      │  │ user_id (FK)                  │  │ domain_category   │
│ account_status    │  │ date_id (FK)                  │  │ is_canonical      │
│ population_type   │  │ action_name (FK)              │  │ weight_factor     │
│ (Real/Admin/Test) │  │ metadata_json                 │  └───────────────────┘
└───────────────────┘  │ is_eligible_for_impact (bool) │
                       └───────────────────────────────┘
```
