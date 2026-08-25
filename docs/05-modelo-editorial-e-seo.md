# Modelo editorial e SEO

## Missão editorial

Transformar acontecimentos e ferramentas de IA, automação e tecnologia em
informação confiável, aplicável e comercialmente relevante para empresas.

## Hierarquia de fontes

### Nível A — primárias

- Documentação oficial.
- Blog, newsroom ou comunicado da organização responsável.
- Repositório e release oficial.
- Diário oficial, legislação, norma ou decisão pública.
- Artigo científico original.
- Dados e relatórios do produtor da pesquisa.

### Nível B — jornalísticas e técnicas reconhecidas

- Veículos com autoria, data, política de correção e reputação verificável.
- Publicações técnicas especializadas com referências.

### Nível C — descoberta, nunca confirmação única

- Redes sociais.
- Newsletters de terceiros.
- Fóruns e comunidades.
- Agregadores.
- Vídeos e opiniões sem documentação.

Fonte Nível C pode descobrir uma pauta, mas não sustenta sozinha a afirmação
central.

## Regra mínima de verificação

- Preferir uma fonte Nível A.
- Sem fonte primária acessível, exigir duas fontes independentes Nível B.
- Registrar data do fato, data de publicação e data de acesso.
- Distinguir fato, declaração, previsão e inferência.
- Não transformar rumor em fato.
- Quando houver conflito entre fontes, interromper a publicação e registrar a
  divergência.
- Temas jurídicos, financeiros, segurança ou privacidade recebem risco alto.

## Processo editorial

| Estado | Responsável | Resultado |
| --- | --- | --- |
| discovered | Hermes | Item encontrado |
| triaged | Hermes | Relevância, risco e duplicação avaliados |
| researching | Hermes | Fontes e evidências reunidas |
| drafted | Hermes | Dossiê e rascunho estruturados |
| awaiting_review | n8n/CMS | Aguardando humano |
| needs_revision | Revisor | Correção solicitada |
| approved | Revisor autorizado | Apto para publicação |
| scheduled | Editor | Data definida |
| published | CMS | Conteúdo público |
| corrected | Editor/Revisor | Alteração material registrada |
| archived | Editor | Retirado de circulação normal |
| rejected | Revisor | Não publicável |

Transições são persistidas. Não é permitido saltar de discovered para published.

### Mapeamento no CMS

A fundação editorial (docs/17-fundacao-editorial-payload.md) implementa no campo
`workflowStatus` dos artigos os estados `draft`, `in_review`, `approved`,
`published` e `archived`, com transições validadas no servidor. Publicação exige
título, resumo, conteúdo, autor, categoria e ao menos uma fonte validada.

## Estrutura editorial obrigatória

### Notícias

- O que aconteceu.
- Quando aconteceu.
- Quem confirmou.
- O que muda.
- Limitações ou pontos ainda desconhecidos.
- Impacto para negócios.
- Fontes.

### Análises

- Tese explícita.
- Evidências.
- Cenários e limites.
- Aplicação por perfil de empresa.
- Conclusão.
- Fontes.

### Guias

- Problema.
- Pré-requisitos.
- Passos.
- Riscos e alternativas.
- Checklist final.
- Data de revisão.

### Comparativos

- Critérios declarados antes da conclusão.
- Mesmo conjunto de critérios para todas as opções.
- Preços e recursos com data de verificação.
- Relação comercial ou afiliada declarada.
- Melhor opção por cenário, sem falso vencedor universal.

### Cases

- Contexto autorizado.
- Problema inicial.
- Solução.
- Escopo e período.
- Métrica com origem.
- Limitações.
- Autorização para nome, marca e resultado.

## Originalidade e direitos

- Não montar artigo por paráfrase sequencial de uma única matéria.
- Usar múltiplas fontes e produzir estrutura própria.
- Citações devem ser curtas, necessárias, atribuídas e ligadas à fonte.
- Imagem exige licença, autorização ou geração própria documentada.
- Não remover marca d’água.
- Não contornar paywall ou autenticação.
- Conteúdo patrocinado não interfere silenciosamente na conclusão editorial.

## Transparência sobre IA

- A política editorial declara o uso do Hermes na pesquisa e preparação.
- Todo conteúdo automatizado informa revisão humana.
- Autor representa responsabilidade editorial real, não persona fictícia.
- Alterações substanciais geradas por automação exigem nova revisão.

## Correções

Correção material deve registrar:

- data;
- trecho ou afirmação afetada;
- versão anterior resumida;
- versão corrigida;
- motivo;
- responsável.

Erros de digitação sem mudança de sentido podem ser corrigidos sem nota pública,
mas permanecem no histórico de versões.

## Checklist SEO por conteúdo

- Intenção de busca identificada.
- Palavra-chave principal usada naturalmente.
- Title exclusivo e orientado a benefício/fato.
- Description exclusiva e fiel.
- Um H1.
- Hierarquia H2/H3 coerente.
- Slug estável.
- Canonical correto.
- Links internos para cluster, conteúdo relacionado e serviço.
- Links externos para fontes.
- Imagem com dimensões, crédito e texto alternativo.
- Data de publicação e atualização.
- Dados estruturados compatíveis.
- CTA contextual.
- Ausência de conteúdo duplicado ou “enchimento”.

## Política de atualização

| Conteúdo | Revisão sugerida |
| --- | --- |
| Notícia | Quando o fato evoluir |
| Análise | A cada mudança material |
| Guia | A cada 90 dias |
| Ferramenta | A cada 60 dias |
| Comparativo | A cada 30–60 dias |
| Case | Quando houver nova métrica autorizada |

O Hermes pode sinalizar envelhecimento; somente o CMS registra a revisão oficial.

## Prevenção de canibalização

- Uma intenção principal por URL.
- Antes de criar conteúdo, consultar posts existentes.
- Se a intenção já existe, atualizar ou ampliar a página canônica.
- Notícias podem apontar para um guia pilar, mas não tentar substituí-lo.
- Tags não devem replicar categorias nem criar páginas vazias.

## Referências técnicas de implementação

- [Next.js: geração de sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js: geração de robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Next.js: arquivos de metadata](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
