import type { CollectionConfig } from "payload";

import {
  publicRead,
  taxonomyCreate,
  taxonomyDelete,
  taxonomyUpdate,
} from "../access";
import { revalidateEditorialContent } from "../hooks/revalidate";

export const Categories: CollectionConfig = {
  slug: "categories",
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
  hooks: {
    afterChange: [revalidateEditorialContent],
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
      name: "description",
      type: "textarea",
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
    },
  ],
};
