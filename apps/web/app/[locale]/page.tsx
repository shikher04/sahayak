import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  Search, ShieldCheck, MessageCircle, Scale, LayoutGrid, ArrowRight,
  TrendingUp, Sprout, Heart, Home as HomeIcon, GraduationCap, Briefcase,
  Landmark, Users, ArrowUpRight, ChevronRight,
} from "lucide-react";
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
  const stats = [
    { value: "1,200+", label: t("stats_schemes"), icon: "📋" },
    { value: "10", label: t("stats_languages"), icon: "🗣️" },
    { value: "28", label: t("stats_states"), icon: "🗺️" },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-6 mt-12">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-sm border border-orange-100">
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className="text-2xl font-bold text-saffron">{stat.value}</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">{stat.label}</div>
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
      gradient: "from-emerald-500 to-green-400",
      bg: "from-green-50 to-emerald-50 border-green-100",
    },
    {
      href: "/chat",
      icon: <MessageCircle className="w-6 h-6" />,
      title: t("action_chat"),
      desc: t("action_chat_desc"),
      gradient: "from-orange-500 to-amber-400",
      bg: "from-orange-50 to-amber-50 border-orange-100",
    },
    {
      href: "/rights",
      icon: <Scale className="w-6 h-6" />,
      title: t("action_rights"),
      desc: t("action_rights_desc"),
      gradient: "from-blue-500 to-indigo-400",
      bg: "from-blue-50 to-indigo-50 border-blue-100",
    },
    {
      href: "/schemes",
      icon: <LayoutGrid className="w-6 h-6" />,
      title: t("action_schemes"),
      desc: t("action_schemes_desc"),
      gradient: "from-purple-500 to-violet-400",
      bg: "from-purple-50 to-violet-50 border-purple-100",
    },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {t("quick_actions_title")}
        </h2>
        <p className="text-center text-gray-400 text-sm mb-10">
          Everything you need in one place
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`card p-6 bg-gradient-to-br ${action.bg} border flex flex-col gap-4 group hover:-translate-y-1 transition-all duration-200`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-sm`}>
                {action.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-saffron transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{action.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-saffron transition-colors">
                Get started
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const SCHEME_CATEGORIES = [
  { key: "agriculture", label: "Agriculture", icon: <Sprout className="w-5 h-5" />, color: "text-green-600 bg-green-50" },
  { key: "health", label: "Health", icon: <Heart className="w-5 h-5" />, color: "text-red-500 bg-red-50" },
  { key: "housing", label: "Housing", icon: <HomeIcon className="w-5 h-5" />, color: "text-orange-600 bg-orange-50" },
  { key: "education", label: "Education", icon: <GraduationCap className="w-5 h-5" />, color: "text-purple-600 bg-purple-50" },
  { key: "employment", label: "Employment", icon: <Briefcase className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
  { key: "welfare", label: "Welfare", icon: <Users className="w-5 h-5" />, color: "text-pink-600 bg-pink-50" },
  { key: "pension", label: "Pension", icon: <Landmark className="w-5 h-5" />, color: "text-slate-600 bg-slate-50" },
];

function CategoryGrid() {
  return (
    <section className="py-14 px-4 bg-gray-50/60">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Browse by Category</h2>
            <p className="text-gray-400 text-sm mt-1">Find schemes relevant to you</p>
          </div>
          <Link href="/schemes" className="btn-secondary text-sm">
            All schemes
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SCHEME_CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={`/schemes?category=${cat.key}`}
              className="card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                {cat.icon}
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-800 group-hover:text-saffron transition-colors">
                  {cat.label}
                </span>
              </div>
            </Link>
          ))}
          <Link
            href="/schemes"
            className="card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200 group border-dashed"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-gray-400 bg-gray-50">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-gray-400 group-hover:text-saffron transition-colors">
              View all
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function TrustBanner() {
  const pillars = [
    { icon: "🔒", title: "Official Data", desc: "Sourced from myscheme.gov.in and ministry portals" },
    { icon: "🌐", title: "10 Languages", desc: "Ask questions in Hindi, Tamil, Telugu and more" },
    { icon: "🤖", title: "AI-Powered", desc: "RAG pipeline with cited sources for every answer" },
    { icon: "📱", title: "Mobile First", desc: "Works on any device, even on slow connections" },
  ];
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-india-green to-green-700 rounded-3xl p-8 md:p-12 text-white">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Built for every Indian citizen</h2>
            <p className="text-green-100 max-w-xl mx-auto text-sm leading-relaxed">
              Information from official government portals, powered by AI, available in your language.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {pillars.map((p) => (
              <div key={p.title} className="text-center">
                <div className="text-3xl mb-3">{p.icon}</div>
                <div className="font-semibold text-sm mb-1">{p.title}</div>
                <div className="text-green-200 text-xs leading-relaxed">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="py-12 px-4 bg-gradient-to-r from-orange-50 to-amber-50 border-y border-orange-100">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Not sure where to start?</h2>
        <p className="text-gray-500 text-sm mb-6">
          Answer 4 quick questions and we&apos;ll show you all the schemes you qualify for.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/eligibility" className="btn-primary px-8 py-3">
            <ShieldCheck className="w-4 h-4" />
            Check My Eligibility
          </Link>
          <Link href="/chat" className="btn-secondary px-8 py-3">
            <MessageCircle className="w-4 h-4" />
            Ask AI Sahayak
          </Link>
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
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-saffron/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-india-green/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-orange-200 text-sm text-orange-600 font-semibold mb-6 shadow-sm">
            <TrendingUp className="w-4 h-4" />
            AI-Powered Government Scheme Discovery
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            {t("hero_title")}
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("hero_subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <Link href="/chat" className="flex-1 relative group cursor-text">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <div className="input pl-12 py-4 text-base shadow-sm text-gray-400 bg-white cursor-text">
                {t("search_placeholder")}
              </div>
            </Link>
            <Link href="/chat" className="btn-primary px-8 py-4 text-base whitespace-nowrap shadow-sm">
              <MessageCircle className="w-5 h-5" />
              {t("search_button")}
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>Try:</span>
            {["PM Kisan", "Ayushman Bharat", "PM Awas Yojana"].map((q) => (
              <Link key={q} href={`/chat?q=${encodeURIComponent(q)}`} className="hover:text-saffron transition-colors hover:underline">
                {q}
              </Link>
            ))}
          </div>

          <HeroStats />
        </div>
      </section>

      <QuickActions />
      <CategoryGrid />
      <CTABanner />
      <TrustBanner />
    </div>
  );
}
