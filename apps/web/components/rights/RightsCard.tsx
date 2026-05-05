"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Scale, ChevronDown, ChevronUp, ArrowRight, MessageCircle } from "lucide-react";
import { useState } from "react";
import type { Right } from "@/lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  fundamental_rights: "⚖️",
  statutory_rights: "📜",
  women_rights: "👩",
};

const CATEGORY_COLORS: Record<string, string> = {
  fundamental_rights: "from-blue-50 to-indigo-50 border-blue-100",
  statutory_rights: "from-green-50 to-emerald-50 border-green-100",
  women_rights: "from-pink-50 to-rose-50 border-pink-100",
};

interface RightsCardProps {
  right: Right;
}

/** Card showing a legal right with expandable article list and action steps. */
export function RightsCard({ right }: RightsCardProps) {
  const t = useTranslations("rights");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const colorClass = CATEGORY_COLORS[right.category] ?? "from-gray-50 to-slate-50 border-gray-100";
  const icon = CATEGORY_ICONS[right.category] ?? "📋";

  return (
    <div className={`card bg-gradient-to-br ${colorClass} border p-5 flex flex-col gap-4 animate-fade-in`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {t(`categories.${right.category}` as never)}
          </span>
          <h3 className="font-bold text-gray-900 mt-0.5 leading-snug">{right.title}</h3>
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">{right.description}</p>

      {/* Articles */}
      {right.articles.length > 0 && (
        <div className="bg-white/70 rounded-xl p-3">
          <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
            <Scale className="w-3 h-3" />
            {t("articles")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {right.articles.map((a) => (
              <span
                key={a.number}
                title={a.title}
                className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-600 font-medium cursor-help"
              >
                Art. {a.number}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action steps (expandable) */}
      {right.action_steps.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-saffron transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            {t("action_steps")}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {expanded && (
            <ol className="mt-2 space-y-1.5 animate-fade-in">
              {right.action_steps.map((step, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-saffron text-white text-[10px] flex items-center justify-center font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Ask AI */}
      <Link
        href={`/${locale}/chat?right=${encodeURIComponent(right.title)}`}
        className="btn-ghost text-xs text-saffron hover:bg-orange-50 justify-center mt-auto"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {t("ask_ai")}
      </Link>
    </div>
  );
}
