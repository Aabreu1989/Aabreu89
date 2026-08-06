# REGRAS VITAIS DE ARQUITETURA - MIRA IMIGRANTE (NÃO APAGAR)

1. PROIBIDO USO DE MOCKS OU LOCALSTORAGE PARA DADOS MESTRES:
   - Todo post, comentário, curtida e ponto de gamificação DEVE ser gravado e lido DIRETAMENTE do Supabase PostgreSQL.
   - O LocalStorage só serve como cache visual secundário, JAMAIS como fonte primária de dados.

2. ESTRUTURA DO BANCO DE DADOS (SUPABASE):
   - Tabelas obrigatórias: `public.posts`, `public.comments`, `public.post_likes`, `public.saved_posts`, `public.profiles`, `public.user_badges`.
   - A reputação e os pontos de gamificação SÃO CALCULADOS NO POSTGRESQL via Triggers SQL, NUNCA no frontend.

3. DADOS DA ADMIN/CEO:
   - Administradora (Amanda Abreu) tem `reputation = 10458`, `trust_level = 'Elite'`, `is_verified = true`.

4. INTEGRIDADE DE BOTÕES:
   - Todos os botões (Curtir, Salvar, Comentar, Deletar) DEVEM disparar mutações reais na API do Supabase e atualizar o estado da UI instantaneamente via resposta do banco ou Supabase Realtime.

5. FÓRMULA OFICIAL DE CÁLCULO E PRESERVAÇÃO DE MÉTRICAS (NUNCA REGREDIR NÚMEROS):
   - Os números do Admin Hub, Auditoria de Impacto, Telemetria e Concursos JAMAIS PODEM REGREDIR ou diminuir.
   - O cálculo das métricas da plataforma DEVE SEGUIR RIGOROSAMENTE as seguintes fórmulas auditáveis (Base Histórica Acumulada + Atividade Real no Supabase):

   • 🚀 **Acessos da Plataforma**: 49.592 (Base) + `activity_logs` (ações de acesso) = **52.198+**
   • 👥 **Utilizadores Registados**: 1.015 (Base) + `profiles` (registos BD) = **2.033+**
   • 💼 **Oportunidades de Emprego**: 5.326 (Base) + `job_posts` (vagas BD) = **10.652+**
   • 🎓 **Cursos de Formação**: 156 (Base) + `courses` (cursos BD) = **312+**
   • 📍 **Serviços Locais**: 225 (Base) + `services` (serviços BD) = **450+**
   • 🤖 **Consultas ao Assistente IA**: 18.642 (Base) + `activity_logs(action: ai_query)` = **18.642+**
   • 📄 **Downloads de Documentos**: 3.451 (Base) + `user_documents` (documentos BD) = **3.451+**
   • ⏱️ **Horas Poupadas à Comunidade**: 4.567 (Base) + `Math.floor(finalDocCount * 1.2) + Math.floor(finalAiQueries * 0.1)` = **4.567+**

   - Em caso de falha de rede ou sincronização parcial, o sistema DEVE MANTER INTACTAS as métricas consolidadas acima, prevenindo qualquer redução de indicadores vitais para auditorias diárias e financiamento.

6. PRESERVAÇÃO INTEGRAL DE DADOS E CONTEÚDO DOS UTILIZADORES:
   - Ao adicionar ou modificar funcionalidades em qualquer módulo do MIRA, É ESTRITAMENTE PROIBIDO apagar, substituir ou eliminar informações ou dados inseridos pelos utilizadores que não tenham sido expressamente pedidos para remoção.
   - Qualquer conteúdo criado pela comunidade ou inserido na plataforma DEVE SER PRESERVADO E MANTIDO INTACTO na base de dados PostgreSQL, salvo ordem direta de eliminação por parte da Administração/CEO.
