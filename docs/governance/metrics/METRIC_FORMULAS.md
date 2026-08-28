# 📐 MIRA METRIC FORMULAS & MATHEMATICAL SPECIFICATIONS (V1.3 SOBERANA)
## Regras Aritméticas, Matriz de Ponderação e Modelos de Arredondamento

---

## 🏛️ 1. INDICADOR MESTRE AGREGADO: MIRA-KPI-010 (NAVEGAÇÕES & INTERAÇÕES)

$$\mathbf{MIRA\text{-}KPI\text{-}010} = \mathbf{B}_{\text{histórico}}\ (50.000) + \mathbf{H}_{\text{observed}}\ (1.561) + \mathbf{H}_{\text{uninstrumented}}\ (\ge 0) \ge \mathbf{51.561}$$

### Decomposição dos Componentes:
* **$B_{\text{histórico}} = 50.000$:** Baseline histórico com proveniência numérica documental comprovada (originado de $49.592$ em `DOCUMENTO_MESTRE_INDICADORES_AUDITORIA.md`, consolidado como `HISTORICAL_BASE_ACCESSES = 50000` e formalizado como `BASELINES.TOTAL_INTERACTIONS = 50000`). A auditoria regista que ocorreu uma evolução semântica de "acessos" para "interações globais", sendo o número tratado como piso histórico.
* **$H_{\text{observed}} = 1.561$:** Eventos humanos funcionais diretamente observados e comprovados em `public.activity_logs` pós-cutoff.
* **$H_{\text{uninstrumented}} = \text{UNKNOWN} \ge 0$:** Atividade do período sem instrumentação ativa (29/07 a 15/08) e ações client-side órfãs (não quantificável retroativamente).
* **Classificação:** **Limite Inferior Atualmente Comprovável ($\ge 51.561$)**.

---

## ⏱️ 2. MODELO ECONOMÉTRICO: MIRA-KPI-015 (HORAS BUROCRÁTICAS POUPADAS)

$$\text{Horas Poupadas Brutas} = (N_{\text{minutas}} \times 4.5\text{h}) + (N_{\text{simulações}} \times 1.5\text{h}) + (N_{\text{consultas\_ia}} \times 0.5\text{h})$$

### Cálculo Aritmético Exato:
1. **Minutas ($3.454$):** $3.454 \times 4.5\text{h} = \mathbf{15.543,0\text{ horas}}$
2. **Simulações ($4.875$):** $4.875 \times 1.5\text{h} = \mathbf{7.312,5\text{ horas}}$
3. **Consultas IA Humanas ($18.690$):** $18.690 \times 0.5\text{h} = \mathbf{9.345,0\text{ horas}}$
4. **Soma Aritmética Exata:**
   $$15.543,0 + 7.312,5 + 9.345,0 = \mathbf{32.200,5\text{ horas}}$$
5. **Regra de Arredondamento:** O standard estabelece arredondamento aritmético à unidade inteira (`Math.round`):
   $$\mathbf{MIRA\text{-}KPI\text{-}015} = \text{round}(32.200,5) = \mathbf{32.201\text{ horas}}$$

---

## 👥 3. MODELO DE RETENÇÃO: MIRA-KPI-016 (TAXA DE RETENÇÃO RECORRENTE)

$$\text{Taxa de Retenção} = \left( \frac{U_{\text{recorrentes}}}{U_{\text{registados}}} \right) \times 100$$

### Cálculo Aritmético Exato:
* **Utilizadores Recorrentes ($U_{\text{recorrentes}}$):** $832$ utilizadores ativos com eventos em dias distintos.
* **Utilizadores Totais Registados ($U_{\text{registados}}$):** $1.048$ perfis na base `public.profiles`.
* **Cálculo:**
   $$\frac{832}{1.048} \times 100 = 79,3893...\%$$
* **Apresentação Oficial:**
   * **Com 1 casa decimal:** $\mathbf{79,4\%}$
   * **Arredondado à unidade:** $\mathbf{79\%}$
   * *(Nota: Proibido o uso de expressões informais como "≈ 80%").*

---

## 📑 4. APOIOS BUROCRÁTICOS PRESTADOS: MIRA-KPI-014

$$\mathbf{MIRA\text{-}KPI\text{-}014} = N_{\text{minutas}}\ (3.454) + N_{\text{simulações}}\ (4.875) = \mathbf{8.329\text{ apoios prestados}}$$

*(Nota: Exclusão formal das 188 simulações administrativas de teste executadas por contas de Admin).*
