# Arquitetura de informação

## Navegação principal

1. Notícias
2. Análises
3. Guias
4. Ferramentas
5. Soluções
6. CTA: Solicitar diagnóstico

Comparativos ficam acessíveis em Ferramentas, busca, home e links contextuais.
Sobre, cases, newsletter, contato e páginas legais permanecem no footer e nos
contextos relevantes.

## Mapa de rotas

### Institucionais e conversão

| Rota | Finalidade |
| --- | --- |
| / | Home editorial e comercial |
| /solucoes | Visão consolidada dos serviços |
| /solucoes/automacao-whatsapp | Atendimento e vendas automatizadas |
| /solucoes/agentes-de-ia | Agentes especializados |
| /solucoes/sites-de-alta-conversao | Sites e landing pages |
| /solucoes/integracoes-n8n | Integrações e orquestração |
| /solucoes/monitoramento-e-suporte | Operação recorrente |
| /cases | Resultados e projetos |
| /cases/[slug] | Case individual |
| /diagnostico | Captação e qualificação |
| /sobre | Marca, método e responsabilidade |
| /contato | Canais de contato |
| /newsletter | Proposta e inscrição |

### Editoriais

| Rota | Finalidade |
| --- | --- |
| /noticias | Fatos recentes e verificados |
| /noticias/[slug] | Notícia individual |
| /analises | Impacto e interpretação |
| /analises/[slug] | Análise individual |
| /guias | Conteúdo perene e educativo |
| /guias/[slug] | Guia individual |
| /ferramentas | Diretório e recomendações |
| /ferramentas/[slug] | Ferramenta individual |
| /comparativos | Comparações metodológicas |
| /comparativos/[slug] | Comparativo individual |
| /categoria/[slug] | Cluster temático |
| /tag/[slug] | Assuntos específicos |
| /autor/[slug] | Perfil e publicações |
| /busca | Busca interna |

### Rotas editoriais públicas implementadas (Fase 2B)

A taxonomia acima permanece como alvo. Na Fase 2B foram implementadas, em
código, as rotas públicas iniciais (detalhes em docs/19):

| Rota | Finalidade |
| --- | --- |
| /conteudos | Hub editorial paginado (12 artigos por página) |
| /conteudos/[slug] | Artigo completo |
| /categorias/[slug] | Conteúdos publicados da categoria |
| /autores/[slug] | Perfil público seguro e artigos do autor |
| /feed.xml | RSS somente com publicados |

As páginas por tipo de conteúdo (notícias, análises, guias, ferramentas e
comparativos) e a busca permanecem previstas para fases posteriores.

### Navegação vigente na Fase 2

A fundação usa somente destinos existentes: Início (`/`), Conteúdos
(`/conteudos`) e as seções da home Soluções, Processo, Diferenciais e Contato
por URLs absolutas (`/#...`). As rotas comerciais e legais listadas como alvo
neste documento não são criadas nem recebem links antes da Fase 4.

### Confiança e legais

| Rota | Finalidade |
| --- | --- |
| /politica-editorial | Método, fontes e uso de IA |
| /correcoes | Política e registro de correções |
| /privacidade | Tratamento de dados |
| /termos | Condições de uso |
| /cookies | Tecnologias e preferências |

## Pilares temáticos

1. **IA nos negócios**
2. **Automação empresarial**
3. **Vendas e atendimento**
4. **Sites e conversão**
5. **Ferramentas e integrações**

Todo conteúdo precisa pertencer a um pilar principal. Tags complementam, mas não
substituem a categoria.

## Tipos de conteúdo

| Tipo | Pergunta que responde | Vida útil |
| --- | --- | --- |
| Notícia | O que aconteceu? | Curta |
| Análise | Por que isso importa? | Média |
| Guia | Como implementar ou decidir? | Longa |
| Ferramenta | Para que serve e quando usar? | Média |
| Comparativo | Qual alternativa atende melhor? | Média |
| Case | O que foi feito e qual resultado? | Longa |

## Estrutura da home

1. Header e posicionamento.
2. Hero com proposta de valor e dois CTAs.
3. Destaque editorial principal.
4. Últimas notícias.
5. Bloco “Por que isso importa para sua empresa”.
6. Soluções da Crescimento Vertical.
7. Guias essenciais.
8. Ferramentas e comparativos.
9. Cases e evidências.
10. Diagnóstico.
11. Newsletter.
12. Confiança editorial e marca.
13. CTA final e footer.

## Estrutura de uma página editorial

1. Breadcrumb.
2. Tipo, categoria e data.
3. Título e subtítulo.
4. Autor, revisor e histórico de atualização.
5. Imagem principal e crédito.
6. Resumo executivo.
7. Conteúdo.
8. Bloco “Impacto para o seu negócio”.
9. Fontes consultadas.
10. Nota de correção, quando houver.
11. CTA contextual.
12. Conteúdos relacionados.
13. Newsletter.

## Regras de URL

- Letras minúsculas, hífen e português claro.
- Slug curto, estável e sem data.
- Não alterar slug publicado sem redirect 301.
- Parâmetros de campanha nunca entram no canonical.
- Filtros e busca são noindex, salvo decisão específica.
- Uma mesma pauta possui uma única URL canônica.

## Mapeamento conteúdo → serviço

| Pilar | Serviço prioritário |
| --- | --- |
| IA nos negócios | Agentes de IA |
| Automação empresarial | Integrações n8n |
| Vendas e atendimento | Automação WhatsApp |
| Sites e conversão | Sites de alta conversão |
| Ferramentas e integrações | Consultoria, integração e suporte |

O CTA deve ser útil e proporcional ao conteúdo; não inserir oferta agressiva em
todo parágrafo.
