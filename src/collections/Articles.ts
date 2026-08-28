import type { CollectionConfig } from "payload";

import {
  articlesCreate,
  articlesDelete,
  articlesRead,
  articlesUpdate,
  workflowStatusFieldAccess,
  publishStatusFieldAccess,
} from "../access";
import { auditWorkflowChange } from "../hooks/audit";
import { enforceWorkflowRules } from "../hooks/enforceWorkflow";
import { ensureSlug } from "../hooks/ensureSlug";
import { revalidateEditorialContent } from "../hooks/revalidate";
import { CONTENT_TYPES, WORKFLOW_STATUSES } from "../lib/editorial";
import { previewURLForArticle } from "../lib/preview";

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "workflowStatus", "publishedAt", "updatedAt"],
    preview: (doc) => previewURLForArticle(doc.slug),
  },
  access: {
    read: articlesRead,
    create: articlesCreate,
    update: articlesUpdate,
    delete: articlesDelete,
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [ensureSlug, enforceWorkflowRules],
    afterChange: [auditWorkflowChange, revalidateEditorialContent],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "excerpt",
      type: "textarea",
    },
    {
      name: "content",
      type: "richText",
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "authors",
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
    },
    {
      name: "tags",
      type: "array",
      fields: [
        {
          name: "tag",
          type: "text",
          required: true,
        },
      ],
    },
    { name: "tagRelations", type: "relationship", relationTo: "tags", hasMany: true },
    { name: "contentType", type: "select", required: true, defaultValue: "news", options: CONTENT_TYPES.map((value) => ({ label: value, value })) },
    { name: "publicReviewer", type: "relationship", relationTo: "authors", access: { create: publishStatusFieldAccess, update: publishStatusFieldAccess } },
    { name: "businessImpact", type: "textarea" },
    { name: "readingTime", type: "number", admin: { readOnly: true } },
    { name: "reviewedAt", type: "date" },
    { name: "aiDisclosure", type: "textarea" },
    { name: "relatedServices", type: "relationship", relationTo: "services", hasMany: true },
    { name: "relatedArticles", type: "relationship", relationTo: "articles", hasMany: true },
    { name: "publicCitations", type: "array", admin: { readOnly: true }, fields: [
      { name: "title", type: "text", required: true }, { name: "publisher", type: "text", required: true }, { name: "url", type: "text", required: true }, { name: "author", type: "text" }, { name: "publishedAt", type: "date" }, { name: "accessedAt", type: "date", required: true }, { name: "sourceType", type: "text", required: true }, { name: "isPrimary", type: "checkbox" },
    ] },
    { name: "correctionHistory", type: "array", access: { create: publishStatusFieldAccess, update: publishStatusFieldAccess }, fields: [{ name: "date", type: "date", required: true }, { name: "summary", type: "textarea", required: true }, { name: "responsible", type: "relationship", relationTo: "authors" }] },
    {
      name: "sources",
      type: "relationship",
      relationTo: "sources",
      hasMany: true,
    },
    {
      name: "dossier",
      type: "relationship",
      relationTo: "research-dossiers",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Marca o artigo como destaque editorial (curadoria manual).",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "workflowStatus",
      type: "select",
      options: WORKFLOW_STATUSES.map((status) => ({
        label: status,
        value: status,
      })),
      defaultValue: "draft",
      required: true,
      access: {
        create: workflowStatusFieldAccess,
        update: workflowStatusFieldAccess,
      },
      admin: {
        position: "sidebar",
      },
    },
    {
      type: "group",
      name: "seo",
      label: "SEO",
      fields: [
        {
          name: "seoTitle",
          type: "text",
        },
        {
          name: "seoDescription",
          type: "textarea",
        },
        {
          name: "canonicalUrl",
          type: "text",
        },
        {
          name: "noindex",
          type: "checkbox",
          defaultValue: false,
        },
      ],
      admin: {
        position: "sidebar",
      },
    },
  ],
};
