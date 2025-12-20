"use client";

import {
  FaUserAlt,
  FaCompass,
  FaHandHoldingHeart,
  FaInfo,
  FaEnvelopeOpenText,
  FaInbox,
  FaBars,
  FaSignOutAlt,
} from "react-icons/fa";

import { signOut } from "firebase/auth";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { auth } from "../../app/firebaseConfig";
import { useUser } from "../../contexts/UserContext";
import { useNavigation } from "../../contexts/NavigationContext";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const { userType } = useUser();
  const { setIsNavigating } = useNavigation();

  if (userType === null) {
    return null;
  }

  const handleNavigation = (href) => {
    setIsMenuOpen(false);
    startTransition(() => {
      router.push(href);
    });
  };

  const handleLogout = async () => {
    try {
      setIsNavigating(true);
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsNavigating(false);
    }
  };

  const navLinks = [
    { href: "/profile", icon: <FaUserAlt />, label: "Profile" },
    userType !== "child" && {
      href: "/discovery",
      icon: <FaCompass />,
      label: "Discover",
    },
    { href: "/about", icon: <FaInfo />, label: "About" },
    { href: "/contact", icon: <FaEnvelopeOpenText />, label: "Contact" },
    { onClick: handleLogout, icon: <FaSignOutAlt />, label: "Logout" },
  ].filter(Boolean);

  return (
    <nav
      className="
        w-full
        bg-blue-100
        px-4 py-3
        flex justify-around items-center
        text-zinc-900
        border-t
        rounded-b-2xl
        shadow-md
      "
    >
      {/* Letterhome */}
      <button
        onClick={() => handleNavigation("/letterhome")}
        className="flex flex-col items-center hover:bg-blue-400/40 rounded-xl p-2 transition"
      >
        <FaInbox className="h-4 w-4" />
        <span className="text-sm">Letterhome</span>
      </button>

      {/* Sponsor */}
      {userType !== "child" && (
        <button
          onClick={() => handleNavigation("/donate")}
          className="flex flex-col items-center hover:bg-blue-400/40 rounded-xl p-2 transition"
        >
          <FaHandHoldingHeart className="h-4 w-4" />
          <span className="text-sm">Sponsor</span>
        </button>
      )}

      {/* Menu */}
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          className="flex flex-col items-center hover:bg-blue-400/40 rounded-xl p-2 transition"
        >
          <FaBars className="h-4 w-4" />
          <span className="text-sm">Menu</span>
        </button>

        {isMenuOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-48 bg-blue-200 rounded-xl shadow-lg p-2">
            {navLinks.map((link) =>
              link.onClick ? (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className="flex items-center gap-2 p-2 hover:bg-blue-400/50 rounded-lg w-full"
                >
                  {link.icon}
                  <span className="text-sm">{link.label}</span>
                </button>
              ) : (
                <button
                  key={link.href}
                  onClick={() => handleNavigation(link.href)}
                  className="flex items-center gap-2 p-2 hover:bg-blue-400/50 rounded-lg w-full"
                >
                  {link.icon}
                  <span className="text-xs">{link.label}</span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
