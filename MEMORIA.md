# 🧠 MEMORIA.md — ARQUIVO PROTEGIDO DE REGRAS RÍGIDAS E INEGOCIÁVEIS DO PROJETO MIRA

> ⚠️ **ATENÇÃO OBRIGATÓRIA À IA (ANTIGRAVITY / GEMINI / CLAUDE):**
> ESTE FICHEIRO É O NÚCLEO MESTRE DE MEMÓRIA E REGRAS RÍGIDAS DO PROJETO MIRA.
> **DEVES CONSULTAR ESTE FICHEIRO ANTES DE QUALQUER AÇÃO, EDIÇÃO DE CÓDIGO, RESPOSTA OU EXECUÇÃO DE COMANDOS.**
> NENHUMA REGRA DAQUI PODE SER VIOLADA, ESQUECIDA, OMITIDA OU ALTERADA SEM AUTORIZAÇÃO EXPRESSA E ESCRITA DA PROPRIETÁRIA (AMANDA ABREU).

---

## 🏛️ REGRAS ABSOLUTAS DO PROJETO (PILARES FUNDAMENTAIS)

- **Supabase** = Fonte de verdade dos dados (Alvo)
- **React** = Representação dos dados
- **Services** = Camada de acesso
- **PostgreSQL** = Persistência
- **RPC/Functions** = Regras/transações críticas (Alvo)
- **Realtime** = Distribuição de mudanças (Alvo/Homologado)
- **Backups** = Estritamente leitura / recuperação
- **F5** = NÃO é mecanismo de sincronização
- **Deployment verde** ≠ Sistema homologado

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

## 📌 6. REGRA PERMANENTE DE PURGA DE VAGAS (> 60 DIAS DE IDADE)
- **MÁXIMO DE 60 DIAS DE IDADE:** SÓ É PERMITIDO EXIBIR E ARMAZENAR VAGAS PUBLICADAS HÁ NO MÁXIMO 60 DIAS.
- Purga automática diária no PostgreSQL (`DELETE FROM job_posts WHERE created_at < NOW() - 60 DAYS`) e filtragem na UI (`isWithin60Days()`) e rotinas de sync em `JobBoard.tsx` e `api/sync-jobs.js`.

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

> 🔒 **ESTE ARQUIVO É A REGRA MESTRA E MEMÓRIA PERMANENTE DO PROJETO MIRA. CONSULTAR ANTES DE QUALQUER AÇÃO OU ALTERAÇÃO.**
