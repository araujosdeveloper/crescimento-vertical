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
| Versão exata | Hermes Agent v0.20.4 (2026.8.18) · Python 3.13.5 · build `649c206…` · método `docker` |
| Instalação | `/opt/hermes` (pacote Python: `cli.py`, `hermes_cli/`, `agent/`, `gateway/`, `cron/`) |
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

## Mecanismo de perfis e execução comprovado (v0.20.4)

Comandos **read-only** executados no contêiner (`--help`, `version`,
`profile list/show`, `gateway status`, `cron list/status`) e inspeção do código
instalado em `/opt/hermes` comprovaram o seguinte:

| Item | Resultado | Fonte |
| --- | --- | --- |
| 1. Versão exata | v0.20.4 (2026.8.18), Python 3.13.5 | `hermes --version` |
| 2. `profile create/list/show` | existem (subcomandos `list, use, create, delete, describe, show, alias, rename, export, import, install, update, info`) | `hermes profile --help` |
| 3. Suporte a `--profile`/`-p` | existe; flag pré-argparse que define `HERMES_HOME` e se remove do argv | `hermes_cli/_parser.py`, `main.py:_apply_profile_override` |
| 4. `HERMES_HOME` | `/opt/data` (caminho seguro) | `printenv HERMES_HOME` |
| 5. Diretório de perfis | `/opt/data/profiles/<nome>/` (em Docker, `profiles/` fica sob `HERMES_HOME`) | `profiles.py:_get_profiles_root` |
| 6. Isolamento | perfis isolam todo o estado via `HERMES_HOME` (config, `.env`, `SOUL.md`, skills, sessions, cron, gateway) | `profiles.py` + `tips.py` |
| 7. `terminal.home_mode:profile` | existe; valores `auto` (padrão), `real`, `profile` (aliases `isolated`/`profile_home`); atual = `auto` | `hermes_constants.py:get_subprocess_home` |
| 8. Selecionar perfil sem mudar o padrão | `hermes -p <nome>` / `--profile <nome>` (por invocação, sem gravar `active_profile`) | `main.py:_apply_profile_override` |
| 9. Execução não interativa | `-z/--oneshot PROMPT`; também `chat -q/--query` e `chat -Q/--quiet` | `hermes --help`, `hermes chat --help` |
| 10. Saída JSON estrita | parcial: `--usage-file PATH` (relatório JSON) e `send --json`; `-z` emite texto plano | `hermes --help`, `hermes send --help` |
| 11. Gateway por perfil | suportado (`gateway list` por perfil; slots supervisionados com `-p <nome>`); gateway do `default` ativo (PID 153) | `gateway --help`, `profiles.py`, `gateway status` |
| 12. Método recomendado para n8n | **CLI one-shot** (`-z` + `-p` + `--usage-file`) — determinístico, sem daemon; entrega via webhook HMAC (docs/22) | ver seção "Recomendação" |

### Recomendação de transporte (baseada em evidência)

O caminho mais seguro para a integração é:

1. **Execução do Hermes**: `hermes -p crescimento-vertical-editorial -z "<prompt>" --usage-file <relatório.json>` —
   não interativo, determinístico, sem exigir gateway persistente, com relatório
   JSON de uso.
2. **Entrega**: o resultado é encaminhado ao webhook HMAC do n8n (docs/22),
   mantendo o n8n como única ponte para o Payload.
3. **Agendamento** (quando autorizado): pode ser feito pelo lado do n8n
   (nó Cron/Schedule) ou pelo `hermes cron` — este último depende do gateway
   ativo e fica para a Fase 8/9.

Não foi escolhido gateway/API como via única porque o gateway é um processo
persistente compartilhado e o modo one-shot cobre o caso sem daemon. A decisão
final de transporte está registrada em docs/14 (ADR-017).

### Limitações e riscos da imagem Hostinger (v0.20.4)

- `-z/--oneshot` **ignora approvals** ("approvals are auto-bypassed"): a skill
  editorial precisa embutir as próprias regras de fail-safe (docs/06), pois não
  haverá prompt de aprovação de comando perigoso no modo one-shot.
- A saída de conteúdo do `-z` é **texto plano**; JSON estrito existe apenas para
  o relatório de uso (`--usage-file`) e para `send --json`. O dossiê em JSON
  deve ser produzido pelo prompt/skill e validado no n8n.
- Perfil `default` é o único existente; o gateway dele está **ativo e
  compartilhado** (não pode ser reiniciado nesta fase).
- `HERMES_DISABLE_LAZY_INSTALLS` sugere que instalações preguiçosas podem ser
  desabilitadas; o valor não foi lido (não expor variáveis sensíveis).

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
5. **Isolamento do perfil Hermes**: **comprovado** — perfis isolam estado via
   `HERMES_HOME` (`/opt/data/profiles/<nome>/`), com seleção por `-p/--profile`
   sem mutar o padrão (ver seção "Mecanismo de perfis"). A criação do perfil
   `crescimento-vertical-editorial` permanece pendente (Fase 8).

## Conclusão

Os serviços existem, estão saudáveis e suportam o contrato planejado (webhook
n8n habilitado, Hermes com busca web e Telegram). A integração deve respeitar o
isolamento lógico e o contrato autenticado de docs/22. O mecanismo de perfis e
o modo não interativo (`-z`/`-p`/`--usage-file`) foram comprovados na versão
instalada (v0.20.4). Nenhuma ação de integração foi executada nesta fase.
