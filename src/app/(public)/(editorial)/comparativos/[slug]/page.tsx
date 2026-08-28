import { typedArticle, typedMetadata } from "@/components/editorial/typed-article-page";
export const dynamic = "force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){return typedMetadata((await params).slug);}
export default async function Page({params}:{params:Promise<{slug:string}>}){return typedArticle((await params).slug);}
