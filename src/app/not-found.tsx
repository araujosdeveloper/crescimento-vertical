import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";

export default function NotFound() {
  return (
    <SiteShell>
      <section className="section-pad">
        <div className="container-shell">
          <div className="editorial-empty editorial-not-found">
            <p className="section-kicker">Erro 404</p>
            <h1 className="section-title">Página não encontrada</h1>
            <p>
              O endereço que você acessou não existe ou foi movido.
            </p>
            <Link className="button-primary" href="/">
              Voltar para o início
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
