import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EditorialNotFound } from "@/components/editorial/not-found-view";

export default function CategoriasNotFound() {
  return (
    <main className="overflow-hidden">
      <Header />
      <section className="section-pad">
        <div className="container-shell">
          <EditorialNotFound
            kicker="Categoria não encontrada"
            title="Categoria não encontrada"
            description="Esta categoria não existe ou ainda não possui conteúdo publicado."
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
