import Link from "next/link";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function NotFound() {
  return (
    <main className="overflow-hidden">
      <Header />
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
      <Footer />
    </main>
  );
}
