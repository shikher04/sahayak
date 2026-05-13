"use client";

import { useTranslations } from "next-intl";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSchemes } from "@/lib/api";
import { SchemeCard, SchemeCardSkeleton } from "@/components/schemes/SchemeCard";
import { Filter, ChevronLeft, ChevronRight, Search, X, SlidersHorizontal } from "lucide-react";

const CATEGORIES = [
  "agriculture", "health", "housing", "education", "employment",
  "savings", "loan", "insurance", "welfare", "pension",
];

const LEVELS = ["central", "state"];

export default function SchemesPage() {
  const t = useTranslations("schemes");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["schemes", { category, level, page, search: debouncedSearch }],
    queryFn: () => fetchSchemes({
      category: category || undefined,
      level: level || undefined,
      page,
      limit: 12,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
  });

  const hasFilters = !!(category || level || debouncedSearch);
  const clearFilters = () => { setCategory(""); setLevel(""); setSearch(""); setDebouncedSearch(""); setPage(1); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search schemes by name, ministry, or benefit..."
          className="input pl-11 pr-10 shadow-sm"
        />
        {search && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`${filtersOpen ? "block" : "hidden"} md:block w-full md:w-56 flex-shrink-0`}>
          <div className="card p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-saffron hover:underline">
                  Clear all
                </button>
              )}
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                {t("filter_category")}
              </label>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setCategory(""); setPage(1); }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    !category ? "bg-orange-50 text-saffron font-semibold" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t("filter_all")}
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setPage(1); }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors capitalize ${
                      category === c ? "bg-orange-50 text-saffron font-semibold" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {t(`categories.${c}` as keyof ReturnType<typeof t>)}
                  </button>
                ))}
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                {t("filter_level")}
              </label>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setLevel(""); setPage(1); }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    !level ? "bg-orange-50 text-saffron font-semibold" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t("filter_all")}
                </button>
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLevel(l); setPage(1); }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors capitalize ${
                      level === l ? "bg-orange-50 text-saffron font-semibold" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {l === "central" ? "Central Govt." : "State Govt."}
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
            {filtersOpen ? "Hide Filters" : "Show Filters"}
          </button>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {category && (
                <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-orange-50 text-saffron rounded-full border border-orange-100 font-medium">
                  {t(`categories.${category}` as keyof ReturnType<typeof t>)}
                  <button onClick={() => setCategory("")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {level && (
                <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-orange-50 text-saffron rounded-full border border-orange-100 font-medium">
                  {level === "central" ? "Central Govt." : "State Govt."}
                  <button onClick={() => setLevel("")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-orange-50 text-saffron rounded-full border border-orange-100 font-medium">
                  &ldquo;{debouncedSearch}&rdquo;
                  <button onClick={() => { setSearch(""); setDebouncedSearch(""); }}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Skeleton loading */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SchemeCardSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <div className="text-center py-20 text-gray-500 card p-8">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="font-medium text-gray-700">Could not load schemes</p>
              <p className="text-sm mt-1">{t("no_schemes")}</p>
            </div>
          )}

          {data && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">{data.total.toLocaleString()}</span> schemes found
                </p>
                <p className="text-xs text-gray-400">Page {page} of {data.pages}</p>
              </div>

              {data.items.length === 0 ? (
                <div className="text-center py-20 card p-8">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-medium text-gray-700">No schemes found</p>
                  <p className="text-sm text-gray-400 mt-1">{t("no_schemes")}</p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="btn-primary mt-4 text-sm">
                      Clear filters
                    </button>
                  )}
                </div>
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
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, data.pages) }).map((_, i) => {
                      const pageNum = Math.max(1, Math.min(data.pages - 4, page - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            pageNum === page
                              ? "bg-saffron text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
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
