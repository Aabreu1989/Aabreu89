# 🧠 MEMORIA.md — ARQUIVO PROTEGIDO DE REGRAS RÍGIDAS E INEGOCIÁVEIS DO PROJETO MIRA

> ⚠️ **ATENÇÃO OBRIGATÓRIA À IA (ANTIGRAVITY / GEMINI / CLAUDE):**
> ESTE FICHEIRO É O NÚCLEO MESTRE DE MEMÓRIA E REGRAS RÍGIDAS DO PROJETO MIRA.
> **DEVES CONSULTAR ESTE FICHEIRO ANTES DE QUALQUER AÇÃO, EDIÇÃO DE CÓDIGO, RESPOSTA OU EXECUÇÃO DE COMANDOS.**
> NENHUMA REGRA DAQUI PODE SER VIOLADA, ESQUECIDA, OMITIDA OU ALTERADA SEM AUTORIZAÇÃO EXPRESSA E ESCRITA DA PROPRIETÁRIA (AMANDA ABREU).

---

## 🔴 BLOCO ANTI-ALUCINAÇÃO — LEITURA OBRIGATÓRIA ANTES DE QUALQUER AUDITORIA

```
╔══════════════════════════════════════════════════════════════════╗
║              MIRA — PROIBIÇÕES ABSOLUTAS DA IA                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🔴 NUNCA declarar 🟢 HOMOLOGADO sem query SQL real visível     ║
║  🔴 NUNCA declarar HOMOLOGADO na mesma sessão em que o          ║
║     código foi escrito                                           ║
║  🔴 NUNCA usar testes Node.js em memória como prova             ║
║  🔴 NUNCA afirmar que um evento de telemetria funciona          ║
║     sem verificar que o nome do action no código                 ║
║     é IDÊNTICO ao nome que a query procura                      ║
║  🔴 NUNCA afirmar que RLS não bloqueia sem testar INSERT        ║
║     com anon key e confirmar o registo no Supabase              ║
║  🔴 NUNCA usar Math.max(baseline,...) ou ?? valor_fixo          ║
║     em métricas do Admin Hub                                     ║
║  🔴 NUNCA apresentar números do dashboard como "reais"          ║
║     sem provar a tabela e query de origem                        ║
║  🔴 NUNCA confundir "teste que passa" com "funciona"            ║
║  🔴 NUNCA confundir "build verde" com "funciona"                ║
║  🔴 NUNCA confundir "tsc = 0" com "funciona"                   ║
║                                                                  ║
║  ✅ PROVA REAL EXIGE:                                           ║
║     1. Query SQL executada → resultado numérico visível          ║
║     2. INSERT confirmado no Supabase (não apenas sem erro)       ║
║     3. Nome do evento no código === nome na query               ║
║     4. Número UI === Número SQL (reconciliação)                 ║
║                                                                  ║
║  SE NÃO TENS OS 4 → DECLARAR: ⚪ NÃO VERIFICADO               ║
║  NUNCA DECLARAR:               🟢 HOMOLOGADO                    ║
║                                                                  ║
║  ESTA REGRA EXISTE PORQUE A IA FALHOU EM 2026-08-12:            ║
║  - Declarou 46/46 PASS com testes em memória fabricados         ║
║  - Declarou HOMOLOGADO sem testar RLS                           ║
║  - Não detectou event names errados (session_start vs           ║
║    app_access, simulation_completed vs use_simulator)            ║
║  - Não encontrou todos os baselines hardcoded                   ║
║  - Apresentou números falsos como reais                         ║
╚══════════════════════════════════════════════════════════════════╝
```



---

## 🏛️ REGRAS ABSOLUTAS DO PROJETO (PILARES FUNDAMENTAIS)

- **GitHub** = Fonte soberana de versionamento do **CÓDIGO**
- **Supabase** = Fonte de verdade soberana dos **DADOS** (apenas para tabelas efetivamente modeladas e persistidas no PostgreSQL com RLS)
- **Vercel** = Ambiente automatizado de **BUILD E DEPLOYMENT**
- **Backups** = Estritamente **RECUPERAÇÃO / REFERÊNCIA HISTÓRICA** (Somente Leitura)
- **React** = Representação dos dados na interface
- **Services** = Camada de acesso e transporte de dados
- **PostgreSQL** = Persistência relacional no Supabase
- **RPC/Functions** = Regras/transações críticas em base de dados
- **Realtime** = Distribuição instantânea de mudanças sem necessidade de F5
- **F5 / Manual Refresh** = NÃO é mecanismo de sincronização aceitável
- **Deployment verde** ≠ Sistema homologado
- **localStorage / Estado React / Fallbacks** = Estado local volátil (É ESTRITAMENTE PROIBIDO apresentar dados em cache local como "dados persistentes da plataforma")

---

## 📌 1. DIRETÓRIO E PASTA ÚNICA PERMITIDA (SOBERANIA TOTAL & PIPELINE)

### Fluxo de Ambientes:
```
           DESENVOLVIMENTO
                  │
                  ▼
   C:\Users\Utilizador\mira-projeto
                  │
                  ▼
               Git
                  │
                  ▼
              GitHub
                  │
                  ▼
              Vercel
                  │
                  ▼
            PRODUÇÃO
                  │
                  ▼
            Supabase
```
- **O ÚNICO PROJETO E DIRETÓRIO ACEITÁVEL É:** `C:\Users\Utilizador\mira-projeto`
- É estritamente proibido criar, modificar, executar comandos ou salvar ficheiros de código fora deste diretório.

---

## 📌 2. MANUSEAMENTO E TRATAMENTO DE BACKUPS (SOMENTE LEITURA)

> 🚨 **REGRA DE SEGURANÇA:** BACKUPS SÃO SOMENTE LEITURA DURANTE AUDITORIA.
> NUNCA editar ficheiros na pasta `backups\` para depois copiar. Nenhum arquivo em `backups\` deve ser tratado como código ativo.

### Procedimento Obrigatório para Recuperar Código:
1. Identificar versão;
2. Comparar;
3. Validar;
4. Copiar explicitamente para `src\`;
5. Executar `npx tsc --noEmit` (0 erros);
6. Executar `npm run build` (OK);
7. Testar localmente;
8. Versionar no Git.

---

## 📌 3. ARQUITETURA DE DADOS: LEITURA, ESCRITA & SUPABASE REALTIME (SEM F5)

### Arquitetura de Dados Ideal:
```
   SUPABASE (PostgreSQL)
            │
  ┌─────────┴─────────┐
  ▼                   ▼
PostgreSQL         Realtime
  │                   │
  │              subscription
  │                   │
  └─────────┬─────────┘
            ▼
     Service / Handler
            │
            ▼
     Estado React
            │
            ▼
          UI
```

### Fluxo de Leitura, Escrita e Atualização Sem F5:
```
[ USUÁRIO ] ──> (publica / comenta / vota / cria alerta)
     │
     ▼
[ REACT / APP ]
     │
     ├──────────────────────────────────────────┐
     ▼                                          ▼
[ LEITURA ]                               [ ESCRITA ]
  ├── SELECT Inicial (Fetch)                ├── INSERT / UPDATE
  └── Paginação / Joins                     ├── DELETE / RPC
     │                                          │
     └───────────────────┬──────────────────────┘
                         │
                         ▼
             [ SUPABASE (PostgreSQL) ]
                         │
                         │ (Mudanças / Postgres Changes)
                         ▼
               [ SUPABASE REALTIME ]
                         │
                         ▼
               [ SUBSCRIÇÕES REACT ]
                         │
                         ▼
              [ ESTADO DA INTERFACE ]
                         │
                         ▼
               [ APP ATUALIZADO (SEM F5) ]
```

---

## 📌 4. MOTOR DE GAMIFICAÇÃO, BADGES E FLUXO ALVO

### Arquitetura de Gamificação e Recompensas:
```
[ AÇÃO DO UTILIZADOR ]
         │
         ▼
[ GAMIFICATION ENGINE ]
         │
         ├──────────────────────┬──────────────────────┐
         ▼                      ▼                      ▼
       [ XP ]               [ PONTOS ]            [ CONTADORES ]
         │                      │                      │
         ▼                      ▼                      ▼
      [ NÍVEL ]            [ REPUTAÇÃO ]         [ BADGE ENGINE ]
                                                       │
                                                       ▼
                                                 [ CONQUISTA ]
                                                       │
                                                       ▼
                                                [ PERSISTÊNCIA ]
                                                       │
                                                       ▼
                                                [ NOTIFICAÇÃO ]
                                                       │
                                                       ▼
                                                 [ SUPABASE ]
```

### Regras de Atribuição e Estrutura:
- **XP**: Responsável pela progressão que determina o **NÍVEL**.
- **PONTOS**: Determinam a **REPUTAÇÃO / CONTRIBUIÇÃO** e a posição no ranking.
- **BADGE**: Conquista ativada por regra específica atingida no banco de dados.
- **TRUE/FAKE (VERIFICAÇÃO COMUNITÁRIA)**: Contribuição de validação comunitária de fact-checking que gera pontos/XP conforme a regra definida.

### Fluxo de Notificação e Registro de Badges:
```
AÇÃO DO USUÁRIO
       │
       ▼
REGRA DE GAMIFICAÇÃO
       │
       ├── XP
       ├── Pontos
       └── verifica badges
                 │
                 ▼
           Badge conquistado?
              /       \
            NÃO        SIM
            │           │
            │           ▼
            │      user_badges
            │           │
            │      ┌────┴─────┐
            │      ▼          ▼
            │  notification  audit_log
            │
            └──────────┬─────────
                       ▼
                    Realtime
                       │
                       ▼
                     React
                       │
                       ▼
              "Você ganhou o badge!"
```

### Estrutura do Badge Engine:
```
BADGE ENGINE
                         │
                         ▼
                ┌─────────────────┐
                │ badge_registry  │
                ├─────────────────┤
                │ badge_id        │
                │ name            │
                │ description     │
                │ icon            │
                │ criteria        │
                │ active          │
                └────────┬────────┘
                         │
                  regra atingida
                         │
                         ▼
                 ┌───────────────┐
                 │ user_badges   │
                 ├───────────────┤
                 │ user_id       │
                 │ badge_id      │
                 │ earned_at     │
                 │ source        │
                 └───────┬───────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         Perfil       Notificação  Auditoria
```

---

## 📌 5. ARQUITETURA DE JOB ALERTS (ALERTAS DE EMPREGO)
- **Estrutura Obrigatória:**
  1. **Preferências (`user_job_alerts`):** Persistidas no Supabase com `user_id`, `work_topic`, `location`, `keywords`, `frequency`, `is_active`.
  2. **Matching Engine (`evaluateJobMatch`):** Compara vagas x preferências ativas calculando Score (0-100) e motivo detalhado.
  3. **Deduplicação Estrita:** Chaves `${userId}:${jobId}:${alertId}` em `deliveredKeys`.
  4. **Notificações Persistentes:** Registos reais em `notifications` com `type: 'jobs'`.
  5. **Supabase Realtime (Sem F5):** Subscrição live (`subscribeToJobAlerts`) para atualização instantânea sem F5.

---

## 📌 6. REGRA PERMANENTE DE PURGA DE VAGAS (> 90 DIAS DE IDADE) & BLINDAGEM DE FONTES
- **MÁXIMO DE 90 DIAS DE IDADE:** SÓ É PERMITIDO EXIBIR E ARMAZENAR VAGAS PUBLICADAS HÁ NO MÁXIMO 90 DIAS.
- Purga automática diária no PostgreSQL (`DELETE FROM job_posts WHERE created_at < NOW() - 90 DAYS`) e filtragem na UI (`isWithin90Days()`) e rotinas de sync em `JobBoard.tsx` e `api/sync-jobs.js`.
- **BLINDAGEM TOTAL DAS FONTES (`src/utils/jobSourcesDatabase.ts`):** O catálogo de fontes de emprego contém a lista oficial fornecida pela proprietária com 116 diretórios/empresas e é ESTRITAMENTE PROTEGIDO. É terminantemente proibido apagar, alterar ou desfigurar a lista de fontes.

---

## 📌 7. CONTAGEM E UNIFICAÇÃO DA BASE DE VAGAS (5.280+ VAGAS DOS 66 PORTAIS)
- O contador total no `JobBoard.tsx` DEVE consolidar a consulta do Supabase (`.limit(5000)`) com a base massiva unificada (`PROTECTED_JOBS` com 3.274+ ofertas), mantendo a baseline auditada de **5.280+ vagas ativas**.

---

## 📌 8. BOTÕES DE DOWNLOAD DO APP (PWA) — DISPARO DIRETO DO ATALHO MIRA IMIGRANTE
- **Visibilidade Permanente:** O botão de instalação do App na tela de login (`AuthScreen.tsx`) e cabeçalho (`TopBar.tsx`) é PERMANENTE e NUNCA pode desaparecer.
- **DESCARREGAMENTO DIRETO DO ATALHO ("MIRA IMIGRANTE"):** Clicar em qualquer botão "Baixar App / Instalar Aplicação" DEVE acionar o assistente PWA nativo (`pwaService.triggerInstall()`) E DESCARREGAR NA HORA para o telemóvel ou computador o ficheiro atalho executável `MIRA IMIGRANTE.url` com o logo oficial do MIRA.
- **PROIBIDO ALERTAS PASSIVOS DE TEXTO:** É estritamente proibido exibir avisos ou popups de texto passivos (*"Para instalar no computador aceda ao menu..."*).

---

## 📌 9. DESIGN E RESPONSIVIDADE MÓVEL 100% FLUIDA
- Barra superior (`TopBar.tsx`) e componentes principais 100% RESPONSIVOS no telemóvel (320px–390px) com badges compactos (`[ App ]`), truncagem (`truncate`) e `flex-nowrap`.

---

## 📌 10. FREQUÊNCIA DE MODAIS (1X AO DIA POR UTILIZADOR)
- Modais RGPD e PWA exibidos no máximo 1 vez por dia via `localStorage`.
- No modo PWA Standalone, o convite de instalação desaparece permanentemente.

---

## 📌 11. PRESERVAÇÃO INTEGRAL E SOBERANIA DE MÉTRICAS (NUNCA REGREDIR)
- Métricas vitais JAMAIS PODEM REGREDIR:
  - Utilizadores Registados: $\ge 1.015$ (base) / retenção $\ge 82\%$ (832)
  - Consultas IA Auditadas: $\ge 18.642$
  - Horas Burocráticas Poupadas: $\ge 4.567\text{h}$
  - Acessos à Plataforma: $\ge 49.592$
  - Vagas da Plataforma: $\ge 5.326$ (base auditada) / $5.280+$ ativas
- Consultas à DB devem usar `Math.max(dbValue, baseline)`.

---

## 📌 12. BOTÃO DE DENÚNCIA (MAILTO) E INTERAÇÕES DA COMUNIDADE
- Botão de denúncia aciona protocolo `mailto:` formatado.
- Curtir, Salvar e Comentar incrementam imediatamente a UI e persistem no Supabase.

---

## 📌 13. AUTENTICAÇÃO E VISIBILIDADE DE EMAILS ADMIN
- Login SEMPRE por Email + Password (sem OTP/magic link).
- Emails de utilizadores visíveis sem máscaras (`••••@••••`) no Admin Hub.

---

## 📌 14. PROTOCOLO OBRIGATÓRIO DE DEPLOYMENT E ALTERAÇÃO (13 PASSOS)

```
1. AUDITAR
    │
    ▼
2. IDENTIFICAR ARQUIVO
    │
    ▼
3. IDENTIFICAR DEPENDÊNCIAS
    │
    ▼
4. PRESERVAR BACKUP (Somente Leitura)
    │
    ▼
5. ALTERAR APENAS O NECESSÁRIO
    │
    ▼
6. npx tsc --noEmit (0 ERROS)
    │
    ▼
7. npm run build (OK)
    │
    ▼
8. TESTE LOCAL (Vite Porta 3333)
    │
    ▼
9. DIFF / STATUS
    │
    ▼
10. GIT COMMIT & PUSH
    │
    ▼
11. GITHUB & VERCEL
    │
    ▼
12. PRODUÇÃO
    │
    ▼
13. TESTE FUNCIONAL, TESTE DO BOTÃO DE DENÚNCIA (MAILTO) & TESTE REALTIME (DOIS CLIENTES / SEM F5)
```

---

## 📌 15. MIRA — AUDITORIA DE USUÁRIOS E FLUXO DE EXIBIÇÃO

### Arquitetura de Auditoria de Utilizadores:
```
                       SUPABASE AUTH
                            │
                            ▼
                      auth.users
                            │
                     TOTAL REAL
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
       confirmados                    não confirmados
             │
             ▼
       usuários reais
             │
             ▼
       ┌───────────────┐
       │ TABELA PERFIL │
       │ DO MIRA       │
       └───────┬───────┘
               │
               ▼
        usuários exibidos
          no aplicativo
```

### Regras Estritas de Auditoria e Exibição:
1. **Fonte Única da Verdade:** Os utilizadores registados e exibidos na plataforma provêm estritamente das contas ativas e confirmadas da tabela `profiles` associada ao `auth.users` do Supabase.
2. **Proibição Absoluta de Limites Estáticos:** É estritamente proibido aplicar fórmulas de teto ou travamentos artificiais (ex: `Math.max(users, 1020)`) na contagem de utilizadores.
3. **Atualização Dinâmica Realtime:** A contagem no Admin Hub, Dashboard e relatórios de impacto deve refletir dinamicamente a contagem em tempo real da base de dados e atualizar automaticamente sem F5 através das subscrições Supabase Realtime.

---

## 📌 16. PROTOCOLO MIRA — SEQUÊNCIA INEGOCIÁVEL EM 23 ETAPAS

```
AUDITAR
   ↓
IDENTIFICAR FONTE
   ↓
IDENTIFICAR ARQUIVO
   ↓
IDENTIFICAR DEPENDÊNCIAS
   ↓
IDENTIFICAR DADOS / TABELAS / RPC
   ↓
PRESERVAR BACKUP
   ↓
ALTERAÇÃO CONTROLADA
   ↓
TSC = 0
   ↓
BUILD = OK
   ↓
TESTE LOCAL
   ↓
DIFF
   ↓
TESTE FUNCIONAL
   ↓
COMMIT
   ↓
PUSH
   ↓
VERCEL
   ↓
PRODUÇÃO
   ↓
TESTE REAL
   ↓
REALTIME
   ↓
DOIS CLIENTES
   ↓
SEM F5
   ↓
HOMOLOGAÇÃO
```

---

## 📌 17. A REGRA DE OURO FINAL DO MIRA

```
╔══════════════════════════════════════════════════════════╗
║                  MIRA — REGRA DE OURO                   ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║ Supabase = fonte de verdade dos DADOS                   ║
║                                                          ║
║ GitHub = fonte de verdade do CÓDIGO                     ║
║                                                          ║
║ Vercel = DEPLOYMENT                                      ║
║                                                          ║
║ React = REPRESENTAÇÃO                                    ║
║                                                          ║
║ Services = ACESSO ORGANIZADO                             ║
║                                                          ║
║ PostgreSQL = PERSISTÊNCIA                                ║
║                                                          ║
║ RPC/Functions = REGRAS CRÍTICAS                          ║
║                                                          ║
║ Realtime = SINCRONIZAÇÃO                                 ║
║                                                          ║
║ localStorage = ESTADO LOCAL AUXILIAR                    ║
║                                                          ║
║ Backups = RECUPERAÇÃO                                    ║
║                                                          ║
║ F5 NÃO É SINCRONIZAÇÃO                                   ║
║                                                          ║
║ TSC = 0 NÃO SIGNIFICA HOMOLOGAÇÃO                        ║
║                                                          ║
║ BUILD VERDE NÃO SIGNIFICA HOMOLOGAÇÃO                    ║
║                                                          ║
║ VERCEL VERDE NÃO SIGNIFICA HOMOLOGAÇÃO                   ║
║                                                          ║
║ TABELA EXISTENTE NÃO SIGNIFICA FUNCIONALIDADE ATIVA      ║
║                                                          ║
║ SERVICE EXISTENTE NÃO SIGNIFICA SERVIÇO HOMOLOGADO       ║
║                                                          ║
║ BADGE EXISTENTE NÃO SIGNIFICA BADGE CONCEDIDO            ║
║                                                          ║
║ NOTIFICATION EXISTENTE NÃO SIGNIFICA ENTREGA REAL        ║
║                                                          ║
║ 1020 NO ADMIN NÃO SIGNIFICA 1020 USUÁRIOS REAIS          ║
║                                                          ║
║ 32 AUTH.USERS É A CONTAGEM COMPROVADA ATUALMENTE         ║
║                                                          ║
║ TODA AFIRMAÇÃO DEVE TER UMA FONTE VERIFICÁVEL            ║
║                                                          ║
║ PIPELINE DE TELEMETRIA SOBERANA:                         ║
║ EVENTO REAL -> REGISTRO PERSISTENTE -> AGREGAÇÃO ->     ║
║ MÉTRICA -> REALTIME -> ADMIN HUB                        ║
║                                                          ║
║ PROIBIDO: NÚMERO DESEJADO -> FALLBACK -> 1020            ║
║ PROIBIDO: HISTÓRICO + LOCALSTORAGE + ESTIMATIVA -> LIVE  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

---

## 📌 18. ARQUITETURA SOBERANA DE AUTENTICAÇÃO E AS 5 BLINDAGENS PERMANENTES DE LOGIN

> ⚠️ **REGRA PERMANENTE E INEGOCIÁVEL (HOMOLOGADA EM 2026-08-13):**
> O FLUXO DE LOGIN, REGISTO E RECUPERAÇÃO DE PALAVRA-PASSE ESTÁ BLINDADO E CONGELADO. É ESTRITAMENTE PROIBIDO ALTERAR, REESCREVER OU REINTRODUZIR FALLBACKS SILENCIOSOS NOS 4 FICHEIROS NÚCLEO (`src/services/authService.ts`, `api/register.js`, `api/recover.js`, `src/components/AuthScreen.tsx`).

### 1. FLUXO DE REGISTO (Criação de Conta)
`AuthScreen` ➔ `authService.signUp()` ➔ `POST /api/register` ➔ `supabaseAdmin.auth.admin.generateLink({ type: 'signup' })` ➔ `action_link` real ➔ `Resend API` (`no-reply@miraimigrante.pt`) ➔ E-mail entregue ➔ Clique em `/auth/callback` ➔ Sessão Supabase estabelecida.

### 2. FLUXO DE RECUPERAÇÃO (Esqueci a Senha)
`AuthScreen` ➔ `POST /api/recover` ➔ `supabaseAdmin.auth.admin.generateLink({ type: 'recovery' })` ➔ `action_link` real ➔ `Resend API` ➔ E-mail entregue com token (`/#access_token=...`) ➔ Clique ativa `isRecoveryMode = true` ➔ `supabase.auth.updateUser({ password })` redefine a senha com sucesso.

### 3. FLUXO DE LOGIN (Autenticação)
`AuthScreen` ➔ `supabase.auth.signInWithPassword({ email, password })` ➔ `authService.fetchProfileWithRetry` ➔ `authService.mapProfileToUser` ➔ Sessão guardada no React State e `localStorage`.

### 🛡️ AS 5 BLINDAGENS PERMANENTES:
1. **Soberania Resend API Gateway:** 100% dos e-mails transacionais (registo e recuperação) são enviados exclusivamente via Resend API (`no-reply@miraimigrante.pt`). É proibido redirecionar para o SMTP nativo do Supabase.
2. **Zero Fallback Silencioso:** É proibido reintroduzir chamadas nativas de fallback como `supabase.auth.signUp()` no cadastro normal. Qualquer erro do backend deve ser propagado e exibido em vermelho na UI.
3. **Validação Obrigatória de `action_link`:** O Resend NUNCA é chamado se `generateLink()` não produzir um `action_link` com token válido. É proibido enviar e-mails com URLs genéricas sem token.
4. **Infraestrutura Unificada:** O backend e o frontend apontam estritamente para o projeto oficial `zqoxqkyfzaywsgngiydx` utilizando a chave de serviço administrativa real (`SUPABASE_SERVICE_ROLE_KEY`).
5. **Salvaguarda de Acesso CEO Fundadora:** Os e-mails de administração (`amandasabreu89@gmail.com`, `mira.app@hotmail.com`) possuem auto-provisionamento de perfil administrativo em caso de exceção de login, garantindo acesso perpétuo.

---

## 📌 19. ARQUITETURA SOBERANA DE INSTALAÇÃO PWA E AS 7 BLINDAGENS PERMANENTES DOS 3 PONTOS DE DISPARO

> ⚠️ **REGRA PERMANENTE E INEGOCIÁVEL (HOMOLOGADA EM 2026-08-13):**
> A ARQUITETURA DE INSTALAÇÃO PWA ESTÁ CENTRALIZADA E PROTEGIDA EM `src/utils/pwa.ts`. É ESTRITAMENTE PROIBIDO VOLTAR A ESPALHAR LÓGICA DE INSTALAÇÃO, CONDICIONAIS SEPARADAS OU REGRAS DE BROWSER DENTRO DOS COMPONENTES DA UI (`AuthScreen.tsx`, `HomeView.tsx`, `App.tsx`).

### 1. OS 3 PONTOS DE ENTRADA UNIFICADOS:
- **Login (`AuthScreen.tsx`):** Chama unicamente `await pwaService.install()`.
- **Home (`HomeView.tsx`):** Chama unicamente `await pwaService.install()`.
- **Modal Diário (`App.tsx`):** Abre 1x por dia no arranque da app e chama `await pwaService.install()`.

### 🛡️ AS 7 BLINDAGENS PERMANENTES DE PWA:
1. **Persistência de Estado em Window:** O objeto `BeforeInstallPromptEvent` é preservado obrigatoriamente no estado global `window.__MIRA_PWA_STATE__` para sobreviver a recriações do módulo pelo Vite/HMR.
2. **Contrato de Decisão Soberana no `pwaService.install()`:**
   - Se Standalone ➔ Devolve `already_installed`.
   - Se `deferredPrompt` disponível ➔ Executa `deferredPrompt.prompt()` e devolve `prompt_accepted` ou `prompt_dismissed`.
   - Se iOS ➔ Devolve `ios_instructions` (ativa o Safari Guide).
   - Se Browser manual/fallback ➔ Devolve `manual_instructions`.
3. **Preservação de Contexto de Gesto do Utilizador (User Activation Frame):** O descarregamento síncrono do atalho `.url` (`pwaService.downloadShortcut()`) deve ocorrer SEMPRE na pilha de eventos do clique do utilizador antes de qualquer instrução `await` que possa revogar a autorização do navegador.
4. **Decisão Diária Centralizada:** A decisão de exibir o pop-up diário pertence exclusivamente a `pwaService.shouldShowDailyModal()` (baseado na data de hoje e em `localStorage`). O `App.tsx` apenas consulta e obedece a este método.
5. **Download de Atalho `.url` Separado:** O ficheiro `MIRA IMIGRANTE.url` é um recurso auxiliar gerado exclusivamente por `pwaService.downloadShortcut()`. É proibido tratar a descarga de um `.url` como equivalente a instalar uma PWA nativa.
6. **Zero Lógica PWA nos Componentes:** NENHUM componente da interface pode inspecionar diretamente `isIOS()`, `isInstallable()` ou capturar o evento `beforeinstallprompt`. Toda a inteligência reside em `src/utils/pwa.ts`.
7. **Salvaguarda de Ficheiros Núcleo PWA:** Os 4 ficheiros (`src/utils/pwa.ts`, `src/components/AuthScreen.tsx`, `src/components/HomeView.tsx`, `src/App.tsx`) constituem a arquitetura oficial de PWA.
8. **Telemetria Realtime com Baseline Zero:** Como a funcionalidade e os botões PWA foram criados e disponibilizados em **12/08/2026**, o baseline histórico cumulativo de PWA é rigorosamente **0**. A métrica de downloads/instalações é 100% realtime a partir da tabela `public.activity_logs` (`action = 'pwa_install'`).

---

## 📌 20. REGRA PERMANENTE E INVIOLÁVEL: SERVIÇOS PROTEGIDOS DE APOIO A PCD E AJUDA HUMANITÁRIA

> ⚠️ **BLINDAGEM SOBERANA PERPÉTUA (HOMOLOGADA EM 2026-08-16):**
> AS 14 ASSOCIAÇÕES NACIONAIS DE APOIO A PESSOAS COM DEFICIÊNCIA (PCD) RECONHECIDAS OFICIALMENTE PELO INR (INSTITUTO NACIONAL PARA A REABILITAÇÃO) SÃO PARTE INTEGRANTE E INEGOCIÁVEL DOS DADOS PROTEGIDOS DO MIRA (`PROTECTED_SERVICES` EM `src/utils/protectedData.ts` E `MASSIVE_SERVICES_DATABASE` EM `src/utils/massiveServicesDatabase.ts`), SOB A CATEGORIA **"Ajuda Humanitária"**.
> **É ESTRITAMENTE PROIBIDO APAGAR, TRUNCAR, OCULTAR OU RETIRAR QUALQUER UM DESTES REGISTOS DA APLICAÇÃO OU DA BASE DE DADOS SUPABASE.**

### 🏛️ As 14 Organizações Protegidas de PCD (Soberania MIRA):
1. **APD — Associação Portuguesa de Deficientes** (`Largo do Rato, 1B, 1250-185 Lisboa` | `https://www.apd.org.pt`)
2. **ACAPO — Associação de Cegos e Amblíopes de Portugal** (`Av. D. Carlos I, nº 126 – 9º, 1200-651 Lisboa` | `https://www.acapo.pt`)
3. **FENACERCI — Federação Nacional das Cooperativas de Solidariedade Social** (`Rua Augusto Macedo, nº 2 A, 1600-794 Lisboa` | `https://www.fenacerci.pt`)
4. **FPAS — Federação Portuguesa das Associações de Surdos** (`Praceta Miguel Cláudio, nº 3 B, 2700-585 Amadora` | `https://fpasurdos.pt`)
5. **FAPPC — Federação das Associações Portuguesas de Paralisia Cerebral** (`Av. Rainha D. Amélia, 1600-676 Lisboa` | `https://www.fappc.pt`)
6. **FPDA — Federação Portuguesa de Autismo** (`Rua José Luís Garcia Rodrigues, Bairro do Alto da Ajuda, 1300-565 Lisboa` | `https://www.fpda.pt`)
7. **FPDD — Federação Portuguesa de Desporto para Pessoas com Deficiência** (`Rua Presidente Samora Machel, Lt. 7 – Lj. Direita R/ch, 2620-061 Olival Basto` | `https://www.fpdd.org`)
8. **FEDRA — Federação de Doenças Raras de Portugal** (`Rotunda Nuno Rodrigues dos Santos, nº 1 B – 8º B – Sala Azul, 2685-223 Portela LRS` | `https://www.fedra.pt`)
9. **ASBIHP — Associação Spina Bifida e Hidrocefalia de Portugal** (`Rua Botelho Vasconcelos, Lote 567, Letra D, Zona J Chelas, 1900-637 Lisboa` | `https://www.asbihp.pt`)
10. **SPEM — Sociedade Portuguesa de Esclerose Múltipla** (`Rua Zófimo Pedroso, nº 66, 1950-291 Lisboa` | `https://www.spem.pt`)
11. **FORMEM — Federação Portuguesa da Formação Profissional e Emprego** (`Rua Coronel Veiga Simão – Edf. CTVC, 3.º Piso, 3025-307 Coimbra` | `https://www.formem.org.pt`)
12. **CNOD — Confederação Nacional de Organizações de Pessoas com Deficiência** (`Av. João Paulo II, Lote 528 – 1º A, 1950-430 Lisboa` | `https://cnod.pt`)
13. **Associação Salvador** (`Av. Fontes Pereira de Melo, 14, 9º, 1050-121 Lisboa` | `https://www.associacaosalvador.com`)
14. **CVI — Centro de Vida Independente** (`Avenida João Paulo II, Lote 526, R/C, Loja A, 1950-159 Lisboa` | `https://www.vidaindependente.org`)

### 🛡️ Regras de Preservação:
- Cada registo contém estritamente os campos: **Nome da Associação**, **Endereço Completo** e **Site**.
- Estão mapeados com categoria `Ajuda Humanitária` e sincronizados no Supabase com contagem permanente na plataforma.
- Nenhum agente ou rotina automatizada tem autorização para remover ou desindexar estes nós.

---

## 📌 21. REGRA PERMANENTE: MÓDULO DE EMPREGOS — SINGLE SOURCE OF TRUTH & IDEMPOTÊNCIA

> 🏆 **HOMOLOGAÇÃO GOLD DEFINITIVA (EM 19/08/2026):**
> O módulo de empregos foi submetido a auditoria forense, saneamento de dados, deduplicação dinâmica, normalização canónica de URLs, eliminação de fontes estáticas e unificação de contadores.
> 
> - **Fonte Única de Verdade:** `public.job_posts` no Supabase.
> - **Invariante Estrutural Permanente:** `COUNT(*) === COUNT(DISTINCT source_url)` com 0 duplicações, 0 URLs NULL e 0 URLs vazias.
> - **Contadores Unificados:** JobBoard, Admin Hub e Dashboard leem estritamente do Supabase, sem baselines, fallbacks fixos (5326, 5280) ou fusões estáticas em tempo de execução.
> - **Canonicalização:** Todas as novas vagas passam por `canonicalizeUrl` (remoção de tags UTM, tracking e barras finais) antes da verificação e inserção.
> - **Idempotência Homologada:** Duas sincronizações consecutivas mantêm a base matematicamente estável, sem gerar duplicações.

---

## 📌 22. REGRA PERMANENTE & INVIOLÁVEL: STANDARD OFICIAL DE GERAÇÃO DE RELATÓRIOS (PDF & EXCEL)

> 🏆 **HOMOLOGAÇÃO GOLD DEFINITIVA (EM 22/08/2026) — APROVADO PELA PROPRIETÁRIA:**
> Este é o **STANDARD ÚNICO E OFICIAL** para a arquitetura, diagramação, tipografia, espaçamentos e distribuição de tabelas em todos os relatórios da plataforma MIRA.

### 🏛️ 1. Cronologia Oficial & Período Operacional
- **Data Oficial de Lançamento:** **`09/04/2026`** (9 de Abril de 2026).
- **Cabeçalho Oficial do PDF:**
  `Período dos Dados: 09 de Abril de 2026 a [Data Atual] (Histórico Operacional em Tempo Real)`
- **Série Temporal do Excel:** Início estrito em `04/2026` (Abril de 2026) até o mês atual corrente.

### 📐 2. Sistema Tipográfico Oficial (`PDF_TYPO`)
- `headerTitle`: **13.0pt** (Negrito, `#0f172a`, título principal institucional)
- `headerSubtitle`: **7.5pt** (Cor secundária `#475569`, dossiê de financiamento)
- `headerTimestamp`: **6.8pt** (Itálico `#94a3b8`, data e hora ao segundo)
- `sectionTitle`: **11.5pt** (Negrito `#0f172a`, títulos principais numerados: `1.`, `2.`, `3.`, `4.`, `5.`, `6.`)
- `subSectionTitle`: **10.5pt** (Negrito `#0f172a`, subtítulos numerados: `2.1.`, `3.1.`, `4.1.`, `5.1.`)
- `tableHead`: **7.2pt** (Negrito, texto branco, `cellPadding: 1.6`)
- `tableBody`: **6.8pt** (Regular, texto escuro `#0f172a`, `cellPadding: 1.3`)
- `cardLabel`: **5.8pt** | `cardValue`: **10.5pt** (Negrito) | `cardNote`: **5.2pt**
- `boxTitle`: **7.5pt** (Negrito) | `boxBody`: **6.6pt** (Regular)
- `footer`: **7.0pt** (`#64748B`, rodapé com `Página X de Y` dinâmico)

### 📏 3. Espaçamentos, Margens & Quebra de Texto
- **Margens:** Esquerda `14mm`, Direita `14mm`, Topo `16mm`, Fundo `16mm` (`pageW = 210mm`, `pageH = 297mm`).
- **Espaço entre Tabelas:** `8mm` entre o final de uma tabela (`lastAutoTable.finalY`) e o próximo título.
- **Espaço Título ➡️ Tabela:** `5mm` entre o título e o início do `autoTable`.
- **Blindagem de Caixas de Texto:** **É ESTRITAMENTE OBRIGATÓRIO** usar `splitTextToSize(text, pageW - 36)` e cálculo dinâmico de altura (`boxHeight = 8 + (splitText.length * 3.8)`) para que nenhum texto transborde das caixas.

### 📑 4. Diagramação Compacta em 4 Páginas (Densidade Máxima Sem Espaços Vazios)
- **Página 1 (Visão Executiva & Infraestrutura):**
  1. Cabeçalho MIRA com Logo Oficial Base64 embutido e metadados.
  2. Caixa de Justificação de Impacto Social para fundos (FAMI, EUSIC, PT2030, IEFP, PRR).
  3. 8 Cartões KPI em 2 linhas (Utilizadores, Vagas, Consultas IA, Horas Poupadas, Acessos, Interações, Retenção, PWA).
  4. `1. Indicadores Auditados de Infraestrutura e Atividade` (12 linhas de infraestrutura).
- **Página 2 (Consultas IA & Mercado de Trabalho — 4 Tabelas):**
  1. `2. Volume de Consultas pelas 10 Áreas Temáticas MIRA` (10 linhas).
  2. `2.1. Termos de Busca Mais Pesquisados na Plataforma` (8 linhas / Top Pain Points).
  3. `3. Métricas de Vagas por Setor Profissional (117 Portais Ativos)` (7 setores).
  4. `3.1. Distribuição de Vagas por Regime de Trabalho e Geografia` (4 regimes/regiões).
- **Página 3 (Habitação, Serviços Públicos, Simuladores & Minutas — 4 Tabelas):**
  1. `4. Preço Médio de Referência e Procura por Tipologia Habitacional` (5 tipologias).
  2. `4.1. Balcões Públicos & Associações Mapeadas (127 Locais Ativos)` (7 balcões prioritários).
  3. `5. Simuladores & Ferramentas de Cálculo Financeiro (5.063 Simulações)` (5 simuladores).
  4. `5.1. Minutas & Documentos Jurídicos Descarregados (3.454 Downloads)` (5 minutas).
- **Página 4 (Fontes Regulatórias & Salvaguarda Legal):**
  1. `6. Fontes Oficiais, Entidades Governamentais & Bases Mapeadas` (14 fontes governamentais).
  2. Caixa de Declaração de Integração de Dados Oficiais.
  3. Caixa de Aviso Legal, Conformidade RGPD & Isenção de Responsabilidade.

---

> 🔒 **ESTE ARQUIVO É A REGRA MESTRA E MEMÓRIA PERMANENTE DO PROJETO MIRA. CONSULTAR ANTES DE QUALQUER AÇÃO OU ALTERAÇÃO.**
> 📜 **O PROTOCOLO INTEGRAL DE AUDITORIA E HOMOLOGAÇÃO ESTÁ REGISTADO EM [`STANDARD_OF_AUDIT.md`](file:///c:/Users/Utilizador/mira-projeto/STANDARD_OF_AUDIT.md).**
