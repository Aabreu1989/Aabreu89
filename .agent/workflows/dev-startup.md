---
description: Como arrancar o ambiente de desenvolvimento MIRA de forma estável
---

# 🚀 MIRA Dev — Arranque Estável

## Comando Principal (único necessário)

```
npm run dev
```

Este único comando faz tudo:
1. Liberta as portas 3000 e 3001 se estiverem ocupadas
2. Arranca o API Server (porta 3001) com auto-restart
3. Arranca o Vite (porta 3000) com auto-restart
4. Se qualquer servidor cair, reinicia automaticamente

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
| `npm run dev` | **Launcher completo** (usar sempre este) |
| `npm run dev:vite` | Só o frontend Vite |
| `npm run dev:api` | Só o API server |
| `npm run dev:all` | Ambos com `concurrently` (sem auto-restart) |

---

## Diagnóstico

- **Porto 3333** → Frontend Vite (React App)
- **Porto 3001** → API Server (Express — funções `/api/*`)
- **Subdomínio Supabase** → Edge Functions (cloud, sempre disponível)

Se o browser mostrar a app mas a IA não responde → problema na Edge Function (cloud), não no localhost.
Se a app não carrega de todo → problema no Vite (Porto 3000).
Se login/registo falha → problema no API Server (Porto 3001).
