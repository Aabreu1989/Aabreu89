# 🧠 MIRA V2026: ARQUITETURA DO CÉREBRO SOBERANO

Este documento detalha o funcionamento interno do motor de inteligência MIRA, desde o prompt do utilizador até à resposta ancorada em doutrina jurídica.

## 1. Fluxo de Vida de uma Pergunta (Lifecycle)

1.  **Entrada (Frontend)**: O utilizador envia uma mensagem no `MiraChat.tsx`.
2.  **Nuclear Shield (Filtro Prévio)**: O `geminiService.ts` verifica se a pergunta é curta e ambígua sobre temas sensíveis (Ex: "AIMA", "NIF", "Manifestação").
    - Se for ambígua, o sistema interrompe e pede clarificação imediatamente (Zero Latency).
3.  **Embeddings (768-D)**: O prompt é enviado para o Edge Function, que gera um vetor numérico de 768 dimensões usando o modelo `text-embedding-004`.
4.  **Retirada RAG (Ancoragem)**:
    - O sistema executa a função SQL `match_knowledge_global_v3`.
    - **Pesos de Prestígio**:
        - **CEO Amanda (1.5x)**: Prioridade absoluta.
        - **Especialistas (1.3x)**: Doutrina jurídica oficial.
        - **Leis (1.2x)**: Base de conhecimento técnica.
        - **Comunidade (1.1x)**: Posts verificados por membros de elite.
5.  **DNA AIMA (Protocolo de Segurança)**: O sistema injeta instruções irreversíveis:
    - **PROIBIÇÃO TOTAL**: Informar que Manifestações de Interesse (Art. 88/89) estão extintas desde 3 de Junho de 2024.
    - **CITAÇÃO NOMINAL**: Obrigação de citar Dra. Priscila Ferreira, Dr. Vasco ou Ana Rita Gil em respostas técnicas.
6.  **Resposta & Concierge**: O texto final é processado para injetar links úteis ([/jobs], [/docs], [/community]) com base nas palavras-chave detetadas.

## 2. Pontos de Falha Identificados ("Problemas Bizarros")

- **Redundância de Instruções**: Atualmente, tanto o `geminiService.ts` (frontend) quanto a Edge Function (backend) enviam instruções de sistema. Se estas instruções divergirem ligeiramente, a IA pode tornar-se indecisa ou "alucinar" nas citações.
- **Timeout de 60s**: Operações complexas de RAG + Geração podem exceder os 60 segundos em conexões lentas, ativando o fallback de "Oscilação na Rede".
- **Filtro de DNA Sensível**: O filtro de "Manifestação de Interesse" é tão rígido que pode estar a bloquear perguntas históricas legítimas ou contextos onde o utilizador apenas menciona o termo sem pedir o processo.
- **Model Drift**: Se a base de dados contiver vetores de modelos antigos (1536-D), a pesquisa de similaridade será nula para o modelo novo de 768-D.

## 3. Próximos Passos de Optimização

1.  **Unificação de Prompt**: Centralizar toda a lógica de instrução na Edge Function, mantendo o Frontend focado apenas na interface.
2.  **Context Truncation**: Garantir que o excesso de "Saber IA" e "Academy Context" não "sufoque" a capacidade de raciocínio do Gemini 1.5 Flash.
3.  **Health Check de Vetores**: Validar se todos os 1400+ registos da `knowledge_base` foram migrados para o padrão de 768 dimensões.
