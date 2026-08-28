import type { CollectionConfig } from "payload";

import {
  articlesCreate,
  articlesDelete,
  articlesRead,
  articlesUpdate,
  workflowStatusFieldAccess,
} from "../access";
import { auditWorkflowChange } from "../hooks/audit";
import { enforceWorkflowRules } from "../hooks/enforceWorkflow";
import { ensureSlug } from "../hooks/ensureSlug";
import { revalidateEditorialContent } from "../hooks/revalidate";
import { WORKFLOW_STATUSES } from "../lib/editorial";
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
