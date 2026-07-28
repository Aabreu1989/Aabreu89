-- ============================================================
-- 🦾 MIRA V2026: PILLAR 015 - MANUAL SIMPLIFICADO DO WEBAPP
-- Remove artigo obsoleto e injeta o Manual Oficial por módulo
-- ============================================================

-- 1. ELIMINAR O ARTIGO OBSOLETO
DELETE FROM public.newsroom_articles 
WHERE slug = 'mira-20-polish-final-transicao-concluida'
   OR title ILIKE '%POLISH FINAL%'
   OR title ILIKE '%TRANSIÇÃO CONCLUÍDA%'
   OR title ILIKE '%MIRA 2.0%';

-- 2. INJETAR O MANUAL SIMPLIFICADO DO WEBAPP MIRA (OFICIAL)
INSERT INTO public.newsroom_articles (title, slug, content, category, author, metadata)
VALUES (
    'Manual Simplificado do WebApp MIRA',
    'manual-simplificado-mira',
    '# Manual Simplificado do WebApp MIRA

Bem-vindo ao MIRA — o teu sistema de integração inteligente em Portugal. Este manual explica, de forma simples, como cada módulo funciona e o que podes fazer com ele.

---

## 💬 MIRA CHAT — O Teu Assistente Inteligente
O MIRA Chat é o coração do sistema. Faz perguntas sobre imigração, leis, documentos, habitação, trabalho — qualquer tema. O MIRA responde em tempo real com base nas leis portuguesas, nas diretrizes da CEO Amanda e no conhecimento da comunidade. Suporta texto e resposta por voz.

**Como usar:** Abre o Chat, escreve a tua dúvida em português ou na tua língua e espera pela resposta. O MIRA cita as fontes.

---

## 👥 COMUNIDADE — A Tua Tribo
Espaço onde os membros partilham experiências, fazem perguntas e ajudam uns aos outros. Os posts podem ser verificados (selados ✅) ou assinalados como falsos ❌. Quanto mais participas, maior é a tua reputação.

**Como usar:** Cria um post, comenta, dá like ou marca como "Verdadeiro" para validar informação útil. Usa os filtros por categoria para encontrar o que precisas.

---

## 💼 VAGAS — O Teu Futuro Profissional
Thousands de vagas de emprego em Portugal, atualizadas regularmente. Filtra por área, localização e tipo de contrato. Acede diretamente ao link da empresa ou plataforma.

**Como usar:** Usa a barra de pesquisa ou os filtros laterais. Clica em "Ver Vaga" para seres redirecionado para a candidatura oficial.

---

## 🎓 ACADEMY — O Teu Crescimento
Centro de cursos e formações certificadas, com destaque para os cursos IEFP (gratuitos). Aprende português, informática, leis do trabalho e muito mais.

**Como usar:** Navega por categoria ou pesquisa por nome do curso. Clica em "Iniciar Curso" para aceder à plataforma do formador.

---

## 📄 DOCUMENTOS — A Tua Organização
Módulo de regularização e documentação. Acede a guias de renovação de vistos, AR, NIF, NIF de empresa, NISS e outros documentos essenciais. Tem duas abas:
- **Regularização:** Processos de imigração e vistos
- **Documentos:** Modelos e guias descarregáveis

**Como usar:** Seleciona a aba pretendida, lê o guia ou descarrega o documento. Os downloads ficam registados no teu perfil.

---

## 🗺️ SERVIÇOS DE APOIO
Serviços de apoio ao imigrante: juntas de freguesia, centros de saúde, associações e muito mais. Avalie os serviços e ajude outros membros. 
(Nota: O MIRA não dispõe de mapas interativos nesta versão).

---

## 🔔 NOTIFICAÇÕES — Nunca Perdes Nada
Recebes alertas em tempo real sobre: respostas aos teus posts, novos likes, atualizações de imigração e mensagens do sistema MIRA.

**Como usar:** Clica no sino 🔪 no canto superior. Marca como lida ou apaga as notificações.

---

## 🏅 PERFIL & GAMIFICAÇÃO — O Teu Estatuto
O teu perfil mostra a tua reputação, os selos conquistados e o teu nível de confiança na comunidade. Existem 10 selos possíveis (Pioneiro, Verificado, Sentinela, etc.).

**Como subir de nível:** Participa ativamente — comenta, valida posts, denuncia fraudes, descarrega documentos e usa o Saber IA.

---

*Manual oficial MIRA V2026. Atualizado pela CEO Amanda Rodrigues.*',
    'Newsroom Imperial',
    'MIRA Editorial',
    '{"prestige": "editorial", "type": "manual", "priority": 1, "official": true}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    category = EXCLUDED.category,
    author = EXCLUDED.author,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
