# 📋 MIRA METRIC REGISTRY — MASTER CATALOGUE (V1.4 SOBERANA)
## Catálogo Canónico de Indicadores, Identificadores Globais e Hierarquia de Agregação

---

## 🏛️ 1. HIERARQUIA ARQUITETURAL: INDICADOR MESTRE vs SUBINDICADORES ESPECÍFICOS

```
                         MIRA-KPI-010
                 NAVEGAÇÕES & INTERAÇÕES
          (TOTAL AGREGADO DE UTILIZAÇÃO HUMANA)
                         │
       ┌─────────────────┼──────────────────┐
       │                 │                  │
       ▼                 ▼                  ▼
   KPI-011            KPI-002            KPI-012
 (Acessos App)    (Consultas IA)     (Simulações)
       │                 │                  │
       └─────────────────┼──────────────────┘
                         │
                       KPI-013
                   (Minutas & Docs)
                         │
                       KPI-009
                    (Eventos PWA)
                         │
       + Todas as demais interações funcionais elegíveis
       (vagas, balcões, cursos, artigos, Europass, comunidade)
```

### Regra Soberana de Contagem:
* Cada ato funcional humano é contabilizado **1 vez no `MIRA-KPI-010`** (como utilização agregada da plataforma).
* O mesmo ato pode simultaneamente alimentar o seu **subindicador analítico específico** (`KPI-002`, `KPI-011`, `KPI-012`, `KPI-013`, `KPI-009`).
* **O `KPI-010` é calculado diretamente sobre a tabela `activity_logs`** (filtrando a população humana externa) e **NUNCA pela soma dos sub-KPIs**, garantindo que nenhum evento seja duplicado no agregado.

---

## 📊 2. CATÁLOGO MESTRE DE KPIS (METRIC INDEX)

| METRIC_ID | Nome Oficial | Papel na Hierarquia | Frequência de Refresh | Fonte Primária | Valor Canónico Homologado |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **`MIRA-KPI-001`** | Utilizadores Registados no Ecossistema | População Global | Síncrono | `public.profiles` | **1.048 perfis** |
| **`MIRA-KPI-002`** | Consultas MIRA Chat (Demanda Humana) | Subindicador IA | Quase Real-Time | Baseline + `activity_logs` | **18.690 consultas** |
| **`MIRA-KPI-003`** | Telemetria de Sistema IA (Probes) | Operacional / Infra | Periódico | `public.activity_logs` | **2.062 probes** |
| **`MIRA-KPI-004`** | Total de Infraestrutura IA | Derivado por Soma | Síncrono (`002 + 003`) | Derivada | **20.752 eventos** |
| **`MIRA-KPI-005`** | Vagas de Emprego Públicas Ativas | Subindicador Emprego | Síncrono | `public.job_posts` | **17.356 vagas** |
| **`MIRA-KPI-006`** | Portais de Emprego Mapeados | Catálogo de Fontes | Estático Curado | `JOB_SOURCES_DATABASE` | **117 portais** |
| **`MIRA-KPI-007`** | Cursos de Formação Reconhecidos | Subindicador Educação | Síncrono | `public.courses` | **168 cursos** |
| **`MIRA-KPI-008`** | Balcões Públicos & Associações | Subindicador Apoio | Síncrono | `public.services` | **127 locais** |
| **`MIRA-KPI-009`** | Eventos de Instalação PWA (Elegíveis) | Subindicador Mobile | Síncrono | `public.activity_logs` | **45 eventos** |
| **`MIRA-KPI-010`** | **Navegações & Interações Globais** | **INDICADOR MESTRE AGREGADO** | Síncrono | Baseline + `activity_logs` | **$\ge$ 51.561 interações (Lower Bound)** |
| **`MIRA-KPI-011`** | Acessos e Sessões à Plataforma | Subindicador Tráfego | Síncrono | Baseline + `activity_logs` | **4.291 acessos** |
| **`MIRA-KPI-012`** | Simulações Financeiras Realizadas | Subindicador Finanças | Síncrono | Baseline + `activity_logs` | **4.875 simulações** |
| **`MIRA-KPI-013`** | Minutas Jurídicas Descarregadas | Subindicador Jurídico | Síncrono | Baseline + `user_documents` | **3.454 downloads** |
| **`MIRA-KPI-014`** | Apoios Burocráticos Prestados | Derivado Ponderado | Síncrono (`013 + 012`) | Derivada | **8.329 apoios** |
| **`MIRA-KPI-015`** | Horas Burocráticas Poupadas | Modelo Econométrico | Síncrono (`013, 012, 002`) | Derivada | **32.201 horas** |
| **`MIRA-KPI-016`** | Taxa de Retenção Recorrente | Fidelização | Síncrono (Opção C) | `832 / 1.048` | **79,4% (ou 79%)** |
