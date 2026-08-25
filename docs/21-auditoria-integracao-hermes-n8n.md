# Auditoria da integração Hermes/n8n (Fase 3A)

Data da auditoria: 25 de agosto de 2026. Escopo: **somente leitura**. Nenhum
contêiner, credencial, rede ou configuração foi alterado. Nenhum valor de
segredo é registrado aqui — apenas nomes de variáveis, imagens e topologia.

## Objetivo

Levantar o estado real do Hermes Agent e do n8n já operantes na VPS, para
subsidiar o contrato de integração (docs/22) e as Fases 8/9. Os dois serviços
são **compartilhados** com outros projetos e devem ser integrados por contrato
autenticado e isolamento lógico (ADR-013).

## Hermes Agent

| Item | Valor observado |
| --- | --- |
| Contêiner | `hermes-agent-sodq-hermes-agent-1` |
| Imagem | `ghcr.io/hostinger/hvps-hermes-agent:latest` (gerenciada, sem pin de versão explícito) |
| Entrypoint | `/entrypoint.sh` |
| Porta | 4860/tcp (interna, sem publicação direta) |
| Redes | `hermes-agent-sodq_default`, `n8n_default` |
| Montagens | bind `/opt/data` (dados), bind `/usr/local/bin/gh` (GitHub CLI) |
| Limites de recursos | ausentes (sem CPU/memória declarados) |
| Variáveis (nomes) | `HERMES_HOME`, `HERMES_TUI_DIR`, `HERMES_WEB_DIST`, `HERMES_DISABLE_LAZY_INSTALLS`, `HERMES_LAZY_INSTALL_TARGET`, `HERMES_WRITE_SAFE_ROOT`, `TAVILY_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_USERS`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `TRAEFIK_HOST`, `PLAYWRIGHT_BROWSERS_PATH`, `GH_CONFIG_DIR` |

Capacidades inferidas dos nomes de variáveis (sem ler valores):

- busca web via Tavily (`TAVILY_API_KEY`);
- integração com Telegram (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_USERS`);
- navegação/extração com Playwright (`PLAYWRIGHT_BROWSERS_PATH`);
- autenticação administrativa própria (`ADMIN_USERNAME`/`ADMIN_PASSWORD`);
- execução protegida contra escrita como root (`HERMES_WRITE_SAFE_ROOT`).

### Observações

- O contêiner é gerenciado pelo próprio Hostinger (`hvps-hermes-agent`); o
  perfil editorial `crescimento-vertical-editorial` deve ser **logicamente
  isolado** (home/diretório e memória próprios), sem recriar ou reconfigurar o
  contêiner global (docs/06).
- O Hermes já possui bot de Telegram próprio; o fluxo de aprovação editorial
  (CV-02) permanece no n8n conforme docs/07, mantendo o Hermes sem autoridade de
  decisão/publicação.
- A ausência de limites de recursos é um risco operacional a tratar na Fase 11.

## n8n

| Item | Valor observado |
| --- | --- |
| Contêiner | `n8n-n8n-1` |
| Imagem | `docker.n8n.io/n8nio/n8n:latest` (sem pin de versão explícito) |
| Versão | 2.33.7 |
| Porta | `127.0.0.1:5678->5678` (somente loopback; exposto via `n8n-traefik-1`) |
| Rede | `n8n_default` |
| Montagens | volume `n8n_data` → `/home/node/.n8n`; bind `/files` |
| Limites de recursos | ausentes |
| Variáveis (nomes) | `WEBHOOK_URL`, `N8N_HOST`, `N8N_PORT`, `N8N_PROTOCOL`, `N8N_PROXY_HOPS`, `GENERIC_TIMEZONE`, `N8N_BLOCK_ENV_ACCESS_IN_NODE`, `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS`, `N8N_RELEASE_TYPE`, `N8N_RUNNERS_ENABLED`, `MERCADO_PAGO_WEBHOOK_SECRET` |

### Observações

- `WEBHOOK_URL` está definido: os webhooks do n8n estão habilitados e são o
  ponto de entrada planejado para o dossiê do Hermes (CV-01).
- O n8n já atende outro projeto (ex.: webhook de Mercado Pago). A integração do
  Crescimento Vertical exige **workflow e segredo HMAC próprios**, sem
  interferir nos fluxos existentes.
- O n8n não publica portas públicas; o acesso é mediado pelo `n8n-traefik-1`.
- `N8N_BLOCK_ENV_ACCESS_IN_NODE` reforça o isolamento de variáveis nos nós.

## Topologia observada (relevante à integração)

~~~text
Hermes (hermes-agent-sodq) --dossiê JSON--> n8n webhook (n8n_default)
n8n --REST--> Payload CMS (rede interna)
n8n <--> Telegram (aprovação CV-02)
Payload/PostgreSQL = fonte de verdade
~~~

- O candidato `cv-phase2-staging-app` participa de `n8n_default` somente para o
  Traefik alcançá-lo; o PostgreSQL **não** participa de `n8n_default`.
- A integração usará HTTP autenticado (HMAC) via o webhook do n8n, não acesso
  direto de rede entre contêineres (auditável e replicável).

## Riscos e restrições identificados

1. **Serviços compartilhados**: Hermes e n8n atendem outros projetos; qualquer
   integração deve ser aditiva e assinada, sem alterar a configuração global.
2. **Imagens sem pin**: `:latest` em ambos (Hermes Hostinger e n8n) pode mudar de
   comportamento; registrar a versão efetiva no momento da integração (Fases 8/9).
3. **Sem limites de recursos**: tratar limites por workflow/job na Fase 11.
4. **Segredos presentes nos contêineres**: Tavily, Telegram, autenticação do
   Hermes e webhook secret do n8n. Nenhum valor foi lido nem será registrado.
5. **Isolamento do perfil Hermes**: depende de como o `hvps-hermes-agent` expõe
   múltiplos perfis/homes; confirmar o mecanismo exato na Fase 8 antes de criar
   `crescimento-vertical-editorial`.

## Conclusão

Os serviços existem, estão saudáveis e suportam o contrato planejado (webhook
n8n habilitado, Hermes com busca web e Telegram). A integração deve respeitar o
isolamento lógico e o contrato autenticado de docs/22. Nenhuma ação de
integração foi executada nesta fase.
