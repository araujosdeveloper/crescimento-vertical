# Roteiro Mestre de Construção

Este é o plano oficial da transformação da landing page Crescimento Vertical em
um portal editorial e comercial orientado à geração de receita.

## Princípios de execução

1. Construção definitiva por camadas, sem “MVP descartável”.
2. Produção preservada até a nova estrutura estar validada em staging.
3. Cada fase entrega uma capacidade completa e verificável.
4. Arquitetura, conteúdo e monetização evoluem juntas, mas com responsabilidades
   separadas.
5. Hermes opera com privilégio mínimo e aprovação humana.
6. Qualidade, segurança, SEO e observabilidade são critérios de aceite, não
   melhorias opcionais.

## Ordem obrigatória

| Fase | Entrega | Dependência | Estado |
| --- | --- | --- | --- |
| 0 | Governança, auditoria e documentação | Nenhuma | Concluída |
| 1 | Baseline técnico e segurança de implantação | Fase 0 | Em execução |
| 2 | Fundação do portal e design system | Fase 1 | Pendente |
| 3 | Payload CMS, PostgreSQL e autenticação | Fase 2 | Pendente |
| 4 | Arquitetura pública e páginas comerciais | Fase 3 | Pendente |
| 5 | Portal editorial e experiência de leitura | Fase 4 | Pendente |
| 6 | SEO técnico, dados estruturados e performance | Fase 5 | Pendente |
| 7 | Captação, diagnóstico e mensuração comercial | Fase 6 | Pendente |
| 8 | Hermes Agent e política editorial automatizada | Fase 7 | Pendente |
| 9 | n8n, Telegram, aprovação e publicação | Fase 8 | Pendente |
| 10 | Conteúdo inicial e validação editorial | Fase 9 | Pendente |
| 11 | Segurança, observabilidade, backup e recuperação | Fase 10 | Pendente |
| 12 | Migração, lançamento e estabilização | Fase 11 | Pendente |

Somente uma fase pode permanecer “em execução”. Exceções precisam de decisão
registrada.

## Fase 0 — Governança, auditoria e documentação

### Entregas

- Inventário da aplicação e infraestrutura declarada no repositório.
- Visão do produto, escopo e arquitetura alvo.
- Arquitetura de informação, modelo editorial e taxonomia.
- Responsabilidade do Hermes, n8n, CMS e site.
- Plano de qualidade, segurança, monetização e operação.
- Regras obrigatórias em AGENTS.md.

### Critério de saída

- Todos os documentos do índice existem, estão ligados entre si e não apresentam
  contradições conhecidas.

## Fase 1 — Baseline técnico e segurança de implantação

### Atividades

1. Confirmar estado real da VPS, Docker, Traefik, DNS e certificados.
2. Registrar versões reais e variáveis necessárias, sem copiar segredos.
3. Fazer backup do repositório implantado, configuração e ativos persistentes.
4. Confirmar commit atualmente em produção.
5. Executar npm ci, lint e build na base sem alterações.
6. Capturar baseline visual da home em desktop e mobile.
7. Corrigir imediatamente contatos fictícios antes de qualquer campanha.
8. Criar branch de evolução do portal.
9. Definir ambiente staging protegido por autenticação e noindex.
10. Criar healthcheck da aplicação e procedimento inicial de rollback.

### Critério de saída

- Base reproduzível, commit de produção conhecido, backup restaurável, staging
  acessível somente aos responsáveis e build atual aprovado.

## Fase 2 — Fundação do portal e design system

### Atividades

1. Organizar rotas com grupos públicos, editoriais e administrativos.
2. Consolidar tokens de cor, espaçamento, tipografia, borda e elevação.
3. Separar componentes de layout, navegação, cards, CTAs e conteúdo.
4. Transformar links por âncora em navegação compatível com páginas reais.
5. Criar header e footer definitivos com menus desktop e mobile.
6. Implantar breadcrumbs, estados de foco e padrões de formulário.
7. Preparar contratos TypeScript para conteúdo e serviços.
8. Implantar testes unitários e de componentes básicos.

### Critério de saída

- Estrutura pública navegável com design consistente, sem regressão da landing
  page e aprovada nos viewports obrigatórios.

## Fase 3 — Payload CMS, PostgreSQL e autenticação

### Atividades

1. Integrar Payload ao Next.js existente.
2. Adicionar PostgreSQL com migrações versionadas.
3. Criar coleções e globals definidos em docs/07-cms-dados-e-apis.md.
4. Implantar roles admin, editor, revisor, comercial e hermes-service.
5. Ativar versões, drafts e preview.
6. Configurar armazenamento persistente de mídia.
7. Implementar seed apenas estrutural: categorias, serviços, CTAs e configurações.
8. Criar backup e teste de restauração do banco.
9. Impedir leitura pública de qualquer documento não publicado.

### Critério de saída

- Administrador consegue criar, revisar, visualizar e publicar um artigo em
  staging; visitante nunca acessa rascunhos; restauração do banco é comprovada.

## Fase 2A — Fundação editorial (implementada em código)

Antecipação aprovada da fundação de código da Fase 3, sem deploy. Detalhes em
[docs/17-fundacao-editorial-payload.md](docs/17-fundacao-editorial-payload.md) e
[ADR-014](docs/14-registro-decisoes.md).

### Entregas implementadas em código

- Payload 3.88.0 integrado ao Next.js existente (`/admin`, `/api`, `withPayload`).
- PostgreSQL 16 dedicado com migrações versionadas (`push` desativado).
- Coleções: users, authors, categories, media, sources, research-dossiers e
  articles, com drafts/versões.
- Roles admin, editor, reviewer, researcher e automation com acesso no servidor.
- Workflow editorial (draft → in_review → approved → published → archived) com
  transições bloqueadas no servidor e publicação exigindo fonte validada.
- Tipos gerados, migration inicial, Dockerfile (sharp/mídia), Compose de
  validação, testes (Vitest) e CI (GitHub Actions).

### Não concluído (permanece pendente)

- Deploy em staging/produção e credenciais reais.
- Primeiro usuário administrador.
- Seed estrutural e backup/restauração do banco.
- Integração Hermes/n8n e páginas públicas do blog.

## Fase 2B — Portal editorial público (implementado em código)

Antecipação aprovada das Fases 4/5/6 (arquitetura pública, portal editorial e
SEO técnico) em código, sem deploy e sem integração Hermes/n8n. Detalhes em
[docs/19-portal-editorial-publico.md](docs/19-portal-editorial-publico.md) e
[ADR-015](docs/14-registro-decisoes.md).

### Entregas implementadas em código

- Camada pública server-only `src/lib/editorial/` (Payload Local API com
  `overrideAccess:false`, `draft:false`, filtro defensivo e DTOs públicos).
- Rotas `/conteudos`, `/conteudos/[slug]`, `/categorias/[slug]`,
  `/autores/[slug]`, `/feed.xml`, `sitemap.xml` e not-found editorial.
- Seção "Conteúdos para crescer" na home.
- SEO técnico (metadata, canonical, Open Graph, Twitter, JSON-LD, sitemap, RSS).
- Cache com revalidação sob demanda.
- Campo `featured` em articles + migration versionada.
- Publicação exige imagem destacada e tetos de SEO (60/160 caracteres).
- 60 testes (Vitest).

### Não concluído (permanece pendente)

- Deploy/ativação e homologação visual.
- Conteúdo editorial real e primeiro usuário administrador.
- Integração Hermes/n8n e produção editorial.

## Fase 4 — Arquitetura pública e páginas comerciais

### Atividades

1. Reconstruir a home como portal de conversão.
2. Criar páginas de soluções e diagnóstico.
3. Criar sobre, contato, cases e páginas legais.
4. Relacionar conteúdo editorial a serviços e CTAs.
5. Implantar redirecionamentos das URLs antigas quando necessário.
6. Validar formulários, WhatsApp, e-mail e navegação.

### Critério de saída

- Todas as rotas comerciais possuem conteúdo real, CTA rastreável, metadados e
  tratamento responsivo.

## Fase 5 — Portal editorial e experiência de leitura

### Atividades

1. Criar listagens de notícias, análises, guias, ferramentas e comparativos.
2. Criar página de artigo com autor, revisor, data, fontes e histórico de
   atualização.
3. Adicionar busca, filtros, paginação e conteúdos relacionados.
4. Implantar blocos de conteúdo reutilizáveis e CTAs contextuais.
5. Criar páginas de categoria, tag e autor.
6. Implantar páginas de política editorial e correções.

### Critério de saída

- O fluxo completo descoberta → leitura → aprofundamento → solução → diagnóstico
  funciona com conteúdo vindo do CMS.

## Fase 6 — SEO técnico, dados estruturados e performance

### Atividades

1. Definir canonical, title, description e Open Graph por rota.
2. Gerar robots.txt e sitemap.xml dinamicamente.
3. Implantar Article, NewsArticle, Organization, BreadcrumbList, Service e FAQ
   quando semanticamente aplicável.
4. Definir política de indexação de busca, filtros, previews e staging.
5. Otimizar imagens, fontes, cache, renderização e JavaScript do cliente.
6. Configurar Google Search Console e GA4.
7. Validar Core Web Vitals e orçamento de performance.

### Critério de saída

- Nenhum erro crítico de indexação, dados estruturados válidos, sitemap íntegro e
  metas de qualidade de docs/11-qualidade-e-aceite.md atendidas.

## Fase 7 — Captação, diagnóstico e mensuração comercial

### Atividades

1. Criar formulário de diagnóstico com consentimento e antispam.
2. Registrar lead com origem, conteúdo, campanha e serviço de interesse.
3. Notificar a operação comercial sem expor dados pessoais em logs.
4. Implantar eventos de CTA, WhatsApp, envio, sucesso e agendamento.
5. Criar confirmação e rota de recuperação em caso de falha.
6. Definir tempo de retenção e rotina de exclusão.

### Critério de saída

- Lead real de staging percorre o fluxo completo uma única vez, com rastreabilidade,
  consentimento e tratamento de falhas.

## Fase 8 — Hermes Agent e política editorial automatizada

### Atividades

1. Auditar recursos e configuração do Hermes já instalado na VPS-alvo.
2. Criar perfil logicamente isolado crescimento-vertical-editorial, sem alterar
   os demais projetos do Hermes.
3. Criar skill editorial versionada neste repositório.
4. Configurar fontes autorizadas, fontes proibidas e regras de verificação.
5. Configurar busca, extração, continuidade e deduplicação.
6. Validar o contrato JSON do dossiê editorial.
7. Configurar agenda inicial e limites de custo.
8. Executar bateria de pautas verdadeiras, falsas, duplicadas e ambíguas.

### Critério de saída

- Hermes gera dossiês rastreáveis, sem publicar, rejeita conteúdo fora do nicho e
  interrompe o fluxo quando não há evidência suficiente.

## Fase 9 — n8n, Telegram, aprovação e publicação

### Atividades

1. Criar os workflows CV-01 a CV-04 definidos na documentação.
2. Validar assinatura, schema e idempotência de cada entrada.
3. Criar rascunho no CMS com o usuário técnico do Hermes.
4. Enviar resumo editorial para Telegram.
5. Processar APROVAR, REJEITAR e REVISAR com identidade do aprovador.
6. Publicar somente após aprovação válida.
7. Registrar toda transição, erro, repetição e correção.
8. Criar fila de falha e reprocessamento manual seguro.

### Critério de saída

- Teste fim a fim comprovado: fonte → Hermes → Telegram → aprovação → CMS →
  publicação; reenvio duplicado não cria segundo artigo.

## Fase 10 — Conteúdo inicial e validação editorial

### Atividades

1. Publicar páginas institucionais e legais definitivas.
2. Preparar clusters iniciais ligados diretamente às soluções comerciais.
3. Revisar autoria, fontes, imagens, direitos e CTAs.
4. Validar links internos e ausência de páginas órfãs.
5. Preparar calendário editorial de 90 dias.
6. Realizar revisão humana integral de todo conteúdo de lançamento.

### Critério de saída

- Portal possui conteúdo suficiente para representar cada pilar, sem texto
  fictício, duplicado ou sem fonte, e cada cluster conduz a uma solução.

## Fase 11 — Segurança, observabilidade, backup e recuperação

### Atividades

1. Aplicar headers, rate limiting, proteção de formulários e auditoria de acesso.
2. Executar varredura de dependências e segredos.
3. Configurar logs estruturados, métricas, uptime e alertas.
4. Automatizar backups de banco, configurações e mídia.
5. Executar restauração em ambiente isolado.
6. Documentar incidentes, rollback e continuidade operacional.
7. Realizar teste de carga compatível com o lançamento.

### Critério de saída

- Alertas chegam ao responsável, restauração cumpre RPO/RTO definidos e nenhuma
  vulnerabilidade crítica conhecida permanece aberta.

## Fase 12 — Migração, lançamento e estabilização

### Atividades

1. Congelar mudanças não essenciais.
2. Fazer backup pré-lançamento e registrar hashes.
3. Executar migrações e implantação controlada.
4. Verificar domínio, TLS, robots, sitemap, páginas, APIs e CTAs.
5. Acompanhar erros, indexação, performance e leads.
6. Manter janela de rollback.
7. Encerrar estabilização somente após sete dias sem incidente crítico.

### Critério de saída

- Produção íntegra, monitorada e recuperável; conteúdo indexável; captação
  funcionando; documentação correspondente ao estado implantado.

## Controle de alteração do roteiro

Qualquer mudança nesta sequência precisa registrar:

- problema que motivou a mudança;
- impacto em escopo, custo, prazo, segurança e SEO;
- alternativa rejeitada;
- decisão e responsável;
- data;
- fases afetadas.

O registro deve ser feito em docs/14-registro-decisoes.md antes da implementação.

### Alteração 2026-08-24 — Fase 2A

- Problema: preparar a fundação editorial em código sem esperar o gate integral
  das Fases 1/2, preservando produção e staging ativos.
- Impacto: entrega antecipada de código (CMS, banco, permissões, migrações,
  testes, CI); sem impacto em produção, DNS, credenciais ou deploy.
- Alternativa rejeitada: aguardar a sequência estrita, adiando a fundação.
- Decisão e responsável: implementar a “Fase 2A” em código, registrada no
  ADR-014; responsável Crescimento Vertical.
- Data: 2026-08-24.
- Fases afetadas: 3 (fundação de CMS/banco), antecipada parcialmente em código.

### Alteração 2026-08-25 — Fase 2B

- Problema: expor o conteúdo editorial publicamente (com SEO e cache) sobre a
  fundação da Fase 2A, sem aguardar o gate integral das Fases 4/5/6.
- Impacto: entrega antecipada de código (portal editorial público, SEO, cache);
  sem impacto em produção, DNS, Hermes, n8n ou deploy.
- Alternativa rejeitada: aguardar a sequência estrita, adiando o portal público.
- Decisão e responsável: implementar a “Fase 2B” em código, registrada no
  ADR-015; responsável Crescimento Vertical.
- Data: 2026-08-25.
- Fases afetadas: 4/5/6 (arquitetura pública, portal editorial e SEO técnico),
  antecipadas parcialmente em código.
