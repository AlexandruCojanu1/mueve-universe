import type { MetadataRoute } from "next";

const HOST = "https://mueve.ro";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/coach",
          "/dashboard",
          "/partner",
          "/api",
          "/q/",
          "/verify-email",
          "/reset-password",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${HOST}/sitemap.xml`,
    host: HOST,
  };
}
