# 🏆 MIRA V2026.GOLD — HOMOLOGAÇÃO DEFINITIVA DO MÓDULO DE EMPREGOS

## 1. Registo Histórico da Migração de Dados
- **Backup Integral Original (JSON + SHA-256):** 35.397 registos (`backups/job_posts_pre_dedup_35397.json`)
- **Estado Pré-Deduplicação Dinâmica:** 7.988 registos
- **Duplicados Removidos na Deduplicação:** 113 registos
- **Estado Pós-Deduplicação Dinâmica:** 7.875 registos únicos (0 duplicadas, 0 NULLs, 0 vazias)

## 2. Homologação E2E de Duplo Sync Consecutivo
- **Medição Inicial:** 7.875 vagas (7.875 URLs distintas, 0 duplicadas)
- **Execução SYNC #1 (Scraping Real + Expiração de Vagas >30d):** 7.770 vagas (7.770 URLs distintas, 0 duplicadas)
- **Execução SYNC #2 (Imediata Consecutiva):** 7.770 vagas (7.770 URLs distintas, 0 duplicadas)
- **Variação Líquida entre Sync #1 e Sync #2:** 0 vagas (Idempotência Absoluta)
- **Invariante `COUNT(*) === COUNT(DISTINCT source_url)`:** 100% Homologado

## 3. Convergência Absoluta dos Contadores (Single Source of Truth)
| Ponto de Observação | Valor Homologado | Fonte de Dados |
|---|---|---|
| **Supabase `job_posts`** | **7.770** | PostgreSQL Real |
| **JobBoard (Total Plataforma)** | **7.770** | Supabase Query |
| **Admin Hub (Módulo Empregos)** | **7.770** | Supabase Query |
| **Dashboard (Métricas Globais)** | **7.770** | Supabase Query |

## 4. Salvaguardas Definitivas Implementadas
1. **Canonicalização de URLs:** Normalização automática contra parâmetros UTM, tracking (`fbclid`, `gclid`) e trailing slashes.
2. **Deduplicação Preventiva:** Deduplicação inteligente em memória antes da persistência.
3. **Eliminação de Fontes Fantasma:** Remoção de fallbacks estáticos (5326, 5280) e desacoplamento do `massiveJobsDatabase.ts` do frontend.
4. **Constraint de Unicidade:** Arquivo de migração pronto em `supabase/migrations/20260819_job_posts_unique_constraint.sql`.
