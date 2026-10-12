import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/environment";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/", "/recipes/create", "/recipes/edit/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
