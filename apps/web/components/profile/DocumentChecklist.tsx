"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { CheckCircle2, Circle, FileText } from "lucide-react";

const DOCUMENTS = [
  "aadhaar", "pan", "income_cert", "caste_cert",
  "bank_account", "land_records", "photo", "ration_card",
] as const;

/** Interactive document checklist for tracking which documents a user has. */
export function DocumentChecklist() {
  const t = useTranslations("profile");
  const [checked, setChecked] = useState<Set<string>>(new Set(["aadhaar"]));

  const toggle = (doc: string) =>
    setChecked((s) => {
      const next = new Set(s);
      next.has(doc) ? next.delete(doc) : next.add(doc);
      return next;
    });

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-saffron" />
        {t("documents_title")}
      </h3>

      <div className="space-y-2.5">
        {DOCUMENTS.map((doc) => {
          const done = checked.has(doc);
          return (
            <button
              key={doc}
              onClick={() => toggle(doc)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                done
                  ? "border-green-200 bg-green-50"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
              )}
              <span className={`text-sm font-medium ${done ? "text-green-700" : "text-gray-600"}`}>
                {t(`documents.${doc}` as never)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        {checked.size}/{DOCUMENTS.length} documents ready
      </div>
    </div>
  );
}
