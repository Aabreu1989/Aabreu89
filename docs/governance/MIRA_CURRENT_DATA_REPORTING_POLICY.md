# 🏛️ POLÍTICA SOBERANA MIRA: ATUALIDADE, DINAMISMO, EXCLUSÃO DE TELEMETRIA E RECONCILIAÇÃO DE DADOS EM RELATÓRIOS

**Código do Documento:** `MIRA-GOV-POL-004`  
**Data de Homologação:** 29 de Agosto de 2026  
**Âmbito:** Transversal a todos os relatórios PDF, Excel, Dashboards, Exports e Dossiês de Candidatura.

---

## 🎯 1. Princípio da Primazia do Estado Atual

Todos os relatórios e documentos que apresentem métricas e indicadores do ecossistema MIRA **DEVEM refletir a realidade operacional viva da plataforma no exato momento da sua geração**.

> **Regra de Ouro:**  
> O relatório deve extrair os dados diretamente das fontes soberanas em tempo real (PostgreSQL Supabase e telemetria auditável). O valor principal apresentado deve sempre refletir o estado mais recente disponível, e nunca uma fotografia obsoleta meramente porque esta foi anteriormente homologada.

---

## 🚫 2. Regra Fundamental: Exclusão Total de Telemetria Não Humana

> **“Eventos de telemetria técnica, sistema, probes, testes, benchmarks, jobs automáticos ou quaisquer eventos não atribuíveis a uma ação humana real e elegível são expressamente excluídos das métricas de utilização, atividade, demanda, interação e impacto humano do MIRA. Esses eventos não podem ser somados às ações humanas para produzir um KPI de utilização humana.”**

> **“A existência de um evento no banco de dados não é suficiente para classificá-lo como ação humana. A elegibilidade semântica do evento deve ser determinada antes da sua inclusão em qualquer KPI humano.”**

> **“Quando houver dúvida entre um evento humano e um evento técnico, o evento não deve ser contabilizado como atividade humana até que sua elegibilidade seja comprovada.”**

---

## ⚖️ 3. Hierarquia entre Dados Vivos e Baselines Históricos

1. **Indicador Principal (Primary Metric):**  
   Deve ser sempre o **valor vivo atual**, calculado dinamicamente no momento da extração a partir de ações humanas elegíveis.
2. **Baseline Histórico (Historical Baseline):**  
   Existe exclusivamente para **comparação temporal, rastreabilidade de auditoria e cálculo de evolução/crescimento**.
3. **Apresentação Obrigatória em Dupla Camada:**
   * **Vagas Ativas Atuais:** `18.276` (População viva em base de dados)
     * *Snapshot Homologado (`MIRA-KPI-003`):* `17.356`
     * *Incremento Reconciliado:* `+920`
   * **Consultas IA Humanas Atuais:** `18.694` (População operacional em tempo real de humanos elegíveis)
     * *Baseline Homologado (`MIRA-KPI-002`):* `18.668`
     * *Incremento Pós-Cutoff:* `+26`
   * **Telemetria Técnica do Sistema:** `2.062` *(Classificada à parte — NÃO contabilizada em KPIs humanos)*
   * **PROIBIDO:** Apresentar a soma técnica `20.756` como métrica de utilização ou demanda humana.

---

## 🧮 4. Regra de Coerência do Universo de Dados

É terminantemente proibido apresentar um total vivo acompanhado de linhas temáticas estáticas ou de universos distintos.
* Se o total de consultas humanas atual é $N$ (ex: $18.694$), então:
  $$\sum_{i=1}^{10} \text{Categorias} = N \quad \text{e} \quad \sum_{j=1}^{18} \text{Tópicos} = N$$
* Todas as percentagens e volumes detalhados derivam dinamicamente da população viva da plataforma.
* Telemetria técnica não entra nestas distribuições.

---

## ⏱️ 5. Timestamp de Auditoria Obrigatório

Todo e qualquer relatório gerado pelo sistema deve estampar de forma visível o carimbo temporal no padrão UTC:
$$\text{"Dados Operacionais Vivos e Auditados em: YYYY-MM-DD HH:mm UTC (Extração Soberana)"}$$

---

## 🚫 6. Proibições Expressas

* ❌ Proibido somar telemetria não humana a consultas ou interações humanas.
* ❌ Proibido hardcodar métricas em arrays estáticos no `exportService.ts`.
* ❌ Proibido alterar cabeçalhos para valores antigos meramente para coincidir com dados estáticos.
* ❌ Proibido omitir o incremento operacional face ao baseline.
* ❌ Proibido utilizar snapshots desatualizados como se fossem a realidade viva da plataforma.
* ❌ Proibido inflacionar artificialmente qualquer indicador de impacto ou utilização.
