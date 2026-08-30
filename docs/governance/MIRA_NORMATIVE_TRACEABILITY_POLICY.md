# 🏛️ POLÍTICA SOBERANA MIRA: RASTREABILIDADE NORMATIVA, EFICÁCIA TEMPORAL E VERSIONAMENTO FISCAL DE SIMULADORES

**Código do Documento:** `MIRA-GOV-POL-005`  
**Data de Homologação:** 29 de Agosto de 2026  
**Âmbito:** Transversal a todos os simuladores financeiros, motores de cálculo fiscal, regras da Segurança Social, requisitos AIMA e wizards de apoio legal do ecossistema MIRA.

---

## 🎯 1. O Princípio da Soberania Normativa

> **Regra de Ouro (MIRA-GOV-POL-005):**  
> **"Código Correto ≠ Legislação Correta."**  
> Nenhum simulador ou motor de cálculo do MIRA pode ser classificado como normativamente "atual" ou "conforme" apenas pela presença estática dos seus parâmetros no código ou pela ausência de erros de compilação. A validade de cada parâmetro deve ser estritamente auditável e verificável contra a fonte normativa oficial soberana, a sua publicação no Diário da República ou Circular setorial e o respetivo período de eficácia temporal.

---

## ⛓️ 2. Cadeia de Rastreabilidade Obrigatória

Todo e qualquer parâmetro de cálculo integrado nos simuladores deve demonstrar a seguinte linhagem:

$$\text{Fonte Legal Soberana (DRE / AT / ISS / BdP)} \longrightarrow \text{Interpretação Jurídica} \longrightarrow \text{Parâmetro Versionado} \longrightarrow \text{Fórmula Estanque} \longrightarrow \text{Resultado Auditável}$$

---

## 🏗️ 3. Arquitetura de Versionamento por Exercício Fiscal

Os motores de cálculo não devem depender de constantes anuais mutáveis sobrescritas no mesmo ficheiro. A arquitetura exige:
1. **Separação estanque** entre o motor de cálculo (fórmula matemática) e a tabela de parâmetros (valores do ano).
2. **Versionamento por ano de vigência** (`rules_2025.ts`, `rules_2026.ts`, `rules_2027.ts`).
3. **Metadados Obrigatórios por Parâmetro:**
   * `valor`
   * `ano de vigência / período de eficácia temporal`
   * `fonte oficial soberana (Diário da República, Circular AT, etc.)`
   * `data de publicação e entrada em vigor`
   * `artigo / número / alínea legal específica`
   * `URL oficial de verificação`

---

## 📋 4. Matriz Canónica de Fontes Vigentes (Exercício 2026)

| Indicador / Parâmetro | Valor MIRA 2026 | Fonte Oficial Soberana | Artigo / Diploma Legal |
| :--- | :---: | :--- | :--- |
| **RMMG (Salário Mínimo)** | `920,00 €` | Acordo Tripartido 2025–2028 / DRE | Decreto-Lei de Fixação da RMMG 2026 |
| **IAS (Apoios Sociais)** | `537,13 €` | Portaria de Fixação do IAS / DRE | Portaria n.º 421/2024 e atualizações |
| **Retenção na Fonte IRS** | Tabelas I, II, III | Autoridade Tributária e Aduaneira (AT) | Despacho n.º 233-A/2026 & Circular n.º 1/2026 |
| **IRS Jovem** | 100%, 75%, 50%, 25% | Código do IRS (CIRS) | Artigo 12.º-B do CIRS (até 35 anos) |
| **Segurança Social (TI)** | 21,4% / 70% Base | Código dos Regimes Contributivos (ISS) | Artigos 139.º a 168.º da Lei n.º 110/2009 |
| **Pensão de Velhice** | 66 anos e 4 meses | MTSSS / DRE | Portaria n.º 396/2023 (Fator Sustentabilidade) |
| **Meios Subsistência AIMA** | 920€ + 30%/dep. | AIMA / MAI | Portaria n.º 1563/2007 & Art. 52.º Lei 23/2007 |
| **IRC Reduzido PMEs** | 12,5% até 50.000 € | Código do IRC (CIRC) | Artigo 87.º, n.º 2 do CIRC |
| **Cauções e Rendas** | Máx. 2 Cauções + 1 Renda | Código Civil Português | Artigo 1076.º do Código Civil (Lei n.º 56/2023) |

---

## 🚫 5. Proibições Expressas

* ❌ Proibido alterar retroativamente parâmetros de anos anteriores ao introduzir um novo ano fiscal.
* ❌ Proibido declarar um simulador como "100% conforme" sem prova documental do diploma legal em vigor.
* ❌ Proibido hardcodar deduções fiscais sem referenciar a tabela ou circular oficial da AT.
