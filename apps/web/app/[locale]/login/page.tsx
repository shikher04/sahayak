"use client";

import { useTranslations, useLocale } from "next-intl";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

type LoginStep = "phone" | "otp";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<LoginStep>("phone");
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [txnId, setTxnId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatAadhaar = (raw: string) =>
    raw.replace(/\D/g, "").slice(0, 12).replace(/(\d{4})(?=\d)/g, "$1 ").trim();

  const handleSendOTP = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/aadhaar/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar_number: aadhaar.replace(/\s/g, "") }),
      });
      if (!res.ok) throw new Error("Failed to send OTP");
      const data = await res.json() as { txn_id: string };
      setTxnId(data.txn_id);
      setStep("otp");
    } catch {
      setError("Could not send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signIn("aadhaar", {
        aadhaar_number: aadhaar.replace(/\s/g, ""),
        otp,
        txn_id: txnId,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid OTP. Please try again.");
      } else {
        router.push(`/${locale}`);
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    await signIn("guest", { redirect: false });
    router.push(`/${locale}`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-50 rounded-2xl mb-4">
            <ShieldCheck className="w-7 h-7 text-saffron" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("login_title")}</h1>
          <p className="text-sm text-gray-500 mt-1">Secure login with Aadhaar OTP</p>
        </div>

        <div className="card p-8 space-y-5">
          {/* Aadhaar input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("aadhaar_label")}
            </label>
            <input
              type="text"
              value={aadhaar}
              onChange={(e) => setAadhaar(formatAadhaar(e.target.value))}
              placeholder={t("aadhaar_placeholder")}
              maxLength={14}
              disabled={step === "otp" || loading}
              className="input font-mono tracking-widest"
            />
          </div>

          {step === "otp" && (
            <div className="animate-slide-up">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("otp_label")}
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t("otp_placeholder")}
                maxLength={6}
                disabled={loading}
                className="input font-mono tracking-[0.5em] text-center text-lg"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Sandbox mode: use OTP <strong>123456</strong>
              </p>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {step === "phone" ? (
            <button
              onClick={handleSendOTP}
              disabled={aadhaar.replace(/\s/g, "").length !== 12 || loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("send_otp")}
            </button>
          ) : (
            <button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6 || loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("verify_otp")}
            </button>
          )}

          <div className="flex items-center gap-3 text-gray-300">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">{t("or")}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            onClick={handleGuest}
            disabled={loading}
            className="btn-secondary w-full justify-center py-3 text-gray-500"
          >
            {t("guest")}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your Aadhaar data is never stored — only a cryptographic hash is used for identity.
        </p>
      </div>
    </div>
  );
}
