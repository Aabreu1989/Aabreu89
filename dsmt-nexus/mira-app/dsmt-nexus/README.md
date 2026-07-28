# Nexus SBCE - Stakeholder Management System

Nexus is a strategic CRM platform developed for managing the regulatory agenda of the **Brazilian Carbon Market (SBCE)** within the Ministry of Finance.

## 🚀 Key Features

- **Strategic Dashboard**: Real-time visualization of institutional risk and influence.
- **SBCE Engagement Funnel**: Track stakeholders through 11 stages of the regulatory journey.
- **Priority Scoring Engine**: Automated ranking based on the formula:
  `Priority = Institutional Influence + SBCE Exposure + Urgency + Blocking Potential`
- **Official Taxonomy**: Fully aligned with the 20+ fields required for the Ministry of Finance regulatory monitoring.

## 🛠 Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Vanilla CSS (Custom Cyber-Industrial Theme)
- **Animations**: Framer Motion
- **Data Visualization**: Recharts + Lucide Icons

## 📊 Priority Formula (Official)

Stakeholders are scored on a 1-5 scale across four pillars:
1. **Influence**: Institutional power and decision-making capacity.
2. **Exposure**: How much the SBCE impacts the entity.
3. **Urgency**: Timeliness of the required engagement.
4. **Risk**: Potential to block or delay the agenda.

Total Score: **0-20 points**.

## 📂 Project Structure

- `/src/data.ts`: Central repository of stakeholders (Source of Truth).
- `/src/types.ts`: Regulatory taxonomy and TypeScript interfaces.
- `/src/App.tsx`: Main dashboard logic and routing.
- `/src/JornadaStakeholder.tsx`: Visual conversion funnel component.

## ⚙️ How to Run

1. `npm install`
2. `npm run dev`

---
*Developed by Nexus AI - Institutional Intelligence Unit.*
