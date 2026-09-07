import type { CollectionConfig } from "payload";

import {
  newsletterCreate,
  newsletterDelete,
  newsletterRead,
  newsletterUpdate,
} from "../access";

export const NewsletterSubscribers: CollectionConfig = {
  slug: "newsletter-subscribers",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "status", "consentedAt"],
  },
  access: {
    read: newsletterRead,
    create: newsletterCreate,
    update: newsletterUpdate,
    delete: newsletterDelete,
  },
  fields: [
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
      admin: { readOnly: true },
    },
    { name: "consentVersion", type: "text", required: true },
    { name: "consentTextHash", type: "text", required: true },
    { name: "consentedAt", type: "date", required: true },
    {
      name: "status",
      type: "select",
      defaultValue: "subscribed",
      options: [
        { label: "Inscrito", value: "subscribed" },
        { label: "Descadastrado", value: "unsubscribed" },
      ],
    },
    { name: "source", type: "text" },
    { name: "idempotencyKey", type: "text", admin: { readOnly: true } },
  ],
};
