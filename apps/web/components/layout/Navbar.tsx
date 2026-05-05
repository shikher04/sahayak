"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home, LayoutGrid, Scale, ShieldCheck, MessageCircle, User,
  Globe, Menu, X, LogIn, ChevronDown,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const LOCALES: { code: string; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
];

/** Replaces the locale segment in the current pathname. */
function switchLocale(currentPath: string, currentLocale: string, newLocale: string): string {
  return currentPath.replace(`/${currentLocale}`, `/${newLocale}`);
}

function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost text-sm gap-1.5"
        aria-label="Switch language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{current.native}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-lg z-40 py-1 max-h-80 overflow-y-auto">
            {LOCALES.map((l) => (
              <Link
                key={l.code}
                href={switchLocale(pathname, locale, l.code)}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  l.code === locale ? "text-saffron font-semibold" : "text-gray-700"
                }`}
              >
                <span>{l.native}</span>
                <span className="text-xs text-gray-400">{l.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  const links = [
    { href: `/${locale}`, label: t("home"), icon: <Home className="w-4 h-4" /> },
    { href: `/${locale}/schemes`, label: t("schemes"), icon: <LayoutGrid className="w-4 h-4" /> },
    { href: `/${locale}/rights`, label: t("rights"), icon: <Scale className="w-4 h-4" /> },
    { href: `/${locale}/eligibility`, label: t("eligibility"), icon: <ShieldCheck className="w-4 h-4" /> },
    { href: `/${locale}/chat`, label: t("chat"), icon: <MessageCircle className="w-4 h-4" /> },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">🇮🇳</span>
            <span className="text-gray-900">
              Sahayak
              <span className="text-saffron">.</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-orange-50 text-saffron"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {session ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href={`/${locale}/profile`} className="btn-ghost">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("profile")}</span>
                </Link>
                <button onClick={() => signOut()} className="btn-ghost text-gray-500">
                  {t("logout")}
                </button>
              </div>
            ) : (
              <Link href={`/${locale}/login`} className="hidden md:flex btn-primary">
                <LogIn className="w-4 h-4" />
                {t("login")}
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden btn-ghost"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 animate-fade-in">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-orange-50 text-saffron"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2">
              {session ? (
                <>
                  <Link
                    href={`/${locale}/profile`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700"
                  >
                    <User className="w-4 h-4" />
                    {t("profile")}
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-500 w-full"
                  >
                    {t("logout")}
                  </button>
                </>
              ) : (
                <Link
                  href={`/${locale}/login`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-saffron"
                >
                  <LogIn className="w-4 h-4" />
                  {t("login")}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
