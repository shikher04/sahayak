import { useTranslations } from "next-intl";
import { EligibilityWizard } from "@/components/eligibility/EligibilityWizard";

export default function EligibilityPage() {
  const t = useTranslations("eligibility");
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-2">{t("subtitle")}</p>
      </div>
      <div className="card p-8">
        <EligibilityWizard />
      </div>
    </div>
  );
}
