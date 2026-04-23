import type { MetadataRoute } from "next";

const HOST = "https://mueve.ro";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${HOST}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${HOST}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${HOST}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${HOST}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${HOST}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
