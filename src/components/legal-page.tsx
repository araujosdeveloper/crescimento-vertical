import type { ReactNode } from "react";
export function LegalPage({title,children}:{title:string;children:ReactNode}){return <div className="section-pad"><div className="container-shell"><p className="section-kicker">Crescimento Vertical</p><h1 className="section-title">{title}</h1><div className="prose prose-invert max-w-3xl">{children}</div></div></div>}
