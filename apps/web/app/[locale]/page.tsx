import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Search, ShieldCheck, MessageCircle, Scale, LayoutGrid, ArrowRight, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: t("hero_title") };
}

function HeroStats() {
  const t = useTranslations("home");
  return (
    <div className="flex flex-wrap justify-center gap-8 mt-10">
      {[
        { value: "1,200+", label: t("stats_schemes") },
        { value: "10", label: t("stats_languages") },
        { value: "28", label: t("stats_states") },
      ].map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="text-3xl font-bold text-saffron">{stat.value}</div>
          <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function QuickActions() {
  const t = useTranslations("home");
  const actions = [
    {
      href: "/eligibility",
      icon: <ShieldCheck className="w-6 h-6" />,
      title: t("action_eligibility"),
      desc: t("action_eligibility_desc"),
      color: "from-green-50 to-emerald-50 border-green-100",
      iconColor: "text-green-600 bg-green-100",
    },
    {
      href: "/chat",
      icon: <MessageCircle className="w-6 h-6" />,
      title: t("action_chat"),
      desc: t("action_chat_desc"),
      color: "from-orange-50 to-amber-50 border-orange-100",
      iconColor: "text-orange-600 bg-orange-100",
    },
    {
      href: "/rights",
      icon: <Scale className="w-6 h-6" />,
      title: t("action_rights"),
      desc: t("action_rights_desc"),
      color: "from-blue-50 to-indigo-50 border-blue-100",
      iconColor: "text-blue-600 bg-blue-100",
    },
    {
      href: "/schemes",
      icon: <LayoutGrid className="w-6 h-6" />,
      title: t("action_schemes"),
      desc: t("action_schemes_desc"),
      color: "from-purple-50 to-violet-50 border-purple-100",
      iconColor: "text-purple-600 bg-purple-100",
    },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">
          {t("quick_actions_title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`card p-6 bg-gradient-to-br ${action.color} border flex flex-col gap-4 group animate-fade-in`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.iconColor}`}>
                {action.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-saffron transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{action.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-saffron group-hover:translate-x-1 transition-all mt-auto" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-20 px-4">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 bg-saffron rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-india-green rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-orange-200 text-sm text-orange-600 font-medium mb-6 shadow-sm">
            <TrendingUp className="w-4 h-4" />
            AI-Powered Government Scheme Discovery
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            {t("hero_title")}
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("hero_subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                className="input pl-12 py-4 text-base shadow-sm"
              />
            </div>
            <Link href="/chat" className="btn-primary px-8 py-4 text-base whitespace-nowrap">
              <MessageCircle className="w-5 h-5" />
              {t("search_button")}
            </Link>
          </div>

          <HeroStats />
        </div>
      </section>

      <QuickActions />

      {/* Trust section */}
      <section className="bg-india-green py-12 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Trusted, Accurate, Multilingual</h2>
          <p className="text-green-100 max-w-xl mx-auto">
            Information sourced directly from official government portals. AI responses cite
            specific scheme names and article numbers.
          </p>
        </div>
      </section>
    </div>
  );
}
