"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Scale, ShieldCheck, MessageCircle } from "lucide-react";

export function MobileNav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const links = [
    { href: `/${locale}`, label: t("home"), icon: Home },
    { href: `/${locale}/schemes`, label: t("schemes"), icon: LayoutGrid },
    { href: `/${locale}/eligibility`, label: t("eligibility"), icon: ShieldCheck },
    { href: `/${locale}/chat`, label: t("chat"), icon: MessageCircle },
    { href: `/${locale}/rights`, label: t("rights"), icon: Scale },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors ${
                active ? "text-saffron" : "text-gray-400"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-saffron rounded-b-full" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
              <span className={`text-[10px] font-medium leading-none ${active ? "text-saffron" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
