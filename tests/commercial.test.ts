import { describe, expect, it } from "vitest";
import { COMMERCIAL_FALLBACK_SERVICES } from "@/lib/commercial/data";

describe("commercial catalog", () => {
  it("contains exactly the six canonical service slugs", () => {
    const slugs = COMMERCIAL_FALLBACK_SERVICES.map((service) => service.slug);
    expect(slugs).toEqual([
      "sites-e-landing-pages",
      "trafego-e-conversao",
      "automacao-whatsapp",
      "agentes-de-ia",
      "integracoes-n8n",
      "consultoria-e-suporte",
    ]);
    expect(new Set(slugs).size).toBe(6);
  });

  it("does not make outcome guarantees or expose internal fields", () => {
    expect(COMMERCIAL_FALLBACK_SERVICES.every((service) => !Object.keys(service).some((key) => ["authorizationStatus", "versions", "workflow", "users"].includes(key)))).toBe(true);
    expect(COMMERCIAL_FALLBACK_SERVICES.every((service) => service.title && service.shortDescription)).toBe(true);
  });
});
