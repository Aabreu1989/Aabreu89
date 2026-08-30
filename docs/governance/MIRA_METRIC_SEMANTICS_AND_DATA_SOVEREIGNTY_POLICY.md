# 🏛️ POLÍTICA SOBERANA MIRA: RIGOR SEMÂNTICO DE MÉTRICAS, PROVA TRANSACIONAL E CONFORMIDADE RGPD

**Código do Documento:** `MIRA-GOV-POL-006`  
**Data de Homologação:** 29 de Agosto de 2026  
**Âmbito:** Transversal a todas as métricas, contadores, perfis de utilizador, gamificação, dados de telemetria, RGPD e relatórios do ecossistema MIRA.

---

## 🎯 1. Princípio Fundamental da Semântica de Dados

> **Regra de Ouro (MIRA-GOV-POL-006):**  
> **"A existência de um registo não determina, por si só, o significado desse registo."**  
> Nenhuma afirmação de "conformidade RGPD total", "eliminação completa", "conta ativa" ou "utilizador impactado" pode ser inferida apenas pela existência de uma função de UI ou de um registo numa tabela. Toda e qualquer métrica deve ser sustentada por uma definição formal, query/fluxo verificável e evidência em todos os sistemas persistentes relevantes.

---

## ⛓️ 2. Linhagem Semântica Universal para Qualquer Métrica

Todo e qualquer KPI gerado no MIRA deve obedecer obrigatoriamente à seguinte cadência de 7 passos:

$$\text{Nome da Métrica} \longrightarrow \text{Definição Formal} \longrightarrow \text{Universo de Abrangência} \longrightarrow \text{Fonte Soberana} \longrightarrow \text{Query/Fluxo Verificável} \longrightarrow \text{Resultado Numérico} \longrightarrow \text{Interpretação Permitida}$$

---

## 📋 3. Dicionário Canónico de Semântica de Dados

Fica formalmente fixada a semântica canónica dos seguintes universos e indicadores:

| Indicador | Valor / Volume | Fonte Soberana | Query / Filtro Canónico | Interpretação Permitida | Interpretações Proibidas |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Perfis Registados** | `1.057` | `public.profiles` | `SELECT COUNT(*) FROM profiles;` | Total de contas criadas na plataforma (1.048 baseline + 9 novos perfis). | ❌ "Contas ativas", ❌ "Utilizadores diários", ❌ "Votos". |
| **Concessões de Selos** | `243` | `public.user_badges` | `SELECT COUNT(*) FROM user_badges;` | Total de medalhas atribuídas a perfis (1 utilizador pode ter vários selos). | ❌ "243 utilizadores impactados", ❌ "243 pessoas distinguidas". |
| **Conexões do Grafo** | `12` | `public.user_follows` | `SELECT COUNT(*) FROM user_follows;` | Total de relações direcionadas de seguimento entre utilizadores. | ❌ "12 utilizadores", ❌ "12 amigos". |
| **Documentos Oficiais** | `1` | `public.user_documents` | `SELECT COUNT(*) FROM user_documents;` | Total de minutas e assistentes de documentos gerados na plataforma. | ❌ "1 utilizador beneficiado", ❌ "1 processo AIMA concluído". |
| **Telemetria Técnica** | `2.062` | `public.activity_logs` | `action = 'telemetry_system' OR is_system = true OR session_id LIKE 'probe_%'` | Probes, diagnósticos de integridade e benchmarks de sistema (excluídos dos KPIs humanos). | ❌ "Consultas humanas", ❌ "Interações da comunidade", ❌ "Demanda real". |
| **Consultas IA Humanas** | `18.694` | `public.activity_logs` (População Viva) | `action = 'ai_query' AND is_system = false AND session_id NOT LIKE 'probe_%'` | População viva de interações humanas elegíveis extraída em tempo real (Baseline: 18.668 \| Delta: +26). | ❌ Somar os 2.062 técnicos para inflacionar artificialmente o total. |
| **Vagas Ativas** | `18.276` | `public.job_posts` (População Viva) | `SELECT COUNT(*) FROM job_posts WHERE status = 'active';` | Ofertas reais de emprego ativas no agregador nacional (Baseline: 17.356 \| Delta: +920). | ❌ Vagas expiradas, ❌ Vagas duplicadas. |

---

## 🛡️ 4. Primazia do Estado Persistido Soberano

* **Hierarquia de Armazenamento:**
  $$\text{PostgreSQL Supabase (public.profiles)} \gg \text{localStorage (Cache de Renderização)}$$
* O estado local do cliente (`localStorage`, `sessionStorage`, `cookies`) tem função estritamente acessória e de apoio transitório à UI. Em caso de divergência, prevalece de forma absoluta o estado persistido na base de dados soberana.

---

## 🔒 5. Norma de Auditoria do Direito ao Esquecimento (RGPD)

Para que um processo de eliminação de conta possa ser legalmente classificado como "Eliminação Integral Concluída" nos termos do Artigo 17.º do RGPD, a prova transacional deve cobrir exaustivamente:
1. Tabelas relacionais primárias (`profiles`, `auth.users`).
2. Tabelas de atividade comunitária (`posts`, `comments`, `stories`, `reports`).
3. Tabelas de preferências e gamificação (`user_badges`, `user_job_alerts`, `saved_posts`, `user_documents`).
4. Grafo social e interações (`user_follows`, `community_interactions`, `reputation_logs`).
5. **Mensagens privadas e conversas** (`messages`, `conversation_participants`, `conversations`).
6. **Objetos em Storage Buckets** (avatares e ficheiros carregados).

> **Classificação de Auditoria Transitória:** Enquanto a prova transacional de DMs e Storage não for formalmente homologada por teste de integridade, o estado oficial permanece:  
> **"Fluxo de autoexclusão implementado e auditado; prova de eliminação exaustiva em curso."**
