# 📖 MIRA METRIC DEFINITIONS & TECHNICAL SHEETS (V1.3 SOBERANA)
## Fichas Técnicas dos 16 Indicadores Canónicos do MIRA

---

### MIRA-KPI-010: Navegações & Interações Globais (Indicador Mestre Agregado)

| Atributo | Especificação Normativa |
| :--- | :--- |
| **Identificador Global** | `MIRA-KPI-010` |
| **Nome Oficial** | Navegações & Interações Globais |
| **Papel na Arquitetura** | **INDICADOR MESTRE AGREGADO DE UTILIZAÇÃO DA PLATAFORMA** |
| **Definição Soberana** | Indicador agregado de utilização e interação funcional da plataforma MIRA, contabilizando todas as interações funcionais elegíveis realizadas por utilizadores humanos externos/reais dentro do ecossistema MIRA. |
| **Classificação de Auditoria**| 🟢 **LIMITE INFERIOR ATUALMENTE COMPROVÁVEL ($\ge 51.561$)** |
| **Proveniência do Baseline** | $50.000$ (Origem documental em $49.592$ de `DOCUMENTO_MESTRE_INDICADORES_AUDITORIA.md`, consolidado como `HISTORICAL_BASE_ACCESSES = 50000` em `081561ba` e tipificado como `BASELINES.TOTAL_INTERACTIONS = 50000` em `c1bc781d`). A proveniência numérica está comprovada; a equivalência semântica decorre de consolidação arquitetural no código. |
| **Incremento Pós-Cutoff** | $1.561$ eventos funcionais humanos diretamente observados em `public.activity_logs`. |
| **Atividade Não Instrumentada**| `UNKNOWN` ($\ge 0$). Período de 29/07 a 15/08 sem telemetria RPC ativa em produção + ações client-side em memória. Não quantificável retroativamente. |
| **Declaração Institucional** | $51.561$ é exclusivamente o piso documental auditável. Não constitui estimativa nem projeção do universo total de utilização. |

---

### MIRA-KPI-015: Horas Burocráticas Poupadas (Modelo Econométrico)

| Atributo | Especificação Normativa |
| :--- | :--- |
| **Identificador Global** | `MIRA-KPI-015` |
| **Nome Oficial** | Horas Burocráticas Poupadas pelos Imigrantes |
| **Fórmula Aritmética** | $(N_{\text{minutas}} \times 4.5\text{h}) + (N_{\text{simulações}} \times 1.5\text{h}) + (N_{\text{consultas\_ia}} \times 0.5\text{h})$ |
| **Cálculo Exato** | $(3.454 \times 4,5) + (4.875 \times 1,5) + (18.690 \times 0,5) = 15.543 + 7.312,5 + 9.345 = \mathbf{32.200,5\text{ horas}}$ |
| **Regra de Arredondamento** | Arredondado à unidade inteira (`Math.round`): $\mathbf{32.201\text{ horas}}$. |

---

### MIRA-KPI-016: Taxa de Retenção Recorrente

| Atributo | Especificação Normativa |
| :--- | :--- |
| **Identificador Global** | `MIRA-KPI-016` |
| **Nome Oficial** | Taxa de Retenção e Utilização Recorrente |
| **Fórmula Aritmética** | $(832 / 1.048) \times 100$ |
| **Cálculo Exato** | $79,3893...\%$ |
| **Apresentação Oficial** | $\mathbf{79,4\%}$ (1 casa decimal) ou $\mathbf{79\%}$ (inteiro). |
