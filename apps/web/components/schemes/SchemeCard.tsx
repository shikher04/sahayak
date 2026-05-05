"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  Building2, Tag, FileText, ExternalLink, MessageCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { Scheme } from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  agriculture: "badge-green",
  health: "badge-blue",
  housing: "badge-orange",
  education: "badge-purple",
  employment: "badge-green",
  savings: "badge-blue",
  loan: "badge-orange",
  insurance: "badge-blue",
  welfare: "badge-purple",
  pension: "badge-orange",
};

interface SchemeCardProps {
  scheme: Scheme;
}

/** Displays a single government scheme in a card layout. */
export function SchemeCard({ scheme }: SchemeCardProps) {
  const t = useTranslations("schemes");
  const locale = useLocale();
  const [docsExpanded, setDocsExpanded] = useState(false);
  const badgeClass = CATEGORY_COLORS[scheme.category] ?? "badge-blue";

  return (
    <div className="card p-5 flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={badgeClass}>
              {t(`categories.${scheme.category}` as keyof ReturnType<typeof t>)}
            </span>
            <span className="badge bg-gray-100 text-gray-600">
              {scheme.level === "central" ? t("categories.agriculture").replace("Agriculture", "") || "Central" : scheme.state_code}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 text-base leading-snug">{scheme.name}</h3>
        </div>
        {scheme.benefit_amount && (
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold text-saffron">{scheme.benefit_amount}</div>
            <div className="text-xs text-gray-400">{t("benefit")}</div>
          </div>
        )}
      </div>

      {/* Ministry */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{scheme.ministry}</span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{scheme.description}</p>

      {/* Documents */}
      {scheme.required_documents.length > 0 && (
        <div>
          <button
            onClick={() => setDocsExpanded((e) => !e)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            {t("documents_required")} ({scheme.required_documents.length})
            {docsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {docsExpanded && (
            <ul className="mt-2 space-y-1">
              {scheme.required_documents.map((doc) => (
                <li key={doc as string} className="text-xs text-gray-500 flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {doc as string}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 mt-auto">
        <Link
          href={`/${locale}/chat?scheme=${encodeURIComponent(scheme.name)}`}
          className="btn-secondary flex-1 justify-center text-xs py-2"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {t("ask_ai")}
        </Link>
        {scheme.application_url && (
          <a
            href={scheme.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 justify-center text-xs py-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t("apply_now")}
          </a>
        )}
      </div>
    </div>
  );
}
