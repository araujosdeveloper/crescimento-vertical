# Fase 9 — n8n, Telegram, aprovação e publicação

## Estado vigente — ativação parcial em staging

A Fase 8 foi aceita em 4 de setembro de 2026 e a Fase 9 está em **ativação**:

- **Migração `api_key`** aplicada no staging e `useAPIKey` ativo no Payload;
- **Role `automation` + API key** provisionadas (`automation@crescimentovertical.com`);
- **Bot Telegram** validado (`@AlertaHermes_Bot`) e `chat_id` de revisão `5710991322`;
- **Credenciais** importadas no n8n (Telegram + Payload, cifradas);
- **Workflows CV-01..CV-04** importados no n8n (inativos até o toggle no painel);
- **Correção de conectividade** — o n8n foi reconectado à rede
  `phase8_execution` (`docker network connect`), pois o ADR-031 havia isolado o
  runner e quebrado a ponte n8n → runner. A correção persistente exige adicionar
  a rede ao compose real em `/docker/n8n/docker-compose.yml` (fora do repo).
- **Teste de componentes validado**: criação de rascunho via role `automation`
  (201, `workflowStatus=draft`) e envio de resumo via Telegram (ok), com
  limpeza do rascunho de teste (nenhum conteúdo fictício permanece).

Restam: ativar os workflows no painel (toggle "Active") e o aceite humano
específico desta fase. Publicação automática e retry 3 continuam proibidos
(ADR-005, ADR-034).

### Teste E2E completo — 5 de setembro de 2026

O pipeline foi validado de ponta a ponta em staging com execução real:

- **Fonte → Hermes → dossiê**: job raiz `7babd8214e…` `succeeded` (tema
  "Sites e landing pages", `contentType=guide`, 4 fontes, 11 claims);
- **Dossiê → draft**: criação via role `automation` (HTTP 201, `workflowStatus=draft`);
- **Draft → Telegram**: resumo enviado ao revisor (chat `5710991322`, `message_id:4`);
- **Limpeza**: rascunho de teste removido (0 artigos, sem conteúdo fictício);
- **Custo acumulado**: US$ 0,2405 (guardrail US$ 2); `retry3=0`; travas fechadas.

O E2E revelou e corrigiu dois defeitos reais: (1) a normalização não extraía o
JSON quando o Hermes emitia prefácio de texto (`1584e47`); (2) o prompt do
runner mencionava "justificativa" (campo inexistente no schema) e omitia enums,
gerando dossiês inválidos (`a365a4f`). Ambos foram corrigidos, testados e
validados com sucesso na re-execução.

## Objetivo

Fechar o ciclo editorial determinístico:

`fonte → Hermes (editor-chefe) → runner (governança) → dossiê validado →
n8n (CV-01) → draft no Payload → Telegram (CV-02) → decisão humana →
n8n (CV-03) → publicação no Payload → portal público → CV-04 (monitoramento)`

O n8n é a **única ponte autorizada** entre o fluxo Hermes e o Payload
(ADR-017). O Hermes não recebe credencial do Payload; a role `automation` cria
ou atualiza drafts mas **nunca publica**.

## Matriz de papéis (imutável — ADR-034)

| Papel | Componente | Responsabilidade | Proibido |
| --- | --- | --- | --- |
| `EDITOR_CHEFE` | Hermes | decidir pauta, pesquisa, fontes e conteúdo; produzir o dossiê | publicar; escrever no Payload |
| `GOVERNANCA` | runner | autenticar, limitar, validar, persistir | produzir texto editorial |
| `MODELO`/`PESQUISA` | DeepSeek/Tavily | inferência e busca subordinadas ao Hermes | ser chamados diretamente como editor |
| `ORQUESTRACAO` | n8n | orquestrar com idempotência, sem decidir editorialmente | decidir pauta/conteúdo |
| `CMS_E_REVISAO` | Payload/PostgreSQL | fonte de verdade, revisão e publicação | receber saída não validada |

## Workflows (CV-01 a CV-04)

### CV-01 — Intake Hermes

1. Webhook autenticado: HMAC-SHA256 sobre corpo bruto + timestamp + versão;
   janela anti-replay de 300 s; `Idempotency-Key`; corpo ≤ 1 MiB.
2. Validação estrita contra `editorial-research-request.v1` (rejeitar extra,
   enums, tamanhos).
3. `hermesEditorial.createJob` (one-shot; runner governa execução).
4. `hermesEditorial.getJob` até estado terminal (deadline monotônico).
5. Se `succeeded`: mapear o dossiê (`editorial-dossier.v1`) e criar
   `research-dossiers`, `sources` e um `articles` em `draft` no Payload via
   role `automation`. Idempotência persistente: o mesmo dossiê não gera
   segundo artigo; conflito de `Idempotency-Key` com corpo diferente é
   rejeitado.

### CV-02 — Aprovação via Telegram

1. Enviar resumo sanitizado (título, pilar, risco, fontes, link de revisão no
   Payload Admin) para um canal/chat autorizado.
2. Comandos `APROVAR`, `REJEITAR` e `REVISAR`, com allowlist de revisores.
3. Persistir no CMS: identidade do aprovador, horário, comentário e decisão.
4. Callbacks assinados, expiráveis e idempotentes; nunca aceitar decisão de
   identidade não autorizada.

### CV-03 — Publicação no CMS

1. Publicar somente com decisão humana válida persistida (APROVAR).
2. Validar título, resumo, conteúdo, autor, revisor, categoria, imagem
   destacada, fontes e `publishedAt`; a role `automation` não publica por si.
3. Revalidar cache editorial e confirmar a URL pública canônica.
4. Erro não produz publicação parcial; transição registrada e auditável.

### CV-04 — Monitoramento editorial

1. Verificar links/fontes e envelhecimento do conteúdo publicado.
2. Abrir tarefa de revisão; nunca alterar texto publicado silenciosamente.
3. Registrar correção, revisor e motivo (histórico versionado no CMS).

## Contratos e schemas existentes (reutilizar, não duplicar)

- `docs/schemas/editorial-research-request.v1.schema.json` (entrada CV-01);
- `docs/schemas/editorial-dossier.v1.schema.json` (saída do Hermes);
- `docs/schemas/source-record.v1.schema.json` e
  `docs/schemas/article-draft.v1.schema.json`;
- `docs/schemas/hermes-observability.v1.schema.json` (telemetria obrigatória);
- contrato HMAC do runner em `docs/22-contrato-integracao-hermes-n8n.md`.

## Credenciais pendentes (fora do Git)

| Credencial | Uso | Estado |
| --- | --- | --- |
| Bot token do Telegram | CV-02 (envio e comandos) | **pendente** |
| Chave da role `automation` no Payload | CV-01/CV-03 (drafts) | **pendente** |
| HMAC do runner | já existe em `.secrets/hmac-secret` | presente |
| DeepSeek/Tavily | no runner, montadas read-only | presente |

## Testes obrigatórios (na ativação)

assinatura válida/inválida e comparação em tempo constante; replay fora da
janela; nonce repetido; payload acima do limite; schema inválido; idempotência
e conflito; indisponibilidade do Payload; Telegram duplicado/expirado/não
autorizado; aprovação/rejeição/revisão; tentativa de publicação por role
errada; reenvio do mesmo dossiê sem criar segundo artigo; falha no meio do
fluxo e reprocessamento manual seguro; fluxo E2E completo em staging.

## Critério de saída

Fonte → Hermes → dossiê → n8n → draft → Telegram → decisão humana → publicação
funciona em staging; reenvio duplicado não cria segundo artigo; todos os
estados e erros são auditáveis; publicação automática permanece impossível.

## Próximo passo (quando autorizado)

1. Provisionar as duas credenciais pendentes (Telegram e Payload `automation`).
2. Criar os workflows CV-01 a CV-04 versionados em `n8n/workflows/`.
3. Validar assinatura, schema e idempotência de cada entrada em staging.
4. Teste E2E completo e aceite humano específico desta fase.
