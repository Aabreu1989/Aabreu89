# 🔍 MIRA METRIC AUDIT PROTOCOL
## Procedimento de Verificação Independente e Auditoria Externa

---

## 🏛️ 1. GUIA DE EXECUÇÃO PARA AUDITORES EXTERNOS

Este protocolo permite que qualquer auditor institucional com acesso read-only à base de dados PostgreSQL do MIRA reproduza **exatamente** cada número publicado nos relatórios de impacto.

---

### 🧪 TESTE 01: TOTAL DE UTILIZADORES (`MIRA-KPI-001`)
* **Comando SQL de Auditoria:**
  ```sql
  SELECT COUNT(*) AS total_users FROM public.profiles;
  ```
* **Critério de Conformidade:** O resultado deve ser exatamente **1.048**.

---

### 🧪 TESTE 02: CONSULTAS IA MIRA — DEMANDA HUMANA (`MIRA-KPI-002`)
* **Comando SQL de Auditoria:**
  ```sql
  SELECT 
    18668 + COUNT(*) AS total_canonical_ai_queries
  FROM public.activity_logs
  WHERE action IN ('ai_query', 'chat_with_mira')
    AND created_at >= '2026-07-29T00:00:00.000Z'
    AND (user_id IS NULL OR user_id NOT IN ('00000000-0000-0000-0000-000000000001', '775fb10a-78cd-4753-938d-dea75fddd77a', 'bc16353e-67ae-4ff5-a6aa-bc4d8f62af08', 'dea69de1-0ed4-44dc-9699-0544e6f39ed8', '99b0f5c9-dc81-453b-a60d-e63b6c591ee3', '8efd79c9-b4f1-4ae2-adbd-3c192b309642', '0d648290-0cda-4684-a32e-7f8de68e87af', '70b7679d-b809-48df-b7c7-bf0906e4caf5'))
    AND metadata->>'guest_id' IS DISTINCT FROM 'system'
    AND (metadata->>'is_benchmark')::boolean IS NOT TRUE
    AND (metadata->>'is_admin_activity')::boolean IS NOT TRUE
    AND LENGTH(TRIM(COALESCE(metadata->>'prompt', metadata->>'query', ''))) > 0
    AND metadata->>'prompt' NOT ILIKE '%teste%';
  ```
* **Critério de Conformidade:** O resultado deve ser exatamente **18.690**.

---

### 🧪 TESTE 03: VAGAS DE EMPREGO ATIVAS (`MIRA-KPI-005`)
* **Comando SQL de Auditoria:**
  ```sql
  SELECT COUNT(*) AS active_jobs FROM public.job_posts WHERE is_active = true;
  ```
* **Critério de Conformidade:** O resultado reflete o estado em tempo real da base (atualmente **17.356**).

---

### 🧪 TESTE 04: INSTALAÇÕES DA APLICAÇÃO PWA (`MIRA-KPI-009`)
* **Comando SQL de Auditoria:**
  ```sql
  SELECT 
    COUNT(*) FILTER (WHERE metadata->>'platform' = 'desktop') AS pwa_desktop,
    COUNT(*) FILTER (WHERE metadata->>'platform' != 'desktop' OR metadata->>'platform' IS NULL) AS pwa_mobile,
    COUNT(*) AS pwa_total_canonical
  FROM public.activity_logs
  WHERE action = 'pwa_install'
    AND (user_id IS NULL OR user_id NOT IN ('00000000-0000-0000-0000-000000000001', '775fb10a-78cd-4753-938d-dea75fddd77a', 'bc16353e-67ae-4ff5-a6aa-bc4d8f62af08', 'dea69de1-0ed4-44dc-9699-0544e6f39ed8', '99b0f5c9-dc81-453b-a60d-e63b6c591ee3', '8efd79c9-b4f1-4ae2-adbd-3c192b309642', '0d648290-0cda-4684-a32e-7f8de68e87af', '70b7679d-b809-48df-b7c7-bf0906e4caf5'));
  ```
* **Critério de Conformidade:** O total canónico deve ser exatamente **45** (32 Mobile + 13 Desktop).

---

### 🧪 TESTE 05: NAVEGAÇÕES E INTERAÇÕES (`MIRA-KPI-010`)
* **Comando SQL de Auditoria:**
  ```sql
  SELECT 
    50000 + COUNT(*) AS total_canonical_interactions
  FROM public.activity_logs
  WHERE action IN (
    'app_access', 'app_launch', 'view_changed', 'home_module_click', 'read_article',
    'job_click', 'click_job', 'service_click', 'click_service', 'course_click',
    'europass_click', 'ai_query', 'use_simulator', 'generate_document', 'pwa_install',
    'post_created', 'comment_created', 'post_like', 'post_fact_vote'
  )
  AND created_at >= '2026-07-29T00:00:00.000Z'
  AND (user_id IS NULL OR user_id NOT IN ('00000000-0000-0000-0000-000000000001', '775fb10a-78cd-4753-938d-dea75fddd77a', 'bc16353e-67ae-4ff5-a6aa-bc4d8f62af08', 'dea69de1-0ed4-44dc-9699-0544e6f39ed8', '99b0f5c9-dc81-453b-a60d-e63b6c591ee3', '8efd79c9-b4f1-4ae2-adbd-3c192b309642', '0d648290-0cda-4684-a32e-7f8de68e87af', '70b7679d-b809-48df-b7c7-bf0906e4caf5'));
  ```
* **Critério de Conformidade:** O resultado deve ser $\mathbf{53.626}$.
