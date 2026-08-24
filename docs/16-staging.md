# Ambiente de staging

## Objetivo

O staging é um ambiente isolado e autenticado para validar mudanças antes de
qualquer implantação em produção. Ele reproduz o build real da aplicação
(mesmo `Dockerfile`), mas permanece bloqueado para indexação e restrito aos
responsáveis.

Nesta etapa o ambiente foi ativado e validado: o container de staging está
saudável, o TLS é válido e a autenticação BasicAuth bloqueia o acesso sem
credenciais. O DNS principal (@ e www) permanece na infraestrutura anterior.

## Isolamento em relação à produção

- Projeto Compose exclusivo: `crescimento-vertical-staging`.
- Serviço, imagem, container, router e middlewares com nomes próprios que não
  colidem com os de produção.
- Sem portas publicadas diretamente na VPS; todo acesso passa pelo Traefik via
  `Host(`${STAGING_HOST}`)`.
- `SITE_NOINDEX=true` é forçado no build, independentemente do restante do
  ambiente.
- O container de staging não depende do container de produção e não o altera.
- Compartilha apenas a rede externa `n8n_default`, necessária para o Traefik
  alcançar o serviço.

## Geração segura do hash BasicAuth

O Traefik exige o hash no formato APR1 (`$apr1$...`). Gerar localmente com:

```
openssl passwd -apr1
```

O resultado tem o formato `usuario:hash`. Como o Compose interpreta `$`, cada
`$` do hash precisa ser duplicado (`$$`) dentro do `.env.staging`. Exemplo:

```
STAGING_BASIC_AUTH_USERS=revisor:$$apr1$$ABCD1234$$hashgerado
```

Nunca registrar o hash real no repositório. O `.env.staging.example` contém
somente um placeholder.

## Criação local do .env.staging

Copiar o exemplo e restringir a permissão:

```
cp .env.staging.example .env.staging
chmod 600 .env.staging
```

Editar somente os valores seguros: `STAGING_HOST`, `NEXT_PUBLIC_SITE_URL` e
`STAGING_BASIC_AUTH_USERS` (com hash real gerado fora do Git e `$` duplicado).

## Comandos de referência

Estes comandos serão usados quando a subida for autorizada:

```
# Build
docker compose --env-file .env.staging -f docker-compose.staging.yml build

# Subida
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d

# Validação
docker compose --env-file .env.staging -f docker-compose.staging.yml config --quiet
curl -I "https://${STAGING_HOST}/"
curl -s "https://${STAGING_HOST}/robots.txt"
curl -s "https://${STAGING_HOST}/api/health/live"

# Remoção
docker compose --env-file .env.staging -f docker-compose.staging.yml down
```

## Testes de aceite do staging

- Autenticação: sem BasicAuth a resposta deve ser 401; com credenciais
  corretas, 200.
- `X-Robots-Tag`: o header deve conter `noindex, nofollow, noarchive`.
- `/robots.txt`: deve retornar `Disallow: /`.
- Healthcheck: `/api/health/live` → `{"status":"ok"}` e
  `/api/health/ready` → `{"status":"ready"}`.
- Metadados: o HTML gerado deve conter `noindex` e `nosnippet`.

## Validação executada — 24 de agosto de 2026

- Data e horário (America/Sao_Paulo): 2026-08-24 15:20.
- Container de staging: running/healthy, sem portas públicas diretas.
- TLS: válido no hostname staging.crescimentovertical.com.
- BasicAuth: 401 sem autenticação; 200 com autenticação.
- Bloqueio de indexação validado nas três camadas: metadados/robots
  (noindex/nosnippet), `/robots.txt` (`Disallow: /`) e `X-Robots-Tag`
  (`noindex, nofollow, noarchive`).
- Healthchecks: `/api/health/live` → `{"status":"ok"}` e
  `/api/health/ready` → `{"status":"ready"}`.
- Produção: permaneceu running/healthy e não foi reiniciada.
- Nenhuma credencial, hash ou conteúdo de `.env.staging` foi versionado.
- Staging pronto para inspeção visual e homologação.

## Aviso

O DNS principal (@ e www) ainda não foi migrado para a VPS; apenas
staging.crescimentovertical.com está ativo. Nenhuma alteração foi feita em DNS
de produção, Traefik global, Hermes ou n8n, e a produção permaneceu
running/healthy sem reinicialização.
