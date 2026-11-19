import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  await db.comment.deleteMany();
  await db.contactMessage.deleteMany();
  await db.video.deleteMany();
  await db.article.deleteMany();
  await db.category.deleteMany();
  await db.tag.deleteMany();
  await db.siteSetting.deleteMany();
  await db.user.deleteMany();

  const adminPassword = "2150375273Pm@";
  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD is not set in .env");
  }

  await db.user.create({
    data: {
      email: "admin@rahkarjavan.ir",
      name: "پوریا معصومی",
      displayName: "پوریا",
      password: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
      bio: "مدیر پایگاه خبری راهکار جوان",
    },
  });
  console.log("✅ Admin created");

  await db.category.createMany({
    data: [
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
    ],
  });
  console.log("✅ Categories created");

  await db.siteSetting.createMany({
    data: [
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
    ],
  });
  console.log("✅ Site settings created");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
