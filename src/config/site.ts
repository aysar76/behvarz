export const siteConfig = {
  name: "هم‌بهورز",
  tagline: "خانه حرفه‌ای بهورزان",
  description: "شبکه حرفه‌ای، یادگیری و هم‌افزایی بهورزان و مراقبین سلامت",
};

export type NavItem = {
  label: string;
  href: string;
  disabled?: boolean;
};

export const mainNav: NavItem[] = [
  { label: "خانه", href: "/" },
  { label: "اتاق مسئله", href: "/problems" },
  { label: "بانک تجربه", href: "/experiences" },
  { label: "کشف دانش", href: "/discover" },
  { label: "حلقه‌های همیار", href: "/circles" },
  { label: "آکادمی", href: "/academy" },
  { label: "مزایا", href: "/benefits" },
  { label: "خوراک حرفه‌ای", href: "/feed" },
  { label: "پروفایل", href: "/me" },
];
