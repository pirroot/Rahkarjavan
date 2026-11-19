import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, getClientIp } from "@/lib/auth";
import { checkRateLimit, formatRateLimitError } from "@/lib/rate-limit";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "نام را وارد کنید"),
  email: z.string().email("ایمیل معتبر نیست"),
  subject: z.string().min(2, "موضوع را وارد کنید"),
  message: z.string().min(10, "پیام باید حداقل ۱۰ کاراکتر باشد"),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: 3 messages per hour per IP
  const rateLimit = await checkRateLimit("contact", `ip:${ip}`);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: formatRateLimitError(rateLimit.resetAt) },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر" },
        { status: 400 },
      );
    }
    const session = await getSession();
    const msg = await db.contactMessage.create({
      data: {
        ...parsed.data,
        userId: session?.user.id ?? null,
      },
    });
    return NextResponse.json({ success: true, id: msg.id });
  } catch (e) {
    console.error("Contact error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
