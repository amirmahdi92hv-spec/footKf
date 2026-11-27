export interface Ad { slot: "sidebar" | "inline"; active: boolean; title: string; text: string; cta: string; url: string; until?: string }
/** Add sponsor entries here (direct-sold banners). No third-party ad network is loaded. Set active:true to show. */
export const ADS: Ad[] = [
  { slot: "sidebar", active: false, title: "جای تبلیغ شما", text: "اینجا می‌تواند بنر اسپانسر شما باشد.", cta: "تماس بگیرید", url: "https://example.com" },
];
