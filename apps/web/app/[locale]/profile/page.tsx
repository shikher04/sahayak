"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { DocumentChecklist } from "@/components/profile/DocumentChecklist";
import { User, LogIn } from "lucide-react";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { data: session, status } = useSession();
  const locale = useLocale();

  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-saffron" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Login Required</h2>
        <p className="text-gray-500 mb-8">Please log in to save your profile and get personalised scheme recommendations.</p>
        <Link href={`/${locale}/login`} className="btn-primary mx-auto">
          <LogIn className="w-4 h-4" />
          Login to Sahayak
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-2">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <ProfileForm />
          </div>
        </div>
        <div>
          <DocumentChecklist />
        </div>
      </div>
    </div>
  );
}
