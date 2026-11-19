// Dynamic sitemap.xml generator
// پایگاه خبری راهکار جوان

import { db } from "@/lib/db";
import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rahkarjavan.ir";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/#/magazine`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/#/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/#/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/#/search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.3,
    },
  ];

  try {
    const [articles, videos, categories] = await Promise.all([
      db.article.findMany({
        where: { isPublished: true, status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
      db.video.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
      }),
      db.category.findMany({
        select: { slug: true, createdAt: true },
      }),
    ]);

    const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
      url: `${SITE_URL}/#/article/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const videoUrls: MetadataRoute.Sitemap = videos.map((v) => ({
      url: `${SITE_URL}/#/video/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${SITE_URL}/#/category/${c.slug}`,
      lastModified: c.createdAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticPages, ...articleUrls, ...videoUrls, ...categoryUrls];
  } catch (e) {
    console.error("sitemap: database unavailable", e);
    return staticPages;
  }
}
