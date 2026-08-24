# Crescimento Vertical

**Inteligência artificial, automação e tecnologia para negócios.**

Este repositório contém o site institucional e o futuro portal editorial da
Crescimento Vertical. A evolução será feita sobre a base existente, em fases
controladas, sem substituir a produção de forma improvisada.

## Estado atual

- Aplicação: Next.js 16 com App Router, React 19 e TypeScript estrito.
- Interface: landing page institucional responsiva, com identidade visual escura
  em azul e ciano.
- Implantação: Docker, Traefik e domínio crescimentovertical.com.
- Ainda ausentes: CMS, PostgreSQL, portal editorial, autenticação administrativa,
  integração Hermes, testes automatizados, CI, observabilidade e rotina formal de
  backup.

O inventário técnico completo está em
[docs/15-auditoria-estado-atual.md](docs/15-auditoria-estado-atual.md).

## Documentos obrigatórios

1. [AGENTS.md](AGENTS.md) — regras de execução para pessoas e agentes.
2. [ROTEIRO-MESTRE.md](ROTEIRO-MESTRE.md) — sequência oficial da construção.
3. [docs/00-indice.md](docs/00-indice.md) — mapa de toda a documentação.
4. [docs/14-registro-decisoes.md](docs/14-registro-decisoes.md) — decisões
   arquiteturais já aprovadas.

Nenhuma fase deve começar sem que os critérios de entrada da fase estejam
atendidos. Nenhuma fase é considerada concluída apenas porque “funciona na
máquina”; os critérios de qualidade e aceite são obrigatórios.

## Comandos atuais

~~~bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run check
npm run dev
~~~

O arquivo .env.example documenta somente variáveis públicas. Enquanto o
WhatsApp real não estiver configurado, os CTAs usam e-mail e nenhum número
fictício é renderizado.

## Regra de produção

O domínio público não será usado para experimentação. Mudanças seguem a ordem:

**branch de trabalho → validação local → staging → backup → migração → produção
→ verificação → possibilidade de rollback**
