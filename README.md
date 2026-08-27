# Crescimento Vertical

**Inteligência artificial, automação e tecnologia para negócios.**

Este repositório contém um produto híbrido editorial e comercial: o portal
transforma informação especializada em autoridade e demanda, enquanto a
operação comercial conecta essa demanda a soluções de IA, automação, vendas,
atendimento digital, sites e integrações.

## Estado atual

- Aplicação pública em Next.js 16, React 19 e TypeScript estrito.
- Payload CMS 3.88.0 e PostgreSQL 16 como fundação editorial, com migrações
  versionadas.
- Portal editorial público com DTOs estritos, RSS, sitemap e SEO técnico.
- Design system, layout público, navegação e acessibilidade da Fase 2
  implementados.
- Suítes com 69 testes da aplicação, 32 do runner editorial e 34 do conector
  n8n ↔ Hermes.
- CI com quatro jobs obrigatórios: aplicação completa, runner editorial,
  conector n8n e secret scan do histórico.
- Staging blue-green protegido por autenticação e bloqueado para indexação.
- Perfil Hermes, runner e conector n8n existentes, com execução editorial
  desabilitada.

As Fases 0 e 1 estão concluídas. A Fase 2 permanece em execução, aguardando
homologação visual humana do candidato de staging.

Continuam pendentes a produção editorial, as páginas comerciais, conteúdo real,
captação e mensuração comercial, armazenamento S3, observabilidade e backup
off-site. Nenhuma capacidade antecipada das fases posteriores substitui seus
gates formais.

O inventário técnico completo está em
[docs/15-auditoria-estado-atual.md](docs/15-auditoria-estado-atual.md).

## Documentos obrigatórios

1. [AGENTS.md](AGENTS.md) — porta automática e regras de execução.
2. [CONSTITUICAO-DO-PROJETO.md](CONSTITUICAO-DO-PROJETO.md) — missão,
   arquitetura, governança e limites permanentes.
3. [ROTEIRO-MESTRE.md](ROTEIRO-MESTRE.md) — sequência oficial da construção.
4. [docs/00-indice.md](docs/00-indice.md) — mapa de toda a documentação.
5. [docs/14-registro-decisoes.md](docs/14-registro-decisoes.md) — decisões
   arquiteturais aprovadas.
6. [docs/10-controle-de-execucao.md](docs/10-controle-de-execucao.md) — fase e
   gates atuais.

Nenhuma fase começa sem seus critérios de entrada. Uma fase também não é
considerada concluída apenas porque funciona localmente: CI, segurança,
documentação e homologação aplicável fazem parte do aceite.

## Comandos de desenvolvimento

~~~bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
npm run dev
~~~

O `.env.example` documenta somente variáveis públicas. Segredos e inventário
operacional permanecem fora do Git.

## Regra de produção

O domínio público não é ambiente de experimentação. Mudanças seguem o fluxo:

**branch de trabalho → validação local → PR/CI → backup → staging → homologação
→ merge → deploy controlado → verificação → possibilidade de rollback**
