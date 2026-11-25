// Seed script for Rahkar Javan News Agency
import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding database...')

  await db.comment.deleteMany()
  await db.contactMessage.deleteMany()
  await db.video.deleteMany()
  await db.article.deleteMany()
  await db.category.deleteMany()
  await db.tag.deleteMany()
  await db.user.deleteMany()

  const adminPassword = await bcrypt.hash('2150375273Pm', 10)
  const admin = await db.user.create({
    data: {
      email: 'drpouriamasoumi@gmail.com',
      name: '',
      displayName: 'پوریا معصومی',
      password: adminPassword,
      role: 'ADMIN',
      bio: 'مدیر پایگاه خبری راهکار جوان',
    },
  })

  const editorPassword = await bcrypt.hash('editor123', 10)
  const editor = await db.user.create({
    data: {
      email: 'editor@rahkarjavan.ir',
      name: 'نگار احمدی',
      displayName: 'نگار احمدی',
      password: editorPassword,
      role: 'EDITOR',
      bio: 'سردبیر مجله راهکار جوان',
    },
  })

  const userPassword = await bcrypt.hash('user123', 10)
  const regularUser = await db.user.create({
    data: {
      email: 'user@rahkarjavan.ir',
      name: 'کاربر نمونه',
      displayName: 'کاربر نمونه',
      password: userPassword,
      role: 'USER',
      bio: 'علاقه‌مند به اخبار جوانان',
    },
  })

  console.log('✅ Users created')

  const categories = await Promise.all([
    db.category.create({ data: { name: 'اجتماعی', nameEn: 'Social', slug: 'social', type: 'BOTH', color: '#dc2626', description: 'اخبار و گزارش‌های اجتماعی' } }),
    db.category.create({ data: { name: 'فرهنگ و هنر', nameEn: 'Culture & Art', slug: 'culture', type: 'BOTH', color: '#7c3aed', description: 'فرهنگ، هنر و سرگرمی جوانان' } }),
    db.category.create({ data: { name: 'اقتصادی', nameEn: 'Economy', slug: 'economy', type: 'BOTH', color: '#059669', description: 'اقتصاد، کارآفرینی و استارتاپ' } }),
    db.category.create({ data: { name: 'آموزش', nameEn: 'Education', slug: 'education', type: 'BOTH', color: '#2563eb', description: 'آموزش، دانشگاه و مهارت‌آموزی' } }),
    db.category.create({ data: { name: 'ورزشی', nameEn: 'Sports', slug: 'sports', type: 'BOTH', color: '#ea580c', description: 'ورزش جوانان' } }),
    db.category.create({ data: { name: 'فناوری', nameEn: 'Technology', slug: 'technology', type: 'BOTH', color: '#0891b2', description: 'فناوری، دیجیتال و نوآوری' } }),
    db.category.create({ data: { name: 'خیریه', nameEn: 'Charity', slug: 'charity', type: 'VIDEO', color: '#16a34a', description: 'فعالیت‌های خیریه و نیکوکاری' } }),
    db.category.create({ data: { name: 'مصاحبه', nameEn: 'Interview', slug: 'interview', type: 'VIDEO', color: '#9333ea', description: 'مصاحبه‌های انحصاری با چهره‌ها' } }),
  ])

  console.log('✅ Categories created')

  const cover = (seed: string) => `https://picsum.photos/seed/${seed}/800/450`

  // Comments
  const art1 = await db.article.findFirst({ where: { slug: 'youth-digital-economy-opportunity' } })
  const art2 = await db.article.findFirst({ where: { slug: 'investing-iranian-startups-guide' } })
  const art3 = await db.article.findFirst({ where: { slug: 'digital-literacy-employment-key' } })

  if (art1 && art2 && art3) {
    await db.comment.createMany({
      data: [
        { content: 'گزارش بسیار جامع و مفیدی بود. ممنون از تیم راهکار جوان.', authorName: 'محمد رضایی', authorEmail: 'mohammad@example.com', articleId: art1.id },
        { content: 'به عنوان یک جوان کارآفرین، با بسیاری از مطالب موافقم. امیدوارم بیشتر به این حوزه توجه شود.', authorName: 'زهرا کریمی', authorEmail: 'zahra@example.com', articleId: art2.id },
        { content: 'آیا برنامه‌ای برای آموزش سواد دیجیتال رایگان وجود دارد؟', authorName: 'علی محمدی', authorEmail: 'ali@example.com', articleId: art3.id },
      ],
    })
  }
  console.log('✅ Comments created')

  await db.contactMessage.createMany({
    data: [
      { name: 'نگار احمدی', email: 'negar@example.com', subject: 'پیشنهاد همکاری', message: 'سلام، من به عنوان روزنامه‌نگار علاقه‌مند به همکاری با پایگاه خبری راهکار جوان هستم. لطفاً راهنمایی کنید.' },
      { name: 'رضا محمدی', email: 'reza@example.com', subject: 'گزارش خطا در سایت', message: 'در صفحه ویدیوها، دکمه اشتراک‌گذاری کار نمی‌کند. لطفاً بررسی کنید.', isRead: true },
    ],
  })
  console.log('✅ Contact messages created')

  await db.siteSetting.createMany({
    data: [
      { key: 'site_name', value: 'پایگاه خبری راهکار جوان' },
      { key: 'site_name_en', value: 'Rahkar Javan News Agency' },
      { key: 'site_url', value: 'https://rahkarjavan.ir' },
      { key: 'contact_email', value: 'news@rahkarjavan.ir' },
      { key: 'contact_phone', value: '021-12345678' },
      { key: 'address', value: 'تهران، خیابان ولیعصر، پلاک ۱۲۳' },
      { key: 'about_text', value: 'پایگاه خبری راهکار جوان، رسانه‌ای مستقل با تمرکز بر اخبار و مسائل جوانان ایران و جهان است. ما تلاش می‌کنیم صدای واقعی نسل جوان را به گوش همه برسانیم.' },
      { key: 'social_twitter', value: 'https://twitter.com/rahkarjavan' },
      { key: 'social_instagram', value: 'https://instagram.com/rahkarjavan' },
      { key: 'social_telegram', value: 'https://t.me/rahkarjavan' },
    ],
  })
  console.log('✅ Site settings created')

  console.log('\n🎉 Seeding completed!')
  console.log('\n📋 Login credentials:')
  console.log('  Admin:    admin@rahkarjavan.ir / admin123')
  console.log('  Editor:   editor@rahkarjavan.ir / editor123')
  console.log('  User:     user@rahkarjavan.ir / user123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
