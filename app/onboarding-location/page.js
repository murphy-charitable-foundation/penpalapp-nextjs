"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { auth, db } from "../firebaseConfig";
import { logButtonEvent } from "../utils/analytics";
import PageBackground from "@/components/general/PageBackground";
import PageContainer from "@/components/general/PageContainer";
// Full country list
const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominican Republic",
  "DR Congo",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

export default function OnboardingLocation() {
  const router = useRouter();
  const isMountedRef = useRef(true);
  const dropdownRef = useRef(null);

  const [country, setCountry] = useState("");
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // ── Guard against state updates after unmount ────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ── Redirect to login if unauthenticated ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!isMountedRef.current) return;
      if (!currentUser) router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  // ── Close dropdown when clicking outside ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = useCallback((selected) => {
    setCountry(selected);
    setIsOpen(false);
    setSearch("");
  }, []);

  // ── Save country to Firestore then navigate ───────────────────────────────────
  const handleContinue = useCallback(async () => {
    if (!country) return;

    logButtonEvent("Continue clicked", "/onboarding-location");
    setErrorMsg(null);
    setLoading(true);

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not authenticated");

      await updateDoc(doc(db, "users", uid), { country });

      if (isMountedRef.current) router.push("/discovery");
    } catch (e) {
      if (isMountedRef.current) {
        setErrorMsg("Failed to save location. Please try again.");
        console.error("Location save error:", e);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [country, router]);

  const handleSkip = useCallback(() => {
    logButtonEvent("Skip for now clicked", "/onboarding-location");
    router.push("/discovery");
  }, [router]);

  return (
    <PageBackground className="min-h-screen !bg-primary">
      <PageContainer className="max-w-lg mx-auto text-white flex flex-col min-h-screen">
        <div className="flex flex-col min-h-screen">
          {/* ── Loading overlay ───────────────────────────────────────────────────── */}
          {loading && (
            <div className="absolute inset-0 bg-white/70 z-50 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-[#034792] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* ── Back button ───────────────────────────────────────────────────────── */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 p-1 text-gray-700 z-10 active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>

          {/* ── Main content ──────────────────────────────────────────────────────── */}
          <div className="flex flex-col flex-1 pt-24 px-8">
            <h1 className="text-3xl font-bold text-[#034792] text-center mb-16 leading-tight">
              Where are you located?
            </h1>

            {/* Country dropdown */}
            <div ref={dropdownRef} className="relative">
              <p className="text-xs text-gray-500 mb-1 ml-1">Country</p>

              {/* Trigger */}
              <button
                onClick={() => {
                  setIsOpen((prev) => !prev);
                  setSearch("");
                }}
                className="w-full flex items-center justify-between border-b-2 border-gray-300 pb-2 focus:outline-none focus:border-[#034792] transition-colors"
              >
                <span className={country ? "text-gray-900" : "text-gray-400"}>
                  {country || "Select an option"}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown list */}
              {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-64 flex flex-col">
                  {/* Search input */}
                  <div className="px-3 pt-3 pb-2">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#034792]"
                      autoFocus
                    />
                  </div>

                  {/* Options */}
                  <div className="overflow-y-auto flex-1">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((c) => (
                        <button
                          key={c}
                          onClick={() => handleSelect(c)}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                            c === country
                              ? "text-[#034792] font-semibold bg-blue-50"
                              : "text-gray-700"
                          }`}
                        >
                          {c}
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-gray-400 text-sm py-6">
                        No results found
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom buttons ────────────────────────────────────────────────────── */}
          <div className="pb-10 px-8 flex flex-col items-center gap-4">
            {errorMsg && (
              <p className="text-red-500 text-sm text-center">{errorMsg}</p>
            )}

            <button
              onClick={handleContinue}
              disabled={!country || loading}
              className={`w-full max-w-xs py-3 rounded-full font-semibold text-sm transition-colors ${
                country && !loading
                  ? "bg-[#034792] text-white hover:bg-[#023a7a]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Saving..." : "Continue"}
            </button>

            <button
              onClick={handleSkip}
              className="text-sm font-semibold text-gray-800 hover:underline"
            >
              Skip for now
            </button>
          </div>
        </div>
      </PageContainer>
    </PageBackground>
  );
}
