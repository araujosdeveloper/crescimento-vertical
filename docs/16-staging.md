# Ambiente de staging

## Objetivo

O staging é um ambiente isolado e autenticado para validar mudanças antes de
qualquer implantação em produção. Ele reproduz o build real da aplicação
(mesmo `Dockerfile`), mas permanece bloqueado para indexação e restrito aos
responsáveis.

Nesta execução, apenas a estrutura foi preparada: o ambiente ainda não foi
subido, o DNS não foi alterado e nenhum container foi criado.

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

## Comandos de referência (não executar nesta etapa)

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

## Aviso

DNS e subida do staging não fazem parte desta execução. Nenhum container de
staging ou de produção foi iniciado, e nenhuma alteração de DNS, Traefik
global, Hermes ou n8n foi realizada.
