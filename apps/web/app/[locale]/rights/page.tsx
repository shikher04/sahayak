"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { fetchRights } from "@/lib/api";
import { RightsCard } from "@/components/rights/RightsCard";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const CATEGORIES = [
  { key: "", label: "All Rights" },
  { key: "fundamental_rights", label: "Fundamental Rights" },
  { key: "statutory_rights", label: "Statutory Rights" },
  { key: "women_rights", label: "Women's Rights" },
];

/** Legal rights page with category filter and cards grid. */
export default function RightsPage() {
  const t = useTranslations("rights");
  const [category, setCategory] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["rights", category],
    queryFn: () => fetchRights(category || undefined),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-2">{t("subtitle")}</p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === c.key
                ? "bg-saffron text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-saffron hover:text-saffron"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          Loading rights...
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((right) => (
            <RightsCard key={right.id} right={right} />
          ))}
        </div>
      )}
    </div>
  );
}
