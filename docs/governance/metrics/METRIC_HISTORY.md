# 📜 MIRA METRIC HISTORY & GIT PROVENANCE (V1.4 SOBERANA)
## Linha do Tempo de Baselines, Decisões Arquiteturais e Genealogia Numérica

---

## 🏛️ 1. GENEALOGIA DOCUMENTAL DOS 50.000

```
1. Commit 6d91ebba (01/08/2026) — Amanda Jhonnes
   "fix(admin): restore total platform accesses baseline to 49,592 accesses across all app modules"
   Código: realAccesses = Math.max(appAccessesCount || 0, Math.floor(realUsers * 49.1) : 49592)
                                      │
                                      ▼
2. Commit 67457444 (03/08/2026) — Amanda Jhonnes
   DOCUMENTO_MESTRE_INDICADORES_AUDITORIA.md:
   "Total Acessos à Aplicação: Math.max(dbAccesses, 49592) → 49.592 acessos"
                                      │
                                      ▼
3. Commit 081561ba (14/08/2026) — Amanda Jhonnes
   api/admin.js:
   "const HISTORICAL_BASE_ACCESSES = 50000;
    finalInteractions = HISTORICAL_BASE_ACCESSES + (allActivityLogsRes.count || 0);"
                                      │
                                      ▼
4. Commit c1bc781d (15/08/2026) — Amanda Jhonnes
   lib/telemetryBaselines.js:
   "BASELINES.TOTAL_INTERACTIONS = 50000;
    BASELINES.APP_ACCESSES = 3508;
    TELEMETRY_CUTOFF_DATE = '2026-07-29T00:00:00.000Z';"
```

### Registo Forense de Governança:
* **Proveniência Numérica:** 🟢 **COMPROVADA**. Rastreável a partir de $49.592$ no Git.
* **Equivalência Semântica:** 🟡 **NÃO DEMONSTRADA**. A evolução de "acessos acumulados" para "interações globais" decorre de consolidação de código e não de uma prova independente de que os dois conceitos são idênticos.
* **Lacuna de Cobertura de `activity_logs`:** 🟢 **COMPROVADA**. Entre $29/07$ e $15/08$, o pipeline RPC `mira_track_event` não estava em produção no frontend, justificando por que a tabela `activity_logs` contém apenas uma fração da atividade do período.
