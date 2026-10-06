import type { TextRegionPosition } from "./text-region";

export type ThemeSettings = {
  mode: "dark" | "light";
  accent: string;
  accent2: string;
  contrast: string;
  radius: "sm" | "md" | "lg" | "full";
  buttonShape: "soft" | "pill" | "sharp";
};

export type HeroSettings = {
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  image: string;
  textRegionPosition?: TextRegionPosition;
  stats: { value: string; label: string }[];
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
  enabled: boolean;
  textRegionPosition?: TextRegionPosition;
};

export type BottomBanner = {
  id: string;
  image: string;
  href: string;
  alt: string;
  enabled: boolean;
  textRegionPosition?: TextRegionPosition;
};

export type SectionTitles = {
  whyAkmaBadge: string;
  whyAkmaTitle: string;
  whyAkmaSubtitle: string;
  categoriesBadge: string;
  categoriesTitle: string;
  categoriesSubtitle: string;
  featuredBadge: string;
  featuredTitle: string;
  featuredSubtitle: string;
  promoBadge: string;
  promoTitle: string;
  promoSubtitle: string;
  promoCtaLabel: string;
  promoCtaHref: string;
  priceTableBadge: string;
  priceTableTitle: string;
  priceTableSubtitle: string;
  stepsBadge: string;
  stepsTitle: string;
  stepsSubtitle: string;
};

export type Feature = { icon: string; title: string; desc: string };
export type PriceRow = { name: string; note: string; price: number };
export type Step = { title: string; desc: string };

export type ContactSettings = {
  phones: string[];
  email: string;
  address: string;
  hours: string;
  instagram: string;
  whatsapp: string;
  telegram: string;
  note: string;
};

export type SiteSettings = {
  name: string;
  latinName: string;
  tagline: string;
  footerText: string;
  aboutTitle: string;
  aboutText: string;
  seoTitle: string;
  seoDescription: string;
};

export type DualCardsSettings = {
  retail: {
    title: string;
    subtitle: string;
    checklist: string[];
    buttonText: string;
    buttonHref: string;
    image: string;
    textRegionPosition?: TextRegionPosition;
  };
  wholesale: {
    title: string;
    subtitle: string;
    checklist: string[];
    buttonText: string;
    buttonHref: string;
    image: string;
    textRegionPosition?: TextRegionPosition;
  };
};

export type CategoryItem = {
  key: string;
  label: string;
  image: string;
  href?: string;
  textRegionPosition?: TextRegionPosition;
};

export type WholesalePromoSettings = {
  title: string;
  subtitle: string;
  tags: string[];
  buttonText: string;
  buttonHref: string;
  image: string;
  textRegionPosition?: TextRegionPosition;
};

export const DEFAULT_THEME: ThemeSettings = {
  mode: "light",
  accent: "#9e1626",
  accent2: "#c51b2e",
  contrast: "#ffffff",
  radius: "lg",
  buttonShape: "pill",
};

export const DEFAULT_HERO: HeroSettings = {
  badge: "تولیدکننده و پخش عمده محصولات مراقبت از کفش",
  title: "مراقبت حرفه‌ای از کفش",
  highlight: "با محصولات آکما",
  subtitle: "تمیزی، دوام و زیبایی در هر قدم — فرمولاسیون اختصاصی بدون نیاز به شست‌وشو با آب و محافظت از چرم و بافت انواع کفش.",
  primaryCta: { label: "مشاهده محصولات", href: "/products" },
  secondaryCta: { label: "خرید عمده و همکاری", href: "/products?mode=wholesale" },
  image: "/images/redesign/hero.jpg",
  textRegionPosition: "right",
  stats: [
    { value: "+۱۵", label: "محصول تخصصی" },
    { value: "تک و عمده", label: "فروش مستقیم" },
    { value: "آنلاین", label: "ثبت فوری سفارش" },
    { value: "سراسری", label: "ارسال سریع تیپاکس" },
  ],
};

export const DEFAULT_DUAL_CARDS: DualCardsSettings = {
  retail: {
    title: "خرید تکی",
    subtitle: "برای مصرف شخصی",
    checklist: [
      "سفارش از ۱ عدد",
      "پرداخت سریع و امن",
      "ارسال به سراسر کشور",
      "مشاهده از اینستاگرام و ثبت سفارش",
    ],
    buttonText: "مشاهده محصولات تکی",
    buttonHref: "/products?mode=retail",
    image: "/images/redesign/retail-card.jpg",
    textRegionPosition: "right",
  },
  wholesale: {
    title: "خرید عمده",
    subtitle: "ویژه فروشگاه‌ها و همکاران",
    checklist: [
      "قیمت همکاری و تخفیف عمده",
      "مناسب برای فروشگاه‌ها و عمده‌فروشان",
      "تضمین کیفیت و تأمین پایدار",
    ],
    buttonText: "ورود به بخش خرید عمده",
    buttonHref: "/products?mode=wholesale",
    image: "/images/redesign/wholesale-boxes.jpg",
    textRegionPosition: "right",
  },
};

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    key: "foam",
    label: "تمیزکننده کفش",
    image: "/images/redesign/cat-foam.jpg",
    href: "/products?cat=foam",
    textRegionPosition: "bottom",
  },
  {
    key: "wax",
    label: "واکس و براق کننده",
    image: "/images/redesign/cat-wax.jpg",
    href: "/products?cat=wax",
    textRegionPosition: "bottom",
  },
  {
    key: "freshener",
    label: "بوگیر کفش",
    image: "/images/redesign/cat-spray.jpg",
    href: "/products?cat=freshener",
    textRegionPosition: "bottom",
  },
  {
    key: "tools",
    label: "ابزار و لوازم جانبی",
    image: "/images/redesign/cat-tools.jpg",
    href: "/products?cat=tools",
    textRegionPosition: "bottom",
  },
  {
    key: "bundle",
    label: "پک‌های ویژه",
    image: "/images/redesign/cat-packs.jpg",
    href: "/products?cat=bundle",
    textRegionPosition: "bottom",
  },
];

export const DEFAULT_WHOLESALE_PROMO: WholesalePromoSettings = {
  title: "خرید عمده با قیمت همکاری",
  subtitle: "مناسب فروشگاه‌ها، عمده‌فروشان و همکاران گرامی با صدور فاکتور رسمی و ارسال مستقیم از کارخانه",
  tags: ["قیمت ویژه همکاری", "مشاوره تخصصی", "تأمین پایدار و فوری"],
  buttonText: "ورود به کاتالوگ عمده",
  buttonHref: "/products?mode=wholesale",
  image: "/images/redesign/wholesale-banner.jpg",
  textRegionPosition: "right",
};

export const DEFAULT_MARQUEE: string[] = [
  "ثبت سفارش آنلاین سریع با تسویه‌حساب بانکی",
  "خرید تکی و مصرف شخصی با ارسال سراسری",
  "تخفیف‌های پلکانی ویژه خریدهای عمده و کارتنی",
  "ارسال سریع و مطمئن با تیپاکس و پست به سراسر ایران",
  "تولیدکننده رسمی محصولات تخصصی مراقبت از کفش آکما",
  "پشتیبانی و مشاوره تلفنی: ۰۹۰۳۳۲۵۳۰۶۵",
];

export const DEFAULT_BANNERS: Banner[] = [
  {
    id: "stand",
    title: "استند سه‌طبقه فروشگاهی آکما",
    subtitle:
      "ویترین حرفه‌ای + پرفروش‌ترین محصولات آکما در یک پکیج کامل؛ مناسب فروشگاه‌های کفش، کتانی و کیف و چرم.",
    cta: "مشاهده استند",
    href: "/products/stand-3",
    image: "/images/redesign/cat-packs.jpg",
    enabled: true,
    textRegionPosition: "right",
  },
];

export const DEFAULT_FEATURES: Feature[] = [
  {
    icon: "CreditCard",
    title: "پرداخت امن",
    desc: "درگاه معتبر بانکی و تسویه‌حساب سریع",
  },
  {
    icon: "Headphones",
    title: "پشتیبانی تخصصی",
    desc: "قبل و بعد از خرید در تمام روزهای هفته",
  },
  {
    icon: "ShieldCheck",
    title: "ضمانت اصالت",
    desc: "محصولات اصلی با فرمولاسیون اختصاصی آکما",
  },
  {
    icon: "Truck",
    title: "ارسال سریع",
    desc: "ارسال به سراسر کشور با بسته‌بندی مقاوم",
  },
];

export const DEFAULT_PRICE_TABLE: PriceRow[] = [
  {
    name: "فوم تمیزکننده کفش آکما | جعبه |",
    note: "به‌همراه فرچه و دستمال میکروفایبر",
    price: 240000,
  },
  {
    name: "خوشبوکننده کفش آکما",
    note: "۶ رایحه متنوع",
    price: 80000,
  },
  {
    name: "پولیش سفیدکننده لژ کفش آکما",
    note: "سر اسفنجی",
    price: 220000,
  },
  {
    name: "فوم تمیزکننده کفش آکما",
    note: "به‌همراه فرچه",
    price: 195000,
  },
];

export const DEFAULT_STEPS: Step[] = [
  {
    title: "انتخاب و افزودن به سبد خرید",
    desc: "محصولات مورد نظر خود را با تیراژ دلخواه به سبد خرید اضافه کنید و فاکتور آنلاین را مشاهده نمایید.",
  },
  {
    title: "تکمیل مشخصات و ثبت سفارش",
    desc: "آدرس و اطلاعات گیرنده را در صفحه تسویه‌حساب وارد کنید و سفارش خود را در چند ثانیه ثبت نمایید.",
  },
  {
    title: "دریافت کد رهگیری و ارسال",
    desc: "کد اختصاصی رهگیری مرسوله را دریافت کرده و وضعیت بسته‌بندی و ارسال با تیپاکس را لحظه‌ای پیگیری کنید.",
  },
];

export const DEFAULT_CONTACT: ContactSettings = {
  phones: ["09033253065"],
  email: "info@akmaofficial.ir",
  address: "ایران — ارسال به سراسر کشور",
  hours: "شنبه تا پنجشنبه — ۹ صبح تا ۹ شب",
  instagram: "akmaofficial.ir",
  whatsapp: "09033253065",
  telegram: "",
  note: "جهت ثبت سفارش، قیمت همکاری و مشاوره خرید عمده با شماره زیر تماس حاصل فرمایید.",
};

export const DEFAULT_SITE: SiteSettings = {
  name: "آکما",
  latinName: "AKMA",
  tagline: "مراقبت حرفه‌ای از کفش",
  footerText:
    "آکما، تولیدکننده و پخش عمده محصولات مراقبت و احیای کفش؛ همراه فروشگاه‌ها، عمده‌فروشان و پخش‌کنندگان سراسر کشور.",
  aboutTitle: "آکما؛ انتخاب فروشگاه‌های حرفه‌ای",
  aboutText:
    "آکما با تمرکز بر کیفیت، بسته‌بندی شکیل و قیمت همکاری رقابتی، مجموعه‌ای کامل از محصولات مراقبت از کفش را برای عرضه در فروشگاه‌های کفش، کتانی، کیف و چرم، کالای ورزشی و مراکز خدمات کفش تولید می‌کند. از فوم تمیزکننده بدون نیاز به آب تا خوشبوکننده ۶ رایحه و پولیش سفیدکننده لژ؛ همه‌ی آنچه برای یک ویترین حرفه‌ای نیاز دارید.",
  seoTitle: "آکما | محصولات مراقبت از کفش — فوم، خوشبوکننده و پولیش (عمده)",
  seoDescription:
    "فروش عمده فوم تمیزکننده کفش، خوشبوکننده کفش و پولیش سفیدکننده لژ آکما با قیمت همکاری. ارسال به سراسر کشور. سفارش تلفنی: ۰۹۰۳۳۲۵۳۰۶۵",
};

export const DEFAULT_BOTTOM_BANNERS: BottomBanner[] = [
  {
    id: "bottom-banner-1",
    image: "/images/craft.png",
    href: "/products",
    alt: "محصولات مراقبت از کفش آکما",
    enabled: true,
    textRegionPosition: "bottom",
  },
];

export const DEFAULT_SECTION_TITLES: SectionTitles = {
  whyAkmaBadge: "چرا آکما؟",
  whyAkmaTitle: "آکما؛ انتخاب فروشگاه‌های حرفه‌ای",
  whyAkmaSubtitle:
    "آکما با تمرکز بر کیفیت، بسته‌بندی شکیل و قیمت همکاری رقابتی، مجموعه‌ای کامل از محصولات مراقبت از کفش را برای عرضه در فروشگاه‌های کفش، کتانی، کیف و چرم، کالای ورزشی و مراکز خدمات کفش تولید می‌کند.",
  categoriesBadge: "دسته‌بندی‌ها",
  categoriesTitle: "هر آنچه ویترین شما نیاز دارد",
  categoriesSubtitle: "انواع فوم تمیزکننده، خوشبوکننده، پولیش و استندهای اختصاصی",
  featuredBadge: "منتخب فروشگاه",
  featuredTitle: "محصولات ویژه آکما",
  featuredSubtitle: "پرفروش‌ترین و محبوب‌ترین اقلام جهت ویترین فروشگاهی شما",
  promoBadge: "پیشنهاد آکما",
  promoTitle: "پیشنهادات و استندهای ویژه",
  promoSubtitle: "پکیج‌های فروشگاهی آماده برای افزایش سودآوری",
  promoCtaLabel: "مشاهده همه محصولات",
  promoCtaHref: "/products",
  priceTableBadge: "شفافیت قیمت",
  priceTableTitle: "قیمت واحد محصولات",
  priceTableSubtitle: "قیمت‌های خرده‌فروشی پیشنهادی؛ برای قیمت همکاری و خرید عمده تماس بگیرید یا آنلاین سفارش دهید.",
  stepsBadge: "سفارش آسان",
  stepsTitle: "سفارش در چند قدم ساده",
  stepsSubtitle: "امکان ثبت سفارش آنلاین از طریق سبد خرید و یا تماس مستقیم تلفنی",
};

export const DEFAULT_SETTINGS: Record<string, unknown> = {
  theme: DEFAULT_THEME,
  hero: DEFAULT_HERO,
  dualCards: DEFAULT_DUAL_CARDS,
  categories: DEFAULT_CATEGORIES,
  wholesalePromo: DEFAULT_WHOLESALE_PROMO,
  marquee: DEFAULT_MARQUEE,
  banners: DEFAULT_BANNERS,
  bottomBanners: DEFAULT_BOTTOM_BANNERS,
  sectionTitles: DEFAULT_SECTION_TITLES,
  features: DEFAULT_FEATURES,
  priceTable: DEFAULT_PRICE_TABLE,
  steps: DEFAULT_STEPS,
  contact: DEFAULT_CONTACT,
  site: DEFAULT_SITE,
};

export type ProductSeed = {
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  features: string[];
  contents: string[];
  price: number;
  retailPrice?: number;
  retailUnitLabel?: string;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  wholesalePackSize?: number | null;
  wholesalePackLabel?: string;
  wholesaleMinPackQty?: number | null;
  wholesaleTiers?: { minQty: number; price: number; label?: string }[];
  isRetail?: boolean;
  isWholesale?: boolean;
  unitPrice: string;
  category: string;
  categoryLabel: string;
  images: string[];
  retailImages?: string[];
  wholesaleImages?: string[];
  cardTextRegionPosition?: TextRegionPosition;
  badge: string;
  featured: boolean;
  sortOrder: number;
};

export const CATEGORIES = [
  { key: "all", label: "همه محصولات" },
  { key: "foam", label: "تمیزکننده کفش" },
  { key: "wax", label: "واکس و براق کننده" },
  { key: "freshener", label: "بوگیر کفش" },
  { key: "tools", label: "ابزار و لوازم جانبی" },
  { key: "bundle", label: "پک‌های ویژه و استند" },
];

export const PRODUCT_SEEDS: ProductSeed[] = [
  {
    name: "فوم تمیزکننده کفش آکما",
    slug: "foam-cleaner-retail",
    subtitle: "فرمولاسیون اختصاصی بدون نیاز به آب — همراه فرچه و دستمال میکروفایبر",
    description: `فوم تمیزکننده تخصصی کفش آکما، راهکاری نوین، سریع و بدون نیاز به شست‌وشو با آب برای تمیزی و احیای انواع کفش‌های کتانی، ورزشی، چرمی، پارچه‌ای و جیر است. با قدرت پاک‌کنندگی عمیق، جرم‌ها و آلودگی‌ها را بدون آسیب به بافت کفش از بین می‌برد.

• مناسب مصرف شخصی و روزمره
• بدون نیاز به آبکشی و شست‌وشو
• حفظ رنگ، نرمی و بافت کفش
• همراه با فرچه تخصصی و دستمال میکروفایبر
• امکان خرید تکی با تحویل سریع سراسری و همچنین خرید عمده کارتنی با قیمت همکاری`,
    features: [
      "قدرت پاک‌کنندگی فوق‌العاده بدون نیاز به آب",
      "مناسب انواع کفش کتانی، اسپرت، چرمی و پارچه‌ای",
      "همراه با فرچه تخصصی و دستمال میکروفایبر",
      "افزایش دوام و تازگی کفش در کمترین زمان",
    ],
    contents: ["فوم تمیزکننده آکما (۲۵۰ میلی‌لیتر)", "فرچه مخصوص", "دستمال میکروفایبر"],
    price: 298000,
    retailPrice: 298000,
    wholesalePrice: 195000,
    wholesaleMinQty: 6,
    wholesaleTiers: [
      { minQty: 6, price: 195000, label: "۶ تا ۱۱ عدد (همکاری)" },
      { minQty: 12, price: 185000, label: "۱۲ تا ۲۳ عدد (بسته کامل)" },
      { minQty: 24, price: 175000, label: "۲۴ عدد به بالا (کارتن عمده)" },
    ],
    isRetail: true,
    isWholesale: true,
    unitPrice: "۲۹۸٬۰۰۰ تومان",
    category: "foam",
    categoryLabel: "تمیزکننده کفش",
    images: ["/images/redesign/cat-foam.jpg", "/images/redesign/hero.jpg"],
    badge: "پرفروش",
    featured: true,
    sortOrder: 1,
  },
  {
    name: "اسپری بوگیر کفش آکما",
    slug: "shoe-deodorant-spray",
    subtitle: "از بین برنده قطعی بوی نامطبوع و باکتری با رایحه ماندگار",
    description: `اسپری خوشبوکننده و ضدعفونی‌کننده کفش آکما با فرمولاسیون آنتی‌باکتریال، بوی نامطبوع ناشی از تعریق را کاملاً خنثی کرده و رایحه‌ای ملایم و باطراوت ایجاد می‌کند.

• خنثی‌سازی باکتری‌ها و عوامل بوی بد
• ماندگاری بالا در کفش‌های روزمره و ورزشی
• قابل استفاده برای انواع کفش، کتانی و کمد کفش
• امکان خرید تکی برای مصرف شخصی یا سفارش عمده کارتنی ۳۰ عددی`,
    features: [
      "آنتی‌باکتریال و ضدعفونی‌کننده فضای داخلی کفش",
      "رایحه مطبوع و بسیار ماندگار",
      "استفاده آسان با اسپری ۳۶۰ درجه",
    ],
    contents: ["اسپری خوشبوکننده کفش آکما (۱۵۰ میلی‌لیتر)"],
    price: 218000,
    retailPrice: 218000,
    wholesalePrice: 80000,
    wholesaleMinQty: 6,
    wholesaleTiers: [
      { minQty: 6, price: 85000, label: "۶ تا ۲۹ عدد (همکاری)" },
      { minQty: 30, price: 80000, label: "۳۰ عدد (کارتن کامل)" },
      { minQty: 60, price: 75000, label: "۶۰ عدد به بالا (عمده پخش)" },
    ],
    isRetail: true,
    isWholesale: true,
    unitPrice: "۲۱۸٬۰۰۰ تومان",
    category: "freshener",
    categoryLabel: "بوگیر کفش",
    images: ["/images/redesign/cat-spray.jpg"],
    badge: "پرفروش",
    featured: true,
    sortOrder: 2,
  },
  {
    name: "واکس سفید کننده لژ آکما",
    slug: "sole-whitener-polish",
    subtitle: "احیای سریع لژهای زرد و کدر شده انواع کتانی و کفش اسپرت",
    description: `واکس و پولیش تخصصی سفیدکننده لژ آکما برای بازگرداندن رنگ سفید خالص به زیره‌ها و لژهای کدر، زرد شده و اکسید شده کتانی‌ها تولید شده است.

• اپلیکاتور اسفنجی سرخود برای استفاده بدون کثیف‌کاری
• پوشانندگی فوق‌العاده لکه‌ها و خط‌وخش‌های لژ
• خشک‌شدن سریع و بدون ایجاد ترک
• مناسب برای تمام کتانی‌ها و کفش‌های با زیره سفید`,
    features: [
      "سفیدکنندگی فوری و با دوام بالا",
      "دارای سر اسفنجی آماده استفاده",
      "مقاوم در برابر سایش و آلودگی مجدد",
    ],
    contents: ["پولیش سفیدکننده لژ با پد اسفنجی"],
    price: 248000,
    retailPrice: 248000,
    wholesalePrice: 160000,
    wholesaleMinQty: 6,
    wholesaleTiers: [
      { minQty: 6, price: 160000, label: "۶ تا ۱۱ عدد (همکاری)" },
      { minQty: 12, price: 150000, label: "۱۲ تا ۲۳ عدد (بسته)" },
      { minQty: 24, price: 140000, label: "۲۴ عدد به بالا (کارتن)" },
    ],
    isRetail: true,
    isWholesale: true,
    unitPrice: "۲۴۸٬۰۰۰ تومان",
    category: "wax",
    categoryLabel: "واکس و براق کننده",
    images: ["/images/redesign/cat-wax.jpg"],
    badge: "پرفروش",
    featured: true,
    sortOrder: 3,
  },
  {
    name: "برس تمیزکننده کفش آکما",
    slug: "shoe-cleaning-brush",
    subtitle: "فرچه چوبی با موهای متراکم برای پاک‌سازی دقیق چرم و کتانی",
    description: `برس ارگونومیک چوبی آکما با تراکم موی استاندارد، بدون ایجاد کوچک‌ترین خراشیدگی روی سطوح چرمی، کتانی یا پارچه‌ای، فوم را در تمام شیارها و بافت‌های کفش پخش کرده و لکه‌ها را پاکسازی می‌کند.

• بدنه چوب طبیعی ارگونومیک با دستگیره خوش‌دست
• موهای مقاوم و منعطف ضد ریزش
• مناسب استفاده مداوم در منزل یا کارگاه‌های کفش`,
    features: [
      "دسته چوبی ضد آب و خوش‌دست",
      "تراکم بالای موها برای تولید کف فراوان",
      "مناسب برای چرم، جیر، نوبوک و مش",
    ],
    contents: ["برس مخصوص چوبی آکما"],
    price: 298000,
    retailPrice: 298000,
    wholesalePrice: 180000,
    wholesaleMinQty: 6,
    wholesaleTiers: [
      { minQty: 6, price: 180000, label: "۶ تا ۱۱ عدد (همکاری)" },
      { minQty: 12, price: 165000, label: "۱۲ تا ۲۳ عدد (بسته)" },
      { minQty: 24, price: 150000, label: "۲۴ عدد به بالا (عمده)" },
    ],
    isRetail: true,
    isWholesale: true,
    unitPrice: "۲۹۸٬۰۰۰ تومان",
    category: "tools",
    categoryLabel: "ابزار و لوازم جانبی",
    images: ["/images/redesign/cat-tools.jpg"],
    badge: "پرفروش",
    featured: true,
    sortOrder: 4,
  },
  {
    name: "استند سه طبقه آکما",
    slug: "stand-3",
    subtitle: "استند فروشگاهی + پکیج کامل محصولات پرفروش",
    description: `استند سه‌طبقه فروشگاهی AKMA، راهکاری حرفه‌ای برای نمایش منظم و جذاب محصولات مراقبت از کفش در فروشگاه‌ها است. این استند با طراحی کاربردی و اشغال فضای کم، باعث می‌شود محصولات همیشه در معرض دید مشتری قرار بگیرند و تجربه خرید بهتری ایجاد شود.

این استند همراه با مجموعه‌ای از پرفروش‌ترین محصولات AKMA عرضه می‌شود و گزینه‌ای مناسب برای فروشگاه‌های کفش، کتونی، اسپرت، کیف و چرم، لوازم ورزشی و مراکز خدمات کفش است.

• طراحی سه‌طبقه با دسترسی آسان به محصولات
• افزایش جلوه ویترین و جلب توجه مشتری
• مناسب برای فروشگاه‌های کفش و کتونی
• اشغال فضای کم و چیدمان منظم
• معرفی هم‌زمان چند محصول پرفروش AKMA
• مناسب برای فروش عمده و نمایندگی‌ها

استند سه‌طبقه AKMA علاوه بر نظم بخشیدن به فضای فروشگاه، باعث دیده شدن بهتر محصولات و افزایش احتمال خرید توسط مشتریان می‌شود و انتخابی مناسب برای فروشگاه‌هایی است که به دنبال ارائه حرفه‌ای محصولات مراقبت و احیای کفش هستند.`,
    features: [
      "طراحی سه‌طبقه با دسترسی آسان",
      "افزایش جلوه ویترین فروشگاه",
      "اشغال فضای کم و چیدمان منظم",
      "همراه با پرفروش‌ترین محصولات آکما",
      "مناسب فروش عمده و نمایندگی‌ها",
    ],
    contents: [
      "فوم تمیزکننده کفش |جعبه| (۱۴ عدد)",
      "فوم تمیزکننده کفش (۱۵ عدد)",
      "اسپری خوشبوکننده کفش (۳۶ عدد)",
      "پولیش کفش (۱۰ عدد)",
    ],
    price: 11990000,
    unitPrice: "",
    category: "bundle",
    categoryLabel: "استند و پک فروشگاهی",
    images: ["/images/products/stand.png"],
    badge: "پیشنهاد ویژه",
    featured: true,
    sortOrder: 1,
  },
  {
    name: "فوم تمیزکننده کفش آکما |جعبه| (۱۰ عدد)",
    slug: "foam-box-10",
    subtitle: "بسته ۱۰ عددی — همراه جعبه، فرچه و دستمال",
    description: `اگر به دنبال خرید عمده فوم تمیزکننده کفش با کیفیت بالا و قیمت مناسب هستید، فوم تمیزکننده کفش آکما انتخابی ایده‌آل برای فروشگاه‌ها، عمده‌فروشان، پخش‌کنندگان، فروشندگان آنلاین و تأمین‌کنندگان لوازم مراقبت از کفش است.

قیمت واحد: ۲۴۰٫۰۰۰ تومان

مزایای خرید عمده فوم تمیزکننده کفش آکما:
• قیمت همکاری و شرایط ویژه برای خرید عمده
• مناسب برای فروشگاه‌های کفش، کیف و چرم
• حاشیه سود مناسب برای فروشندگان
• بسته‌بندی شکیل و آماده عرضه
• کیفیت بالا و استفاده آسان
• بدون نیاز به شست‌وشو با آب
• مناسب برای انواع کفش‌های چرمی، کتانی، پارچه‌ای و چرم مصنوعی

محتویات بسته: فوم تمیزکننده کفش آکما، فرچه مخصوص تمیزکاری، دستمال میکروفایبر، جعبه مقاوم و شکیل.

خرید عمده مستقیم از آکما: اگر قصد خرید عمده فوم تمیزکننده کفش را دارید، آکما امکان تأمین سفارش‌های عمده را با قیمت رقابتی و شرایط همکاری ویژه فراهم کرده است. این محصول برای فروشگاه‌های حضوری، فروشگاه‌های اینترنتی، شرکت‌های پخش و عمده‌فروشان سراسر کشور قابل سفارش است.`,
    features: [
      "شامل جعبه شکیل، فرچه و دستمال میکروفایبر",
      "بدون نیاز به شست‌وشو با آب",
      "مناسب انواع کفش چرمی، کتانی و پارچه‌ای",
      "بسته‌بندی آماده عرضه در فروشگاه",
      "قیمت همکاری ویژه خرید عمده",
    ],
    contents: [
      "فوم تمیزکننده کفش آکما (۱۰ عدد)",
      "فرچه مخصوص تمیزکاری",
      "دستمال میکروفایبر",
      "جعبه مقاوم و شکیل",
    ],
    price: 2400000,
    unitPrice: "قیمت واحد: ۲۴۰٫۰۰۰ تومان",
    category: "foam",
    categoryLabel: "فوم تمیزکننده",
    images: ["/images/products/foam-box.png"],
    badge: "پرفروش",
    featured: true,
    sortOrder: 2,
  },
  {
    name: "فوم تمیزکننده کفش آکما (۱۰ عدد)",
    slug: "foam-10",
    subtitle: "بسته ۱۰ عددی — همراه فرچه",
    description: `اگر به دنبال خرید عمده فوم تمیزکننده کفش با کیفیت بالا و قیمت مناسب هستید، فوم تمیزکننده کفش آکما انتخابی ایده‌آل برای فروشگاه‌ها، عمده‌فروشان، پخش‌کنندگان، فروشندگان آنلاین و تأمین‌کنندگان لوازم مراقبت از کفش است.

قیمت واحد: ۱۹۵٫۰۰۰ تومان

مزایای خرید عمده فوم تمیزکننده کفش آکما:
• قیمت همکاری و شرایط ویژه برای خرید عمده
• مناسب برای فروشگاه‌های کفش، کیف و چرم
• حاشیه سود مناسب برای فروشندگان
• کیفیت بالا و استفاده آسان
• بدون نیاز به شست‌وشو با آب
• مناسب برای انواع کفش‌های چرمی، کتانی، پارچه‌ای و چرم مصنوعی`,
    features: [
      "همراه با فرچه مخصوص",
      "بدون نیاز به شست‌وشو با آب",
      "مناسب انواع کفش چرمی، کتانی و پارچه‌ای",
      "کیفیت بالا و استفاده آسان",
      "حاشیه سود مناسب فروشندگان",
    ],
    contents: [],
    price: 1950000,
    unitPrice: "قیمت واحد: ۱۹۵٫۰۰۰ تومان",
    category: "foam",
    categoryLabel: "فوم تمیزکننده",
    images: ["/images/products/foam-bottle.png"],
    badge: "",
    featured: false,
    sortOrder: 3,
  },
  {
    name: "فوم تمیزکننده کفش آکما (۲۰ عدد)",
    slug: "foam-20",
    subtitle: "بسته ۲۰ عددی — همراه فرچه",
    description: `اگر به دنبال خرید عمده فوم تمیزکننده کفش با کیفیت بالا و قیمت مناسب هستید، فوم تمیزکننده کفش آکما انتخابی ایده‌آل برای فروشگاه‌ها، عمده‌فروشان، پخش‌کنندگان، فروشندگان آنلاین و تأمین‌کنندگان لوازم مراقبت از کفش است.

قیمت واحد: ۱۹۵٫۰۰۰ تومان

مزایای خرید عمده فوم تمیزکننده کفش آکما:
• قیمت همکاری و شرایط ویژه برای خرید عمده
• مناسب برای فروشگاه‌های کفش، کیف و چرم
• حاشیه سود مناسب برای فروشندگان
• کیفیت بالا و استفاده آسان
• بدون نیاز به شست‌وشو با آب
• مناسب برای انواع کفش‌های چرمی، کتانی، پارچه‌ای و چرم مصنوعی`,
    features: [
      "بسته اقتصادی ۲۰ عددی",
      "همراه با فرچه مخصوص",
      "بدون نیاز به شست‌وشو با آب",
      "مناسب انواع کفش چرمی، کتانی و پارچه‌ای",
      "قیمت همکاری ویژه خرید عمده",
    ],
    contents: [],
    price: 3900000,
    unitPrice: "قیمت واحد: ۱۹۵٫۰۰۰ تومان",
    category: "foam",
    categoryLabel: "فوم تمیزکننده",
    images: ["/images/products/foam-bottle.png"],
    badge: "اقتصادی",
    featured: false,
    sortOrder: 4,
  },
  {
    name: "فوم تمیزکننده کفش آکما |جعبه| (۲۰ عدد)",
    slug: "foam-box-20",
    subtitle: "بسته ۲۰ عددی — همراه جعبه، فرچه و دستمال",
    description: `اگر به دنبال خرید عمده فوم تمیزکننده کفش با کیفیت بالا و قیمت مناسب هستید، فوم تمیزکننده کفش آکما انتخابی ایده‌آل برای فروشگاه‌ها، عمده‌فروشان، پخش‌کنندگان، فروشندگان آنلاین و تأمین‌کنندگان لوازم مراقبت از کفش است.

قیمت واحد: ۲۴۰٫۰۰۰ تومان

مزایای خرید عمده فوم تمیزکننده کفش آکما:
• قیمت همکاری و شرایط ویژه برای خرید عمده
• مناسب برای فروشگاه‌های کفش، کیف و چرم
• حاشیه سود مناسب برای فروشندگان
• بسته‌بندی شکیل و آماده عرضه
• کیفیت بالا و استفاده آسان
• بدون نیاز به شست‌وشو با آب
• مناسب برای انواع کفش‌های چرمی، کتانی، پارچه‌ای و چرم مصنوعی

محتویات بسته: فوم تمیزکننده کفش آکما، فرچه مخصوص تمیزکاری، دستمال میکروفایبر، جعبه مقاوم و شکیل.`,
    features: [
      "بسته عمده ۲۰ عددی",
      "شامل جعبه شکیل، فرچه و دستمال میکروفایبر",
      "بدون نیاز به شست‌وشو با آب",
      "بسته‌بندی آماده عرضه در فروشگاه",
      "قیمت همکاری ویژه خرید عمده",
    ],
    contents: [
      "فوم تمیزکننده کفش آکما (۲۰ عدد)",
      "فرچه مخصوص تمیزکاری",
      "دستمال میکروفایبر",
      "جعبه مقاوم و شکیل",
    ],
    price: 4800000,
    unitPrice: "قیمت واحد: ۲۴۰٫۰۰۰ تومان",
    category: "foam",
    categoryLabel: "فوم تمیزکننده",
    images: ["/images/products/foam-box.png"],
    badge: "عمده",
    featured: false,
    sortOrder: 5,
  },
  {
    name: "خوشبوکننده کفش آکما (۳۰ عدد)",
    slug: "freshener-30",
    subtitle: "بسته ۳۰ عددی — ۶ رایحه متنوع",
    description: `خوشبوکننده کفش آکما محصولی کاربردی و فوق‌العاده اقتصادی برای از بین بردن بوی نامطبوع انواع کفش و ایجاد رایحه‌ای دلپذیر و ماندگار است. این محصول با فرمولاسیون ویژه، به کاهش بوی ناشی از تعریق و استفاده روزانه کمک کرده و حس تازگی را در داخل کفش حفظ می‌کند.

قیمت واحد: ۸۰٫۰۰۰ تومان

ویژگی‌های خوشبوکننده کفش آکما:
• از بین بردن بوی نامطبوع کفش
• ایجاد رایحه‌ای خوش و ماندگار
• مناسب برای انواع کفش‌های ورزشی، کتانی، رسمی و روزمره
• استفاده آسان با اسپری
• مناسب برای استفاده روزانه
• کمک به ایجاد حس تازگی در داخل کفش

مناسب برای: کفش‌های ورزشی، کتانی، کفش‌های چرمی، کفش‌های اداری و رسمی، بوت و نیم‌بوت و انواع کفش‌های روزمره.

روش استفاده: قبل از استفاده از کفش، مقدار مناسبی از خوشبوکننده آکما را داخل کفش تا انتها اسپری کنید. چند دقیقه صبر کنید تا رایحه در فضای داخلی کفش پخش شود، سپس کفش را استفاده کنید.

خرید عمده خوشبوکننده کفش: اگر فروشگاه کفش، فروشگاه لوازم ورزشی یا پخش‌کننده محصولات مراقبت از کفش هستید، امکان خرید عمده خوشبوکننده کفش آکما با قیمت همکاری فراهم است. این محصول به دلیل مصرف بالا، بسته‌بندی مناسب و کیفیت مطلوب، یکی از گزینه‌های پرفروش بازار محسوب می‌شود.`,
    features: [
      "از بین بردن بوی نامطبوع کفش",
      "۶ رایحه متنوع و ماندگار",
      "مناسب انواع کفش ورزشی، کتانی و رسمی",
      "استفاده آسان با اسپری",
      "پرفروش‌ترین محصول مصرفی بازار",
    ],
    contents: [],
    price: 2400000,
    unitPrice: "قیمت واحد: ۸۰٫۰۰۰ تومان",
    category: "freshener",
    categoryLabel: "خوشبوکننده",
    images: ["/images/products/spray.png"],
    badge: "پرفروش",
    featured: true,
    sortOrder: 6,
  },
  {
    name: "خوشبوکننده کفش آکما + استند (۳۰ عدد)",
    slug: "freshener-stand-30",
    subtitle: "بسته ۳۰ عددی + استند رومیزی",
    description: `خوشبوکننده کفش آکما محصولی کاربردی و فوق‌العاده اقتصادی برای از بین بردن بوی نامطبوع انواع کفش و ایجاد رایحه‌ای دلپذیر و ماندگار است. این محصول با فرمولاسیون ویژه، به کاهش بوی ناشی از تعریق و استفاده روزانه کمک کرده و حس تازگی را در داخل کفش حفظ می‌کند.

این پک شامل ۳۰ عدد خوشبوکننده به‌همراه استند نمایشگاهی برای عرضه بهتر در فروشگاه است.

قیمت واحد: ۸۰٫۰۰۰ تومان

ویژگی‌های خوشبوکننده کفش آکما:
• از بین بردن بوی نامطبوع کفش
• ایجاد رایحه‌ای خوش و ماندگار
• مناسب برای انواع کفش‌های ورزشی، کتانی، رسمی و روزمره
• استفاده آسان با اسپری
• مناسب برای استفاده روزانه
• کمک به ایجاد حس تازگی در داخل کفش

روش استفاده: قبل از استفاده از کفش، مقدار مناسبی از خوشبوکننده آکما را داخل کفش تا انتها اسپری کنید. چند دقیقه صبر کنید تا رایحه در فضای داخلی کفش پخش شود، سپس کفش را استفاده کنید.`,
    features: [
      "شامل ۳۰ عدد خوشبوکننده + استند",
      "۶ رایحه متنوع و ماندگار",
      "نمایش حرفه‌ای در ویترین فروشگاه",
      "مناسب انواع کفش ورزشی، کتانی و رسمی",
      "قیمت همکاری ویژه خرید عمده",
    ],
    contents: ["خوشبوکننده کفش آکما (۳۰ عدد)", "استند نمایش رومیزی"],
    price: 2400000,
    unitPrice: "قیمت واحد: ۸۰٫۰۰۰ تومان",
    category: "bundle",
    categoryLabel: "استند و پک فروشگاهی",
    images: ["/images/products/spray.png"],
    badge: "",
    featured: false,
    sortOrder: 7,
  },
  {
    name: "فوم تمیزکننده کفش آکما + استند (۱۰ عدد)",
    slug: "foam-stand-10",
    subtitle: "بسته ۱۰ عددی + استند رومیزی",
    description: `اگر به دنبال خرید عمده فوم تمیزکننده کفش با کیفیت بالا و قیمت مناسب هستید، فوم تمیزکننده کفش آکما انتخابی ایده‌آل برای فروشگاه‌ها، عمده‌فروشان، پخش‌کنندگان، فروشندگان آنلاین و تأمین‌کنندگان لوازم مراقبت از کفش است.

این پک شامل ۱۰ عدد فوم تمیزکننده به‌همراه استند نمایشگاهی برای عرضه بهتر در فروشگاه است.

قیمت واحد: ۱۹۵٫۰۰۰ تومان

مزایای خرید عمده فوم تمیزکننده کفش آکما:
• قیمت همکاری و شرایط ویژه برای خرید عمده
• مناسب برای فروشگاه‌های کفش، کیف و چرم
• حاشیه سود مناسب برای فروشندگان
• کیفیت بالا و استفاده آسان
• بدون نیاز به شست‌وشو با آب
• مناسب برای انواع کفش‌های چرمی، کتانی، پارچه‌ای و چرم مصنوعی`,
    features: [
      "شامل ۱۰ عدد فوم + استند نمایشی",
      "بدون نیاز به شست‌وشو با آب",
      "نمایش حرفه‌ای در ویترین فروشگاه",
      "مناسب انواع کفش چرمی، کتانی و پارچه‌ای",
      "قیمت همکاری ویژه خرید عمده",
    ],
    contents: ["فوم تمیزکننده کفش آکما (۱۰ عدد)", "استند نمایش رومیزی"],
    price: 2000000,
    unitPrice: "قیمت واحد: ۱۹۵٫۰۰۰ تومان",
    category: "bundle",
    categoryLabel: "استند و پک فروشگاهی",
    images: ["/images/products/foam-bottle.png"],
    badge: "",
    featured: false,
    sortOrder: 8,
  },
  {
    name: "پولیش سفیدکننده لژ کفش آکما (۱۰ عدد)",
    slug: "polish-10",
    subtitle: "بسته ۱۰ عددی — سر اسفنجی",
    description: `پولیش سفیدکننده لژ کفش AKMA، راهکاری سریع برای احیای لژهای زرد و کدر انواع کفش و کتانی. با پوشش یکنواخت و استفاده آسان، ظاهر تمیز و سفید لژ را در چند دقیقه بازمی‌گرداند. مناسب فروش عمده به فروشگاه‌های کفش، کتانی و لوازم مراقبت از کفش.

قیمت واحد: ۲۲۰٫۰۰۰ تومان

پولیش سفیدکننده لژ کفش AKMA محصولی تخصصی برای بازسازی ظاهر لژهای سفید است که به مرور زمان بر اثر استفاده، آلودگی و نور خورشید زرد یا کدر شده‌اند. این محصول با ایجاد پوششی یکنواخت روی سطح لژ، رنگ سفید و تمیز را به کفش بازمی‌گرداند و باعث می‌شود کفش ظاهر نوتر و جذاب‌تری پیدا کند.

اپلیکاتور اسفنجی محصول، استفاده از آن را بسیار ساده کرده و بدون نیاز به ابزار اضافی، امکان اعمال دقیق روی لژ را فراهم می‌کند. این محصول برای انواع کتانی، کفش اسپرت و کفش‌هایی با لژ سفید مناسب بوده و گزینه‌ای پرفروش برای فروشگاه‌های کفش، کتانی، کالای ورزشی، خدمات شست‌وشوی کفش و مراکز مراقبت از کفش محسوب می‌شود.

اگر به دنبال یک محصول مکمل با حاشیه سود مناسب برای فروش عمده هستید، پولیش سفیدکننده لژ AKMA می‌تواند انتخابی کاربردی برای افزایش سبد محصولات فروشگاه شما باشد.`,
    features: [
      "احیای لژهای زرد و کدر در چند دقیقه",
      "اپلیکاتور اسفنجی، بدون نیاز به ابزار",
      "پوشش یکنواخت و ماندگار",
      "مناسب کتانی و کفش‌های لژ سفید",
      "حاشیه سود مناسب برای فروش عمده",
    ],
    contents: [],
    price: 2200000,
    unitPrice: "قیمت واحد: ۲۲۰٫۰۰۰ تومان",
    category: "polish",
    categoryLabel: "پولیش و احیا",
    images: ["/images/products/polish.png"],
    badge: "جدید",
    featured: true,
    sortOrder: 9,
  },
];
