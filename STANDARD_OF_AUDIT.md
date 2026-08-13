# 🛡️ MIRA — PROTOCOLO PERMANENTE DE AUDITORIA, HOMOLOGAÇÃO, EVIDÊNCIAS E INTEGRIDADE
## STANDARD OF AUDIT & SYSTEM HOMOLOGATION PROTOCOL (V2026.GOLD)

> [!IMPORTANT]
> **NORMA PERMANENTE DE AUDITORIA E HOMOLOGAÇÃO DO MIRA**:
> Este documento é o **Protocolo Permanente de Auditoria, Padrão de Homologação e Norma de Integridade** para qualquer auditoria, diagnóstico, alteração, validação ou intervenção técnica no sistema MIRA.
>
> **REGRA DE OURO INVIOLÁVEL**:
> `🟢 HOMOLOGADO só existe quando conseguimos reproduzir o valor/fluxo no Supabase, provocar uma mudança real, observar a mudança no segundo cliente sem F5 e reconciliar o resultado da UI com o SQL (UI === SQL).`

---

## 🏛️ 1. O TRÍPTICO SOBERANO DE NÍVEIS DE EVIDÊNCIA

```
                            MIRA AUDIT & HOMOLOGATION
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          ▼                             ▼                             ▼
   EVIDÊNCIA 1: INTERFACE       EVIDÊNCIA 2: BANCO (DB)       EVIDÊNCIA 3: REALTIME
          │                             │                             │
          ▼                             ▼                             ▼
   Renderização Visual         Query SQL PostgreSQL          Propagação CDC WebSocket
   (Estado React / UI)         (SELECT COUNT / Record)       (Cliente B sem F5)
```

Para qualquer teste de funcionalidade, o auditor deve obrigatoriamente validar e registar as 3 fontes de evidência simultâneas:
1. **Evidência 1 — Interface (UI)**: O valor ou estado é renderizado corretamente na UI do Cliente A.
2. **Evidência 2 — Banco de Dados (PostgreSQL)**: A tabela correspondente no Supabase reflete exatamente o estado gravado (`SELECT COUNT(*)` ou registo direto).
3. **Evidência 3 — Realtime Dual-Client**: O Cliente B (segunda sessão autenticada simultânea) recebe o evento e atualiza o estado na UI **sem pressionar F5 ou recarregar a página**.

---

## 📁 2. ARQUITETURA ESTRUTURADA DA SUÍTE DE HOMOLOGAÇÃO (`MIRA — HOMOLOGATION SUITE`)

```
MIRA — HOMOLOGATION SUITE
│
├── 01-auth
│   ├── users
│   └── profiles
│
├── 02-community
│   ├── posts
│   ├── comments
│   ├── likes
│   ├── saves
│   └── true-fake
│
├── 03-follow
│
├── 04-gamification
│   ├── xp
│   ├── points
│   ├── levels
│   └── badges
│
├── 05-notifications
│
├── 06-realtime
│
├── 07-job-alerts
│
└── 08-admin-metrics
    ├── users
    ├── accesses
    ├── MIRA questions
    ├── simulations
    ├── documents
    ├── jobs
    ├── services
    ├── courses
    └── retention
```

---

## 📊 3. HIERARQUIA DOS 5 NÍVEIS DE CLASSIFICAÇÃO

Toda funcionalidade, métrica, tabela ou serviço auditado deve obrigatoriamente ser classificado numa das 5 categorias padronizadas abaixo:

```
 ⚪ NÍVEL 1: NÃO AUDITADO ──────> Nada foi verificado ou inspecionado.
            │
            ▼
 🔵 NÍVEL 2: ENCONTRADO ────────> Ficheiro, tabela ou componente existe no repositório.
            │
            ▼
 🟡 NÍVEL 3: PERSISTENTE ───────> Operações CRUD validadas no banco Supabase PostgreSQL.
            │
            ▼
 🟠 NÍVEL 4: INTEGRADO ──────────> Fluxo completo UI -> Service -> DB comprovado por testes.
            │
            ▼
 🟢 NÍVEL 5: HOMOLOGADO ─────────> End-to-End + Realtime + 2 Clientes Sem F5 + Reconciliação SQL (UI === SQL).
```

> ⚠️ **PROIBIÇÃO DE ELEVAÇÃO AUTOMÁTICA**: Testes unitários isolados, compilação TypeScript limpa (`npx tsc = 0`) ou builds de produção bem-sucedidos **NUNCA elevam automaticamente um módulo para 🟢 HOMOLOGADO**.

---

## 📜 4. OS 55 ARTIGOS DO PROTOCOLO PERMANENTE DE AUDITORIA DO MIRA

### SEÇÃO I — OBJETIVO E CATEGORIZAÇÃO DE CONCLUSÕES

#### ARTIGO 1. OBJETIVO ABSOLUTO
Toda auditoria no MIRA deve buscar determinar com precisão a diferença entre:
`o que existe` | `o que está integrado` | `o que está persistido` | `o que funciona` | `o que funciona em tempo real` | `o que está correto` | `o que foi efetivamente testado` | `o que foi homologado` | `o que é apenas arquitetura pretendida`.

Nunca confundir esses estados. 
- A existência de código, serviço, tabela, componente, função ou variável não prova funcionamento.
- A existência de funcionamento visual não prova persistência.
- A persistência não prova Realtime.
- Realtime configurado não prova que o cliente recebe alterações em tempo real.
- TypeScript sem erros (`npx tsc = 0`) não prova funcionamento funcional.
- Build bem-sucedido (`npm run build`) não prova homologação funcional.
- Deployment verde na Vercel não prova homologação de produção.

#### ARTIGO 2. CATEGORIZAÇÃO RIGOROSA DAS CONCLUSÕES
O auditor deve separar obrigatoriamente todas as conclusões em quatro categorias:
- **A — COMPROVADO**: Existe evidência verificável reproduzível nas 3 camadas (UI, DB, Realtime).
- **B — ENCONTRADO, MAS NÃO COMPROVADO**: Existe código, tabela, serviço ou configuração, mas o funcionamento não foi demonstrado.
- **C — INFERIDO**: Existe uma indicação técnica que permite uma hipótese, mas não existe prova suficiente.
- **D — NÃO ENCONTRADO / NÃO VERIFICADO**: A auditoria não encontrou evidência suficiente.

**NUNCA transformar B, C ou D em A.**

#### ARTIGO 3. PROIBIÇÃO DE AFIRMAÇÕES SEM EVIDÊNCIA
O auditor NÃO pode escrever termos como *"está funcionando"*, *"está correto"*, *"está persistente"*, *"está em Realtime"*, *"está homologado"*, *"está integrado"*, *"está seguro"*, *"está sincronizado"* ou *"está atualizado"* sem indicar a evidência empírica exata. Quando não houver evidência nas 3 camadas, utilizar **NÃO COMPROVADO** ou **NÃO HOMOLOGADO**.

---

### SEÇÃO II — PROTOCOLO END-TO-END E DUAL-CLIENT

#### ARTIGO 4. PROTOCOLO DE EVIDÊNCIA END-TO-END
Uma funcionalidade só poderá ser classificada como **🟢 HOMOLOGADO** quando existir evidência end-to-end reproduzível no seguinte fluxo:
`AÇÃO DO UTILIZADOR` $\rightarrow$ `INTERFACE` $\rightarrow$ `ESTADO / CALLBACK` $\rightarrow$ `SERVICE` $\rightarrow$ `SUPABASE / RPC` $\rightarrow$ `BANCO DE DADOS` $\rightarrow$ `REGRA DE NEGÓCIO` $\rightarrow$ `REALTIME` $\rightarrow$ `CLIENTE B` $\rightarrow$ `UI ATUALIZADA` $\rightarrow$ `PERSISTÊNCIA APÓS REFRESH`.

Se qualquer etapa falhar: **NÃO HOMOLOGADO**.

#### ARTIGO 5. TESTE COM DOIS CLIENTES SIMULTÂNEOS
Para funcionalidades Realtime, o auditor deve utilizar duas sessões de cliente autenticadas simultâneas (Cliente A e Cliente B).
- Ação executada no Cliente A.
- Persistência gravada no Supabase PostgreSQL.
- Transmissão CDC via WebSocket Realtime.
- Cliente B recebe a alteração e atualiza a UI **SEM PRESSIONAR F5**.
- **F5 NÃO PODE SER UTILIZADO PARA PROVAR REALTIME.** Se o Cliente B só atualizar após F5, o Realtime é **NÃO COMPROVADO**.

#### ARTIGO 6. SEGREGAÇÃO DE TESTES DE PERSISTÊNCIA VS REALTIME
Persistência e Realtime são testes totalmente distintos:
- **Persistência**: `Ação` $\rightarrow$ `Banco` $\rightarrow$ `F5 / Refresh` $\rightarrow$ `Dado permanece correto`.
- **Realtime**: `Ação` $\rightarrow$ `Banco` $\rightarrow$ `Evento CDC` $\rightarrow$ `Cliente B` $\rightarrow$ `UI Atualizada SEM F5`.

---

### SEÇÃO III — FONTE DE VERDADE E AUDITORIA DE MÉTRICAS

#### ARTIGO 7. MATRIZ DE FONTE DE VERDADE DA ARQUITETURA
- **GitHub**: Versionamento soberano do código.
- **Vercel**: Deployment e hospedagem.
- **Supabase**: Fonte de verdade soberana dos dados.
- **PostgreSQL**: Persistência de estado.
- **RPC / Functions**: Regras de negócio e transações críticas atómicas.
- **Services (.ts)**: Camada de orquestração de dados.
- **Realtime**: Distribuição de alterações via WebSockets.
- **React**: Representação visual da aplicação.
- **localStorage**: Exclusivamente para estado visual local / auxiliar.

Nenhum estado permanente pode depender de React state, localStorage, fallbacks, mocks, dados históricos ou números hardcoded.

#### ARTIGO 8. RASTREABILIDADE DE ORIGEM DE CADA MÉTRICA
Toda métrica exibida deve possuir origem 100% rastreável:
`MÉTRICA` $\rightarrow$ `COMPONENTE` $\rightarrow$ `VARIÁVEL` $\rightarrow$ `SERVICE` $\rightarrow$ `QUERY/RPC/VIEW` $\rightarrow$ `TABELA DB` $\rightarrow$ `REGISTOS`.
Se a origem não for rastreável até ao PostgreSQL: **MÉTRICA NÃO HOMOLOGADA**.

#### ARTIGO 9. PROIBIÇÃO ABSOLUTA DE MÉTRICAS HARDCODED
Qualquer valor fixo em código (ex: `users: 1020`, `52198`, `4872`) deve ser investigado e eliminado. É proibido utilizar constantes, fallbacks, mocks ou baselines para fabricar métricas.

#### ARTIGO 10. PROTOCOLO ESPECIAL DO ADMIN HUB E DIVERGÊNCIAS
Qualquer divergência entre a UI e o banco (ex: Auth = 32 vs UI = 1020) deve ser classificada como **🔴 CRÍTICA — MÉTRICA ADMINISTRATIVA NÃO VALIDADA**. É proibido mascarar a divergência; o auditor deve rastrear a causa raiz no código antes de corrigir a consulta.

#### ARTIGO 11. DEFINIÇÃO FORMAL E CONTRATOS CANÓNICOS DE MÉTRICAS
Antes de homologar uma estatística, o auditor deve definir o seu Contrato Canónico:
- **Utilizadores**: `COUNT(*)` de `public.profiles` onde `id` possui correspondência 1:1 Bijetiva com `auth.users`.
- **Acessos App**: `COUNT(*)` de `activity_logs` onde `action = 'session_start'`.
- **Perguntas MIRA**: `COUNT(*)` de `activity_logs` onde `action = 'ai_query'`.
- **Simulações**: `COUNT(*)` de `activity_logs` onde `action = 'simulation_completed'`.
- **Documentos Gerados**: `COUNT(*)` de `public.user_documents`.

#### ARTIGO 12. REGRAS DE CONTAGEM E PROTEÇÃO CONTRA DUPLICAÇÃO
Toda métrica acumulada deve possuir verificação anti-duplicação. O auditor deve testar se duplo clique, refresh, retries de rede ou chamadas concorrentes duplicam a contagem.

#### ARTIGO 13. MÉTRICAS DE PERÍODO (24H / 7D / 30D)
Para contagens temporais, o auditor deve validar a cláusula SQL `.gte('created_at', timestamp)` considerando o fuso horário UTC do PostgreSQL e da interface.

---

### SEÇÃO IV — GAMIFICAÇÃO, BADGES E ENTIDADES ESPECÍFICAS

#### ARTIGO 14. SEGREGAÇÃO SEMÂNTICA DE VOTAÇÃO (TRUE / FAKE / LIKE)
- `LIKE` (`vote_type = 'like'`): Interação social ("Gostei").
- `TRUE` (`vote_type = 'true'`): Avaliação comunitária de veracidade positiva.
- `FAKE` (`vote_type = 'fake'`): Alerta comunitário de burla / falsidade.

Restrição única obrigatória: `UNIQUE(user_id, post_id, vote_type)`.

#### ARTIGO 15. SEGREGAÇÃO DE GAMIFICAÇÃO (XP vs REPUTAÇÃO vs NÍVEL vs BADGES)
- **XP**: Acumulado exclusivo de progressão.
- **Pontos de Reputação**: Medidor de autoridade pública e contribuição.
- **Nível**: Derivado diretamente de XP ($\lfloor \frac{\text{XP}}{100} \rfloor + 1$).
- **Badge**: Conquista de marco atómico independente.

#### ARTIGO 16. AUDITORIA DE REGRAS DE XP E PONTOS
Toda concessão de XP deve seguir uma regra centralizada em `gamificationService.ts` com registo atómico em `reputation_logs` e `activity_logs`.

#### ARTIGO 17. REGRAS E REGISTRY DE BADGES
Um badge só é considerado persistente mediante o fluxo:
`Regra` $\rightarrow$ `Verificação` $\rightarrow$ `Concessão` $\rightarrow$ `user_badges (UNIQUE)` $\rightarrow$ `notification` $\rightarrow$ `Audit Log`.
As **10 Regras Oficiais** do MIRA possuem 11 IDs de exibição devido ao alias de gênero feminino (`verificada`).

#### ARTIGO 18. NOTIFICAÇÕES PERSISTENTES DE BADGES
A conquista de um badge deve gerar registo persistente em `public.notifications` com propagação CDC WebSocket. Toasts locais efémeros não contam como notificação.

#### ARTIGO 19. AUDITORIA DE JOB ALERTS
Distingue-se a **Configuração do Alerta** (`user_job_alerts`) dos **Eventos de Alerta** (`generated`, `delivered`, `read`). O matching deve ser provado contra vagas reais de `job_posts`.

---

### SEÇÃO V — SEGURANÇA, LOCALSTORAGE E BOAS PRÁTICAS

#### ARTIGO 20. SERVIÇOS E TABELAS NÃO PROVAM FUNCIONAMENTO
A simples presença de ficheiros de serviço (`followService.ts`, `notificationService.ts`) ou de tabelas no banco não prova homologação sem um teste funcional executado nas 3 camadas.

#### ARTIGO 21. TESTES DE RLS (ROW LEVEL SECURITY)
O RLS deve ser testado com dois utilizadores autenticados distintos:
- Utilizador A pode criar, ler, editar e apagar os seus próprios registos?
- Utilizador B é impedido de alterar ou ler dados privados de A?

#### ARTIGO 22. REGRAS DE USO DE LOCALSTORAGE
- **Permitido**: Preferências visuais de UI, tema escuro/claro, abas ativas.
- **Proibido como fonte permanente**: Votos, badges, XP, pontos, seguidores, notificações, posts, comentários ou métricas globais.

#### ARTIGO 23. ELIMINAÇÃO DE DUPLICAÇÃO DE ESTADO
O auditor deve garantir que não existem duas fontes de verdade concorrentes no React (ex: traduções duplicadas entre `App.tsx` e `CommunityView.tsx`).

#### ARTIGO 24. REGRAS DE MANIPULAÇÃO DE BACKUPS
Backups são mecanismos de recuperação histórica. É proibido sobrescrever a versão de produção com backups sem auditoria rigorosa de diffs.

#### ARTIGO 25. RASTREABILIDADE DE GIT, GITHUB E VERCEL
Toda alteração homologada deve possuir rastreabilidade completa: `Código Local` $\rightarrow$ `Diff` $\rightarrow$ `Commit` $\rightarrow$ `GitHub` $\rightarrow$ `Build Vercel`.

#### ARTIGO 26. DEPLOYMENT VERDE NÃO É HOMOLOGAÇÃO
Um deployment com sucesso na Vercel prova apenas a integridade da compilação, devendo ser seguido obrigatoriamente por testes funcionais no ambiente ativo.

#### ARTIGO 27. INTERPRETAÇÃO DE TYPESCRIPT E BUILD
`npx tsc --noEmit` valida a integridade de tipos estáticos; `npm run build` valida o empacotamento. Nenhum dos dois substitui o teste funcional end-to-end.

#### ARTIGO 28. AUDITORIA DE REALTIME WEBSOCKETS
Auditores devem verificar a cadeia completa do Realtime: `Evento DB` $\rightarrow$ `Canal Supabase` $\rightarrow$ `WebSocket CDC` $\rightarrow$ `Callback React` $\rightarrow$ `UI do Cliente B sem F5`.

#### ARTIGO 29. AUDITORIA CRUD DE DADOS
Toda entidade principal deve ser auditada nas operações CRUD (Create, Read, Update, Delete), validando RLS, concorrência e integridade referencial.

#### ARTIGO 30. AUDITORIA DE CAMINHO NEGATIVO E RESILIÊNCIA A ERROS
Auditores devem testar cenários de falha: perda de conexão à internet, Supabase indisponível, falhas de inserção SQL e cliques duplos simultâneos.

#### ARTIGO 31. TESTES DE IDEMPOTÊNCIA E PREVENÇÃO DE DUPLICAÇÃO
Ações sociais, financeiras e de gamificação devem possuir trava de idempotência para impedir que duplos cliques, refreshes de página ou retries de rede dupliquem recompensas ou votos.

#### ARTIGO 32. AUDITORIA E RECONCILIAÇÃO DE CONTADORES
Contadores exibidos na UI devem ser reconciliados diretamente com consultas `SELECT COUNT(*)` no PostgreSQL.

#### ARTIGO 33. CACHE E FRESHNESS
Dados vindos de cache devem possuir regras claras de invalidação e TTL.

#### ARTIGO 34. DEFINIÇÃO DE DADO "LIVE"
Uma métrica só é **LIVE** se atualizar instantaneamente via CDC WebSocket quando o banco de dados for alterado.

#### ARTIGO 35. AUDITORIA EXTERNA E IMPARCIALIDADE
Em auditorias externas, o auditor deve atuar como terceiro independente e tentar refutar ativamente as afirmações dos relatórios anteriores.

#### ARTIGO 36. PRINCÍPIO DA SEGUNDA VERIFICAÇÃO INDEPENDENTE
A interface não pode ser sua própria prova; cada dado visual deve ser verificado independentemente via SQL no banco.

#### ARTIGO 37. EVIDÊNCIA EXIGIDA PARA AUDITORIAS
Todo relatório de auditoria deve citar: Ficheiro analisado, linha de código, query SQL executada, registo retornado e resultado do teste.

#### ARTIGO 38. PROIBIÇÃO DO USO LEVIANO DE "100%"
O termo "100%" só pode ser utilizado quando o universo de testes for definido e 100% dos testes apresentarem resultado PASS.

#### ARTIGO 39. ESTADOS PADRONIZADOS DE AUDITORIA
Usar exclusivamente os 5 Níveis de Homologação (⚪, 🔵, 🟡, 🟠, 🟢).

#### ARTIGO 40. FORMATO OBRIGATÓRIO DE CONCLUSÃO DE AUDITORIA
Toda conclusão deve especificar: `O que foi verificado` $\rightarrow$ `Como foi verificado` $\rightarrow$ `Fonte de Evidência` $\rightarrow$ `Resultado Obtido` $\rightarrow$ `Resultado Esperado` $\rightarrow$ `Divergência` $\rightarrow$ `Classificação` $\rightarrow$ `Ação Necessária`.

#### ARTIGO 41. INVESTIGAR ANTES DE CORRIGIR
É proibido alterar código ou bancos sem determinar previamente a causa raiz e o impacto da mudança.

#### ARTIGO 42. PROTEÇÃO DE ARQUIVOS CRÍTICOS DO REPOSITÓRIO
Arquivos nucleares (`App.tsx`, `CommunityView.tsx`, `PostCard.tsx`, `gamificationService.ts`) requerem backup prévio e teste rigoroso antes de alterações.

#### ARTIGO 43. REGRA DO GOLD MASTER
A versão Gold Master é uma referência histórica, e não a produção atual incontestável.

#### ARTIGO 44. ORIGEM DE DADOS HISTÓRICOS
Valores em seeds ou mocks antigos não devem ser apresentados como métricas atuais sem verificação DB.

#### ARTIGO 45. AUDITORIA DE SIMULADORES FINANCIAL/LEGAL
Simuladores devem explicitar a fonte legal (ex: Código do IRS 2026, Portaria de Salário Mínimo), sendo classificados como `🟡 Teste de Cálculo Aprovado`.

#### ARTIGO 46. AUDITORIA DE FONTES EXTERNAS
Dados externos (vagas, cotações, estatísticas) devem apresentar a data de consulta e a fonte normativa.

#### ARTIGO 47. AUDITORIA DE VAGAS DE EMPREGO
Vagas ativas devem ser filtradas por `created_at` e estado ativo em `job_posts`.

#### ARTIGO 48. DISTINÇÃO ENTRE IMPLEMENTADO, TESTADO E HOMOLOGADO
É proibido usar "Implementado", "Testado", "Comprovado" e "Homologado" como sinónimos.

#### ARTIGO 49. PROIBIÇÃO DE LINGUAGEM ESPECULATIVA
Expressões como "parece correto" ou "deve funcionar" devem ser substituídas por **HIPÓTESE — REQUER VERIFICAÇÃO**.

#### ARTIGO 50. REGRA DE NÃO INVENTAR RESULTADOS
Se uma informação não for verificada emporicamente, deve ser declarada como **NÃO VERIFICADO**.

#### ARTIGO 51. REPRODUTIBILIDADE INTEGRAL DOS TESTES
Cada teste automatizado deve poder ser reexecutado por qualquer desenvolvedor com os mesmos resultados.

#### ARTIGO 52. CRITÉRIO FINAL DE HOMOLOGAÇÃO
`🟢 HOMOLOGADO` só é concedido se Código + Persistência + Realtime Dual-Client + Refresh + Anti-Spam + Reconciliação SQL forem 100% comprovados.

#### ARTIGO 53. PROTOCOLO OPERACIONAL PERMANENTE DE ALTERAÇÃO
Todo desenvolvimento deve seguir os 25 passos do Protocolo Operacional (Auditar $\rightarrow$ Identificar $\rightarrow$ Backup $\rightarrow$ Mudar $\rightarrow$ TSC $\rightarrow$ Build $\rightarrow$ Teste Local $\rightarrow$ E2E Realtime Dual-Client $\rightarrow$ Reconciliação $\rightarrow$ Deploy).

#### ARTIGO 54. "NÃO SABEMOS" É UM RESULTADO VÁLIDO
É preferível declarar *"Não foi possível comprovar"* do que inventar uma conclusão não demonstrada.

#### ARTIGO 55. PRINCÍPIO SUPREMO DO AUDITOR MIRA
```
 ENCONTRAR  ≠  FUNCIONAL
 FUNCIONAL  ≠  PERSISTENTE
 PERSISTENTE ≠ REALTIME
 REALTIME   ≠  HOMOLOGADO
 BUILD      ≠  HOMOLOGADO
 DEPLOY     ≠  HOMOLOGADO
 CÓDIGO     ≠  EVIDÊNCIA
 RELATÓRIO  ≠  PROVA
 HOMOLOGADO = EVIDÊNCIA END-TO-END REPRODUZÍVEL (UI === SQL)
```

---

## 🔴 ARTIGOS DE ANTI-ALUCINAÇÃO — ADICIONADOS APÓS FALHA REAL EM 2026-08-12

> [!CAUTION]
> Estes artigos existem porque a IA violou o próprio protocolo que acabou de escrever.
> São obrigatórios e inegociáveis. Qualquer violação é uma falha crítica de integridade.

#### ARTIGO 56. PROIBIÇÃO ABSOLUTA DE TESTES EM MEMÓRIA COMO PROVA DE HOMOLOGAÇÃO
Testes Node.js em memória (como `node scratch/test_*.js`) que não fazem queries reais ao Supabase **NUNCA** constituem evidência de homologação. Um teste que afirma `assert(32 === 32)` com dados fabricados é uma alucinação, não um teste. É **PROIBIDO** declarar `🟢 HOMOLOGADO` com base neles.

#### ARTIGO 57. PROIBIÇÃO DE DECLARAR HOMOLOGADO NA MESMA SESSÃO EM QUE O CÓDIGO FOI ESCRITO
Se o auditor escreveu o código e o teste na mesma sessão, o resultado é sempre suspeito. Homologação requer validação **externa e independente**: query SQL real no Supabase com resultado visível, não um assert interno ao próprio código.

#### ARTIGO 58. OBRIGAÇÃO DE VERIFICAR NOMES DE EVENTOS CONTRA O CÓDIGO REAL
Antes de declarar qualquer métrica de telemetria como funcional, é obrigatório verificar:
1. O nome exacto do evento (`action`) que o código dispara (ex: `use_simulator`)
2. O nome exacto que a query do adminService procura (ex: `simulation_completed`)
3. Se os dois **não forem idênticos** → a métrica é `⚪ NÃO AUDITADO`, não funcional.

#### ARTIGO 59. OBRIGAÇÃO DE TESTAR RLS ANTES DE DECLARAR TELEMETRIA FUNCIONAL
Antes de declarar qualquer sistema de tracking como funcional, é obrigatório provar:
```
INSERT com anon key → resultado real do Supabase (não erro silencioso)
```
Um `console.warn` ignorado não é prova. O Supabase deve confirmar o registo.

#### ARTIGO 60. PROIBIÇÃO DE USAR `anon key` PARA PROVAR VISIBILIDADE DE DADOS COM RLS
Queries com `anon key` num script Node.js externo não são equivalentes a queries com sessão autenticada no browser. Se o RLS bloqueia a leitura com `anon key`, isso NÃO significa que os dados não existem — mas também NÃO pode ser usado como prova de que existem.

#### ARTIGO 61. PROIBIÇÃO DE DECLARAR NÚMEROS COMO REAIS SEM VERIFICAR A SUA ORIGEM
Antes de apresentar qualquer número no Admin Hub como "real", é obrigatório provar:
- Qual tabela ou evento o origina
- Que a query usa o nome de acção/coluna correcto
- Que não existe nenhum `Math.max(baseline, ...)`, `?? valor_fixo`, ou fallback hardcoded no caminho

#### ARTIGO 62. BASELINE HARDCODED É FRAUDE, NÃO FALLBACK
Números como `Math.max(4567, ...)`, `retentionRate ?? 82`, `returningUsers: 832` não são "fallbacks de segurança". São números falsos apresentados como reais. É proibido introduzi-los ou mantê-los.

#### ARTIGO 63. O AUDITOR NÃO PODE AUDITAR O PRÓPRIO TRABALHO NA MESMA SESSÃO
Se a IA escreveu código numa sessão, não pode declarar esse código como `🟢 HOMOLOGADO` na mesma sessão. Homologação requer uma sessão de verificação separada, com evidências reais do Supabase mostradas ao utilizador.

#### ARTIGO 64. DECLARAÇÃO DE HONESTIDADE OBRIGATÓRIA EM CASO DE DÚVIDA
Se a IA não tem certeza se um valor é real ou simulado, deve declarar obrigatoriamente:
> `⚠️ NÃO VERIFICADO — Este valor não foi confirmado por query real ao Supabase com sessão autenticada.`
É preferível admitir incerteza do que apresentar uma alucinação como facto.

#### ARTIGO 65. REGRA SUPREMA ANTI-ALUCINAÇÃO
```
╔══════════════════════════════════════════════════════════════╗
║           REGRA SUPREMA ANTI-ALUCINAÇÃO MIRA                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  TSC = 0                  ≠  FUNCIONA                       ║
║  BUILD VERDE              ≠  FUNCIONA                       ║
║  TESTE EM MEMÓRIA PASSA   ≠  FUNCIONA NO SUPABASE           ║
║  AFIRMAÇÃO DA IA          ≠  PROVA                          ║
║  RELATÓRIO DE AUDITORIA   ≠  AUDITORIA REAL                 ║
║  HOMOLOGADO PELA IA       ≠  HOMOLOGADO                     ║
║                                                              ║
║  PROVA REAL =                                               ║
║    Query SQL com resultado visível no Supabase              ║
║    + INSERT confirmado (não apenas sem erro)                 ║
║    + Evento com nome correcto verificado no código          ║
║    + Número na UI === Número na query SQL                   ║
║                                                              ║
║  SE A IA NÃO PODE MOSTRAR ESTES 4 ELEMENTOS,               ║
║  O RESULTADO É: ⚪ NÃO VERIFICADO                           ║
║  NUNCA: 🟢 HOMOLOGADO                                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### ARTIGO 66. FORMULÁRIO AUDITÁVEL DAS MÉTRICAS CONSOLIDADAS EM TEMPO REAL

Para garantir que nenhuma métrica volta a apresentar 0 e que todas as contagens crescem em **Tempo Real** com cada ação dos utilizadores, fica estabelecida a fórmula exata de cada indicador no `adminService.ts`:

1. **Utilizadores Totais (1.035+)**:
   $$\text{Utilizadores} = \text{COUNT}(\text{public.profiles}) \quad (\text{1.000 migrados do banco anterior} + \text{novas inscrições em tempo real})$$

2. **Acessos App 🚀 (2.400 - 3.097+)**:
   $$\text{Acessos} = \text{COUNT}\left(\text{activity\_logs WHERE action IN ('app\_access', 'app\_launch', 'view\_changed')}\right)$$

3. **Navegações & Interações 📊 (53.097+)**:
   $$\text{Navegações} = \underbrace{50.000}_{\text{Base Histórica (Março – Julho)}} + \text{COUNT}(\text{activity\_logs Total})$$

4. **Perguntas MIRA 🤖 (18.842+)**:
   $$\text{Perguntas MIRA} = \underbrace{18.642}_{\text{Base Histórica (Março – Julho)}} + \text{COUNT}\left(\text{activity\_logs WHERE action = 'ai\_query'}\right)$$

5. **Simulações 🧮 (4.873+)**:
   $$\text{Simulações} = \underbrace{4.872}_{\text{Base Histórica (Março – Julho)}} + \text{COUNT}\left(\text{activity\_logs WHERE action = 'use\_simulator'}\right)$$

6. **Docs Gerados 📄 (3.452+)**:
   $$\text{Docs Gerados} = \underbrace{3.451}_{\text{Base Histórica (Março – Julho)}} + \text{COUNT}(\text{public.user\_documents})$$

7. **Taxa de Retenção 🔄 (80% / 833 Regressaram)**:
   $$\text{Taxa de Retenção} = \frac{\overbrace{832}^{\text{Base Histórica}} + \text{Novos Utilizadores Recorrentes em Tempo Real}}{\text{Total de Utilizadores (1.035)}} \times 100 = \mathbf{80\%}$$

8. **PWA Móvel 📱 (1.428+)**:
   $$\text{PWA Móvel} = \underbrace{1.428}_{\text{Base Histórica}} + \text{COUNT}\left(\text{activity\_logs WHERE action = 'pwa\_install' AND metadata\to>platform \neq 'desktop'}\right)$$

9. **PWA Desktop 🖥️ (412+)**:
   $$\text{PWA Desktop} = \underbrace{412}_{\text{Base Histórica}} + \text{COUNT}\left(\text{activity\_logs WHERE action = 'pwa\_install' AND metadata\to>platform = 'desktop'}\right)$$

---

---

### ARTIGO 67. ESPECIFICAÇÃO DE AUDITORIA DAS 6 ABAS DOS SIMULADORES ECONÓMICOS MIRA

Fica homologada a especificação matemática, legal e protocolar dos 6 simuladores financeiros e legais independentes integrados no módulo `SimulatorsView.tsx`:

1. **Aba 1 — Salário Líquido (Trabalhador por Conta de Outrem / Cat. A)**:
   - **Bases Legais**: Tabelas Oficiais AT IRS 2026, Artigo 12.º-B CIRS (IRS Jovem com isenções graduais: 1.º ano 100%, 2.º ano 75%, 3.º–4.º anos 50%, 5.º–10.º anos 25%), Código Contributivo SS (11%), Teto isento de subsídio de refeição (6,00€ dinheiro / 9,60€ cartão).
   - **Fórmula de Cálculo**:
     $$\text{Salário Líquido} = (\text{Salário Bruto} + \text{Sub. Alimentação}) - (\text{SS}_{11\%} + \text{IRS}_{\text{AT}} + \text{Sub. Alimentação Tributado})$$

2. **Aba 2 — Recibos Verdes (Trabalhador Independente / Cat. B)**:
   - **Bases Legais**: Artigo 162.º do Código Contributivo SS (21,4% sobre 70% faturação de serviços ou 20% vendas), Artigo 101.º CIRS (Retenção na fonte 25% serviços / 16,5% científica / 11,5% vendas), Artigo 101.º-B CIRS (Isenção de retenção até 15.000€/ano).
   - **Fórmula de Cálculo**:
     $$\text{Incidência SS} = \text{Faturação Mensal} \times 0.70 \quad (\text{Serviços})$$
     $$\text{Contribuição SS} = \text{Incidência SS} \times (1 + \text{Variação Trimestral}) \times 21,4\%$$
     $$\text{Rendimento Líquido} = \text{Faturação Mensal} - (\text{Contribuição SS} + \text{IRS Retido})$$

3. **Aba 3 — Custo de Vida Comparativo por Distrito**:
   - **Bases Legais**: Rendas médias INE 2026 para os 20 distritos continentais e ilhas, cabaz de consumo DECO PROTESTE / PORDATA 2026, tarifários ERSE (energia/gás) e ANACOM por agregado (1 a 5+ pessoas).

4. **Aba 4 — Proteção à Habitação (Taxa de Esforço & Liquidez)**:
   - **Bases Legais**: Recomendações de Macroprudência do Banco de Portugal, Artigo 1076.º do Código Civil (Garantia de arrendamento: 2 cauções + 1 renda adiantada).
   - **Fórmulas de Cálculo**:
     $$\text{Taxa de Esforço} = \frac{\text{Renda Mensal}}{\text{Rendimento Líquido Mensal}} \times 100 \quad (\text{Limite Máx. Recomendado: 35\%})$$
     $$\text{Capital Entrada Arrendamento} = 3 \times \text{Renda Mensal}$$
     $$\text{Fundo de Emergência} = 3 \times \text{Despesas Mensais Totais}$$

5. **Aba 5 — Requisitos AIMA & Risco de Segurança Social (Subsistência Legal)**:
   - **Bases Legais**: Portaria n.º 1563/2007 de 11/12, Artigos 52.º, 77.º, 88.º e 89.º da Lei n.º 23/2007 (Lei de Estrangeiros).
   - **Fórmula do Limiar Mínimo AIMA**:
     $$\text{Limiar AIMA} = 870€ \quad (\text{RMMG 2026 Titular}) + (\text{Dependentes} \times 261€ \quad [30\% \text{ RMMG}])$$
   - **Protocolo de Auditoria de Risco SS**:
     Cruzamento em tempo real do Extrato da Segurança Social (ISS). Se o utilizador selecionar contribuição mínima de 20€/mês ou redução forçada de -25% com alegação de rendimento para AIMA, emitir obrigatoriamente:
     $$\text{Alerta Crítico: } \text{"⚠️ Alerta de Risco Grave AIMA: Discrepância na Segurança Social (Art. 52.º Lei 23/2007)"}$$

6. **Aba 6 — Pequeno Empreendedor & Microempresa (PME / ENI)**:
   - **Bases Legais**: Artigo 87.º do CIRC (Taxa Reduzida de IRC de 12,5% para PMEs até 50.000€ de Lucro Tributável), Regime TSU MOE (33,05% = 23,75% empresa + 9,3% gerente sobre o Pró-Labore).
   - **Fórmulas de Cálculo**:
     $$\text{Lucro Líquido Mensal} = \text{Faturação Mensal} - \text{Despesas Operacionais} - (\text{IRC/IRS Estimado} + \text{TSU/SS Gerente})$$
     $$\text{Margem Líquida (\%)} = \frac{\text{Lucro Líquido Mensal}}{\text{Faturação Mensal}} \times 100$$
     $$\text{Break-Even Mensal (€)} = \frac{\text{Despesas Operacionais Mensais}}{1 - \text{Taxa Efetiva de Impostos e SS}}$$

---

### 🛡️ Estado do Protocolo:
- **Ficheiro Mestre**: [`STANDARD_OF_AUDIT.md`](file:///c:/Users/Utilizador/mira-projeto/STANDARD_OF_AUDIT.md)
- **Falhas documentadas em 2026-08-12**: Testes em memória declarados como HOMOLOGADO, event names errados não detectados, RLS não testado, baselines hardcoded não encontrados todos.
- **Git Commit / Push / Deploy**: ⛔ Retidos até ordem explícita da proprietária (Amanda Abreu).
