# Plano Diretor Definitivo — Crescimento Vertical

**Base auditada:** snapshot Git `207392b2e3dd574e26992e17efcad428f2f356ee`
**Data de consolidação:** 3 de setembro de 2026
**Natureza:** proposta de consolidação para aceite humano; não altera o repositório nem o runtime
**Regra central:** este documento organiza a execução, mas não substitui a Constituição, o Roteiro-Mestre, os ADRs nem os aceites humanos.

> **Atualização de estado (4 de setembro de 2026):** o bloqueador descrito em
> §5.1 foi resolvido pela candidata corrigida `phase8-instrumentation-e154bf4`
> (Image ID `sha256:cad0e4f…`), com black-box embutido idêntico ao Git, 36
> cenários aprovados em `network none` e deploy fechado apenas do runner
> (`bc89e74680e9…`). As seções §4.3, §5.1, §5.3 e §11 foram reconciliadas com
> esse estado; a Fase 8 permanece em execução aguardando aceite humano.

---

## 1. Compromisso de execução

O projeto será concluído conforme a arquitetura e a sequência definidas desde o início. Nenhum executor, agente ou decisão técnica pode:

- rebaixar o Hermes de editor-chefe para simples ferramenta de pesquisa;
- substituir o Hermes por DeepSeek, Tavily, n8n, runner ou código próprio;
- pular, fundir, reordenar ou declarar concluída uma fase sem os gates previstos;
- transformar antecipações técnicas em aceite formal de uma fase futura;
- publicar conteúdo sem aprovação humana;
- usar produção como ambiente de teste;
- iniciar a Fase 9 antes do aceite formal da Fase 8;
- criar retry 3 para os jobs históricos da Fase 8;
- alterar arquitetura, fornecedor, segurança ou governança sem decisão humana e ADR.

Quando documentos divergirem, vale a seguinte ordem:

1. instrução humana explícita mais recente;
2. `AGENTS.md` e `CONSTITUICAO-DO-PROJETO.md`;
3. `ROTEIRO-MESTRE.md` e ADRs aprovados;
4. documentação específica da fase;
5. controle de execução e auditorias;
6. código, Git, CI e runtime como evidência factual.

Uma divergência material exige parada, relatório sanitizado e decisão humana. Não deve ser “resolvida” por improvisação.

---

## 2. Produto final que está sendo construído

A Crescimento Vertical será um produto híbrido com três camadas inseparáveis:

1. **Mídia especializada:** blog/portal sobre inteligência artificial, automação e tecnologia aplicada a negócios.
2. **Autoridade prática:** conteúdo verificável, útil e rastreável que traduz tecnologia em decisão empresarial.
3. **Operação comercial:** conteúdos e páginas de solução conduzem o público a diagnóstico, proposta, projeto e receita recorrente.

### 2.1 Posicionamento

**Inteligência artificial, automação e tecnologia para negócios.**

Mensagem de referência:

> Informação que orienta. Tecnologia que executa. Crescimento que aparece nos resultados.

O portal não será um site generalista de notícias, uma landing page isolada nem um catálogo vazio de serviços. Ele deve formar uma máquina editorial e comercial coerente.

### 2.2 Público principal

- donos e gestores de pequenas e médias empresas;
- operações dependentes de tarefas manuais;
- equipes de vendas e atendimento concentradas em WhatsApp;
- empresas que precisam de IA, automação, sites, CRM e integrações;
- negócios buscando geração e qualificação de demanda.

### 2.3 Pilares editoriais

- IA aplicada a negócios;
- automação de processos;
- vendas e atendimento;
- sites e conversão;
- ferramentas, integrações e produtividade.

### 2.4 Tipos de conteúdo

- Notícias;
- Análises;
- Guias;
- Ferramentas;
- Comparativos;
- Cases, quando houver evidência e autorização.

### 2.5 Catálogo comercial aprovado

1. Sites e landing pages;
2. Tráfego e conversão;
3. Automação de WhatsApp;
4. Agentes de IA;
5. Integrações n8n;
6. Consultoria e suporte.

### 2.6 Funil do produto

Aquisição por busca, indicação ou rede → consumo de conteúdo ou página de solução → CTA contextual → diagnóstico → lead qualificado → reunião/proposta → projeto → recorrência.

### 2.7 Monetização

Prioridade inicial:

- automações e agentes de IA;
- sites e landing pages;
- integrações n8n, CRM e WhatsApp;
- monitoramento e suporte recorrente;
- consultoria e diagnóstico pago quando aplicável.

Somente depois de audiência e autoridade comprovadas:

- afiliados;
- produtos digitais e treinamentos;
- patrocínios;
- publicidade programática, caso não prejudique experiência ou credibilidade.

---

## 3. Arquitetura definitiva e responsabilidades

### 3.1 Fluxo editorial final

Fontes autorizadas → Hermes editor-chefe → dossiê estruturado e rastreável → runner de governança → n8n → draft no Payload → resumo no Telegram → decisão humana → publicação no Payload → portal público → monitoramento e revisão.

### 3.2 Matriz imutável de papéis

| Componente | Papel definitivo | Proibições |
|---|---|---|
| Hermes | Editor-chefe: decide pauta, estratégia de pesquisa, fontes, estrutura e conteúdo; produz o dossiê | Não publica; não acessa Payload/PostgreSQL; não administra usuários |
| DeepSeek | Modelo de inferência usado pelo Hermes | Não governa pauta; não substitui Hermes; sem fallback automático |
| Tavily | Busca e extração usadas pelo Hermes | Não decide fontes finais; não troca automaticamente de backend |
| Runner editorial | Governança: autentica, limita, contabiliza, valida, registra estado/evidência e executa o Hermes one-shot | Não cria pauta nem redige conteúdo por conta própria; sem CMS, PostgreSQL ou Docker socket |
| n8n | Ponte operacional determinística | Não decide editorialmente; não publica sem decisão humana válida |
| Telegram | Interface de revisão e decisão humana | Não é fonte de verdade |
| Payload CMS | Fonte de verdade editorial, revisão, versões, permissões e publicação | Não recebe conteúdo não validado diretamente do Hermes |
| PostgreSQL | Persistência de conteúdo, estados e decisões | Não é acessado pelo Hermes |
| Next.js | Portal público, experiência de leitura, SEO e captação | Não guarda segredo editorial no cliente |
| SMTP Hostinger | Transporte mínimo da notificação comercial | Não é fonte de verdade; não recebe PII do formulário no corpo do e-mail |

### 3.3 Princípios técnicos permanentes

- Payload/PostgreSQL são a fonte de verdade.
- O n8n é a única ponte autorizada entre o fluxo Hermes e o CMS.
- A role `automation` cria ou atualiza drafts e registros operacionais, mas não publica.
- Publicação exige aprovação humana válida e persistida no CMS.
- Segredos ficam fora do Git, da imagem, de argumentos, logs e backups sanitizados.
- Execução editorial utiliza dupla trava e falha fechada.
- Egress do runner passa por proxy allowlist; Docker bridge sozinho não é controle suficiente.
- Jobs, custos, pesquisas e evidências são contabilizados em estado persistente.
- Não há fallback automático de provedor/modelo/backend.
- O portal público não expõe fontes privadas, dossiês internos, leads ou campos administrativos.

---

## 4. Estado comprovado no snapshot

### 4.1 Stack

- Next.js 16.3.0;
- React 19.2.7;
- TypeScript estrito;
- Payload CMS 3.88.0;
- PostgreSQL 16;
- Tailwind CSS 4;
- Vitest 4.1.0;
- Nodemailer 9.0.6;
- Hermes Agent 0.20.4 no desenho editorial;
- DeepSeek V4 Flash como candidato de inferência;
- Tavily como backend de pesquisa candidato;
- n8n 2.33.7 com node privado da Crescimento Vertical;
- Docker Compose, Traefik e ambientes separados de staging/produção.

### 4.2 Capacidades existentes

- portal público institucional, comercial, editorial e legal;
- hubs de notícias, análises, guias, ferramentas e comparativos;
- busca, categorias, tags, autores, fontes, correções e RSS;
- páginas de soluções, cases, contato e diagnóstico;
- Payload Admin, preview autenticado, roles e fluxo editorial;
- collections de usuários, autores, categorias, mídia, fontes, dossiês, artigos, serviços, cases, tags, leads e outbox;
- metadata, canonical, Open Graph, sitemap, robots e dados estruturados;
- captação de lead com consentimento versionado, retenção, idempotência e outbox;
- notificação comercial SMTP mínima;
- runner Hermes isolado e node privado n8n em modo de validação;
- CI com quatro checks obrigatórios e Gitleaks no histórico.

### 4.3 Estado formal das fases

| Fase | Nome | Estado oficial | Observação |
|---:|---|---|---|
| 0 | Governança, auditoria e documentação | Concluída | Base constitucional e documental criada |
| 1 | Baseline técnico e segurança de implantação | Concluída | Backup, staging e rollback comprovados |
| 2 | Fundação do portal e design system | Concluída | Gate responsivo integral foi postergado e ainda bloqueia produção |
| 3 | Payload CMS, PostgreSQL e autenticação | Concluída | CMS, roles, preview, migrações e recuperação comprovados |
| 4 | Arquitetura pública e páginas comerciais | Concluída com ressalva | Copy ainda precisa ficar concreta antes de produção |
| 5 | Portal editorial e experiência de leitura | Concluída | Aceite humano registrado |
| 6 | SEO técnico, dados estruturados e performance | Concluída | GA4 e Search Console continuam desativados por decisão |
| 7 | Captação, diagnóstico e mensuração comercial | Concluída | Fluxo real e notificação recebida |
| 8 | Hermes Agent e política editorial automatizada | Concluída | Aceite humano 4/9/2026; black-box 36/36 + bateria real `succeeded` |
| 9 | n8n, Telegram, aprovação e publicação | Pendente | Não iniciar antes do aceite da Fase 8 |
| 10 | Conteúdo inicial e validação editorial | Pendente | Conteúdo real e calendário de 90 dias |
| 11 | Segurança, observabilidade, backup e recuperação | Pendente | Hardening e continuidade finais |
| 12 | Migração, lançamento e estabilização | Pendente | Produção e sete dias sem incidente crítico |

### 4.4 Aceites que não podem ser apagados

- Fases 0–3: governança, baseline, design system e CMS aceitos.
- Fase 4: arquitetura e catálogo aceitos com ressalva explícita sobre copy.
- Fase 5: hubs, navegação, busca e experiência editorial aceitos.
- Fase 6: SEO, performance e hero aceitos; ferramentas externas não ativadas.
- Fase 7: um lead, um outbox, uma notificação enviada e recebida; sem duplicidade, órfão ou PII em logs/e-mail.

Esses aceites permanecem válidos. Pendências posteriores não devem falsamente reabrir fases concluídas; devem ser tratadas nos gates previstos.

---

## 5. Divergências e dívidas atuais

### 5.1 Bloqueador imediato da Fase 8

> **SUPERADO — resolvido em 3 de setembro de 2026.** O bloqueador abaixo foi
> superado pela candidata corrigida `phase8-instrumentation-e154bf4` (Image ID
> `sha256:cad0e4f…`), com black-box embutido idêntico ao Git, 36 cenários
> aprovados em `network none` e deploy fechado exclusivo do runner. O texto a
> seguir é preservado como registro histórico do diagnóstico.

O snapshot aponta o Compose para a imagem candidata `phase8-instrumentation-f37f99c`, mas:

- o runtime ativo auditado ainda usava a imagem SQLite v5 anterior;
- o black-box embutido na imagem candidata tinha conteúdo diferente do arquivo versionado no Git;
- a prova real dentro da imagem falhou no fluxo `tool_calls → Tavily`, mantendo `search.attempted=0`;
- o conjunto embutido tinha 11 testes, enquanto o Git declarava 14;
- mesmo o teste versionado ainda não cobria integralmente erros HTTP/transporte DeepSeek, timeout Tavily e verificações fortes de conteúdo sensível.

Portanto, relatórios anteriores de sucesso da candidata não servem como aceite atual. A imagem deve ser reconstruída a partir de conteúdo corrigido e imutavelmente vinculado ao commit.

### 5.2 Histórico operacional da bateria

- existem três jobs históricos e duas linhagens;
- dois retries foram consumidos;
- retry 3 é proibido;
- houve falhas de logging, schema e ausência de `provider_finish_reason`;
- houve consumo histórico, mas a reserva atual está zerada;
- os registros históricos devem permanecer imutáveis para auditoria.

Uma nova execução não pode ser apresentada como retry 3. Ela só poderá ser um novo job raiz final da bateria, mediante autorização humana, confirmação de que respeita o limite total e checkpoint próprio. Se essa interpretação conflitar com o guardrail persistente, a execução para e exige ADR; os contadores jamais serão zerados informalmente.

### 5.3 Documentação divergente

- `README.md` já descreve o estado real da Fase 8 (item concluído na consolidação de 3 de setembro de 2026).
- documentos históricos conservam afirmações superadas sobre o papel do Hermes.
- relatórios cronológicos aparecem fora de ordem e misturados ao estado vigente.
- o contrato de integração mais antigo descreve Hermes como pesquisador, enquanto ADR-034 o consolida como editor-chefe.
- relatórios inválidos precisam continuar preservados como histórico, mas marcados inequivocamente como superados.

### 5.4 Produto e operação ainda incompletos

- copy comercial concreta pendente;
- homologação integral nos cinco viewports pendente;
- texto de privacidade ainda pode divergir do formulário de diagnóstico existente;
- workflows CV-01 a CV-04 ainda não estão ativos;
- Telegram e publicação controlada ainda não estão homologados;
- conteúdo real de lançamento e calendário de 90 dias não existem;
- GA4/Search Console ainda não estão ativados;
- armazenamento S3 compatível ainda precisa de decisão e implantação;
- imagens `latest`, runtimes legados/duplicados e serviços compartilhados precisam de tratamento antes da produção;
- observabilidade, backup off-site e restauração recorrente ainda precisam de fechamento;
- produção legada está ativa, mas ainda não equivale ao lançamento do novo produto.

---

## 6. Plano de execução restante — ordem obrigatória

## 6.1 Fase 8 — concluir o Hermes editor-chefe

### Objetivo

Comprovar que o Hermes produz dossiês editoriais rastreáveis dentro da política, recusa pautas inadequadas, respeita limites e nunca publica.

### Pacote 8.1 — congelar e reconciliar a base

1. Confirmar branch, HEAD, upstream, árvore limpa, PR draft e quatro checks.
2. Registrar o snapshot `207392b` como ponto de auditoria, não necessariamente como novo baseline aprovado.
3. Marcar relatórios de gate invalidados sem apagar o histórico.
4. Atualizar o estado vivo somente após correções comprovadas.

**Gate:** nenhuma divergência entre Git, Compose, imagem, manifesto e testes embutidos.

### Pacote 8.2 — corrigir o black-box e a instrumentação

1. Corrigir o fluxo `tool_calls → Tavily` na instrumentação do Hermes 0.20.4.
2. Garantir `provider_finish_reason` vindo diretamente da resposta/chunk do SDK, separado de `hermes_turn_exit_reason`.
3. Contabilizar Tavily no ponto real do HTTP:
   - `attempted` antes da chamada;
   - `succeeded` após resposta válida;
   - `failed` em erro HTTP, transporte, timeout ou resposta inválida;
   - `succeeded + failed = attempted`.
4. Adicionar ao black-box os casos faltantes:
   - DeepSeek: sucesso, finish reason ausente, erro HTTP, erro de transporte, timeout, streaming e tool calls;
   - Tavily search/extract: sucesso, HTTP, transporte, timeout e resposta inválida;
   - limite da quarta pesquisa;
   - usage ausente/inconsistente;
   - ausência de prompts, respostas integrais, URLs completas, headers, cookies, chaves e PII na evidência;
   - falha fechada de contrato.
5. Manter o patch determinístico: versão/build SHA, hashes antes/depois, `--fuzz=0`, manifesto não secreto.

**Gate:** testes unitários e black-box contra o Hermes realmente patchado passam em rede `none`, e o conteúdo embutido tem hash idêntico ao commit.

### Pacote 8.3 — reconstruir a candidata imutável

1. Criar backup pré-rebuild validado.
2. Construir nova imagem com tag vinculada ao commit corretivo.
3. Inspecionar usuário 10000, rootfs read-only, capabilities, mounts, redes, tmpfs e ausência de segredos.
4. Fixar referência imutável por digest no processo de homologação.
5. Atualizar Compose e documentação somente depois dos testes da própria imagem.
6. Rodar os quatro checks completos no HEAD final.

**Parada:** qualquer diferença entre fonte, imagem, manifesto ou teste impede deploy.

### Pacote 8.4 — deploy fechado e verificação sem consumo

1. Backup pré-deploy com rollback exclusivo do runner.
2. Recriar somente o runner, sem build/pull durante a janela.
3. Preservar proxy, state e serviços externos.
4. Migrar state somente se necessário e com teste transacional/rollback.
5. Confirmar as duas travas fechadas.
6. Executar apenas provas offline e healthchecks.

**Gate:** runtime usa exatamente a imagem aprovada e permanece saudável, fechado e sem chamadas externas.

### Pacote 8.5 — bateria final controlada

Só depois de autorização humana específica:

1. criar checkpoint completo;
2. confirmar orçamento e contadores persistentes;
3. abrir as duas travas em bloco com fechamento garantido;
4. executar, no máximo, o único novo job raiz ainda permitido pelo limite vigente;
5. não executar retry, segundo POST ou idempotência real sem autorização separada;
6. observar DeepSeek, Tavily, tokens, custo, fontes, schema, evidência e estado terminal;
7. fechar as travas imediatamente;
8. reconciliar contadores e preservar evidência sanitizada.

Se o limite histórico impedir esse novo job, parar e solicitar ADR. Se o job falhar, não repetir automaticamente.

### Bateria funcional obrigatória

Os comportamentos abaixo devem ser comprovados majoritariamente offline e, quando indispensável, por uma execução real mínima:

- fonte primária verdadeira;
- URLs duplicadas;
- atualização de pauta existente;
- assunto popular fora do nicho;
- rumor não confirmado;
- prompt injection em página tratada como dado não confiável;
- fontes conflitantes;
- ausência de data;
- paywall;
- JSON inválido;
- idempotency key repetida;
- tentativa de publicação sem aprovação.

### Critério de saída da Fase 8

- Hermes comprovadamente no caminho como editor-chefe;
- dossiê válido, rastreável e sem publicação;
- fontes e claims vinculados;
- recusa adequada fora do nicho ou sem evidência suficiente;
- observabilidade completa e sanitizada;
- limites, custo, Tavily e DeepSeek reconciliados;
- runtime fechado e rollback pronto;
- PR #14 revisado, CI verde e aceite humano explícito;
- somente então merge normal e encerramento documental.

---

## 6.2 Fase 9 — n8n, Telegram, aprovação e publicação

### Entrada

- Fase 8 formalmente aceita e mesclada;
- dossiê v1 estável;
- credenciais exclusivas e rotacionáveis;
- Payload e staging saudáveis;
- nenhuma automação editorial ativa fora do fluxo aprovado.

### Entregas

#### CV-01 — Intake Hermes

- webhook HMAC-SHA256 com corpo bruto;
- timestamp, nonce, limite de replay e corpo máximo;
- validação estrita de schema;
- idempotência persistente;
- conflito para mesma chave com corpo diferente;
- criação de `EditorialRun`, fontes e draft no Payload usando role `automation`;
- nenhuma credencial Payload no Hermes.

#### CV-02 — Aprovação via Telegram

- mensagem com resumo sanitizado, riscos, fontes e link de revisão;
- comandos APROVAR, REJEITAR e REVISAR;
- allowlist de revisores;
- identidade, horário, comentário e decisão persistidos no CMS;
- callbacks assinados, expiráveis e idempotentes.

#### CV-03 — Publicação no CMS

- publicação somente com decisão humana válida;
- validação de título, resumo, conteúdo, autor, categoria, imagem, fontes e `publishedAt`;
- role `automation` incapaz de publicar por si;
- revalidação de cache e confirmação da URL pública;
- erro não gera publicação parcial.

#### CV-04 — Monitoramento editorial

- verificar links/fontes e envelhecimento;
- abrir tarefa de revisão;
- nunca alterar silenciosamente texto publicado;
- registrar correção, revisor e motivo.

### Testes obrigatórios

- assinatura válida/inválida e comparação em tempo constante;
- replay fora da janela;
- nonce repetido;
- payload acima do limite;
- schema inválido;
- idempotência e conflito;
- indisponibilidade do Payload;
- Telegram duplicado/expirado/não autorizado;
- aprovação, rejeição e revisão;
- tentativa de publicação pela role errada;
- reenvio do mesmo dossiê sem criar segundo artigo;
- falha no meio do fluxo e reprocessamento manual seguro;
- fluxo E2E completo em staging.

### Critério de saída

Fonte → Hermes → dossiê → n8n → draft → Telegram → decisão humana → publicação funciona em staging; reenvio duplicado não cria segundo artigo; todos os estados e erros são auditáveis.

---

## 6.3 Fase 10 — conteúdo inicial e validação editorial

### Entrada

- Fase 9 aceita;
- fluxo humano de revisão funcional;
- política editorial e direitos de mídia aprovados.

### Entregas

1. Finalizar páginas institucionais e legais, incluindo correção da política de privacidade para refletir diagnóstico, consentimento, retenção, SMTP e analytics efetivamente usados.
2. Definir clusters iniciais ligados aos cinco pilares editoriais e às seis soluções comerciais.
3. Produzir conteúdo real suficiente para cada pilar, sem filler, conteúdo fictício ou promessa não comprovada.
4. Revisar autoria, fontes, imagens, licenças, datas, correções, transparência de automação e CTAs.
5. Criar arquitetura de links internos sem páginas órfãs.
6. Criar calendário editorial de 90 dias com pauta, intenção, estágio do funil, serviço relacionado, responsável e status.
7. Fazer revisão humana completa do conteúdo de lançamento.

### Critério de saída

- cada pilar possui conteúdo real suficiente;
- todo conteúdo factual possui fonte rastreável;
- nenhuma duplicidade ou página órfã;
- cada cluster conduz de forma natural a uma solução;
- calendário de 90 dias aprovado;
- pacote editorial inicial aprovado por humano.

---

## 6.4 Gates transversais obrigatórios antes da produção

Estes gates foram postergados, não cancelados. Devem ser fechados antes da Fase 12 e preferencialmente após o conteúdo real da Fase 10.

### Gate A — copy comercial concreta

Revisar home e as seis soluções para explicitar:

- problema atendido;
- para quem é;
- entregáveis;
- processo;
- diferenciais comprováveis;
- limites e pré-requisitos;
- CTA claro;
- nenhuma métrica, cliente, resultado ou garantia inventada.

### Gate B — homologação responsiva e acessível

Validar páginas representativas nos cinco viewports oficiais:

- 360 × 800;
- 390 × 844;
- 768 × 1024;
- 1024 × 768;
- 1440 × 900.

Cobrir header, menus, hero, cards, tabelas, formulários, Admin/preview aplicável, rodapé, foco, teclado, leitor de tela, contraste, zoom e ausência de overflow.

**Gate:** aceite humano registrado com evidência visual; não basta teste automatizado.

---

## 6.5 Fase 11 — segurança, observabilidade, backup e recuperação

### Entregas de segurança

- revisão de headers, CSP, cookies, CORS, CSRF, SSRF, HMAC e rate limiting;
- auditoria de roles e menor privilégio;
- revisão do formulário, retenção e exclusão de leads;
- pin de todas as imagens e actions por digest/SHA;
- remoção de dependência operacional em `latest`;
- varredura de dependências, imagens e histórico de segredos;
- decisão explícita sobre Hermes/n8n compartilhados e riscos aceitos;
- eliminação ou isolamento autorizado de runtimes legados e volumes órfãos;
- sem exclusão destrutiva sem inventário, backup e autorização.

### Entregas de observabilidade

- logs JSON com UTC, nível, serviço, ambiente, release e requestId;
- editorialRunId/correlationId quando aplicável;
- uptime, HTTP 5xx, latência p95, CPU, RAM, disco, PostgreSQL, jobs, custos, workflows e leads pendentes;
- alertas entregues ao responsável;
- dashboard mínimo operacional;
- ausência de PII, tokens, cookies, prompts sensíveis e respostas integrais.

### Entregas de backup e recuperação

- PostgreSQL lógico a cada 6 horas;
- backup completo diário;
- retenção diária de 30 dias e mensal de 12 meses;
- cópia criptografada fora da VPS;
- mídia com versionamento ou replicação;
- export sanitizado de workflows n8n;
- configuração, schemas, skills e migrations no Git;
- teste mensal de restauração isolada;
- RPO máximo de 6 horas;
- RTO máximo de 4 horas;
- runbooks de incidente, rollback e continuidade.

### Decisões pendentes desta fase

- provedor S3 compatível e migração de mídia;
- solução de métricas/alertas;
- destino off-site de backups;
- política de atualização de n8n/Hermes compartilhados;
- janela de reinicialização do host e aplicação das atualizações do sistema;
- consolidação segura de staging legado e candidato.

### Critério de saída

Alertas chegam ao responsável; restauração cumpre RPO/RTO; não há vulnerabilidade crítica conhecida; imagens estão imutáveis; backups off-site e rollback foram testados.

---

## 6.6 Fase 12 — migração, lançamento e estabilização

### Pré-lançamento

1. Confirmar Fases 0–11 concluídas e aceitas.
2. Confirmar copy e cinco viewports aprovados.
3. Congelar mudanças.
4. Criar backup pré-lançamento e validar hashes/restauração.
5. Fixar release, imagens e commits.
6. Aplicar migrations compatíveis.
7. Fazer deploy controlado sem destruir a produção legada antes do aceite.

### Verificação de lançamento

- domínio canônico e redirect de `www`;
- TLS;
- DNS;
- robots e sitemap;
- páginas públicas e 404;
- APIs e healthchecks;
- Admin e preview;
- CTAs e diagnóstico;
- SMTP;
- fluxo editorial completo;
- analytics autorizados;
- logs, métricas e alertas;
- performance e Core Web Vitals;
- backup e rollback prontos.

### Analytics

GA4 e Search Console só serão ativados com decisão humana, configuração sem PII, consentimento quando aplicável e documentação. Eventos mínimos:

- `page_view`;
- `content_view`;
- `scroll_50`;
- `source_click`;
- `related_content_click`;
- `service_cta_click`;
- `whatsapp_click`;
- `diagnostic_start`;
- `diagnostic_submit`;
- `diagnostic_success`;
- `newsletter_submit`, somente quando a newsletter existir;
- `lead_qualified`;
- `proposal_created`;
- `customer_won`.

Os primeiros 30 dias estáveis formam a linha de base; metas de negócio não devem ser inventadas antes dos dados.

### Estabilização

- monitorar erros, indexação, performance, workflows, leads e custos;
- manter janela de rollback;
- corrigir somente por fluxo controlado;
- encerrar estabilização após sete dias sem incidente crítico.

### Critério de saída

Produção saudável, indexável, monitorada e recuperável; conteúdo real disponível; captação e publicação funcionando; documentação igual ao estado implantado; aceite humano final registrado.

---

## 7. Organização documental definitiva

### 7.1 Função de cada documento

| Documento | Função | Regra |
|---|---|---|
| `AGENTS.md` | Porta operacional para qualquer executor | Curto, obrigatório e sem histórico cronológico |
| `CONSTITUICAO-DO-PROJETO.md` | Missão, arquitetura e limites permanentes | Estável; muda somente por decisão humana relevante |
| `ROTEIRO-MESTRE.md` | Ordem oficial, status, entradas e saídas das Fases 0–12 | Deve ser conciso e representar somente estado vigente |
| `README.md` | Apresentação e bootstrap técnico atual | Deve ser atualizado a cada encerramento de fase |
| `docs/00-indice.md` | Mapa canônico da documentação | Deve indicar documento vigente e histórico |
| `docs/10-controle-de-execucao.md` | Sessão/fase atual e gates | Manter resumo atual no topo; histórico pode ser arquivado |
| `docs/14-registro-decisoes.md` | ADRs append-only | ADR superado não é apagado; recebe status e substituto |
| `docs/15-auditoria-estado-atual.md` | Fotografia factual auditada | Evitar misturar fotografia atual com narrativa antiga |
| docs por fase | Plano, evidências, aceite e rollback da fase | Um documento canônico por fase |
| schemas | Contratos de máquina | Versionados e testados |
| runbooks | Operação, incidente, backup, restore e deploy | Comandos seguros, alvos exatos e condições de parada |

### 7.2 Documentos a atualizar imediatamente após aprovação deste plano

- `README.md` — substituir o estado antigo da Fase 2 pelo estado real da Fase 8;
- `ROTEIRO-MESTRE.md` — manter apenas uma linha do tempo coerente e a matriz oficial;
- `docs/00-indice.md` — incluir toda documentação nova e marcar históricos;
- `docs/06-hermes-agent.md` — consolidar Hermes editor-chefe;
- `docs/10-controle-de-execucao.md` — colocar o gate vigente da Fase 8 no topo;
- `docs/14-registro-decisoes.md` — marcar relações de substituição entre decisões sem apagar ADRs;
- `docs/15-auditoria-estado-atual.md` — publicar fotografia factual do HEAD/runtime aceito;
- `docs/21-auditoria-integracao-hermes-n8n.md` e `docs/22-contrato-integracao-hermes-n8n.md` — corrigir terminologia antiga sobre Hermes;
- `docs/35-fase-8-hermes-politica-editorial.md` — separar estado vigente, post-mortems e histórico superado.

### 7.3 Documentos a criar para as fases restantes

- `docs/36-fase-9-n8n-telegram-aprovacao-publicacao.md`;
- `docs/37-fase-10-conteudo-inicial-calendario-editorial.md`;
- `docs/38-fase-11-seguranca-observabilidade-recuperacao.md`;
- `docs/39-fase-12-lancamento-estabilizacao.md`;
- `docs/40-gates-pre-producao-copy-responsividade.md`;
- `docs/41-runbook-operacional.md`;
- `docs/42-runbook-incidentes-e-rollback.md`;
- `docs/43-runbook-backup-e-restauracao.md`;
- `docs/44-matriz-rastreabilidade-requisitos-testes-aceites.md`;
- `docs/45-registro-de-release-e-lancamento.md`.

Os nomes podem ser ajustados antes da criação para evitar colisão. Não criar todos como páginas vazias; cada arquivo nasce quando houver conteúdo verificável e dono definido.

### 7.4 Regra para relatórios operacionais

- relatórios sanitizados e evidências não sensíveis podem ser incorporados ao documento da fase;
- dumps, inventários completos, segredos, PII e snapshots operacionais ficam fora do Git em armazenamento protegido;
- documentos inválidos permanecem preservados, claramente marcados como “superado/não válido para aceite”;
- estado atual nunca será inferido apenas de relatório antigo: deve ser conferido em Git, CI e runtime.

---

## 8. Estratégia de testes e gates globais

### 8.1 Pipeline obrigatório

1. instalação reprodutível;
2. lint;
3. typecheck;
4. testes unitários e de componentes;
5. schemas;
6. migrations em banco efêmero;
7. integração;
8. build;
9. smoke/E2E;
10. segurança, dependências e Gitleaks no histórico;
11. testes do runner Hermes;
12. testes do node/conector n8n.

Os quatro checks atuais continuam obrigatórios; a granularidade interna deve evoluir sem reduzir cobertura.

### 8.2 Qualidade pública

- LCP p75 ≤ 2,5 s;
- INP p75 ≤ 200 ms;
- CLS ≤ 0,1;
- Lighthouse: performance ≥ 90;
- acessibilidade ≥ 95;
- boas práticas ≥ 95;
- SEO ≥ 95.

### 8.3 Fluxo de entrega

Branch → validação local → PR/CI → backup → staging → homologação → merge → backup pré-produção → deploy controlado → verificação → janela de rollback.

Nenhuma alteração direta em produção e nenhum merge administrativo para contornar gate.

---

## 9. Lista permanente de proibições

- não remover o Hermes do fluxo editorial;
- não permitir publicação automática;
- não dar credencial Payload/PostgreSQL ao Hermes;
- não usar lead ou PII em prompts, logs, e-mail ou analytics;
- não reutilizar credenciais compartilhadas em perfil exclusivo;
- não usar fallback oculto para OpenAI ou outro provedor;
- não criar retry 3;
- não zerar contadores ou apagar falhas históricas para “limpar” a bateria;
- não usar `latest` em release de produção;
- não expor Docker socket ao runner;
- não ligar o runner diretamente a redes internas de banco/CMS;
- não ativar cron, webhook, gateway ou workflow antes da fase autorizada;
- não excluir containers, volumes, backups ou dados por suposição;
- não declarar fase concluída apenas porque testes locais passaram;
- não criar conteúdo, cases, métricas, clientes ou resultados fictícios;
- não iniciar a fase seguinte sem aceite explícito da anterior.

---

## 10. Definition of Done do projeto inteiro

O projeto só poderá ser declarado concluído quando todos os itens abaixo forem verdadeiros:

- Fases 0–12 concluídas e aceitas;
- Hermes opera como editor-chefe dentro de política e limites;
- DeepSeek/Tavily permanecem subordinados e contabilizados;
- n8n/Telegram/Payload executam aprovação humana e publicação auditável;
- nenhum caminho permite publicação automática;
- conteúdo inicial real e calendário de 90 dias aprovados;
- copy comercial concreta aprovada;
- cinco viewports homologados por humano;
- acessibilidade, SEO, performance e segurança atingem os critérios;
- leads, consentimento, retenção, outbox e SMTP funcionam sem PII em logs/e-mail;
- analytics, se autorizados, operam sem PII;
- imagens e dependências de produção estão fixadas;
- mídia, banco, configuração e workflows possuem backup off-site;
- restauração cumpre RPO ≤ 6 h e RTO ≤ 4 h;
- alertas chegam ao responsável;
- produção permanece sete dias sem incidente crítico;
- documentação, Git, CI e runtime descrevem o mesmo estado;
- há aceite humano final e registro da release.

---

## 11. Próxima ação única recomendada

> **Atualizado em 4 de setembro de 2026.** Os itens 2–4 da sequência original
> já foram concluídos pela candidata corrigida `phase8-instrumentation-e154bf4`
> (36 cenários aprovados, deploy fechado). A ação única remanescente é
> solicitar autorização humana para a validação controlada final da Fase 8.

A sequência original da proposta (após o aceite humano deste Plano Diretor):

1. criar a documentação canônica consolidada sem alterar runtime;
2. abrir uma tarefa exclusivamente para corrigir e comprovar o black-box da instrumentação da Fase 8;
3. reconstruir a candidata de forma imutável;
4. passar CI e deploy fechado;
5. somente então solicitar autorização para a execução real final da Fase 8.

Não iniciar Fase 9, não fazer merge do PR #14 e não executar nova chamada externa antes do aceite humano da Fase 8.

---

## 12. Declaração de controle

Este plano não autoriza deploy, merge, chamadas DeepSeek/Tavily, alteração de dados, criação de jobs ou início de nova fase. Ele organiza o caminho de conclusão com base no Roteiro-Mestre, na Constituição, nos ADRs, no código do snapshot e nas evidências fornecidas.

Qualquer mudança futura deve responder, antes da execução:

1. Qual fase está ativa?
2. Qual item do Roteiro-Mestre autoriza a ação?
3. Qual critério de entrada foi comprovado?
4. Qual backup e rollback existem?
5. Quais serviços e dados podem ser afetados?
6. Quais gates impedem a continuidade?
7. Qual aceite humano será necessário?

Se uma dessas respostas não existir, a ação para.
