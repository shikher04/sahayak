"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { saveProfile, fetchProfile, type ProfileData } from "@/lib/api";
import { CheckCircle2, Loader2 } from "lucide-react";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh",
];

const OCCUPATIONS = [
  "farmer", "student", "employed", "self_employed", "business",
  "street_vendor", "unemployed", "retired",
];

const INCOMES = [
  "below_50k", "50k_1l", "1l_3l", "3l_6l", "6l_12l", "above_12l",
];

const INCOME_LABELS: Record<string, string> = {
  below_50k: "Below ₹50,000/year",
  "50k_1l": "₹50,000 – ₹1 lakh/year",
  "1l_3l": "₹1 lakh – ₹3 lakh/year",
  "3l_6l": "₹3 lakh – ₹6 lakh/year",
  "6l_12l": "₹6 lakh – ₹12 lakh/year",
  above_12l: "Above ₹12 lakh/year",
};

function Select({
  label, value, onChange, children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      >
        <option value="">— Select —</option>
        {children}
      </select>
    </div>
  );
}

/** Profile form with auto-save and matched schemes display. */
export function ProfileForm() {
  const t = useTranslations("profile");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<ProfileData>({});

  useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    onSuccess: (data: ProfileData) => setForm(data),
  } as Parameters<typeof useQuery>[0]);

  const mutation = useMutation({
    mutationFn: saveProfile,
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const update = (key: keyof ProfileData, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(form);
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("age")}</label>
          <input
            type="number"
            value={form.age ?? ""}
            onChange={(e) => update("age", e.target.value ? parseInt(e.target.value) : undefined)}
            min={0} max={130}
            placeholder="e.g. 35"
            className="input"
          />
        </div>

        {/* Gender */}
        <Select label={t("gender")} value={form.gender ?? ""} onChange={(v) => update("gender", v || undefined)}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>

        {/* State */}
        <Select label={t("state")} value={form.state ?? ""} onChange={(v) => update("state", v || undefined)}>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>

        {/* Occupation */}
        <Select label={t("occupation")} value={form.occupation ?? ""} onChange={(v) => update("occupation", v || undefined)}>
          {OCCUPATIONS.map((o) => (
            <option key={o} value={o} className="capitalize">{o.replace("_", " ")}</option>
          ))}
        </Select>

        {/* Annual income */}
        <Select label={t("annual_income")} value={form.annual_income ?? ""} onChange={(v) => update("annual_income", v || undefined)}>
          {INCOMES.map((i) => <option key={i} value={i}>{INCOME_LABELS[i]}</option>)}
        </Select>

        {/* Caste category */}
        <Select label={t("caste_category")} value={form.caste_category ?? ""} onChange={(v) => update("caste_category", v as ProfileData["caste_category"] || undefined)}>
          <option value="general">General</option>
          <option value="obc">OBC</option>
          <option value="sc">SC</option>
          <option value="st">ST</option>
          <option value="ews">EWS</option>
        </Select>
      </div>

      {/* Land ownership */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t("has_land")}</label>
        <div className="flex gap-3">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => update("has_land", v)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                form.has_land === v
                  ? "border-saffron bg-orange-50 text-saffron"
                  : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
              }`}
            >
              {v ? "Yes" : "No"}
            </button>
          ))}
        </div>
      </div>

      {form.has_land && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("land_area")}</label>
          <input
            type="number"
            value={form.land_area_hectares ?? ""}
            onChange={(e) => update("land_area_hectares", e.target.value ? parseFloat(e.target.value) : undefined)}
            step="0.01" min={0}
            placeholder="e.g. 1.5"
            className="input"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-primary w-full justify-center py-3"
      >
        {mutation.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        ) : saved ? (
          <><CheckCircle2 className="w-4 h-4 text-green-300" /> {t("saved")}</>
        ) : (
          t("save_button")
        )}
      </button>
    </form>
  );
}
