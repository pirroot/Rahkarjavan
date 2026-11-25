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

  const videos = [
    {
      title: 'تجمع افراد الهام‌بخش و رهبران جوان در میدان امید',
      titleEn: 'Inspirational Youth Leaders Gather in Field of Hope',
      slug: 'youth-leaders-gather-hope-field',
      description: 'گزارش تصویری از تجمع بزرگ رهبران جوان و افراد الهام‌بخش در میدان امید که نشان‌دهنده قدرت و انگیزه نسل جوان برای ساختن آینده‌ای روشن‌تر است.',
      descriptionEn: 'Visual report of the great gathering of young leaders and inspirational figures in the Field of Hope.',
      coverImage: cover('hope-field'),
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration: '12:34',
      videoType: 'REPORT' as const,
      isFeatured: true,
      categoryId: categories[0].id,
      sourceName: 'تهیه شده توسط تیم راهکار جوان',
      views: 15420,
    },
    {
      title: 'کاروان خیریه راهکار جوان در مناطق محروم',
      titleEn: 'Rahkar Javan Charity Caravan in Deprived Areas',
      slug: 'charity-caravan-deprived-areas',
      description: 'کاروان خیریه راهکار جوان با همراهی جوانان داوطلب به مناطق محروم کشور سفر کرد تا کمکی هرچند کوچک به خانواده‌های نیازمند داشته باشد.',
      descriptionEn: 'Rahkar Javan charity caravan traveled to deprived areas of the country.',
      coverImage: cover('charity'),
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      duration: '08:45',
      videoType: 'CHARITY' as const,
      isFeatured: true,
      categoryId: categories[6].id,
      sourceName: 'گزارش راهکار جوان',
      views: 8920,
    },
    {
      title: 'مصاحبه انحصاری با جوان کارآفرین سال',
      titleEn: 'Exclusive Interview with Young Entrepreneur of the Year',
      slug: 'interview-young-entrepreneur-year',
      description: 'گفتگوی اختصاصی راهکار جوان با جوان کارآفرین سال که موفق به دریافت جایزه ملی کارآفرینی شد. او داستان موفقیت خود را برای جوانان تعریف می‌کند.',
      descriptionEn: 'Exclusive interview with young entrepreneur of the year.',
      coverImage: cover('entrepreneur'),
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: '15:20',
      videoType: 'INTERVIEW' as const,
      categoryId: categories[2].id,
      sourceName: 'مصاحبه: نگار احمدی',
      views: 12340,
    },
    {
      title: 'گزارش ویژه: زندگی در حاشیه شهر',
      titleEn: 'Special Report: Life on the Edge of the City',
      slug: 'special-report-life-edge-city',
      description: 'گزارش ویژه راهکار جوان از زندگی جوانان در حاشیه کلان‌شهرها و چالش‌هایی که با آن روبه‌رو هستند.',
      descriptionEn: 'Special report on life of youth in the outskirts of metropolises.',
      coverImage: cover('city-edge'),
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      duration: '22:10',
      videoType: 'SPECIAL' as const,
      isFeatured: true,
      categoryId: categories[0].id,
      sourceName: 'تهیه شده توسط تیم راهکار جوان',
      views: 18900,
    },
    {
      title: 'مستند کوتاه: پرتره جوانان ایران',
      titleEn: 'Short Documentary: Portrait of Iranian Youth',
      slug: 'portrait-iranian-youth',
      description: 'مستند کوتاهی که نگاهی نو به زندگی، آرزوها و چالش‌های جوانان ایرانی امروز می‌اندازد.',
      descriptionEn: 'Short documentary taking a fresh look at life, dreams and challenges of Iranian youth.',
      coverImage: cover('portrait'),
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      duration: '18:55',
      videoType: 'DOCUMENTARY' as const,
      categoryId: categories[1].id,
      sourceName: 'مستند راهکار جوان',
      views: 9870,
    },
    {
      title: 'جوانان و تغییر اقلیم؛ مسئولیت ما',
      titleEn: 'Youth and Climate Change; Our Responsibility',
      slug: 'youth-climate-change',
      description: 'ویدیوهای خبری درباره نقش جوانان در مبارزه با تغییر اقلیم و محافظت از محیط زیست.',
      descriptionEn: 'News video about the role of youth in fighting climate change.',
      coverImage: cover('climate'),
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      duration: '06:30',
      videoType: 'NEWS' as const,
      categoryId: categories[0].id,
      sourceName: 'خبرگزاری راهکار جوان',
      views: 5430,
    },
    {
      title: 'مصاحبه با قهرمان جوان پارالمپیک',
      titleEn: 'Interview with Young Paralympic Champion',
      slug: 'interview-paralympic-champion',
      description: 'گفتگو با قهرمان جوان پارالمپیک که با اراده‌اش الگوی هزاران جوان ایرانی شد.',
      descriptionEn: 'Interview with young Paralympic champion.',
      coverImage: cover('paralympic'),
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      duration: '14:18',
      videoType: 'INTERVIEW' as const,
      categoryId: categories[4].id,
      sourceName: 'مصاحبه: سینا پیرزاده',
      views: 11200,
    },
    {
      title: 'گزارش تصویری: جشنواره هنرهای street art',
      titleEn: 'Visual Report: Street Art Festival',
      slug: 'street-art-festival',
      description: 'گزارش تصویری از جشنواره هنرهای خیابانی که جوانان هنرمند آثار خود را به نمایش گذاشتند.',
      descriptionEn: 'Visual report from street art festival.',
      coverImage: cover('street-art'),
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      duration: '09:42',
      videoType: 'REPORT' as const,
      categoryId: categories[1].id,
      sourceName: 'گزارش راهکار جوان',
      views: 7650,
    },
    {
      title: 'استارتاپ جوانان ایرانی در حوزه هوش مصنوعی',
      titleEn: 'Iranian Youth Startup in AI',
      slug: 'iranian-youth-startup-ai',
      description: 'ویدیوی خبری درباره استارتاپ موفق جوانان ایرانی در حوزه هوش مصنوعی.',
      descriptionEn: 'News video about successful Iranian youth startup in AI.',
      coverImage: cover('ai-startup'),
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      duration: '11:15',
      videoType: 'NEWS' as const,
      categoryId: categories[5].id,
      sourceName: 'خبرگزاری راهکار جوان',
      views: 13400,
    },
    {
      title: 'مستند: از خیابان تا صحنه',
      titleEn: 'Documentary: From Street to Stage',
      slug: 'documentary-street-to-stage',
      description: 'مستندی درباره سفر جوانان هنرمند از خیابان به صحنه تئاتر حرفه‌ای.',
      descriptionEn: 'Documentary about journey of young artists from street to professional theater stage.',
      coverImage: cover('theater'),
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
      duration: '25:30',
      videoType: 'DOCUMENTARY' as const,
      categoryId: categories[1].id,
      sourceName: 'مستند راهکار جوان',
      views: 6780,
    },
    {
      title: 'جوانان و سواد دیجیتال؛ کلید اشتغال نسل جدید',
      titleEn: 'Youth and Digital Literacy; Key to New Generation Employment',
      slug: 'youth-digital-literacy-video',
      description: 'گزارش درباره اهمیت سواد دیجیتال برای جوانان و نقش آن در ایجاد اشتغال.',
      descriptionEn: 'Report on importance of digital literacy for youth.',
      coverImage: cover('digital'),
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      duration: '07:25',
      videoType: 'REPORT' as const,
      categoryId: categories[5].id,
      sourceName: 'گزارش راهکار جوان',
      views: 8910,
    },
    {
      title: 'ویدیو خبری: سیلاب در جنوب کشور',
      titleEn: 'News Video: Floods in Southern Country',
      slug: 'floods-southern-country',
      description: 'ویدیوی خبری از سیلاب اخیر در جنوب کشور و تلاش جوانان داوطلب برای کمک به آسیب‌دیدگان.',
      descriptionEn: 'News video about recent floods in southern country.',
      coverImage: cover('flood'),
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
      duration: '04:50',
      videoType: 'NEWS' as const,
      categoryId: categories[0].id,
      sourceName: 'خبرگزاری راهکار جوان',
      views: 21300,
    },
  ]

  for (const v of videos) {
    await db.video.create({ data: v })
  }
  console.log(`✅ ${videos.length} videos created`)

  const articles = [
    {
      title: 'جوانان و اقتصاد دیجیتال؛ فرصتی که نباید از دست برود',
      titleEn: 'Youth and Digital Economy; An Opportunity Not to Miss',
      slug: 'youth-digital-economy-opportunity',
      excerpt: 'اقتصاد دیجیتال فرصتی بی‌نظیر برای جوانان ایرانی است. در این گزارش به بررسی چالش‌ها و امکانات این حوزه می‌پردازیم.',
      excerptEn: 'Digital economy is a unique opportunity for Iranian youth.',
      content: `<p>اقتصاد دیجیتال در سال‌های اخیر به یکی از مهم‌ترین محورهای توسعه اقتصادی کشور تبدیل شده است. جوانان ایرانی با وجود چالش‌های متعدد، فرصت‌های بی‌نظیری در این حوزه پیدا کرده‌اند.</p>
<h2>فرصت‌های نوظهور</h2>
<p>با گسترش اینترنت و فناوری‌های جدید، زمینه‌های کاری جدیدی برای جوانان ایجاد شده است. از فروشگاه‌های آنلاین تا استارتاپ‌های فناوری، همه نشان‌دهنده پتانسیل بالای جوانان در این حوزه است.</p>
<h2>چالش‌های پیش رو</h2>
<p>با وجود تمام فرصت‌ها، چالش‌های متعددی نیز وجود دارد. عدم زیرساخت‌های کافی، محدودیت‌های مالی و کمبود آموزش‌های تخصصی از جمله مشکلات اصلی هستند.</p>
<h2>راهکارهای پیشنهادی</h2>
<p>برای بهره‌برداری بهتر از فرصت‌های اقتصاد دیجیتال، سرمایه‌گذاری در آموزش، توسعه زیرساخت‌ها و حمایت از استارتاپ‌ها ضروری است.</p>
<p>کارشناسان معتقدند که با برنامه‌ریزی صحیح، جوانان ایرانی می‌توانند به بازیگران اصلی اقتصاد دیجیتال منطقه تبدیل شوند.</p>`,
      coverImage: cover('digital-economy'),
      categoryId: categories[2].id,
      authorId: editor.id,
      tags: 'اقتصاد دیجیتال,جوانان,استارتاپ,فناوری',
      isFeatured: true,
      isBreaking: false,
      views: 4520,
      publishedAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      title: 'پرتره مستند جوانان ایران',
      titleEn: 'Documentary Portrait of Iranian Youth',
      slug: 'documentary-portrait-iranian-youth',
      excerpt: 'نگاهی عمیق به زندگی، آرزوها و چالش‌های نسل جوان ایران در مستندی تازه منتشر شده.',
      excerptEn: 'A deep look at the life, dreams and challenges of the young Iranian generation.',
      content: `<p>مستند جدید «پرتره جوانان ایران» تلاش می‌کند تصویری واقعی و بدون تعصب از نسل جوان کشور ارائه دهد.</p>
<h2>روایت‌های متعدد</h2>
<p>این مستند روایت‌های متعددی از جوانان مختلف را در کنار هم قرار می‌دهد تا تصویری جامع از این نسل ارائه کند.</p>
<h2>آرزوها و ناامیدی‌ها</h2>
<p>در کنار آرزوهای بزرگ، ناامیدی‌هایی نیز وجود دارد که بخشی از واقعیت زندگی جوانان ایرانی است.</p>`,
      coverImage: cover('portrait-youth'),
      categoryId: categories[1].id,
      authorId: editor.id,
      tags: 'مستند,جوانان,هنر',
      isFeatured: false,
      views: 2340,
      publishedAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      title: 'شهر و نسل جوان؛ چالش زندگی در کلان‌شهرها',
      titleEn: 'City and Young Generation; Challenge of Living in Metropolises',
      slug: 'city-young-generation-metropolis',
      excerpt: 'زندگی در کلان‌شهرها چالش‌های خاص خود را برای جوانان ایجاد می‌کند. از مسکن تا حمل و نقل، همه چیز در این گزارش.',
      excerptEn: 'Living in metropolises creates special challenges for youth.',
      content: `<p>کلان‌شهرهای ایران با وجود امکانات فراوان، چالش‌های متعددی برای جوانان ایجاد کرده‌اند.</p>
<h2>بحران مسکن</h2>
<p>یکی از بزرگترین چالش‌های جوانان در کلان‌شهرها، مسئله مسکن است. افزایش بی‌رویه قیمت‌ها، جوانان را از خرید خانه ناامید کرده است.</p>
<h2>حمل و نقل عمومی</h2>
<p>تراکم بالای جمعیت و ضعف حمل و نقل عمومی، بخش بزرگی از وقت جوانان را در روز صرف جابه‌جایی می‌کند.</p>`,
      coverImage: cover('city-youth'),
      categoryId: categories[0].id,
      authorId: editor.id,
      tags: 'شهر,جوانان,کلان‌شهر,مسکن',
      isFeatured: false,
      views: 3120,
      publishedAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      title: 'سرمایه‌گذاری در استارتاپ‌های ایرانی؛ راهنمای کامل',
      titleEn: 'Investing in Iranian Startups; Complete Guide',
      slug: 'investing-iranian-startups-guide',
      excerpt: 'راهنمای جامع برای جوانانی که قصد سرمایه‌گذاری در استارتاپ‌های ایرانی را دارند. مراحل، ریسک‌ها و فرصت‌ها.',
      excerptEn: 'Comprehensive guide for young people looking to invest in Iranian startups.',
      content: `<p>سرمایه‌گذاری در استارتاپ‌ها یکی از روش‌های نوین سرمایه‌گذاری است که در سال‌های اخیر در ایران نیز رایج شده است.</p>
<h2>مراحل سرمایه‌گذاری</h2>
<p>برای سرمایه‌گذاری موفق در استارتاپ‌ها، باید مراحل مختلفی را طی کنید. از تحقیق و بررسی تیم تا ارزیابی بازار.</p>
<h2>ریسک‌ها و مدیریت آن</h2>
<p>هر سرمایه‌گذاری با ریسک همراه است. شناخت ریسک‌ها و مدیریت آن‌ها کلید موفقیت است.</p>`,
      coverImage: cover('startup-invest'),
      categoryId: categories[2].id,
      authorId: admin.id,
      tags: 'استارتاپ,سرمایه‌گذاری,اقتصاد',
      isFeatured: true,
      views: 5670,
      publishedAt: new Date(Date.now() - 86400000 * 1),
    },
    {
      title: 'از خیابان تا صحنه؛ داستان جوانان تئاتر',
      titleEn: 'From Street to Stage; Story of Theater Youth',
      slug: 'street-to-stage-theater-youth',
      excerpt: 'گزارشی از مسیر جوانانی که از تئاتر خیابانی به صحنه حرفه‌ای رسیدند.',
      excerptEn: 'Report on the journey of young people from street theater to professional stage.',
      content: `<p>تئاتر خیابانی سال‌هاست که به عنوان مدرسه‌ای برای جوانان هنرمند عمل می‌کند.</p>
<h2>شروع از خیابان</h2>
<p>بسیاری از هنرمندان موفق امروز، کار خود را از تئاتر خیابانی آغاز کرده‌اند.</p>
<h2>رسیدن به صحنه حرفه‌ای</h2>
<p>مسیر از خیابان تا صحنه حرفه‌ای، با چالش‌ها و سختی‌های بسیاری همراه است.</p>`,
      coverImage: cover('theater-youth'),
      categoryId: categories[1].id,
      authorId: editor.id,
      tags: 'تئاتر,هنر,جوانان',
      isFeatured: false,
      views: 1890,
      publishedAt: new Date(Date.now() - 86400000 * 7),
    },
    {
      title: 'سواد دیجیتال، کلید اشتغال نسل جدید',
      titleEn: 'Digital Literacy, Key to New Generation Employment',
      slug: 'digital-literacy-employment-key',
      excerpt: 'در دنیای امروز، سواد دیجیتال به یکی از مهم‌ترین مهارت‌ها برای جوانان جویای کار تبدیل شده است.',
      excerptEn: "In today's world, digital literacy has become one of the most important skills for young job seekers.",
      content: `<p>سواد دیجیتال دیگر یک مهارت اضافی نیست، بلکه ضرورت زندگی مدرن است.</p>
<h2>اهمیت سواد دیجیتال</h2>
<p>در دنیای امروز، تقریباً تمام مشاغل نیاز به حداقلی از مهارت‌های دیجیتال دارند.</p>
<h2>آموزش و توسعه</h2>
<p>برای توسعه سواد دیجیتال در میان جوانان، آموزش‌های متنوعی لازم است.</p>`,
      coverImage: cover('digital-literacy'),
      categoryId: categories[5].id,
      authorId: admin.id,
      tags: 'سواد دیجیتال,اشتغال,آموزش',
      isFeatured: false,
      views: 4320,
      publishedAt: new Date(Date.now() - 86400000 * 4),
    },
    {
      title: 'سیلاب در جنوب؛ جوانان داوطلب به کمک آمدند',
      titleEn: 'Floods in the South; Young Volunteers Came to Help',
      slug: 'floods-south-young-volunteers',
      excerpt: 'گزارشی از تلاش‌های جوانان داوطلب برای کمک به آسیب‌دیدگان سیلاب جنوب کشور.',
      excerptEn: 'Report on the efforts of young volunteers to help flood victims in the south.',
      content: `<p>سیلاب اخیر در جنوب کشور، خسارات زیادی به بار آورد، اما جوانان داوطلب با حضور سریع خود، نجات‌بخش بسیاری از خانواده‌ها بودند.</p>
<h2>موج اول کمک‌ها</h2>
<p>ساعاتی پس از وقوع سیلاب، جوانان داوطلب در منطقه حاضر شدند.</p>
<h2>تداوم کمک‌ها</h2>
<p>کمک‌ها همچنان ادامه دارد و نیازهای منطقه هنوز برطرف نشده است.</p>`,
      coverImage: cover('flood-news'),
      categoryId: categories[0].id,
      authorId: editor.id,
      tags: 'سیلاب,داوطلب,خبر',
      isFeatured: true,
      isBreaking: true,
      views: 8920,
      publishedAt: new Date(Date.now() - 86400000 * 0.5),
    },
    {
      title: 'بیماری خاموش؛ آگاهی جوانان در مورد دیابت',
      titleEn: 'Silent Disease; Youth Awareness About Diabetes',
      slug: 'diabetes-awareness-youth',
      excerpt: 'با افزایش ابتلا به دیابت در میان جوانان، آگاهی در مورد این بیماری بیشتر از همیشه ضروری است.',
      excerptEn: 'With rising diabetes among youth, awareness is more essential than ever.',
      content: `<p>دیابت که در گذشته بیماری افراد مسن تلقی می‌شد، امروزه به مشکلی برای جوانان نیز تبدیل شده است.</p>
<h2>علل افزایش دیابت</h2>
<p>تغذیه نامناسب و کم‌تحرکی از عوامل اصلی افزایش دیابت در میان جوانان است.</p>
<h2>پیشگیری</h2>
<p>پیشگیری از دیابت با تغییر سبک زندگی ممکن است.</p>`,
      coverImage: cover('diabetes'),
      categoryId: categories[0].id,
      authorId: admin.id,
      tags: 'دیابت,سلامت,جوانان',
      isFeatured: false,
      views: 1540,
      publishedAt: new Date(Date.now() - 86400000 * 6),
    },
  ]

  for (const a of articles) {
    await db.article.create({ data: { ...a, status: 'PUBLISHED' } })
  }
  console.log(`✅ ${articles.length} articles created`)

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
