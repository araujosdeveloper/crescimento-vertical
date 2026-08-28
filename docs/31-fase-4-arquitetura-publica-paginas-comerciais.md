# Fase 4 — Arquitetura pública e páginas comerciais

Data de início: 28 de agosto de 2026. Status: em execução.

## Catálogo aprovado

O ADR-024 consolida seis pilares e as rotas `/solucoes` e individuais:
sites-e-landing-pages, trafego-e-conversao, automacao-whatsapp, agentes-de-ia,
integracoes-n8n e consultoria-e-suporte. Os oito cards anteriores foram
absorvidos; não há catálogo concorrente.

## Implementação

Foram adicionadas as coleções Payload `services` e `cases`, com drafts/versões,
acesso server-side, publicação restrita e filtros públicos defensivos. O seed
`npm run seed:services` é explícito e idempotente, cria somente os seis serviços
aprovados e nunca roda no startup. Nenhum case ou dado fictício é criado.

A camada `src/lib/commercial/` expõe DTOs whitelist, cache e revalidação para a
home, `/solucoes` e cases. As páginas incluem soluções, diagnóstico, sobre,
contato, cases e páginas de privacidade, termos e cookies. Não há formulário,
analytics, preços ou promessa de resultado nesta fase.

## Migration e rollback

A migration `20260828_153822_add_services_cases` cria as tabelas e versões sem
alterar dados existentes. Antes de staging, gerar backup Git/PostgreSQL/mídia e
validar SHA-256. Em rollback, restaurar a imagem anterior e recriar somente o
app; a migration deve ser revertida apenas por procedimento aprovado.

## Gates

Produção permanece inalterada. A homologação responsiva completa nos cinco
viewports, teclado, foco, overflow e todas as rotas segue obrigatória no
hardening visual final e bloqueia produção.
