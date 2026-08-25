import type { CollectionBeforeChangeHook } from "payload";

import { slugify } from "../lib/slugify";

/**
 * Generates a slug from the title when one is not provided explicitly.
 * Editors may override the slug manually. De-duplication of colliding slugs
 * is deferred to Fase 4, when public routes are introduced.
 */
export const ensureSlug: CollectionBeforeChangeHook = ({ data }) => {
  const title = data?.title;
  const slug = data?.slug;

  if ((!slug || slug.trim() === "") && typeof title === "string") {
    data.slug = slugify(title);
  }

  return data;
};
