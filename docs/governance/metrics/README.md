# 🏛️ MIRA METRIC GOVERNANCE REGISTRY — V1.0
## Caderno Soberano de Governança de Dados, Linhagem e Auditoria de Métricas

---

## 📌 1. OBJETIVO & ESCOPO INSTITUCIONAL
O **MIRA Metric Governance Registry** constitui a autoridade normativa e documental máxima para a definição, cálculo, reconciliação, auditabilidade e publicação de todos os Indicadores-Chave de Desempenho (KPIs) e Métricas de Impacto Social da plataforma **MIRA Imigrante 🇵🇹**.

Este ecossistema documental foi desenhado para assegurar conformidade estrita perante processos de auditoria externa e elegibilidade a candidaturas a fundos públicos e europeus, nomeadamente:
* **FAMI** (Fundo para o Asilo, a Migração e a Integração)
* **EUSIC** (European Social Innovation Competition)
* **Portugal 2030** (Avisos de Inovação e Coesão Social)
* **PRR** (Plano de Recuperação e Resiliência)
* **IEFP** (Instituto do Emprego e Formação Profissional)

---

## 🔒 2. PRINCÍPIO FUNDAMENTAL DA GOVERNANÇA

> ### 🛑 REGISTRAR $\neq$ CONTABILIZAR $\neq$ MÉTRICA CANÓNICA $\neq$ KPI REPORTADO
> 
> * **1. RAW (Camada de Ingestão):** Todo o evento disparado no ecossistema é persistido para integridade e rastreabilidade bruta.
> * **2. OPERATIONAL (Observabilidade):** Visão em tempo real de diagnósticos e monitoramento operacional (incluindo testes e administração).
> * **3. CANONICAL (Impacto Real):** Universo estatístico estrito de demanda humana real, aplicando regras formais de elegibilidade, filtros de disjunção e deduplicação.
> * **4. REPORTED (Publicação Externa):** Valores consolidados, congelados e certificados para relatórios executivos, PDF oficial e auditoria institucional.

---

## 📂 3. ESTRUTURA DO REGISTO DE GOVERNANÇA

| Ficheiro Normativo | Conteúdo / Finalidade |
| :--- | :--- |
| [`METRIC_REGISTRY.md`](./METRIC_REGISTRY.md) | Catálogo mestre de todos os KPIs com IDs únicos (`MIRA-KPI-xxx`) e metadados. |
| [`METRIC_DEFINITIONS.md`](./METRIC_DEFINITIONS.md) | Fichas técnicas individuais padronizadas e semântica de cada indicador. |
| [`METRIC_FORMULAS.md`](./METRIC_FORMULAS.md) | Fórmulas matemáticas, pesos ponderados e algoritmos de agregação. |
| [`METRIC_DATA_LINEAGE.md`](./METRIC_DATA_LINEAGE.md) | Linhagem de dados completa: Origem $\rightarrow$ Ingestão $\rightarrow$ DB $\rightarrow$ Gateway $\rightarrow$ UI/PDF. |
| [`METRIC_INCLUSIONS_EXCLUSIONS.md`](./METRIC_INCLUSIONS_EXCLUSIONS.md) | Matriz rigorosa de populações (Admin, CEO, Testes, Pré-Auth, Utilizadores Reais). |
| [`METRIC_AUDIT_PROTOCOL.md`](./METRIC_AUDIT_PROTOCOL.md) | Procedimentos passo a passo para auditores externos reproduzirem as métricas. |
| [`METRIC_CHANGE_CONTROL.md`](./METRIC_CHANGE_CONTROL.md) | Política mandatória de controlo de versão e proibição de alterações silenciosas. |
| [`METRIC_HISTORY.md`](./METRIC_HISTORY.md) | Reconstituição histórica commit por commit da evolução dos dados. |
| [`METRIC_RECONCILIATION.md`](./METRIC_RECONCILIATION.md) | Matriz de reconciliação entre Raw, Operational, Canonical e Reported. |
| [`METRIC_TEST_CASES.md`](./METRIC_TEST_CASES.md) | Casos de teste automatizados de integridade e disjunção estatística. |
| [`METRIC_CHANGELOG.md`](./METRIC_CHANGELOG.md) | Registo de versões e histórico de revisões deste caderno normativo. |

---

## 🛡️ 4. POLÍTICA DE PROTEÇÃO DESTE ARTEFATO
Este diretório é um **Artefato Protegido de Governança**. 
Nenhum desenvolvedor, rotina de CI/CD ou agente de IA tem autorização para modificar silenciosamente qualquer fórmula, query ou baseline aqui contido. Toda e qualquer alteração requer aprovação formal via processo de Controlo de Mudança ([`METRIC_CHANGE_CONTROL.md`](./METRIC_CHANGE_CONTROL.md)).
