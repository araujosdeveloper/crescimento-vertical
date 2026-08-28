export type CommercialSEO = { metaTitle?: string | null; metaDescription?: string | null; canonicalUrl?: string | null; noindex?: boolean | null };
export type PublicService = {
  id: string | number; title: string; slug: string; shortDescription?: string | null;
  positioning?: string | null; targetAudience?: string | null; problems: string[];
  deliverables: string[]; processSteps: string[]; capabilities: string[];
  primaryCTAType?: string | null; primaryCTALabel?: string | null; featured?: boolean | null;
  order?: number | null; seo: CommercialSEO;
};
export type PublicCase = { id: string | number; title: string; slug: string; summary?: string | null; clientDisplayName?: string | null; challenge?: string | null; solution?: string | null; results?: string | null; period?: string | null; relatedServices: Array<{title:string;slug:string}>; testimonial?: string | null; media?: {url?:string|null;alt?:string|null}|null; seo: CommercialSEO };
