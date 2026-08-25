import type { CollectionConfig } from "payload";
import path from "path";

import {
  mediaCreate,
  mediaDelete,
  mediaUpdate,
  publicRead,
} from "../access";

const mediaDir = process.env.PAYLOAD_MEDIA_DIR || path.resolve(process.cwd(), "media");

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "alt",
    defaultColumns: ["alt", "filename", "updatedAt"],
  },
  access: {
    read: publicRead,
    create: mediaCreate,
    update: mediaUpdate,
    delete: mediaDelete,
  },
  upload: {
    staticDir: mediaDir,
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/svg+xml",
    ],
    focalPoint: true,
    adminThumbnail: "thumbnail",
    imageSizes: [
      {
        name: "thumbnail",
        width: 480,
        height: 320,
        position: "centre",
      },
      {
        name: "card",
        width: 768,
        height: 512,
        position: "centre",
      },
      {
        name: "feature",
        width: 1600,
        height: 900,
        position: "centre",
      },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "caption",
      type: "text",
    },
    {
      name: "credit",
      type: "text",
    },
  ],
};
