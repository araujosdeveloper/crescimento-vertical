import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const noindex = process.env.SITE_NOINDEX === "true";

  if (noindex) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
  };
}
