import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Noto_Sans, Noto_Sans_Devanagari, Noto_Sans_Tamil, Noto_Sans_Telugu } from "next/font/google";
import { ReactNode } from "react";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import "@/app/globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-devanagari",
  display: "swap",
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-tamil",
  display: "swap",
});

const notoTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-telugu",
  display: "swap",
});

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: {
      default: "Sahayak — Government Schemes & Legal Rights for India",
      template: "%s | Sahayak",
    },
    description: t("hero_subtitle"),
    keywords: ["government schemes", "India", "legal rights", "RTI", "PM Kisan", "Ayushman Bharat"],
    openGraph: {
      title: "Sahayak",
      description: t("hero_subtitle"),
      type: "website",
      locale: locale,
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  const fontVars = [
    notoSans.variable,
    notoDevanagari.variable,
    notoTamil.variable,
    notoTelugu.variable,
  ].join(" ");

  return (
    <html lang={locale} className={fontVars}>
      <body className="min-h-screen flex flex-col bg-surface">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileNav />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
