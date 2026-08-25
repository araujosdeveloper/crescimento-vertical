import Link from "next/link";

export function EditorialNotFound({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="editorial-empty editorial-not-found">
      <p className="section-kicker">{kicker}</p>
      <h1 className="section-title">{title}</h1>
      <p>{description}</p>
      <Link className="button-primary" href="/conteudos">
        Ver todos os conteúdos
      </Link>
    </div>
  );
}
