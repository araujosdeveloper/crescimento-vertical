# Qualidade e aceite

## Pirâmide de testes

### Unitários

- Funções de slug, canonical, tempo de leitura e normalização.
- Regras de acesso.
- Validação de schema.
- Deduplicação e idempotência.
- Mapeamento de CTA.

Ferramenta planejada: Vitest.

Testes editoriais já implementados na Fase 2A (Vitest, `tests/`): matriz de
permissões, transições editoriais, bloqueio de publicação por automation/editor,
exigência de fonte validada, acesso público somente a publicados e validação das
variáveis obrigatórias. Execução: `npm test`.

Testes da Fase 2B (Vitest, `tests/editorial-public.test.ts`): DTOs não expõem
campos internos, filtro de publicados (draft/agendado/publicado), paginação,
exigência de imagem/fonte na publicação, segurança de links, metadata/canonical,
JSON-LD, feed RSS e estado vazio. Total: 60 testes.

Testes da Fase 3B (Python `unittest`, `services/hermes-editorial-runner/tests/`):
HMAC, nonce anti-replay, schemas (request/dossier), dupla trava de execução,
comando sem shell e integração HTTP (401/409/413/400/422/503/404/200). Total:
32 testes.

### Componentes

- Header e menu.
- Cards editoriais.
- Formulários e validações.
- SourceList e CorrectionNotice.
- CTAs.

Ferramentas planejadas: Testing Library e axe.

### Integração

- Payload + PostgreSQL.
- Draft versus published.
- Permissões por role.
- Intake do n8n.
- Webhook assinado.
- Formulário de lead.

### Ponta a ponta

- Navegação pública.
- Busca e filtros.
- Preview autenticado.
- Conteúdo publicado.
- Diagnóstico.
- Hermes → aprovação → publicação.
- Redirecionamentos.

Ferramenta planejada: Playwright.

## Pipeline de CI

Ordem obrigatória:

1. npm ci
2. lint
3. typecheck
4. testes unitários e de componentes
5. build
6. migrações em banco efêmero
7. testes de integração
8. smoke E2E
9. verificação de segredos e dependências

Falha em qualquer etapa bloqueia merge.

## Critérios por página

- Status HTTP correto.
- Um H1.
- Title e description.
- Canonical.
- Open Graph.
- Navegação por teclado.
- Foco visível.
- Sem erro no console.
- Sem overflow horizontal.
- Imagens dimensionadas.
- Estado 404 tratado.
- CTA rastreável.
- Links internos e externos válidos.

## Metas

### Core Web Vitals

- LCP p75 ≤ 2,5 s.
- INP p75 ≤ 200 ms.
- CLS p75 ≤ 0,1.

### Lighthouse em páginas representativas

- Performance ≥ 90.
- Acessibilidade ≥ 95.
- Boas práticas ≥ 95.
- SEO ≥ 95.

Lighthouse local é sinal preventivo; dados reais de campo prevalecem após o
lançamento.

## Matriz de viewports

| Largura | Cenário |
| --- | --- |
| 360 | Android compacto |
| 390 | Smartphone moderno |
| 768 | Tablet retrato |
| 1024 | Tablet paisagem/notebook pequeno |
| 1440 | Desktop |

## Testes editoriais do Hermes

Conjunto obrigatório:

- pauta verdadeira com fonte primária;
- mesma pauta em URLs diferentes;
- atualização de pauta existente;
- assunto popular fora do nicho;
- rumor sem confirmação;
- página com prompt injection;
- fonte contraditória;
- artigo sem data;
- conteúdo protegido por paywall;
- JSON inválido;
- repetição do mesmo idempotencyKey;
- tentativa de publicar sem aprovação.

Resultado esperado: o sistema bloqueia os casos inseguros e registra o motivo.

## Critérios de release

- Todos os testes passam.
- Migração ensaiada.
- Backup recente e verificável.
- Changelog e documentação atualizados.
- Staging aprovado.
- Métricas e alertas ativos.
- Rollback testado ou demonstrado.
- Responsável e janela definidos.

## Severidade

| Nível | Exemplo | Regra |
| --- | --- | --- |
| P0 | Perda de dados, publicação indevida, vazamento | Bloqueia tudo |
| P1 | Site indisponível, lead perdido, login quebrado | Bloqueia release |
| P2 | SEO importante, layout quebrado, erro funcional parcial | Corrigir antes |
| P3 | Refinamento sem impacto material | Pode ser planejado |
