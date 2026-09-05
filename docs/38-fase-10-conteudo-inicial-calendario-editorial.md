# Fase 10 — Conteúdo inicial e validação editorial

## Estado vigente

A Fase 10 está em execução. A Fase 9 foi aceita em 5 de setembro de 2026; o
pipeline editorial (Hermes → runner → n8n → Payload → Telegram) está ativo e
validado em staging. O objetivo desta fase é produzir o conteúdo real de
lançamento e o calendário editorial, sem conteúdo fictício e com fontes
rastreáveis.

## Objetivo

Preparar o portal para o lançamento com conteúdo real suficiente em cada um
dos cinco pilares, cada cluster conduzindo naturalmente a uma solução
comercial, com autoria, fontes, imagens, direitos e CTAs revisados.

## Critério de saída

- cada pilar possui conteúdo real suficiente;
- todo conteúdo factual possui fonte rastreável (nível A/B);
- nenhuma duplicidade ou página órfã;
- cada cluster conduz a uma solução;
- calendário de 90 dias aprovado;
- pacote editorial inicial aprovado por humano.

## Clusters iniciais (ligados às soluções)

| Cluster | Pilar | Solução relacionada | Tipos |
| --- | --- | --- | --- |
| Agentes de IA para vendas e atendimento | ai-business | Agentes de IA | analysis, guide, tool |
| Automação de WhatsApp para PMEs | sales-attendance | Automação de WhatsApp | guide, comparison, news |
| Integrações n8n e produtividade | tools-integrations | Integrações n8n | guide, tool, comparison |
| Sites e conversão para empresas locais | sites-conversion | Sites e landing pages | guide, analysis |
| Automação de processos empresariais | automation | Consultoria e suporte | analysis, news |
| Tráfego e funis de conversão | sites-conversion | Tráfego e conversão | guide, analysis |

## Calendário editorial — 90 dias (12 semanas)

Cadência alvo: 2 publicações por semana (24 pautas). O Hermes prepara o
dossiê/rascunho; um revisor humano aprova e publica no Payload Admin.
`retry3` e publicação automática permanecem proibidos.

| Sem | Pauta (exemplo) | Pilar | Tipo | Funil | Solução |
| --- | --- | --- | --- | --- | --- |
| 1 | O que são agentes de IA e onde aplicá-los na sua empresa | ai-business | guide | topo | Agentes de IA |
| 1 | Automação de WhatsApp: o que dá para automatizar hoje | sales-attendance | guide | topo | Automação de WhatsApp |
| 2 | Comparativo: plataformas de agente de IA (critérios de escolha) | ai-business | comparison | meio | Agentes de IA |
| 2 | Sites de alta conversão: estrutura que gera contato | sites-conversion | guide | meio | Sites e landing pages |
| 3 | Integrações n8n: quando e por que automatizar | tools-integrations | guide | topo | Integrações n8n |
| 3 | Atendimento no WhatsApp com IA: limites e boas práticas | sales-attendance | analysis | meio | Automação de WhatsApp |
| 4 | Ferramentas de IA para produtividade de PMEs | tools-integrations | tool | meio | Integrações n8n |
| 4 | Landing page vs. site: o que sua empresa precisa | sites-conversion | guide | topo | Sites e landing pages |
| 5 | Agentes de IA com revisão humana: como manter o controle | ai-business | analysis | meio | Agentes de IA |
| 5 | Automação de processos: por onde começar | automation | guide | topo | Consultoria e suporte |
| 6 | Comparativo: WhatsApp Business API vs. ferramentas de automação | sales-attendance | comparison | fundo | Automação de WhatsApp |
| 6 | Mensuração de conversão: o que medir em um site | sites-conversion | guide | meio | Tráfego e conversão |
| 7 | n8n vs. Zapier: decisão para automação empresarial | tools-integrations | comparison | fundo | Integrações n8n |
| 7 | IA aplicada a vendas: casos de uso reais | ai-business | analysis | meio | Agentes de IA |
| 8 | Tráfego pago para PMEs: fundamentos | sites-conversion | guide | topo | Tráfego e conversão |
| 8 | Automação de follow-up: recuperar oportunidades | sales-attendance | guide | meio | Automação de WhatsApp |
| 9 | Segurança e LGPD em automação de atendimento | automation | analysis | meio | Consultoria e suporte |
| 9 | Ferramentas de conversão: formulários, CTAs e qualificação | sites-conversion | tool | meio | Sites e landing pages |
| 10 | Agentes de IA no atendimento: o que muda na operação | ai-business | analysis | meio | Agentes de IA |
| 10 | Orquestração n8n: um fluxo de vendas completo | tools-integrations | guide | fundo | Integrações n8n |
| 11 | Erros comuns em automação de WhatsApp | sales-attendance | guide | meio | Automação de WhatsApp |
| 11 | Consultoria de automação: quando vale contratar | automation | analysis | fundo | Consultoria e suporte |
| 12 | Revisão do cluster de IA para negócios | ai-business | news | topo | Agentes de IA |
| 12 | Roadmap de automação para o próximo trimestre | automation | guide | meio | Consultoria e suporte |

## Revisão editorial obrigatória (por artigo)

- autoria e revisor públicos atribuídos;
- fontes nível A/B com URL HTTPS e data de acesso;
- imagens com crédito/licença;
- CTAs contextuais coerentes (sem oferta agressiva);
- links internos válidos, sem página órfã;
- SEO (título ≤ 60, descrição ≤ 160, canonical) verificado.

## Próximo passo

Produzir as primeiras pautas via Hermes (job raiz real) e submeter os rascunhos
à revisão humana no Payload Admin, validando o fluxo de publicação de ponta a
ponta com conteúdo real.
