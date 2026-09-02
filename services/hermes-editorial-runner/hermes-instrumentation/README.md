# Instrumentação mínima do Hermes 0.20.4 (observabilidade v1)

Patch mínimo, isolado, versionado e testável para que o Hermes exporte, no
`--usage-file`, os campos exigidos pelo contrato de observabilidade
`docs/schemas/hermes-observability.v1.schema.json` (ADR-034):

- `finish_reason` — valor real do provider, derivado de `turn_exit_reason`
  (o Hermes já embute o valor em `text_response(finish_reason=...)`);
- `tavily_operations` — contadores exatos de `search` e `extract`,
  instrumentados no ponto real do HTTP.

## O que muda (2 arquivos)

1. `hermes_cli/oneshot.py::_write_usage_file`
   - adiciona `finish_reason` (via `extract_finish_reason`) e
     `tavily_operations` (via contador do provider) ao relatório JSON.
2. `plugins/web/tavily/provider.py`
   - adiciona contador process-local e incrementa `search`/`extract` no ponto
     real do HTTP (`_tavily_request`).

Nenhum prompt, resposta integral, header, cookie ou segredo é registrado. O
patch não altera o loop editorial: o Hermes continua sendo o único responsável
por decidir pauta, estratégia de pesquisa, fontes, estrutura e conteúdo.

## Como aplicar

```sh
cd /opt/hermes                       # diretório-fonte do Hermes na imagem
patch -p1 < hermes-0.20.4-observability.patch
```

O patch é aplicado na **imagem do runner** (que parte de
`ghcr.io/hostinger/hvps-hermes-agent`), nunca no perfil `default` compartilhado
nem no runtime atual sem autorização. A aplicação exige janela autorizada e
reconstrução da imagem candidata; não é executada nesta reconciliação.

## Testes offline

`observability.py` implementa a mesma lógica sem importar o Hermes. Os testes
unitários vivem em `services/hermes-editorial-runner/tests/` e cobrem:

- `finish_reason` stop / length / content_filter / tool_calls / ausente;
- `tavily_operations` search/extract contabilizados no ponto do HTTP;
- ausência de segredos no relatório (nenhum prompt/resposta/header/cookie).

Execução:

```sh
python3 -m unittest discover -s services/hermes-editorial-runner/tests -t services/hermes-editorial-runner
```

## Estado

- Patch **preparado e testado offline**, ainda **não aplicado** à imagem.
- Enquanto não aplicado, o runner permanece **fail-closed** quando a telemetria
  obrigatória (`finish_reason`, `tavily_operations`) estiver ausente.
