# 👥 MIRA POPULATION MODEL & INCLUSION/EXCLUSION RULES
## Matriz de Segregação de Populações e Tratamento de Identidades

---

## 🏛️ 1. MATRIZ FORMAL DE POPULAÇÕES

| Categoria Populacional | Definição Técnica | Total Perfis | Ingestão (`activity_logs`) | Métricas Canónicas (Impacto) | Observabilidade (Admin Hub) | Relatório PDF / Excel |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **A. Utilizador Real Autenticado** | Utilizador com conta criada via email/Google, sem privilégios administrativos. | **1.040** | ✅ Registado | ✅ **INCLUÍDO** | ✅ **INCLUÍDO** | ✅ **INCLUÍDO** |
| **B. Utilizador Pré-Autenticação (`NULL`)** | Cidadão a interagir com a aplicação antes do login (abertura, PWA, navegação). | N/A | ✅ Registado (`p_user_id = null`) | ✅ **INCLUÍDO (quando elegível)** | ✅ **INCLUÍDO** | ✅ **INCLUÍDO** |
| **C. Administradores & CEO** | 8 contas listadas em `ADMIN_USER_IDS` e `ADMIN_EMAILS`. | **8** | ✅ Registado (marcado `is_admin_activity: true`) | ❌ **EXCLUÍDO** | ✅ **INCLUÍDO (em tempo real)** | ❌ **EXCLUÍDO** |
| **D. Benchmarks & Probes de Sistema** | Testes de carga automatizados com `guest_id: 'system'` ou `is_benchmark: true`. | N/A | ✅ Registado (`action = 'system_benchmark'`) | ❌ **EXCLUÍDO** | ✅ **INCLUÍDO (diagnóstico)** | ❌ **EXCLUÍDO** (Exceto contagem de infraestrutura) |

---

## 🔒 2. A REGRA SOBERANA DE CONTAGEM DE UTILIZADORES
* **Regra:** O indicador **Total de Utilizadores Registados (`MIRA-KPI-001`)** mede a população global do ecossistema e corresponde estritamente a:
  $$\text{Total Utilizadores} = \text{Utilizadores Reais } (1.040) + \text{Administradores / CEO } (8) = \mathbf{1.048}$$
* **Invariante:** É expressamente proibido subtrair Administradores da contagem de perfis da tabela `public.profiles`.

---

## 🛡️ 3. A REGRA DE TRATAMENTO DE `user_id IS NULL`
* **Semântica:** `user_id IS NULL` **NÃO** significa "visitante anónimo externo à plataforma", mas sim uma ação disparada por um utilizador em momento em que a sessão ainda não está associada ao payload (ex.: instalação da PWA antes de login, abertura de ecrã inicial).
* **Armadilha SQL Superada:** No PostgreSQL, a cláusula `WHERE user_id NOT IN ('admin-1', 'admin-2')` retorna `NULL` (falsy) quando `user_id IS NULL`, descartando indevidamente esses registos legítimos.
* **Cláusula Padrão Obrigatória em Todo o Código:**
  ```sql
  WHERE (user_id IS NULL OR user_id NOT IN (ADMIN_USER_IDS))
  ```

---

## 📋 4. LISTA IMUTÁVEL DE IDENTIDADES ADMINISTRATIVAS (`ADMIN_USER_IDS`)

Os 8 UUIDs fixados para segregação de tráfego interno são:
1. `00000000-0000-0000-0000-000000000001` (System Root)
2. `775fb10a-78cd-4753-938d-dea75fddd77a` (Admin Secundário)
3. `bc16353e-67ae-4ff5-a6aa-bc4d8f62af08` (Admin Suporte)
4. `dea69de1-0ed4-44dc-9699-0544e6f39ed8` (Admin Operações)
5. `99b0f5c9-dc81-453b-a60d-e63b6c591ee3` (Admin Homologação)
6. `8efd79c9-b4f1-4ae2-adbd-3c192b309642` (Admin Conteúdo)
7. `0d648290-0cda-4684-a32e-7f8de68e87af` (Admin Auditoria)
8. `70b7679d-b809-48df-b7c7-bf0906e4caf5` (CEO / Administração Principal)
