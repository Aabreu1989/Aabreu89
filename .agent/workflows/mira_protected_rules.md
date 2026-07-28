---
description: Regras obrigatórias antes de qualquer edição no projeto MIRA
---

# ⚠️ REGRAS OBRIGATÓRIAS — LER ANTES DE QUALQUER EDIÇÃO

## ANTES de editar qualquer ficheiro:

1. **LER `PROTECTED_CONTENT.md`** na raiz do projeto para saber o que NUNCA pode ser removido
2. **NUNCA usar `write_to_file` com `Overwrite: true`** em ficheiros com listas de dados (usar sempre `multi_replace_file_content` ou `replace_file_content`)
3. **NUNCA remover funcionalidades existentes** sem perguntar explicitamente à utilizadora
4. **NUNCA remover itens de arrays** (cursos, avatares, serviços, documentos) — apenas ADICIONAR
5. **SEMPRE verificar** se o ficheiro que vai editar tem conteúdo protegido antes de reescrever

## Ficheiros que NUNCA devem ser reescritos na totalidade:
- `constants.tsx` — contém PREDEFINED_AVATARS
- `utils/iefpCoursesDatabase.ts` — contém todos os cursos
- `components/LearningHub.tsx` — contém IEFP_SYNCED_COURSES
- `components/LocalServicesMap.tsx` — contém lógica de serviços
- `PROTECTED_CONTENT.md` — é o ficheiro de referência

## Ficheiros onde o mapa foi intencionalmente REMOVIDO:
- `LocalServicesMap.tsx` — mapa Leaflet foi removido a pedido. NÃO VOLTAR A ADICIONAR.

## Login:
- SEMPRE email + password
- NUNCA OTP / passwordless / magic link
