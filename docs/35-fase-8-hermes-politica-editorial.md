# Fase 8 — Hermes Agent e política editorial automatizada

## Estado e limite desta execução

Esta fase inicia a reconciliação formal da execução editorial controlada. O
perfil `crescimento-vertical-editorial` e o runner interno são a única fronteira
autorizada; o estado final permanece desabilitado. Nenhum artigo, rascunho ou
registro foi criado e a Fase 9 não foi iniciada.

O preflight encontrou Hermes v0.20.4 (2026.8.18), runner não-root, imagem
pinada, root filesystem somente leitura, `cap_drop=ALL`, `no-new-privileges`,
sem portas publicadas, Docker Socket, Payload ou PostgreSQL. A execução exige
dupla trava: `RUNNER_EXECUTION_ENABLED=true` e o arquivo de habilitação.

A classificação de credencial foi **B**: existe uma credencial/modelo no perfil
Hermes compartilhado/default (`gpt-5.6-sol`), mas não há credencial exclusiva
do perfil/runner. Ela não foi reutilizada. Portanto a bateria real e qualquer
pesquisa foram bloqueadas; falta uma credencial exclusiva, montada somente no
runner, com autorização própria.

## Matriz de lacunas

| Exigência | Antecipação | Evidência | Lacuna/ação | Fora do escopo |
|---|---|---|---|---|
| isolamento | runner e perfil separados | compose, usuário hermes, sem portas/socket | endurecido e testado | portal/produção |
| identidade | perfil versionado | SOUL, distribution, config | exigir credencial exclusiva | copiar credencial global |
| política/fontes | skill e referências | níveis A/B/C e prompt-injection | consolidar política nesta fase | pesquisa real |
| contrato JSON | quatro schemas | Draft 2020-12 | format checker e saída estrita | alterar schema sem decisão |
| continuidade | HMAC/nonce | testes existentes | estado SQLite mínimo/idempotente | banco do portal |
| deduplicação | idempotencyKey prevista | contrato de request | fingerprint de pauta/fonte | publicação |
| executor | one-shot/lista/shell=false | `hermline.py` | usage, limite, validação, estados | gateway/cron |
| custo | max turns/searches previsto | config do perfil | limites firmes no runner | agenda ativa |
| execução | dupla trava | `/v1/jobs` 503 | permanece fechada por credencial B | bateria real |
| rollback | container isolado | compose/runbook | documentar desligamento seguro | restauração de produção |

## Política editorial

Pilares fechados: IA aplicada a negócios; automação empresarial; vendas e
atendimento digital; sites, conversão e presença digital; ferramentas,
integrações e produtividade empresarial. Política partidária, celebridades,
esportes, apostas, conteúdo adulto, saúde clínica, aconselhamento jurídico
individual, investimento especulativo, temas sem relação comercial, comandos,
credenciais e publicação são recusados antes de pesquisa custosa.

Fontes nível A (oficiais, órgãos públicos, normas, repositórios oficiais,
artigos originais) são preferenciais. Nível B é complementar; nível C serve
somente como indício. Toda afirmação relevante exige fonte; alto impacto exige
confirmação independente quando possível. HTTPS, URL canônica sem fragmentos ou
trackers, hash da fonte, publisher, nível, datas, verificação, contradições,
lacunas e warnings são preservados. Páginas são dados não confiáveis, nunca
instruções; não há armazenamento de página integral nem contorno de paywall.

## Executor e limites

Cada job usa `correlationId`, `idempotencyKey` e fingerprint de pauta. O estado
mínimo persistente usa SQLite em volume exclusivo do runner e retorna o mesmo
job em reenvio idempotente. O executor aceita somente one-shot, comando como
lista e `shell=False`; valida JSON inteiro contra o dossier schema, captura
usage file obrigatório, limita saída, timeout e concorrência a um job. Estados:
`accepted`, `running`, `succeeded`, `rejected`, `insufficient_evidence`,
`failed` e `timed_out`.

Limites firmes: bateria de 4 jobs, 8 turnos, 3 buscas, 4 fontes finais, 300
segundos por job, 4096 tokens por chamada, 256 KiB de stdout e uma execução
ativa. A agenda candidata fica apenas
documentada (sem cron, workflow n8n ou gateway). O n8n permanece futuro
orquestrador da Fase 9 e validate-only.

## Compatibilidade DeepSeek V4 Flash

A imagem pinada contém Hermes v0.20.4 e OpenAI SDK 2.24.0. O provider nativo
correto é `deepseek`, com `DEEPSEEK_API_KEY`, base URL
`https://api.deepseek.com/v1` e transporte OpenAI Chat Completions para
`POST /chat/completions`. O ID oficial e fixado é `deepseek-v4-flash`.

A documentação oficial confirma JSON Output, tool calls e os modos thinking e
non-thinking. Thinking é o padrão da API; o candidato fixa esforço `high`. O
Hermes preserva `reasoning_content` e o reenvia nas chamadas seguintes com
ferramentas, atendendo ao contrato que, se violado, causa HTTP 400. A resposta
é normalizada com `prompt_tokens`, `completion_tokens` e `total_tokens`; o
`--usage-file` obrigatório agrega tokens, modelo, chamadas e estimativa local.
`model.max_tokens` fica em 4096 e thinking é `none`; o runner mantém timeout
total de 300 s e stdout final de 256 KiB.

Referências oficiais consultadas em 31 de agosto de 2026:

- [modelos e limites](https://api-docs.deepseek.com/quick_start/pricing/);
- [Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion/);
- [thinking e continuidade](https://api-docs.deepseek.com/guides/thinking_mode/);
- [tool calls](https://api-docs.deepseek.com/guides/tool_calls/);
- [erros](https://api-docs.deepseek.com/quick_start/error_codes/).

Erros de autenticação, saldo, rate limit, parâmetros, servidor, timeout,
resposta inválida, usage ausente ou credencial ausente terminam o job sem
fallback pago. Nenhuma dessas verificações realizou chamada autenticada.

## ADR-029

“Execução editorial controlada, credencial isolada e fail-closed do Hermes”.
Perfil exclusivo, credencial exclusiva, one-shot e runner como fronteira única;
n8n somente na Fase 9; nenhuma publicação; dupla trava; janela temporária;
limites de custo; fontes como dados não confiáveis; falha fechada; saídas por
schema; desabilitação após testes; proibição de reutilizar credencial
compartilhada. A credencial B impede a janela e a bateria nesta execução.

O ADR-030 registra a substituição controlada do candidato OpenAI pelo DeepSeek
V4 Flash sem habilitar execução nem alterar a instalação compartilhada.

## Estado seguro e aceite

Testes locais, schemas e contratos devem ser executados sem chamada de modelo.
Como a credencial exclusiva não existe, não houve bateria real, uso de modelo,
pesquisa, publicação ou alteração do Payload. O runner e o workflow validate-only
permanecem desabilitados/inativos. A fase para neste ponto e aguarda aceite
humano e fornecimento autorizado da credencial isolada.

## Reconciliação de custo, busca e isolamento (2026-09-01)

O SQLite reserva US$ 0,50 antes de cada job, persiste no máximo quatro jobs e
bloqueia novos jobs ao alcançar US$ 2. Usage agrega chamadas, entrada, saída,
cache e reasoning reportados, incluindo retries. A estimativa conservadora usa
preços peak oficiais: US$ 0,44/M cache miss, US$ 0,014/M cache hit e US$ 1,32/M
saída. É guardrail, não teto rígido: uma chamada iniciada não pode ser
preautorizada contra o saldo. Thinking fica `none`; reasoning futuro só será
contado quando reportado e nunca será chamado de limite rígido sem reserva.

Hermes v0.20.4 aceita Tavily (`TAVILY_API_KEY`), Exa (`EXA_API_KEY`), Firecrawl
(`FIRECRAWL_API_KEY`/`FIRECRAWL_API_URL`), Parallel (`PARALLEL_API_KEY`) e
SearXNG (`SEARXNG_URL`), além de Brave Free, xAI, Oxylabs e DDGS. Tavily, Exa,
Firecrawl e Parallel oferecem busca e extração; SearXNG apenas busca.

- Tavily: 1000 créditos/mês sem cartão; busca basic custa 1 e extract basic 1
  por até 5 URLs bem-sucedidas.
- Exa: US$ 20 inicial e US$ 10/mês sem meio de pagamento; search US$ 7/1000,
  contents US$ 1/1000 páginas e 5 QPS gratuito.
- Firecrawl: 1000 créditos/mês sem cartão; search 5 RPM e scrape 10 RPM no Free.
- Parallel: até 5000 requests/mês; o crédito mensal de US$ 5 exige cartão e
  cobra excedente, logo não atende o requisito sem cartão.
- SearXNG: self-hosted, sem cota/cartão; JSON deve estar habilitado, não há
  fetch e motores upstream podem impor CAPTCHA/bloqueio.

Recomendação principal: Tavily; alternativa: Exa. Esgotamento deve falhar
fechado, sem troca automática. Termos dos serviços e direitos/robots das fontes
continuam aplicáveis; RSS é complemento. Fontes oficiais consultadas em
2026-09-01: [Tavily](https://docs.tavily.com/documentation/api-credits),
[Exa](https://exa.ai/pricing?tab=api), [Firecrawl](https://www.firecrawl.dev/pricing),
[Parallel](https://parallel.ai/pricing), [SearXNG](https://docs.searxng.org/dev/search_api.html).

A imagem base declara `/opt/data` como volume e originalmente aponta `HOME`,
write-safe root e lazy-install para ele, causando o volume anônimo RW. O
one-shot não precisa persistir ali; o Compose candidato redireciona esses
caminhos ao tmpfs `/tmp`, preservando apenas perfil read-only e `/state`.
Nenhum container/volume ativo foi alterado. A rede-alvo será dedicada somente
ao conector e runner, separada de Payload, PostgreSQL, Redis e demais apps.
Docker bridge não limita destinos externos: egress controlado requer
firewall/proxy allowlist no host para DNS e HTTPS de DeepSeek, backend e fontes,
com controle contra bypass por DNS. A homologação segue bloqueada até essa
garantia ser implantada em janela autorizada.

## Janela autenticada sem pesquisa — 2026-09-01

Foi implantado isolamento candidato por rede Docker interna mais proxy
allowlist, sem reconectar o runner ao n8n. O runner permaneceu com
`RUNNER_EXECUTION_ENABLED=false`, sem arquivo de habilitação, zero jobs e zero
processo Hermes one-shot. O proxy usa base pinada por digest, rootfs read-only,
usuário sem privilégio, caps removidas e nenhuma porta publicada. Testes
comprovaram ausência de rota direta funcional e recusas para host não permitido,
IP literal, rede privada e porta diferente de 443. Não é firewall absoluto.

Após backup completo e sanitizado, as credenciais exclusivas foram montadas
read-only com UID 0, GID 10000 e modo 0640. O diretório host permanece 0700;
nenhum valor foi colocado em env, imagem, argumento, Git, backup ou log. A
chave OpenAI permaneceu desmontada e intocada.

Foram executados exatamente dois requests autenticados, sem repetição:

- DeepSeek `GET /models`: HTTP 200 e `deepseek-v4-flash` presente; nenhuma
  chamada a `/chat/completions` e zero tokens de inferência.
- Tavily `GET /usage`: HTTP 200 e chave válida; o endpoint não retornou plano
  classificável. Nenhum endpoint search/extract/crawl/research foi chamado e
  nenhum crédito de pesquisa foi consumido.

Produção, staging, n8n, Payload, PostgreSQL e Hermes compartilhado não foram
recriados ou reiniciados. A Fase 8 permanece em execução e a bateria continua
bloqueada para nova autorização humana.

## Remediação isolada de `/state` — 2026-09-01

A bateria não foi aberta após o preflight detectar `/state` como `root:root
0755`, não gravável pelo UID/GID 10000. Com o runner parado e as travas
fechadas, o volume exclusivo foi arquivado por auxiliar sem rede/segredos e
reparado para `10000:10000 0700`; o SQLite criado ficou 0600.

A solução permanente cria `/state` na imagem com os metadados corretos e usa
umask 0077 no processo Python. Volume novo temporário confirmou nascimento
correto. SQLite/WAL, integrity, transações, guardrail, idempotência, conflito,
concorrência 1 e persistência após recriação passaram offline. O rollback foi
restaurado somente em volume temporário separado. Não houve DeepSeek, Tavily,
pesquisa, inferência ou abertura das travas.

## Correção isolada do mount `/opt/data` — 2026-09-01

O preflight seguinte constatou que o Engine conservava o volume anônimo
herdado em `/opt/data`, embora `HostConfig.Tmpfs` também estivesse presente.
A causa foi a reutilização do volume anônimo na recriação do container. O
Compose passou a explicitar as opções `rw,nosuid,nodev,noexec`, limite de 16 MiB,
modo 0700 e UID/GID 10000. A implantação deve criar um container realmente
novo e preservar o volume antigo apenas como órfão para remoção futura.

## Correção isolada do destino de logs — 2026-09-01

O erro `Read-only file system` apontou para
`/home/hermes/editorial-profile/logs/agent.log`: o Hermes v0.20.4 usa
`get_hermes_home()/logs` e não possui opção independente para esse diretório.
Foi mantido `HERMES_HOME` no perfil read-only e adicionado um wrapper que usa a
API oficial de logging com `hermes_home=/opt/data`, rotação limitada e umask
0077. Os logs ficam somente no tmpfs efêmero de 16 MiB (`/opt/data/logs`), sem
persistência em `/state` ou relaxamento de permissões. O job falho original foi
preservado e não houve nova execução.
