# Hardening do repositório público

## Objetivo

Aplicar controles transversais após a Fase 3C para reduzir o risco de alteração
direta da `main`, vazamento de segredos e comprometimento da cadeia de supply
chain do CI. Esta atividade não inicia a Fase 4 e não altera o runtime da VPS.

## Proteção da `main`

A `main` exige pull request, conversas resolvidas e os quatro checks reais do
CI atualizados com a base. As regras também se aplicam ao administrador. Não há
aprovação obrigatória porque o repositório possui um único proprietário.
Force-push e exclusão ficam bloqueados; histórico linear, commits assinados e
restrições por usuário/equipe não são exigidos nesta atividade.

## Checks obrigatórios

1. `lint, typecheck, test, migrate e build`;
2. `hermes-editorial-runner (Python, schemas, docker build)`;
3. `n8n-hermes-connector (node package, workflows, docker build)`;
4. `secret-scan (gitleaks full history)`.

O Gitleaks recebe checkout com `fetch-depth: 0` e inspeciona todo o histórico.
O merge permanece bloqueado se qualquer check falhar.

## Supply chain e permissões

Actions externas são fixadas por SHA completo de 40 caracteres, com comentário
da versão humana. Todos os checkouts usam `persist-credentials: false`. O
workflow e o job de Gitleaks declaram somente `contents: read`; o token padrão é
usado apenas pelo action, sem licença por se tratar de repositório pessoal.

O build da imagem n8n usa o registry oficial alternativo
`ghcr.io/n8n-io/n8n`, que disponibiliza o mesmo conteúdo endereçado pelo mesmo
digest pinado do registry anterior. A mudança elimina a dependência do pull
anônimo limitado no Docker Hub, sem alterar a versão n8n 2.33.7 e sem alterar o
runtime ativo na VPS. Para indisponibilidade transitória do registry, o CI
repete esse build no máximo quatro vezes, com esperas progressivas de 60, 120 e
240 segundos, somente quando o log identifica rate limit HTTP 429. Qualquer
outro erro falha imediatamente; a quarta ocorrência também permanece como falha
do job.

## Falsos positivos

Não existe allowlist ampla. Toda ocorrência deve ser inspecionada sem imprimir
o valor. Uma exceção só pode ser adicionada após comprovar placeholder ou
fixture fictícia, limitada ao caminho e à regra estritamente necessários, com
justificativa registrada. Diretórios, histórico ou padrões genéricos nunca são
ignorados.

A varredura inicial identificou duas fixtures de `PAYLOAD_SECRET` em
`tests/env.test.ts`, no commit
`7c83d881d84cb7a399a67c5bcf7bade44858d10a`: uma entrada válida e outra curta
de propósito para testar rejeição. Os valores não foram impressos. As únicas
exceções ficam em `.gitleaksignore` pelos fingerprints completos das linhas 10
e 25; qualquer mudança de commit, caminho, regra ou linha volta a bloquear.

## Validação

1. Validar a sintaxe YAML.
2. Confirmar que todo `uses:` externo aponta para SHA de 40 caracteres.
3. Executar `git diff --check` e auditoria de segredos do diff.
4. Executar Gitleaks contra todo o histórico local quando possível.
5. Abrir PR e exigir sucesso dos quatro jobs.
6. Após merge normal, exigir os quatro jobs também no commit da `main`.
7. Configurar a proteção com os contextos reais retornados pelos check-runs e
   reler a API para conferir todos os controles.

## Rollback documental

Se a configuração impedir o fluxo legítimo, preservar as evidências, reverter
somente o commit deste hardening por novo PR e ajustar a proteção via API sem
admin bypass. Não remover o Gitleaks nem reduzir sua cobertura para contornar
falhas. Nenhuma reversão envolve deploy ou alteração da VPS.

## Runtime

Produção, staging, containers, Docker runtime, n8n, Hermes, Payload,
PostgreSQL, DNS e Traefik não são modificados. A execução editorial do Hermes
permanece desabilitada.
