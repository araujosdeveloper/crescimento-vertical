# Auditoria do estado atual

Data da auditoria: 23 de agosto de 2026.

## VPS oficial confirmada em 24 de agosto de 2026

- O identificador e o endereço da VPS ficam no registro privado ignorado pelo
  Git.
- Não existe diretório nem contêiner do Crescimento Vertical; não há implantação
  anterior para migrar ou sobrescrever.
- Traefik, n8n e Hermes estão ativos e serão preservados.
- A implantação será nova e deverá preservar integralmente os serviços atuais.
- Memória, disco, carga, runtime e consumo dos contêineres foram auditados; há
  capacidade para o baseline. CMS e PostgreSQL receberão limites próprios quando
  forem introduzidos.
- Não há recursos Docker inativos que justifiquem limpeza neste gate.
- O apex ainda aponta para a infraestrutura anterior, não para a VPS-alvo.
- HTTPS no apex e em www falhou com certificado incompatível com o hostname.
- O DNS não será alterado antes de a nova aplicação estar implantada e validada
  localmente por meio do Traefik.
- As portas web públicas pertencem ao Traefik; o n8n não está publicado
  diretamente na internet.
- Um processo público preexistente fora do Docker foi documentado no registro
  privado e não será interrompido no escopo deste projeto.
- Traefik redireciona globalmente web para websecure, usa o resolver ACME
  mytlschallenge por TLS challenge e possui persistência de certificados.
- As labels do Crescimento Vertical já referenciam websecure e
  mytlschallenge, portanto são compatíveis com o proxy instalado.
- Não existe router atual para crescimentovertical.com; não há conflito de host.
- Os volumes ainda precisam ser auditados antes do deploy definitivo.

## Validação da imagem e do container — 24 de agosto de 2026

- Commit-base implantado: b71b52a8c0cdd4442a1c6244e61a53f8f57b532c.
- npm ci, npm run check, ESLint, TypeScript e build Next.js: aprovados.
- docker compose build: aprovado; imagem crescimento-vertical-crescimento-vertical.
- Container iniciado com --no-build e --wait; estado healthy em cerca de 6 s.
- GET /api/health/live retornou {"status":"ok"}.
- GET /api/health/ready retornou {"status":"ready"}.
- Traefik local entregou crescimentovertical.com e www.crescimentovertical.com
  com HTTP 200.
- O processo Next.js iniciou em 0.0.0.0:3000.
- A VPS exigiu o pacote libatomic1 para executar o Node instalado.
- TLS local resultou em 18: o DNS ainda aponta para a infraestrutura anterior;
  isso não configura TLS de produção aprovado.
- Nenhum DNS foi alterado.
- Hermes, n8n, Traefik e demais serviços existentes foram preservados.

## Repositório

- Repositório: araujosdeveloper/crescimento-vertical.
- Branch padrão: main.
- Aplicação pequena e centralizada em um único projeto Next.js.
- Não havia documentação de produto ou arquitetura na raiz.

## Stack encontrada

| Item | Estado |
| --- | --- |
| Next.js | 16.2.9, App Router |
| React | 19.2.7 |
| TypeScript | strict habilitado |
| Estilos | Tailwind CSS e CSS global |
| Ícones | lucide-react |
| Build | next build --webpack |
| Contêiner | Node 22 Alpine, múltiplos estágios |
| Proxy | Traefik via labels |
| Rede | n8n_default externa |
| Banco | Ausente |
| CMS | Ausente |
| Testes | Ausentes |
| CI | Ausente |

## Estrutura funcional atual

- Home composta por Header, Hero, Autoridade, Serviços, Problema, Processo,
  Diferenciais, CTA, Footer e botão flutuante de WhatsApp.
- Navegação baseada em âncoras na mesma página.
- Identidade visual escura com azul e ciano.
- Componentes separados por seção.
- Responsividade tratada em CSS, inclusive para telas pequenas.

## Pontos positivos preserváveis

- Base em App Router e TypeScript estrito.
- Marca visual coerente com tecnologia.
- Componentização suficiente para evoluir sem descartar toda a interface.
- Dockerfile com estágios de dependências, build e execução.
- TLS e roteamento já declarados por Traefik.

## Lacunas e riscos

### Críticos antes de aquisição de tráfego — estado original

- WHATSAPP_URL usa o número fictício 5500000000000.
- Footer exibe (00) 00000-0000.
- Não há formulário de diagnóstico ou armazenamento de leads.
- Não há política de privacidade, termos, política editorial ou correções.

### Tratamento iniciado na Fase 1

- O número 5500000000000 e a exibição (00) 00000-0000 foram removidos do código.
- WhatsApp passou a depender de NEXT_PUBLIC_WHATSAPP_NUMBER válido.
- Na ausência de WhatsApp configurado, os CTAs usam o e-mail.
- .env.example documenta as variáveis públicas sem segredos.
- Contato real ainda precisa ser confirmado pelo responsável.

### Produto e conteúdo

- Não existem rotas de notícias, análises, guias, ferramentas ou comparativos.
- Serviços não possuem páginas próprias.
- Não há CMS, banco, usuários, drafts, versões ou preview.
- Não há taxonomia editorial nem relacionamento entre conteúdo e serviço.

### SEO

- Metadata global ainda representa somente “Estratégia Digital, Automação e
  Performance”.
- Não foram encontrados sitemap.ts, robots.ts, canonical por página ou dados
  estruturados.
- Não existem páginas de autor, categoria, tag ou política editorial.

### Engenharia

- Não há script separado de typecheck.
- Não há testes unitários, de integração ou ponta a ponta.
- Não há workflow de integração contínua.
- Docker Compose não declara healthcheck, volumes, banco ou política de recursos.
- Aplicação compartilha diretamente a rede n8n_default.
- Não há ambiente staging documentado.
- Não há migrações, backup, observabilidade ou runbook.

## Restrições da evolução

- Não apagar a landing atual antes de existir substituta validada.
- Não alterar domínio, DNS ou implantação nesta fase documental.
- Não adicionar CMS ou banco sem baseline e backup da Fase 1.
- Não publicar conteúdo automatizado sem workflow de aprovação.
- Não corrigir silenciosamente redirecionamentos; toda URL afetada será mapeada.

## Primeira ação técnica autorizável

Executar a Fase 1 do Roteiro Mestre: confirmar a infraestrutura real, criar
baseline reproduzível, proteger staging e validar backup/rollback. Nenhuma
integração do Hermes deve ser instalada antes desse gate.

## Evidências locais após o início da Fase 1

- Commit-base clonado: 5b461252037f6670be7d8cd4095c5d202f97ae5d.
- Branch: feat/portal-phase-1-baseline.
- npm ci: aprovado.
- ESLint: aprovado.
- TypeScript: aprovado.
- Build Next.js: aprovado.
- Saída standalone: aprovada.
- Healthchecks live e ready: aprovados em smoke test HTTP.
- Home gerada sem telefone fictício.
- Docker Compose: YAML validado.
- Imagem Docker: construída e validada na VPS; container saudável e healthchecks
  aprovados.

A imagem foi construída e validada na VPS oficial com commit-base
b71b52a8c0cdd4442a1c6244e61a53f8f57b532c. Backup pré-implantação, redes, DNS, TLS,
staging e rollback continuam dependentes da auditoria operacional.
