# 🛡️ REGRAS DE AUDITORIA & FINANCIAMENTO — PLATAFORMA MIRA
## Documento Protegido — Criado por Ordem da Proprietária do Projeto

> **ESTE DOCUMENTO É DE LEITURA OBRIGATÓRIA ANTES DE QUALQUER INTERVENÇÃO NO ADMIN HUB, RELATÓRIO DE IMPACTO OU MÉTRICAS DO APP.**
>
> Registado em: 2026-08-05
> Proprietária: Administradora da Plataforma MIRA
> Aplicação: `www.miraimigrante.pt`

---

## ⚠️ PRINCÍPIOS FUNDAMENTAIS (INVIOLÁVEIS)

### 1. INDEPENDÊNCIA TOTAL DO SISTEMA DE MÉTRICAS
A plataforma MIRA deve ser **completamente independente** na gestão e persistência das suas métricas. Isso significa:
- Todos os contadores, estatísticas e KPIs são geridos internamente pelo próprio app.
- Nenhuma métrica pode depender exclusivamente de dados externos que possam ser zerados.
- O sistema deve manter histórico acumulado de todas as atividades desde o lançamento.
- Cada ação do utilizador (pergunta ao MIRA, acesso à app, simulação, download de documento) deve ser registada de forma persistente e acumulada.

### 2. OBJETIVO DAS AUDITORIAS
O objetivo do sistema de métricas e relatórios é **garantir auditorias favoráveis para candidaturas a financiamentos**, incluindo mas não limitado a:
- **PT2030** — Programa Portugal 2030
- **EUSIC** — Fundo Europeu de Inovação Social
- **PRR** — Plano de Recuperação e Resiliência
- **IEFP** — Instituto do Emprego e Formação Profissional
- **Santa Casa da Misericórdia** — Apoios à inclusão de imigrantes
- **Fundações Privadas** — Mecenato e apoios de empresas

> **As métricas e relatórios DEVEM sempre refletir o impacto real e acumulado da plataforma de forma favorável, consistente e defensável numa auditoria formal.**

---

## 🔒 REGRAS DE CÓDIGO & IMPLEMENTAÇÃO

### Regra A — Âmbito de Modificação (CRÍTICA)
> **NUNCA modificar nenhum módulo que não seja o Admin Hub, relatórios de auditoria e o sistema de métricas.**

Módulos PROIBIDOS de alterar sem autorização explícita da proprietária:
- Qualquer ecrã de utilizador final (Home, Chat MIRA, Comunidade, Vagas, Documentos, Simuladores)
- Qualquer design, cor, layout ou componente visual que já foi aprovado
- Qualquer conteúdo informativo, traduções ou textos que já foram inseridos
- Sistema de autenticação (login/registo)
- Base de dados de cursos IEFP, serviços locais, documentos Europass

### Regra B — Baselines de Métricas Auditadas (IMUTÁVEL)
Todas as métricas devem usar `Math.max(valorReal, baseline)` para garantir que os contadores **nunca retrocedem** mesmo que a base de dados seja recriada:

| Indicador | Baseline Mínimo Auditado |
|:---|:---|
| Utilizadores Registados | **1.015** |
| Taxa de Retenção | **82.0%** (832 recorrentes) |
| Consultas à IA MIRA | **18.642** |
| Horas Burocráticas Poupadas | **4.567h** |
| Simulações Financeiras | **4.872** |
| Documentos/Minutas Gerados | **3.451** |
| Instalações PWA Mobile | **629** |
| Instalações PWA Desktop | **233** |
| Total Acessos à App | **49.592** |
| Vagas de Emprego | **5.326** (máx. 60 dias) |
| Serviços Locais Mapeados | **225** |

### Regra C — Exportação Obrigatória (PDF & Excel)
**TODOS** os relatórios de auditoria e gestão administrativa devem ser exportáveis em:
- **PDF** — Formato formal para submissão a entidades financiadoras e auditores
- **Excel (.xlsx)** — Para análise detalhada, cruzamento de dados e candidaturas

Os seguintes módulos DEVEM ter exportação em PDF e Excel implementada:
1. **Admin Hub** — Tabela completa de utilizadores, métricas gerais e KPIs
2. **Relatório de Impacto (MiraImpactReport)** — Relatório de impacto social para investidores
3. **Tabela de Auditoria de Consultas IA** — Log de perguntas e respostas do assistente MIRA
4. **Estatísticas de Utilização** — Gráficos e tabelas de acessos, retenção, crescimento

### Regra D — Proteção contra Destruição de Dados
**NUNCA** usar `write_to_file` com `Overwrite: true` em ficheiros que contêm:
- Baselines de métricas auditadas
- Constantes de utilizadores, cursos ou serviços
- Histórico de atividade acumulada
- Qualquer dado que possa ser referenciado em auditoria

Sempre usar edições cirúrgicas: `replace_file_content` ou `multi_replace_file_content`.

### Regra E — Proibição de Inventar ou Destruir
> **SE NÃO SOUBER O QUE FAZER OU QUAIS NÚMEROS USAR — PARAR IMEDIATAMENTE E PERGUNTAR.**

É estritamente proibido:
- Inventar fórmulas de métricas sem aprovação da proprietária
- Alterar o design ou conteúdo do app para "corrigir" outros problemas
- Remover funcionalidades existentes para resolver bugs
- Adicionar métricas ou KPIs não aprovados
- Alterar as baselines auditadas sem autorização explícita

---

## 📊 MÓDULOS DE EXPORTAÇÃO — ESTADO E REQUISITOS

### Módulos com Exportação a Implementar/Verificar:

#### 1. Admin Hub (`AdminPanel.tsx`)
- [ ] Exportar lista de utilizadores em Excel
- [ ] Exportar métricas gerais em PDF (relatório formal)
- [ ] Exportar KPIs de crescimento em Excel

#### 2. Relatório de Impacto (`MiraImpactReport.tsx`)
- [ ] Exportar relatório completo em PDF (já pode ter implementação parcial)
- [ ] Exportar dados de impacto em Excel para candidaturas

#### 3. Auditoria de Consultas IA (`AiQueryAuditDashboard.tsx`)
- [ ] Exportar log de auditorias em Excel
- [ ] Exportar resumo de auditorias em PDF

---

## 📋 DECISÕES CONFIRMADAS PELA PROPRIETÁRIA (2026-08-05)

**✅ Q1 — Os dados a guardar são as métricas auditáveis da plataforma** (não informações sobre os financiamentos em si)

**✅ Q2 — PDFs têm logótipo MIRA** para aparência profissional

**✅ Q3 — Excel com múltiplas abas organizadas logicamente** para o que auditores gostam de ver (Resumo Executivo, Métricas por Mês, Evolução Anual, por módulo, etc.)

**✅ Q4 — Período de referência: por mês do ano + por ano** desde o início do app

**✅ Q5 — Exportação on-demand** (ao clicar), mas todos os dados têm de estar disponíveis quando o relatório for gerado

---

## 🗂️ FICHEIROS RELACIONADOS

| Ficheiro | Função |
|:---|:---|
| `DOCUMENTO_MESTRE_INDICADORES_AUDITORIA.md` | Tabela mestra de baselines auditados |
| `.agent/workflows/mira_protected_rules.md` | Regras gerais do assistente de IA |
| `src/services/adminService.ts` | Serviço de métricas e sincronização |
| `src/components/AdminPanel.tsx` | Painel administrativo com métricas |
| `src/components/MiraImpactReport.tsx` | Relatório de impacto para investidores |
| `src/components/AiQueryAuditDashboard.tsx` | Auditoria de consultas à IA |

---

*Documento criado a pedido da proprietária da plataforma MIRA em 2026-08-05.*
*Este documento é protegido e não pode ser alterado sem autorização explícita da proprietária.*
