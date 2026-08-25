import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EditorialNotFound } from "@/components/editorial/not-found-view";

export default function AutoresNotFound() {
  return (
    <main className="overflow-hidden">
      <Header />
      <section className="section-pad">
        <div className="container-shell">
          <EditorialNotFound
            kicker="Autor não encontrado"
            title="Autor não encontrado"
            description="Este autor não existe ou ainda não possui conteúdo publicado."
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
