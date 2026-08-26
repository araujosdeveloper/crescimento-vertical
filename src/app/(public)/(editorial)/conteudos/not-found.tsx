import { EditorialNotFound } from "@/components/editorial/not-found-view";

export default function ConteudosNotFound() {
  return (
    <section className="section-pad">
      <div className="container-shell">
        <EditorialNotFound
          kicker="Conteúdo não encontrado"
          title="Artigo não encontrado"
          description="Este conteúdo pode ter sido movido, arquivado ou ainda não foi publicado."
        />
      </div>
    </section>
  );
}
