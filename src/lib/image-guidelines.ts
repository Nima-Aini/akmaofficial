export const IMAGE_GUIDELINES = {
  product: {
    width: 1200,
    height: 1200,
    ratio: "1:1",
    fit: "contain",
    usage: "نمایش کامل محصول در دسکتاپ و موبایل؛ اطراف سوژه کمی فضای خالی بگذارید.",
  },
  hero: {
    width: 1500,
    height: 1200,
    ratio: "5:4",
    fit: "cover",
    usage: "در قاب ۵:۴ نمایش داده و لبه‌ها ممکن است اندکی برش بخورند؛ سوژه را وسط نگه دارید.",
  },
  banner: {
    width: 1200,
    height: 900,
    ratio: "4:3",
    fit: "cover",
    usage: "در موبایل و دسکتاپ با برش کنترل‌شده نمایش داده می‌شود؛ متن را داخل خود تصویر نگذارید.",
  },
  blogCover: {
    width: 1600,
    height: 900,
    ratio: "16:9",
    fit: "cover",
    usage: "کاور مقاله در فهرست و صفحه مطلب؛ سوژه اصلی را در مرکز امن تصویر قرار دهید.",
  },
  blogInline: {
    width: 1400,
    height: 933,
    ratio: "3:2",
    fit: "contain",
    usage: "داخل متن با عرض کامل و بدون کشیدگی نمایش داده می‌شود.",
  },
} as const;

export type ImageGuidelineKey = keyof typeof IMAGE_GUIDELINES;
