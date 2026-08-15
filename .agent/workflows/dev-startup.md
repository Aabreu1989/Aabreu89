---
description: Como arrancar o ambiente de desenvolvimento MIRA de forma estável
---

# 🚀 MIRA Dev — Arranque Estável

## Comando Principal (único necessário)

```
npm run dev
```

Este único comando faz tudo:
1. Arranca o servidor Vite no porto **3333** com o middleware de API integrado
2. As rotas `/api/*` são servidas diretamente pelo Vite (sem servidor separado)
3. Auto-restart em caso de crash

---

## Se o Servidor Ainda Cair

### Passo 1: Matar processos zombie do Node manualmente
Abrir PowerShell como Administrador e correr:
```powershell
Get-Process node | Stop-Process -Force
```

### Passo 2: Arrancar novamente
```
npm run dev
```

---

## Comandos Alternativos

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | **Único comando necessário** (Frontend + API no porto 3333) |
| `npm run dev:vite` | Só o frontend Vite |

---

## Diagnóstico

- **Porto 3333** → Frontend Vite + APIs `/api/*` (tudo integrado)
- **Subdomínio Supabase** → Edge Functions (cloud, sempre disponível)

> ⚠️ **REGRA PERMANENTE:** O MIRA usa EXCLUSIVAMENTE o porto `3333` em desenvolvimento local.
> Não existe porto 3000 nem 3001. Todas as chamadas de API usam URLs relativas (`/api/...`).

Se o browser mostrar a app mas a IA não responde → problema na Edge Function (cloud), não no localhost.
Se a app não carrega de todo → problema no Vite (Porto 3333).
Se login/registo falha → verificar variáveis de ambiente no `.env`.
