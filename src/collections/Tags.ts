import type { CollectionConfig } from "payload";
import { tagsRead, taxonomyCreate, taxonomyDelete, taxonomyUpdate } from "../access";
import { ensureSlug } from "../hooks/ensureSlug";
import { revalidateEditorialContent } from "../hooks/revalidate";
export const Tags: CollectionConfig = { slug: "tags", admin: { useAsTitle: "name", defaultColumns: ["name", "slug", "active", "indexable"] }, access: { read: tagsRead, create: taxonomyCreate, update: taxonomyUpdate, delete: taxonomyDelete }, hooks: { beforeChange: [ensureSlug], afterChange: [revalidateEditorialContent] }, fields: [
  { name: "name", type: "text", required: true }, { name: "slug", type: "text", required: true, unique: true, index: true }, { name: "description", type: "textarea" }, { name: "active", type: "checkbox", defaultValue: true }, { name: "indexable", type: "checkbox", defaultValue: false }, { name: "order", type: "number" }, { name: "seo", type: "group", fields: [{ name: "metaTitle", type: "text" }, { name: "metaDescription", type: "textarea" }, { name: "canonicalUrl", type: "text" }] },
] };
