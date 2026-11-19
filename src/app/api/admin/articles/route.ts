import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const articles = await db.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, author: true },
  });
  return NextResponse.json({ articles });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const slug = body.slug || body.title.replace(/\s+/g, "-").toLowerCase();
    const existing = await db.article.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "این slug قبلاً استفاده شده" },
        { status: 409 },
      );
    }
    const article = await db.article.create({
      data: {
        title: body.title,
        titleEn: body.titleEn || null,
        slug,
        excerpt: body.excerpt || "",
        excerptEn: body.excerptEn || null,
        content: body.content || "",
        contentEn: body.contentEn || null,
        coverImage: body.coverImage || "https://picsum.photos/seed/new/800/450",
        views: 0,
        isFeatured: Boolean(body.isFeatured),
        isPublished: body.isPublished !== false,
        isBreaking: Boolean(body.isBreaking),
        authorId: session.user.id,
        categoryId: body.categoryId || null,
        tags: body.tags || "",
        status: body.status || "PUBLISHED",
        publishedAt:
          body.status === "SCHEDULED" && body.publishedAt
            ? new Date(body.publishedAt)
            : new Date(),
      },
    });
    return NextResponse.json({ article });
  } catch (e) {
    console.error("Create article error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
