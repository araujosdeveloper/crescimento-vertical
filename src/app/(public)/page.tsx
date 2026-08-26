import { CTASection } from "@/components/cta-section";
import { AuthoritySection } from "@/components/authority-section";
import { DifferentialsSection } from "@/components/differentials-section";
import { EditorialSection } from "@/components/editorial-section";
import { Hero } from "@/components/hero";
import { ProblemSection } from "@/components/problem-section";
import { ProcessSection } from "@/components/process-section";
import { ServicesSection } from "@/components/services-section";
import { getRecentArticles } from "@/lib/editorial/data";
import { HOME_ARTICLE_COUNT } from "@/lib/editorial/constants";

export const dynamic = "force-dynamic";

export default async function Home() {
  const articles = await getRecentArticles(HOME_ARTICLE_COUNT);

  return (
    <>
      <Hero />
      <AuthoritySection />
      <ServicesSection />
      <ProblemSection />
      <ProcessSection />
      <DifferentialsSection />
      <EditorialSection articles={articles} />
      <CTASection />
    </>
  );
}
