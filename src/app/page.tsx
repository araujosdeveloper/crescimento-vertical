import { CTASection } from "@/components/cta-section";
import { AuthoritySection } from "@/components/authority-section";
import { DifferentialsSection } from "@/components/differentials-section";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { ProblemSection } from "@/components/problem-section";
import { ProcessSection } from "@/components/process-section";
import { ServicesSection } from "@/components/services-section";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <Header />
      <Hero />
      <AuthoritySection />
      <ServicesSection />
      <ProblemSection />
      <ProcessSection />
      <DifferentialsSection />
      <CTASection />
      <Footer />
      <FloatingWhatsAppButton />
    </main>
  );
}
