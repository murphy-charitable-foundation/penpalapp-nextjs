"use client";

import PageBackground from "@/components/general/PageBackground";
import PageContainer from "@/components/general/PageContainer";
import AvatarUploadModal from "@/components/general/AvatarUploadModal";
import LoadingSpinner from "@/components/loading/LoadingSpinner";

import { useEffect, useMemo, useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { uploadFile } from "../utils/uploadFile";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useCachedUserLogins } from "../contexts/CachedUserLoginContext";
import { refreshCachedUserPhoto } from "../utils/refreshCachedUserPhoto";
import { ChevronDown, ChevronLeft } from "lucide-react";

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

export default function Page() {
  const { user, displayName } = useUser();
  const { updateCachedUserLogin } = useCachedUserLogins();
  const router = useRouter();
  const dropdownRef = useRef(null);
  const avatarUploadPromiseRef = useRef(null);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [showFinalSpinner, setShowFinalSpinner] = useState(false);
  const [countryLoading, setCountryLoading] = useState(false);

  const [country, setCountry] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // First name is extracted from displayName via UserContext
  const firstName = displayName?.split(" ")[0] ?? "";

  const filteredCountries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return COUNTRIES;

    return COUNTRIES.filter((c) =>
      c.toLowerCase().includes(normalizedSearch)
    );
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleWelcomeContinue = () => {
    setShowAvatarModal(true);
  };

  const handleAvatarSkip = () => {
    setShowAvatarModal(false);
    setShowCountryModal(true);
  };

  const handleAvatarBack = () => {
    setShowAvatarModal(false);
    setShowCountryModal(false);
    setErrorMsg("");
  };

  const handleAvatarSelected = (blob) => {
    // Show country modal immediately.
    // The upload starts in the background, but no spinner is shown yet.
    setShowAvatarModal(false);
    setShowCountryModal(true);
    setErrorMsg("");

    if (!user?.uid || !blob) {
      avatarUploadPromiseRef.current = null;
      return;
    }

    setIsUploading(true);

    avatarUploadPromiseRef.current = new Promise((resolve) => {
      try {
        uploadFile(
          blob,
          `user-profiles/${user.uid}/profile-image`,
          () => {},
          (error) => {
            console.error("Profile image upload error", error);
            setErrorMsg(
              "Your profile photo could not be saved. You can still continue."
            );
            setIsUploading(false);
            resolve();
          },
          async (url) => {
            try {
              if (!url) {
                console.error("Profile image upload returned empty URL");
                setErrorMsg(
                  "Your profile photo could not be saved. You can still continue."
                );
                return;
              }

              await updateDoc(doc(db, "users", user.uid), {
                photo_uri: url,
              });
              await refreshCachedUserPhoto(user.uid, updateCachedUserLogin);
            } catch (error) {
              console.error("Failed to update user photo_uri", error);
              setErrorMsg(
                "Your profile photo could not be saved. You can still continue."
              );
            } finally {
              setIsUploading(false);
              resolve();
            }
          }
        );
      } catch (error) {
        console.error("Profile image upload failed to start", error);
        setErrorMsg(
          "Your profile photo could not be saved. You can still continue."
        );
        setIsUploading(false);
        resolve();
      }
    });
  };

  const handleSelect = (selectedCountry) => {
    setCountry(selectedCountry);
    setErrorMsg("");
    setIsOpen(false);
    setSearch("");
  };

  const finishOnboarding = async () => {
    const avatarUploadPromise = avatarUploadPromiseRef.current;

    // Only show the original spinner AFTER the country step is done.
    // If the avatar upload is still running, wait here before routing.
    if (avatarUploadPromise && isUploading) {
      setShowFinalSpinner(true);
      await avatarUploadPromise;
    }

    if (user?.uid) {
      await refreshCachedUserPhoto(user.uid, updateCachedUserLogin);
    }

    router.push("/inbox");  // change to discovery when we are ready to onboard new international buddy users
  };

  const handleCountryContinue = async () => {
    if (!country) {
      setErrorMsg("Please select a country.");
      return;
    }

    setCountryLoading(true);
    setErrorMsg("");

    try {
      if (user?.uid) {
        await updateDoc(doc(db, "users", user.uid), { country });
      }

      setCountryLoading(false);
      await finishOnboarding();
    } catch (error) {
      console.error("Failed to update user country", error);
      setErrorMsg("Could not save your country. Please try again.");
      setCountryLoading(false);
    }
  };

  const handleCountrySkip = async () => {
    await finishOnboarding();
  };

  const handleCountryBack = () => {
    setShowCountryModal(false);
    setShowAvatarModal(true);
    setErrorMsg("");
    setIsOpen(false);
  };

  return (
    <PageBackground className="min-h-screen">
      {showFinalSpinner && <LoadingSpinner />}

      {showCountryModal ? (
        <PageContainer className="max-w-lg mx-auto text-white flex flex-col min-h-screen">
          <div className="relative flex flex-col min-h-screen bg-white">
            {/* Back button */}
            <button
              type="button"
              onClick={handleCountryBack}
              className="absolute top-4 left-4 p-1 text-gray-700 z-10 active:scale-95 transition-transform"
              aria-label="Go back"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Main content */}
            <div className="flex flex-col flex-1 pt-24 px-8">
              <h1 className="text-3xl font-bold text-[#034792] text-center mb-16 leading-tight">
                Where are you located?
              </h1>

              {/* Country dropdown */}
              <div ref={dropdownRef} className="relative">
                <p className="text-xs text-gray-500 mb-1 ml-1">Country</p>

                {/* Trigger */}
                <button
                  type="button"
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
                    className={`text-gray-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
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
                        className="w-full text-sm text-gray-900 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#034792]"
                        autoFocus
                      />
                    </div>

                    {/* Options */}
                    <div className="overflow-y-auto flex-1">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((c) => (
                          <button
                            type="button"
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

            {/* Bottom buttons */}
            <div className="pb-10 px-8 flex flex-col items-center gap-4">
              {errorMsg && (
                <p className="text-red-500 text-sm text-center">{errorMsg}</p>
              )}

              <button
                type="button"
                onClick={handleCountryContinue}
                disabled={!country || countryLoading}
                className={`w-full max-w-xs py-3 rounded-full font-semibold text-sm transition-colors ${
                  country && !countryLoading
                    ? "bg-[#034792] text-white hover:bg-[#023a7a]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {countryLoading ? "Saving..." : "Continue"}
              </button>

              <button
                type="button"
                onClick={handleCountrySkip}
                disabled={countryLoading}
                className={`text-sm font-semibold ${
                  countryLoading
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-800 hover:underline"
                }`}
              >
                Skip for now
              </button>
            </div>
          </div>
        </PageContainer>
      ) : (
        <>
          {showAvatarModal && (
            <AvatarUploadModal
              title="Upload a profile photo"
              autoSave={false}
              onContinue={handleAvatarSelected}
              onBackClick={handleAvatarBack}
              onSkip={handleAvatarSkip}
              continueText="Save"
              skipText="Skip for now"
              pageAnalyticsPath="/welcome"
            />
          )}

          <PageContainer className="max-w-lg mx-auto text-white flex flex-col min-h-screen">
            <div className="min-h-screen bg-[#034792] flex flex-col max-w-lg mx-auto">
              {/* Hero image */}
              <div
                className="w-full h-[50vh] bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: "url('/welcome.png')" }}
                role="img"
                aria-label="Community photo"
              />

              {/* Content */}
              <div className="flex flex-col flex-1 text-white px-6">
                <h1 className="pt-16 text-center font-bold text-2xl">
                  Welcome{firstName ? `, ${firstName}` : ""}
                </h1>

                <p className="text-center pt-5 flex-1 leading-relaxed opacity-90">
                  We are so happy to be here, thanks for your support. Now you are
                  part of the family.
                </p>

                {/* CTA */}
                <div className="text-center pt-10 pb-20">
                  <button
                    type="button"
                    onClick={handleWelcomeContinue}
                    className="bg-white text-[#111111] px-16 py-2 rounded-full font-semibold hover:bg-opacity-90 transition-opacity"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </PageContainer>
        </>
      )}
    </PageBackground>
  );
}