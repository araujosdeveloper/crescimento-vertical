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

Limites firmes: 40 turnos, 10 buscas, 8 fontes finais, 900 segundos por job,
512 KiB de saída e uma execução ativa. A agenda candidata fica apenas
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
`model.max_tokens` fica em 32768, enquanto o runner mantém timeout total de 900
s e saída final de 512 KiB.

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
