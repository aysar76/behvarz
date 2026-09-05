import type { IconName } from "@/components/ui/icon";

export const siteConfig = {
  name: "هم‌بهورز",
  tagline: "خانه حرفه‌ای بهورزان",
  description: "شبکه حرفه‌ای، یادگیری و هم‌افزایی بهورزان و مراقبین سلامت",
};

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  disabled?: boolean;
};

export const mainNav: NavItem[] = [
  { label: "اتاق مسئله", href: "/problems", icon: "question" },
  { label: "بانک تجربه", href: "/experiences", icon: "book" },
  { label: "کشف دانش", href: "/discover", icon: "compass" },
  { label: "حلقه‌های همیار", href: "/circles", icon: "users" },
  { label: "آکادمی", href: "/academy", icon: "graduation" },
  { label: "مزایا", href: "/benefits", icon: "gift" },
  { label: "ابزارها", href: "/tools", icon: "wrench" },
  { label: "کمپین‌ها", href: "/campaigns", icon: "target" },
  { label: "خوراک حرفه‌ای", href: "/feed", icon: "feed" },
  { label: "پروفایل", href: "/me", icon: "user" },
];

export const mobileNav: NavItem[] = [
  { label: "مسئله", href: "/problems", icon: "question" },
  { label: "کشف", href: "/discover", icon: "compass" },
  { label: "حلقه‌ها", href: "/circles", icon: "users" },
  { label: "پروفایل", href: "/me", icon: "user" },
];