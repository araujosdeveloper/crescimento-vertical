# Contrato de saída (referência da skill)

A saída da skill é validada pelo runner contra
`docs/schemas/editorial-dossier.v1.schema.json` (Draft 2020-12,
`additionalProperties: false`).

## Campos obrigatórios

- `schemaVersion`: `"1.0"`.
- `idempotencyKey`: string (chave de idempotência da pauta/fontes).
- `hermesRunId`: identificador da execução.
- `discoveredAt`: ISO-8601.
- `contentType`: enum (`news`, `analysis`, `guide`, `tool`, `comparison`,
  `case`).
- `primaryPillar`: enum (`ai-business`, `automation`, `sales-attendance`,
  `sites-conversion`, `tools-integrations`).
- `riskLevel`: enum (`low`, `medium`, `high`, `blocked`).
- `sources`: array (mínimo 1) de objetos com `url` (HTTPS), `publisher`,
  `sourceLevel` (`A`/`B`/`C`), `publishedAt`, `accessedAt`, `supports[]`.

## Campos opcionais relevantes

- `correlationId`, `confidence` (0–1), `contradictions[]`,
  `missingInformation[]`, `riskFlags[]`.
- `title`, `dek`, `executiveSummary`, `businessImpact`, `draft`.
- `claims[]` (com `id`, `text`, `sourceUrls[]`, `status`
  `verified`/`unverified`).
- `relatedServiceSlug`, `warnings[]`.

## Regras

- `sources` deve conter pelo menos uma fonte; cada `claim` deve referenciar a
  fonte que a sustenta (`sourceUrls`).
- `confidence` reflete a segurança das afirmações; contradições e lacunas devem
  ser registradas, nunca omitidas.
- A skill devolve **somente** JSON — nenhum texto adicional.
