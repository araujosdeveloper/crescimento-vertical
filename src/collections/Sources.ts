import type { CollectionConfig } from "payload";

import {
  sourcesCreate,
  sourcesDelete,
  sourcesRead,
  sourcesUpdate,
} from "../access";
import { SOURCE_RELIABILITY_LEVELS } from "../lib/editorial";

export const Sources: CollectionConfig = {
  slug: "sources",
  admin: {
    useAsTitle: "title",
    defaultColumns: [
      "title",
      "publisher",
      "sourceLevel",
      "reliability",
      "collectedAt",
    ],
  },
  access: {
    read: sourcesRead,
    create: sourcesCreate,
    update: sourcesUpdate,
    delete: sourcesDelete,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "publisher",
      type: "text",
      required: true,
    },
    {
      name: "url",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "sourceType",
      type: "select",
      options: [
        { label: "Documentação oficial", value: "official_documentation" },
        { label: "Imprensa / veículo", value: "press" },
        { label: "Publicação técnica", value: "technical_publication" },
        { label: "Artigo científico", value: "research_paper" },
        { label: "Rede social", value: "social" },
        { label: "Fórum / comunidade", value: "community" },
        { label: "Newsletter", value: "newsletter" },
        { label: "Agregador", value: "aggregator" },
        { label: "Vídeo", value: "video" },
        { label: "Outro", value: "other" },
      ],
      defaultValue: "press",
    },
    {
      name: "sourceLevel",
      type: "select",
      options: [
        { label: "A — Primária", value: "A" },
        { label: "B — Reconhecida", value: "B" },
        { label: "C — Descoberta", value: "C" },
      ],
    },
    {
      name: "author",
      type: "text",
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "collectedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: "editorialNotes",
      type: "textarea",
    },
    {
      name: "reliability",
      type: "select",
      options: SOURCE_RELIABILITY_LEVELS.map((level) => ({
        label: level,
        value: level,
      })),
      defaultValue: "unverified",
      required: true,
    },
  ],
};
