import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@rahkarjavan.ir";

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD is not set in .env");
  }

  // Admin: فقط اگر وجود نداشت ساخته می‌شود (رمز موجود را تغییر نمی‌دهد)
  await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: "پوریا معصومی",
      displayName: "پوریا",
      password: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
      bio: "مدیر پایگاه خبری راهکار جوان",
    },
  });
  console.log("✅ Admin ensured");

  const categories = [
    {
      name: "اجتماعی",
      nameEn: "Social",
      slug: "social",
      type: "BOTH",
      color: "#dc2626",
      description: "اخبار و گزارش‌های اجتماعی",
    },
    {
      name: "فرهنگ و هنر",
      nameEn: "Culture & Art",
      slug: "culture",
      type: "BOTH",
      color: "#7c3aed",
      description: "فرهنگ، هنر و سرگرمی جوانان",
    },
    {
      name: "اقتصادی",
      nameEn: "Economy",
      slug: "economy",
      type: "BOTH",
      color: "#059669",
      description: "اقتصاد، کارآفرینی و استارتاپ",
    },
    {
      name: "آموزش",
      nameEn: "Education",
      slug: "education",
      type: "BOTH",
      color: "#2563eb",
      description: "آموزش، دانشگاه و مهارت‌آموزی",
    },
    {
      name: "ورزشی",
      nameEn: "Sports",
      slug: "sports",
      type: "BOTH",
      color: "#ea580c",
      description: "ورزش جوانان",
    },
    {
      name: "فناوری",
      nameEn: "Technology",
      slug: "technology",
      type: "BOTH",
      color: "#0891b2",
      description: "فناوری، دیجیتال و نوآوری",
    },
    {
      name: "خیریه",
      nameEn: "Charity",
      slug: "charity",
      type: "VIDEO",
      color: "#16a34a",
      description: "فعالیت‌های خیریه و نیکوکاری",
    },
    {
      name: "مصاحبه",
      nameEn: "Interview",
      slug: "interview",
      type: "VIDEO",
      color: "#9333ea",
      description: "مصاحبه‌های انحصاری با چهره‌ها",
    },
  ];
  for (const c of categories) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log("✅ Categories ensured");

  const settings = [
    { key: "site_name", value: "پایگاه خبری راهکار جوان" },
    { key: "site_name_en", value: "Rahkar Javan News Agency" },
    { key: "site_url", value: "https://rahkarjavan.ir" },
    { key: "contact_email", value: "news@rahkarjavan.ir" },
    { key: "contact_phone", value: "021-12345678" },
    { key: "address", value: "تهران، خیابان ولیعصر، پلاک ۱۲۳" },
    {
      key: "about_text",
      value:
        "پایگاه خبری راهکار جوان، رسانه‌ای مستقل با تمرکز بر اخبار و مسائل جوانان ایران و جهان است. ما تلاش می‌کنیم صدای واقعی نسل جوان را به گوش همه برسانیم.",
    },
    { key: "social_twitter", value: "https://twitter.com/rahkarjavan" },
    { key: "social_instagram", value: "https://instagram.com/rahkarjavan" },
    { key: "social_telegram", value: "https://t.me/rahkarjavan" },
  ];
  for (const s of settings) {
    // update: {} یعنی تنظیماتی که از پنل ادمین عوض شده‌اند بازنویسی نمی‌شوند
    await db.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("✅ Site settings ensured");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
