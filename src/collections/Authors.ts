import type { CollectionConfig } from "payload";

import {
  publicRead,
  taxonomyCreate,
  taxonomyDelete,
  taxonomyUpdate,
} from "../access";

export const Authors: CollectionConfig = {
  slug: "authors",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "active"],
  },
  access: {
    read: publicRead,
    create: taxonomyCreate,
    update: taxonomyUpdate,
    delete: taxonomyDelete,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "biography",
      type: "textarea",
    },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
    },
  ],
};
