import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-white text-lg mb-3">
              <span>🇮🇳</span>
              <span>Sahayak</span>
            </div>
            <p className="text-sm leading-relaxed">
              AI-powered platform helping Indian citizens discover government schemes and understand
              their legal rights — in 10 Indian languages.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/schemes", label: "Government Schemes" },
                { href: "/rights", label: "Legal Rights" },
                { href: "/eligibility", label: "Eligibility Checker" },
                { href: "/chat", label: "AI Chat" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Popular Schemes</h4>
            <ul className="space-y-2 text-sm">
              {[
                "PM Kisan Samman Nidhi",
                "Ayushman Bharat",
                "PM Awas Yojana",
                "MNREGA",
                "PM Mudra Yojana",
              ].map((s) => (
                <li key={s}>
                  <Link href="/schemes" className="hover:text-white transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Languages</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                "English", "हिन्दी", "தமிழ்", "తెలుగు",
                "मराठी", "বাংলা", "ગુજરાતી", "ಕನ್ನಡ", "മലയാളം", "ਪੰਜਾਬੀ",
              ].map((l) => (
                <span key={l} className="px-2 py-1 bg-gray-800 rounded text-gray-300">
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2024 Sahayak. Built for Indian citizens. Data from official government portals.</p>
          <p className="text-gray-600">
            Disclaimer: This platform provides informational guidance. For official applications,
            visit respective government portals.
          </p>
        </div>
      </div>
    </footer>
  );
}
