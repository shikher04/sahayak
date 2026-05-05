"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSchemes } from "@/lib/api";
import { SchemeCard } from "@/components/schemes/SchemeCard";
import { Filter, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const CATEGORIES = [
  "agriculture", "health", "housing", "education", "employment",
  "savings", "loan", "insurance", "welfare", "pension",
];

const LEVELS = ["central", "state"];

/** Schemes browsing page with sidebar filters and pagination. */
export default function SchemesPage() {
  const t = useTranslations("schemes");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["schemes", { category, level, page }],
    queryFn: () => fetchSchemes({ category: category || undefined, level: level || undefined, page, limit: 12 }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-2">{t("subtitle")}</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`${filtersOpen ? "block" : "hidden"} md:block w-full md:w-60 flex-shrink-0`}>
          <div className="card p-5 sticky top-24">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h3>

            {/* Category */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                {t("filter_category")}
              </label>
              <div className="space-y-1.5">
                <button
                  onClick={() => { setCategory(""); setPage(1); }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    !category ? "bg-orange-50 text-saffron font-medium" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t("filter_all")}
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setPage(1); }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors capitalize ${
                      category === c ? "bg-orange-50 text-saffron font-medium" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                {t("filter_level")}
              </label>
              <div className="space-y-1.5">
                <button
                  onClick={() => { setLevel(""); setPage(1); }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    !level ? "bg-orange-50 text-saffron font-medium" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t("filter_all")}
                </button>
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLevel(l); setPage(1); }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors capitalize ${
                      level === l ? "bg-orange-50 text-saffron font-medium" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter toggle */}
          <button
            className="md:hidden btn-secondary mb-4 w-full justify-center"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <Filter className="w-4 h-4" />
            {t("filter_category")}
          </button>

          {isLoading && (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              {t("loading")}
            </div>
          )}

          {isError && (
            <div className="text-center py-20 text-gray-500">{t("no_schemes")}</div>
          )}

          {data && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {data.total} schemes found
                </p>
              </div>

              {data.items.length === 0 ? (
                <div className="text-center py-20 text-gray-500">{t("no_schemes")}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.items.map((scheme) => (
                    <SchemeCard key={scheme.id} scheme={scheme} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary p-2 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 px-4">
                    Page {page} of {data.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page >= data.pages}
                    className="btn-secondary p-2 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
