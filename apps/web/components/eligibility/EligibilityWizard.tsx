"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { checkEligibility, type MatchedScheme } from "@/lib/api";
import Link from "next/link";
import {
  ChevronRight, ChevronLeft, CheckCircle2, ExternalLink, MessageCircle, Loader2,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4;

interface WizardState {
  occupation: string;
  annual_income: string;
  caste_category: string;
  has_land: boolean | null;
  state: string;
  age: string;
  gender: string;
}

const INITIAL_STATE: WizardState = {
  occupation: "",
  annual_income: "",
  caste_category: "",
  has_land: null,
  state: "",
  age: "",
  gender: "",
};

function ProgressBar({ step, total }: { step: number; total: number }) {
  const t = useTranslations("eligibility");
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>
          {t("step_of")} {step} / {total}
        </span>
        <span>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-saffron to-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "text-green-700 bg-green-100" : pct >= 50 ? "text-yellow-700 bg-yellow-100" : "text-orange-700 bg-orange-100";
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>{pct}% match</span>
  );
}

/** Multi-step eligibility wizard with results. */
export function EligibilityWizard() {
  const t = useTranslations("eligibility");
  const locale = useLocale();
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [results, setResults] = useState<MatchedScheme[] | null>(null);

  const mutation = useMutation({
    mutationFn: checkEligibility,
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const update = (key: keyof WizardState, value: string | boolean) =>
    setState((s) => ({ ...s, [key]: value }));

  const canProceed = (): boolean => {
    if (step === 1) return !!state.occupation;
    if (step === 2) return !!state.annual_income;
    if (step === 3) return !!state.caste_category;
    if (step === 4) return state.has_land !== null;
    return false;
  };

  const handleSubmit = () => {
    mutation.mutate({
      occupation: state.occupation,
      annual_income: state.annual_income,
      caste_category: state.caste_category,
      has_land: state.has_land ?? false,
      state: state.state || undefined,
      age: state.age ? parseInt(state.age) : undefined,
      gender: state.gender || undefined,
    });
  };

  const OCCUPATIONS = [
    { key: "farmer", label: t("occupations.farmer") },
    { key: "student", label: t("occupations.student") },
    { key: "employed", label: t("occupations.employed") },
    { key: "self_employed", label: t("occupations.self_employed") },
    { key: "business", label: t("occupations.business") },
    { key: "street_vendor", label: t("occupations.street_vendor") },
    { key: "unemployed", label: t("occupations.unemployed") },
    { key: "retired", label: t("occupations.retired") },
  ];

  const INCOMES = [
    { key: "below_50k", label: t("incomes.below_50k") },
    { key: "50k_1l", label: t("incomes.50k_1l") },
    { key: "1l_3l", label: t("incomes.1l_3l") },
    { key: "3l_6l", label: t("incomes.3l_6l") },
    { key: "6l_12l", label: t("incomes.6l_12l") },
    { key: "above_12l", label: t("incomes.above_12l") },
  ];

  const CATEGORIES = [
    { key: "general", label: t("categories.general") },
    { key: "obc", label: t("categories.obc") },
    { key: "sc", label: t("categories.sc") },
    { key: "st", label: t("categories.st") },
    { key: "ews", label: t("categories.ews") },
  ];

  if (results !== null) {
    return (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          {t("results_title")}
        </h2>

        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-500">{t("no_results")}</div>
        ) : (
          <div className="space-y-4">
            {results.map((scheme) => (
              <div key={scheme.scheme_id} className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{scheme.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{scheme.ministry}</p>
                  </div>
                  <ConfidenceBadge score={scheme.confidence_score} />
                </div>

                {scheme.benefit_amount && (
                  <div className="text-sm font-medium text-saffron mb-3">
                    Benefit: {scheme.benefit_amount}
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 mb-1.5">Why you match:</div>
                  <ul className="space-y-1">
                    {scheme.match_reasons.map((r) => (
                      <li key={r} className="text-xs text-gray-600 flex items-center gap-1.5">
                        <span className="text-green-500">✓</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
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
            ))}
          </div>
        )}

        <button
          onClick={() => { setResults(null); setStep(1); setState(INITIAL_STATE); }}
          className="btn-secondary mt-6"
        >
          Check Again
        </button>
      </div>
    );
  }

  const OptionGrid = ({
    options,
    value,
    onChange,
  }: {
    options: { key: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all text-left ${
            value === opt.key
              ? "border-saffron bg-orange-50 text-saffron"
              : "border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <ProgressBar step={step} total={4} />

      {step === 1 && (
        <div className="animate-slide-up">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t("step_occupation")}</h2>
          <OptionGrid
            options={OCCUPATIONS}
            value={state.occupation}
            onChange={(v) => update("occupation", v)}
          />
        </div>
      )}

      {step === 2 && (
        <div className="animate-slide-up">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t("step_income")}</h2>
          <OptionGrid
            options={INCOMES}
            value={state.annual_income}
            onChange={(v) => update("annual_income", v)}
          />
        </div>
      )}

      {step === 3 && (
        <div className="animate-slide-up">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t("step_category")}</h2>
          <OptionGrid
            options={CATEGORIES}
            value={state.caste_category}
            onChange={(v) => update("caste_category", v)}
          />
        </div>
      )}

      {step === 4 && (
        <div className="animate-slide-up">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t("step_land")}</h2>
          <div className="flex gap-4">
            {[
              { value: true, label: "Yes" },
              { value: false, label: "No" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => update("has_land", opt.value)}
                className={`flex-1 py-4 rounded-xl text-sm font-medium border-2 transition-all ${
                  state.has_land === opt.value
                    ? "border-saffron bg-orange-50 text-saffron"
                    : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="btn-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("back")}
          </button>
        )}

        {step < 4 ? (
          <button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!canProceed()}
            className="btn-primary ml-auto"
          >
            {t("next")}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || mutation.isPending}
            className="btn-primary ml-auto"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t("check")}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
