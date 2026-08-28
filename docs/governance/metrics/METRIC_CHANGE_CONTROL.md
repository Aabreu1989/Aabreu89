# 🛡️ MIRA METRIC CHANGE CONTROL POLICY (V1.4 SOBERANA)
## Política Mandatória de Gestão de Mudanças, Não-Regressão e Proibição de Alterações Silenciosas

---

## 🔒 1. PRINCÍPIO SOBERANO: NO METRIC MAY CHANGE SILENTLY

> **REGRA ZERO DE GOVERNANÇA:**  
> É estritamente proibido a qualquer programador, auditor, script ou agente de IA modificar qualquer query, fórmula, baseline, filtro ou constante de métrica sem aprovação formal e registo prévio neste caderno.
>
> **O CÓDIGO DA APLICAÇÃO É CONSUMIDOR DA FONTE SOBERANA. A FONTE SOBERANA NUNCA É REESCRITA PELO CÓDIGO.**

Qualquer alteração de código que resulte em modificação não autorizada de um KPI reportado é classificada como **METRIC GOVERNANCE VIOLATION** e sujeita a reversão imediata.

---

## 🛑 2. MONOTONIC HISTORICAL KPI RULE (REGRA DE NÃO-REGRESSÃO HISTÓRICA)

Uma métrica histórica homologada **NUNCA pode regredir ou ser apagada retroativamente** em consequência de:
* Refatoração de componentes ou queries;
* Reindexação ou recriação de tabelas no banco de dados;
* Correção de pipelines de telemetria ou introdução de novos RPCs;
* Alteração de definições semânticas em dashboards ou exportadores.

Se um novo sistema de medição for implementado e medir um universo diferente:
1. O histórico homologado permanece **intocado e preservado**.
2. É criado um **novo indicador, subversão ou definição incremental**, documentando formalmente a diferença.
3. É expressamente proibido reescrever o passado a partir de medições do presente.

---

## 📋 3. FLUXO OBRIGATÓRIO DE APROVAÇÃO DE MUDANÇA

```
1. REGISTO DO PEDIDO DE MUDANÇA (RFC)
   ├── Identificador do KPI afetado (ex: MIRA-KPI-002)
   ├── Justificação técnica / metodológica
   └── Estimativa de impacto numérico no KPI
          │
          ▼
2. AUDITORIA READ-ONLY & PROVA MATEMÁTICA
   ├── Execução em staging / script de validação isolado
   └── Demonstração de que não há contaminação de outros KPIs
          │
          ▼
3. APROVAÇÃO FORMAL DA PROPRIETÁRIA / CEO
   └── Autorização expressa e por escrito
          │
          ▼
4. IMPLEMENTAÇÃO CIRÚRGICA & TESTES AUTOMATIZADOS
   ├── npx tsc --noEmit (0 erros)
   ├── npm run build (SUCCESS)
   └── Testes de Reconciliação (METRIC_TEST_CASES.md)
          │
          ▼
5. ATUALIZAÇÃO DO CHANGELOG (METRIC_CHANGELOG.md)
   └── Registo da nova versão (ex: v1.1) e hash do commit
```

---

## 📝 4. FORMULÁRIO PADRÃO DE PEDIDO DE MUDANÇA (METRIC CHANGE REQUEST)

```markdown
### Pedido de Mudança de Métrica (MCR-YYYYMMDD-XX)
* **METRIC_ID:** MIRA-KPI-xxx
* **Versão Anterior:** v1.0
* **Nova Versão Proposta:** v1.1
* **Data do Pedido:** YYYY-MM-DD
* **Autor:** Nome / Email
* **Motivo da Mudança:** (Descrição detalhada)
* **Impacto Numérico Estimado:** Antes: [X] → Depois: [Y] (Delta: [Z])
* **Ficheiros Afetados:** Lista de ficheiros e linhas exatas
* **Status de Aprovação:** [ PENDENTE / APROVADO / REJEITADO ]
* **Assinatura / Autorização:** CEO / Proprietária
```
