import type { CollectionBeforeChangeHook } from "payload";
import { slugify } from "../lib/slugify";
import { isAdmin, hasRole } from "../lib/roles";

export const ensureCommercialSlug: CollectionBeforeChangeHook = ({ data }) => {
  if ((!data?.slug || !String(data.slug).trim()) && typeof data?.title === "string") {
    data.slug = slugify(data.title);
  } else if (typeof data?.slug === "string") {
    data.slug = slugify(data.slug);
  }
  return data;
};

export const enforceCommercialPublication: CollectionBeforeChangeHook = ({ req, data, originalDoc, collection }) => {
  const nextStatus = data?._status ?? originalDoc?._status ?? "draft";
  const publishing = nextStatus === "published";
  const seeded = req.context?.seedServices === true;
  if (publishing && !seeded && !(isAdmin(req.user) || hasRole(req.user, "reviewer"))) {
    throw new Error("Somente admin ou reviewer podem publicar conteúdo comercial.");
  }
  if (collection?.slug === "cases" && publishing && (data?.authorizationStatus ?? originalDoc?.authorizationStatus) !== "approved") {
    throw new Error("Case exige autorização aprovada para publicação.");
  }
  data._status = publishing ? "published" : "draft";
  if (publishing && !data.publishedAt) data.publishedAt = new Date().toISOString();
  return data;
};
