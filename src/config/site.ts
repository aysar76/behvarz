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
  { label: "اتاق مسئله", href: "/problems", disabled: true },
  { label: "بانک تجربه", href: "/experiences", disabled: true },
  { label: "حلقه‌های همیار", href: "/circles", disabled: true },
  { label: "پروفایل", href: "/me" },
];
