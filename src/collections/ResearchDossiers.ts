import type { CollectionConfig } from "payload";

import {
  dossiersCreate,
  dossiersDelete,
  dossiersRead,
  dossiersUpdate,
} from "../access";

export const ResearchDossiers: CollectionConfig = {
  slug: "research-dossiers",
  admin: {
    useAsTitle: "topic",
    defaultColumns: ["topic", "status", "updatedAt"],
  },
  access: {
    read: dossiersRead,
    create: dossiersCreate,
    update: dossiersUpdate,
    delete: dossiersDelete,
  },
  fields: [
    {
      name: "topic",
      type: "text",
      required: true,
    },
    {
      name: "summary",
      type: "textarea",
    },
    {
      name: "keyFindings",
      type: "array",
      fields: [
        {
          name: "finding",
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
      name: "risksAndDivergences",
      type: "textarea",
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Pesquisa", value: "research" },
        { label: "Validado", value: "validated" },
        { label: "Rejeitado", value: "rejected" },
      ],
      defaultValue: "research",
      required: true,
    },
    {
      name: "provenance",
      type: "group",
      fields: [
        {
          name: "origin",
          type: "select",
          options: [
            { label: "Hermes", value: "hermes" },
            { label: "Manual", value: "manual" },
            { label: "Importação", value: "import" },
          ],
          defaultValue: "manual",
        },
        {
          name: "runId",
          type: "text",
        },
        {
          name: "collectedAt",
          type: "date",
          admin: {
            date: {
              pickerAppearance: "dayAndTime",
            },
          },
        },
        {
          name: "notes",
          type: "textarea",
        },
      ],
    },
    {
      name: "assignee",
      type: "relationship",
      relationTo: "users",
    },
  ],
};
