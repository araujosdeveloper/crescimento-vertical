# Segurança e LGPD

## Princípios

- Privilégio mínimo.
- Negar por padrão.
- Separar ambientes e credenciais.
- Validar toda entrada.
- Registrar decisões críticas.
- Coletar o mínimo de dado necessário.
- Ser capaz de recuperar e revogar.

## Identidade e acesso

- Contas individuais para administradores.
- Proibir conta administrativa compartilhada.
- Senha forte e rate limiting.
- MFA obrigatório assim que suportado pela configuração adotada.
- Sessão com expiração e cookies Secure, HttpOnly e SameSite.
- Roles aplicadas no servidor.
- Revogação imediata de usuário desligado.
- Usuários de serviço sem login interativo quando possível.

### Implementado na Fase 2A

Papéis, controle de acesso, rate limit de login, transições editoriais e
validação de publicação estão implementados em código no servidor
(docs/17-fundacao-editorial-payload.md). A role `automation` não publica, não
apaga usuários e não altera permissões.

## Segredos

- Variáveis em arquivo protegido ou gerenciador de segredos.
- .env.example contém apenas nomes e exemplos inofensivos.
- Nunca registrar token, senha, cookie ou webhook secreto.
- Rotação documentada.
- Segredos distintos por ambiente.
- Credencial do Hermes não pode administrar CMS.

### Repositório público

- A `main` exige pull request e os quatro checks do CI.
- Gitleaks varre todo o histórico em cada PR e push da `main`.
- Actions externas usam SHA imutável de 40 caracteres.
- Checkouts não persistem credenciais e o workflow usa `contents: read`.
- Falso positivo só admite exceção estreita, comprovada e documentada.
- Force-push e exclusão da `main` permanecem bloqueados.

## Rede

- Somente Traefik expõe 80/443.
- Banco e serviços internos sem portas públicas.
- Redes Docker separadas por responsabilidade.
- Painel do CMS protegido por autenticação e rate limiting.
- Staging protegido adicionalmente e bloqueado para indexação.
- Webhook exige assinatura mesmo em rede privada.

## Aplicação

- CSP definida e validada antes da produção.
- HSTS após confirmação de HTTPS integral.
- X-Content-Type-Options: nosniff.
- Referrer-Policy restritiva.
- Permissions-Policy mínima.
- Proteção contra CSRF conforme método de autenticação.
- Sanitização de rich text.
- Upload limitado por tipo, tamanho e inspeção.
- Dependências fixadas e auditadas.

## Formulários e abuso

- Honeypot e proteção antiautomação progressiva.
- Rate limit por IP e chave contextual.
- Validação no servidor.
- Mensagem pública não confirma existência de conta.
- Idempotência para impedir leads duplicados por repetição.
- Links e anexos não são aceitos em campos livres sem necessidade.

## Webhooks

- HMAC calculado sobre corpo bruto, timestamp e versão.
- Comparação em tempo constante.
- Janela de replay.
- Idempotency-Key única.
- Corpo máximo.
- Schema estrito.
- Resposta sem stack trace.
- Dead-letter operacional para falhas.

### Runner editorial (Fase 3B)

O runner `cv-hermes-editorial-runner` (docs/24) aplica HMAC-SHA256 sobre
`{timestamp}.{nonce}.{body}`, janela de replay de 300 s, nonce anti-replay,
corpo ≤ 1 MiB e validação Draft 2020-12. Sem Docker Socket, sem PostgreSQL,
sem Payload; execução desabilitada por dupla trava.

### Conector n8n (Fase 3C)

O node privado `hermesEditorial` (docs/26) assina com o mesmo HMAC; a credencial
`crescimentoVerticalHermesApi` restringe a URL a
`http://cv-hermes-editorial-runner:8100` e o segredo é armazenado criptografado
(encryptV2). Sem Code node/Execute Command para assinar; sem webhook/cron no
workflow de conectividade.

## Riscos específicos de IA

- Prompt injection em fontes.
- Fonte fabricada.
- Citação incompatível com a afirmação.
- Confusão entre data do fato e data do artigo.
- Reprodução indevida.
- Vazamento de segredo.
- Publicação de instrução maliciosa.

Controles:

- fontes permitidas;
- verificação de URL;
- claims ligados a evidências;
- revisão humana;
- usuário sem permissão de publicar;
- logs e dossiê imutável;
- testes adversariais.

## LGPD

### Dados previstos

- Identificação e contato em diagnóstico.
- Informações profissionais e da empresa.
- Origem, campanha e páginas visitadas conforme consentimento/configuração.
- E-mail e evidência de opt-in da newsletter.

### Regras

- Informar finalidade antes do envio.
- Registrar versão do texto de consentimento.
- Não condicionar contato essencial a consentimento de marketing.
- Disponibilizar canal para acesso, correção e exclusão.
- Definir controlador, canal e política de retenção.
- Não enviar lead para ferramenta não documentada.
- Contratos com operadores devem ser avaliados.
- Minimizar dados em backups e logs.

## Retenção inicial

A retenção definitiva depende da política jurídica aprovada. Até lá:

- não coletar CPF, documento, dados bancários ou dado sensível;
- lead sem relação comercial ativa entra em revisão periódica;
- opt-out de newsletter é propagado imediatamente;
- logs de aplicação não armazenam conteúdo integral de formulário.

## Resposta a incidente

1. Conter.
2. Preservar evidências.
3. Rotacionar credenciais afetadas.
4. Identificar dados, período e pessoas impactadas.
5. Restaurar serviço seguro.
6. Avaliar obrigações de comunicação.
7. Registrar causa, correção e prevenção.

Nenhum incidente será “resolvido” apagando logs sem preservação.
# Fase 7 — dados de diagnóstico

O formulário coleta somente dados necessários ao atendimento, com consentimento
explícito versionado (`2026-08-29.v1`), finalidade, revogação, retenção de 180
dias e link para privacidade. Não há marketing, analytics, cookies não
essenciais, IP bruto, User-Agent ou PII em logs. Exclusão/anonimização é manual,
idempotente e dry-run por padrão; nenhuma integração externa foi ativada.

### Transporte comercial por SMTP

No staging, a notificação usa Hostinger na porta 465 com TLS implícito e
validação normal de certificado. A senha é arquivo 0640 `root:root`; o app roda
com UID 1001 e GID 0, sem capabilities, e recebe bind mount read-only exclusivo.
O segredo não entra no Git,
ambiente, inspect, imagem, processo, log ou backup. O e-mail não contém PII:
somente horário, UUID e link ao Admin protegido por BasicAuth + Payload + role.
Rotação/revogação consiste em trocar o arquivo protegido e recriar apenas o app;
falha mantém o registro no outbox.
