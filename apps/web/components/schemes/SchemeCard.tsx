"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  Building2, FileText, ExternalLink, MessageCircle, ChevronDown, ChevronUp,
  Sprout, Heart, Home, GraduationCap, Briefcase, PiggyBank, CreditCard,
  Shield, Users, Landmark, ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import type { Scheme } from "@/lib/api";

const CATEGORY_META: Record<string, { color: string; icon: React.ReactNode; badge: string }> = {
  agriculture: {
    color: "bg-green-50 border-green-100",
    icon: <Sprout className="w-4 h-4 text-green-600" />,
    badge: "badge-green",
  },
  health: {
    color: "bg-red-50 border-red-100",
    icon: <Heart className="w-4 h-4 text-red-500" />,
    badge: "badge-blue",
  },
  housing: {
    color: "bg-orange-50 border-orange-100",
    icon: <Home className="w-4 h-4 text-orange-600" />,
    badge: "badge-orange",
  },
  education: {
    color: "bg-purple-50 border-purple-100",
    icon: <GraduationCap className="w-4 h-4 text-purple-600" />,
    badge: "badge-purple",
  },
  employment: {
    color: "bg-blue-50 border-blue-100",
    icon: <Briefcase className="w-4 h-4 text-blue-600" />,
    badge: "badge-blue",
  },
  savings: {
    color: "bg-teal-50 border-teal-100",
    icon: <PiggyBank className="w-4 h-4 text-teal-600" />,
    badge: "badge-green",
  },
  loan: {
    color: "bg-amber-50 border-amber-100",
    icon: <CreditCard className="w-4 h-4 text-amber-600" />,
    badge: "badge-orange",
  },
  insurance: {
    color: "bg-indigo-50 border-indigo-100",
    icon: <Shield className="w-4 h-4 text-indigo-600" />,
    badge: "badge-blue",
  },
  welfare: {
    color: "bg-pink-50 border-pink-100",
    icon: <Users className="w-4 h-4 text-pink-600" />,
    badge: "badge-purple",
  },
  pension: {
    color: "bg-slate-50 border-slate-100",
    icon: <Landmark className="w-4 h-4 text-slate-600" />,
    badge: "badge-orange",
  },
};

const DEFAULT_META = {
  color: "bg-gray-50 border-gray-100",
  icon: <FileText className="w-4 h-4 text-gray-500" />,
  badge: "badge-blue",
};

interface SchemeCardProps {
  scheme: Scheme;
}

export function SchemeCard({ scheme }: SchemeCardProps) {
  const t = useTranslations("schemes");
  const locale = useLocale();
  const [docsExpanded, setDocsExpanded] = useState(false);
  const meta = CATEGORY_META[scheme.category] ?? DEFAULT_META;

  const levelLabel = scheme.level === "central"
    ? t("common_central", { defaultValue: "Central" })
    : (scheme.state_code ?? "State");

  return (
    <div className="card flex flex-col gap-0 overflow-hidden group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Coloured top strip with icon + category */}
      <div className={`px-5 pt-4 pb-3 ${meta.color} border-b`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            {meta.icon}
          </div>
          <span className={`${meta.badge} flex-shrink-0`}>
            {t(`categories.${scheme.category}` as keyof ReturnType<typeof t>)}
          </span>
          <span className="text-xs text-gray-400 font-medium bg-white px-2 py-0.5 rounded-full shadow-sm ml-auto flex-shrink-0">
            {levelLabel}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-3 flex flex-col gap-3 flex-1">
        {/* Benefit amount — prominent, full width */}
        {scheme.benefit_amount && (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-gray-500">{t("benefit")}</span>
            <span className="text-base font-bold text-saffron break-words">{scheme.benefit_amount}</span>
          </div>
        )}

        {/* Name */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-saffron transition-colors">
          {scheme.name}
        </h3>

        {/* Ministry */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{scheme.ministry}</span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {scheme.description}
        </p>

        {/* Documents */}
        {scheme.required_documents.length > 0 && (
          <div>
            <button
              onClick={() => setDocsExpanded((e) => !e)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              {t("documents_required")} ({scheme.required_documents.length})
              {docsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {docsExpanded && (
              <ul className="mt-2 space-y-1">
                {scheme.required_documents.map((doc) => (
                  <li key={doc as string} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {doc as string}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Actions — always at bottom */}
      <div className="px-5 pb-4 flex gap-2 mt-auto pt-2 border-t border-gray-50">
        <Link
          href={`/${locale}/chat?scheme=${encodeURIComponent(scheme.name)}`}
          className="btn-secondary flex-1 justify-center text-xs py-2"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {t("ask_ai")}
        </Link>
        {scheme.application_url ? (
          <a
            href={scheme.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 justify-center text-xs py-2"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            {t("apply_now")}
          </a>
        ) : (
          <button className="btn-secondary flex-1 justify-center text-xs py-2 opacity-40 cursor-not-allowed">
            <ExternalLink className="w-3.5 h-3.5" />
            {t("apply_now")}
          </button>
        )}
      </div>
    </div>
  );
}

export function SchemeCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-14 bg-gray-100 border-b border-gray-100" />
      <div className="px-5 pt-4 pb-4 flex flex-col gap-3">
        <div className="h-5 w-20 bg-gray-100 rounded" />
        <div className="h-5 w-full bg-gray-100 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 rounded" />
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-4/5 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="px-5 pb-4 flex gap-2 border-t border-gray-50 pt-2">
        <div className="h-8 flex-1 bg-gray-100 rounded-xl" />
        <div className="h-8 flex-1 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}
