# Gates pré-produção — copy comercial e homologação responsiva

Dois gates transversais bloqueiam produção e foram postergados (ADR-023), não
cancelados. Ambos exigem **aceite humano com evidência**.

## Gate A — copy comercial concreta

**Estado:** concretizada em código (commit `079d11b`), pendente de revisão
humana editorial.

As seis soluções agora declaram, sem métricas/clientes/resultados/garantias
inventados: problema atendido, para quem é, entregáveis, processo e
capacidades. Os textos estão em `src/seed/services.ts` (fonte autoritativa) e
em `src/lib/commercial/data.ts` (fallback sem banco).

**Para fechar:** revisar os seis textos em staging (ou em `src/seed/services.ts`)
e confirmar clareza, especificidade e ausência de promessa vazia. Após
aprovação, aplicar o seed no staging (`npm run seed:services`).

## Gate B — homologação responsiva e acessível

**Estado:** pendente de inspeção visual humana. Não pode ser declarado
concluído por teste automatizado (ADR-023).

### Viewports obrigatórios

| Largura × altura | Dispositivo |
| --- | --- |
| 360 × 800 | mobile pequeno |
| 390 × 844 | mobile padrão |
| 768 × 1024 | tablet retrato |
| 1024 × 768 | tablet paisagem |
| 1440 × 900 | desktop |

### Rotas a homologar (representativas)

- `/` (home: Header, Hero, Autoridade, Soluções, Problema, Processo,
  Diferenciais, Conteúdos, CTA, Footer);
- `/solucoes` e `/solucoes/[slug]` (uma página de solução);
- `/conteudos` (estado vazio e, quando houver, populado);
- `/sobre`, `/contato`, `/diagnostico`;
- 404 (`/rota-inexistente`);
- `/politica-editorial` e uma página legal.

### Critérios por viewport

- [ ] Menu mobile/tablet abre e fecha (accordion), sem sobreposição.
- [ ] Nenhum título ou texto cortado; sem overflow horizontal.
- [ ] CTAs e botão flutuante não cobrem conteúdo nem controles.
- [ ] Imagens mantêm proporção e reservam espaço.
- [ ] Navegação completa por teclado e foco visível em todos os elementos.
- [ ] `Escape` fecha menus; foco devolvido ao acionador.
- [ ] `prefers-reduced-motion` respeitado.
- [ ] Contraste legível (WCAG 2.2 AA).

### Como executar

Acessar o staging protegido (BasicAuth + `noindex`), inspecionar cada rota nos
cinco viewports (DevTools responsivo ou dispositivo real) e registrar a
evidência (capturas por viewport × rota). Registrar o aceite humano em
`docs/10` e `docs/15` somente após a validação integral.
