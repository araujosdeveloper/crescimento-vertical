# Escopo e requisitos

## Escopo funcional

### Catálogo comercial da Fase 4

O catálogo oficial possui seis pilares: Sites e landing pages, Tráfego e
conversão, Automação de WhatsApp, Agentes de IA, Integrações n8n e Consultoria
e suporte. As rotas canônicas estão em `/solucoes` e seus subdiretórios. Não há
preços, métricas, cases ou resultados inventados.

### Experiência pública

- Home editorial e comercial.
- Notícias, análises, guias, ferramentas, comparativos e cases.
- Categorias, tags, autores e busca.
- Páginas individuais de serviços.
- Diagnóstico, contato e newsletter.
- Política editorial, correções, privacidade e termos.
- Conteúdos relacionados e CTAs contextuais.
- Compartilhamento e metadados sociais.

### Administração

- Login seguro.
- Gestão de posts, páginas, serviços, autores, categorias, tags, mídias e CTAs.
- Drafts, versões, preview, agendamento, revisão e publicação.
- Registro de fontes e histórico de correções.
- Gestão de redirecionamentos.
- Consulta de leads conforme permissão.
- Auditoria das execuções do Hermes.

### Automação

- Pesquisa agendada.
- Extração e comparação de fontes.
- Classificação de relevância e risco.
- Deduplicação.
- Geração de dossiê e rascunho.
- Aprovação por Telegram.
- Criação idempotente no CMS.
- Publicação e registro de auditoria.
- Alertas de falha e fila de correção.

### Comercial

- CTA por contexto e serviço.
- Formulário de diagnóstico.
- Rastreamento de origem e campanha.
- Notificação de novo lead.
- Registro de consentimento.
- Métricas de conversão.

## Fora do escopo

- Portal de notícias gerais.
- Rede social ou fórum aberto.
- Marketplace de prestadores.
- Publicação automática irrestrita.
- Comentários públicos no lançamento.
- Aplicativo móvel nativo.
- Sistema completo de CRM dentro do portal.
- Checkout ou cobrança na primeira etapa comercial.
- Recomendações médicas, jurídicas ou financeiras personalizadas.
- Scraping que viole termos, paywall, autenticação ou direitos autorais.

## Requisitos não funcionais

### Disponibilidade e recuperação

- Healthcheck da aplicação, CMS e banco.
- Monitoramento externo do domínio.
- Backups criptografados e restauração testada.
- RPO máximo de 6 horas.
- RTO máximo de 4 horas.
- Procedimento de rollback por release.

### Performance

- LCP p75 até 2,5 s.
- INP p75 até 200 ms.
- CLS p75 até 0,1.
- Imagens responsivas e dimensionadas.
- JavaScript de cliente apenas quando necessário.
- Cache explícito para conteúdo publicado.

### Acessibilidade

- WCAG 2.2 nível AA como referência.
- Navegação completa por teclado.
- Foco visível.
- Contraste adequado.
- Hierarquia semântica de títulos.
- Formulários com label, erro e instrução acessíveis.
- Respeito a redução de movimento.

### Segurança

- TLS obrigatório.
- Privilégio mínimo por usuário e serviço.
- Rate limiting em autenticação, formulários e webhooks.
- Assinatura e idempotência nas integrações.
- Secrets somente em ambiente protegido.
- Logs sem credenciais ou conteúdo pessoal desnecessário.
- Atualização e varredura contínua de dependências.

### SEO

- Canonical e metadados exclusivos.
- Sitemap e robots válidos.
- Dados estruturados coerentes com o conteúdo.
- Páginas órfãs proibidas.
- Redirecionamentos permanentes mapeados.
- Staging e previews sempre noindex.

## Requisitos editoriais obrigatórios

- Todo artigo possui tipo, categoria, autor, revisor, data e fontes.
- Conteúdo noticioso diferencia data do fato, publicação e atualização.
- Afirmação central depende de fonte primária ou confirmação independente.
- Conteúdo gerado com auxílio de IA passa por revisão humana.
- Correções materiais permanecem visíveis.
- Conteúdo patrocinado recebe identificação clara.
- URLs externas são registradas com data de acesso.
- Texto de terceiros não é reproduzido além do necessário para análise.

## Restrições técnicas

- Preservar Next.js e App Router.
- Integrar Payload no projeto existente, não manter dois frontends concorrentes.
- Usar PostgreSQL com migrações versionadas.
- Usar TypeScript estrito.
- Continuar compatível com Docker e Traefik.
- Não depender do estado interno do Hermes como fonte oficial do conteúdo.
- CMS e banco são a fonte de verdade editorial.
