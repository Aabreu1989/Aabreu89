---
description: Regras obrigatórias antes de qualquer edição no projeto MIRA
---

# ⚠️ REGRAS OBRIGATÓRIAS — LER ANTES DE QUALQUER EDIÇÃO

## ANTES de editar qualquer ficheiro:

0. **LER O FICHEIRO PROTEGIDO [`MEMORIA.md`](file:///c:/Users/Utilizador/mira-projeto/MEMORIA.md)** na raiz para todas as regras rígidas do projeto MIRA
0.1. **LER O PROTOCOLO SOBERANO DE AUDITORIA [`STANDARD_OF_AUDIT.md`](file:///c:/Users/Utilizador/mira-projeto/STANDARD_OF_AUDIT.md)** na raiz para os 55 artigos e protocolo de 3 camadas de evidência (UI, DB, Realtime)
1. **LER `PROTECTED_CONTENT.md`** na raiz do projeto para saber o que NUNCA pode ser removido
2. **NUNCA usar `write_to_file` com `Overwrite: true`** em ficheiros com listas de dados (usar sempre `multi_replace_file_content` ou `replace_file_content`)
3. **NUNCA remover funcionalidades existentes** sem perguntar explicitamente à utilizadora
4. **NUNCA remover itens de arrays** (cursos, avatares, serviços, documentos) — apenas ADICIONAR
5. **SEMPRE verificar** se o ficheiro que vai editar tem conteúdo protegido antes de reescrever

## Ficheiros que NUNCA devem ser reescritos na totalidade:
- `constants.tsx` — contém PREDEFINED_AVATARS
- `utils/iefpCoursesDatabase.ts` — contém todos os cursos
- `components/LearningHub.tsx` — contém IEFP_SYNCED_COURSES
- `components/LocalServicesMap.tsx` — contém lógica de serviços
- `PROTECTED_CONTENT.md` — é o ficheiro de referência

## Ficheiros onde o mapa foi intencionalmente REMOVIDO:
- `LocalServicesMap.tsx` — mapa Leaflet foi removido a pedido. NÃO VOLTAR A ADICIONAR.

## Login:
- SEMPRE email + password
- NUNCA OTP / passwordless / magic link

## Vagas de Emprego (REGRA PERMANENTE):
- **SÓ É PERMITIDO EXIBIR E ARMAZENAR VAGAS DE ATÉ 60 DIAS (MÁXIMO 60 DIAS DE IDADE)**
- Vagas com mais de 60 dias da data de publicação NUNCA devem ser apresentadas aos utilizadores e DEVEM SER PURGADAS AUTOMATICAMENTE do código, queries e rotinas de sync em `JobBoard.tsx` e `api/sync-jobs.js`.

## Indicadores & Métricas de Auditoria (REGRA PERMANENTE):
- **LER O FICHEIRO `DOCUMENTO_MESTRE_INDICADORES_AUDITORIA.md`** na raiz antes de alterar qualquer serviço de métricas.
- **NUNCA ALTERAR OU REDUZIR AS BASELINES AUDITADAS**:
  - Utilizadores Mínimos: `1.015`
  - Taxa de Retenção Recorrente: `82.0%` (`832` utilizadores recorrentes)
  - Consultas IA Auditadas: `18.642`
  - Horas Burocráticas Poupadas: `4.567h`
  - Simulações Financeiras: `4.872`
  - Minutas Descarregadas: `3.451`
  - Total Instalações PWA: `862` (629 mobile + 233 desktop)
  - Total Acessos à App: `49.592`
- **Toda e qualquer consulta à DB deve usar `Math.max(dbValue, baseline)`** para evitar que contadores zerem se tabelas forem recriadas.

## Visibilidade de Emails no Admin Hub (REGRA PERMANENTE):
- No Admin Hub e perfil de utilizadores visto por Administrador, **o email de CADA utilizador tem que ser SEMPRE VISÍVEL sem máscaras (sem `••••@••••`)**.
- Se a coluna email estiver vazia na base de dados, gerar o fallback público formatado (`${username}@miraimigrante.pt`).

## Regras de Auditoria & Financiamento (REGRA PERMANENTE):
- **LER O FICHEIRO `REGRAS_AUDITORIA_FINANCIAMENTO.md`** nesta pasta antes de qualquer intervenção no Admin Hub, métricas ou relatórios.
- **ÂMBITO RESTRITO**: Apenas o Admin Hub, Relatório de Impacto e sistema de métricas podem ser modificados. NUNCA alterar módulos de utilizador final (Chat, Comunidade, Vagas, Documentos, Simuladores) sem autorização explícita.
- **EXPORTAÇÃO OBRIGATÓRIA**: Admin Hub, Relatório de Impacto e Auditoria de Consultas IA devem ser exportáveis em PDF e Excel.
- **SE NÃO SOUBER O QUE FAZER — PARAR E PERGUNTAR À PROPRIETÁRIA. NUNCA INVENTAR.**


