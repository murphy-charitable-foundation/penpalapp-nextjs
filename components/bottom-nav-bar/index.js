"use client";

import {
  FaUserAlt,
  FaPen,
  FaCompass,
  FaHandHoldingHeart,
  FaInfo,
  FaEnvelopeOpenText,
  FaHome,
  FaInbox,
  FaBars,
  FaSignOutAlt,
} from "react-icons/fa";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../app/firebaseConfig";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "../../app/firebaseConfig";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  
  useEffect(() => {
    const grabUser = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnapshot = await getDoc(userRef);
      const userData = userSnapshot.data();
  
      if (userData?.user_type === "admin") {
        setIsAdmin(true);
      } else { 
        setIsAdmin(false);
      }
    }
  
    grabUser();
  }, []);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const navLinks = [
    {
      href: "/profile",
      icon: <FaUserAlt className="h-4 w-4" />,
      label: "Profile",
    },
    {
      href: "/letterhome",
      icon: <FaHome className="h-4 w-4" />,
      label: "Home",
    },
    {
      href: "/discovery",
      icon: <FaCompass className="h-4 w-4" />,
      label: "Discover",
    },
    { 
      href: "/about", 
      icon: <FaInfo className="h-4 w-4" />, 
      label: "About" 
    },
    {
      href: "/contact",
      icon: <FaEnvelopeOpenText className="h-4 w-4" />,
      label: "Contact",
    },
    // 👇 conditionally add admin link
    ...(isAdmin
      ? [
          {
            href: "/admin",
            icon: <FaUserAlt className="h-4 w-4" />, // choose any admin icon
            label: "Admin",
          },
        ]
      : []),
    {
      onClick: handleLogout,
      icon: <FaSignOutAlt className="h-4 w-4" />,
      label: "Logout",
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 bg-blue-100 p-3 flex justify-around items-center text-zinc-900 border-t border-[#E6E6E6] shadow-md">
      <Link href="/letterhome">
        <button className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-blue-400/50 hover:text-blue-900 rounded-lg p-2">
          <FaInbox className="h-4 w-4" />
          <span className="text-xs">Letterhome</span>
        </button>
      </Link>
      <Link href="/donate">
        <button className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-blue-400/50 hover:text-blue-900 rounded-lg p-2">
          <FaHandHoldingHeart className="h-4 w-4" />
          <span className="text-xs">Donate</span>
        </button>
      </Link>
      <div className="relative">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-blue-400/50 hover:text-blue-900 rounded-lg p-2"
        >
          <FaBars className="h-4 w-4" />
          <span className="text-xs">Menu</span>
        </button>
        {isMenuOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-48 bg-blue-200 rounded-lg shadow-lg p-2">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) =>
                link.onClick ? (
                  <button
                    key={link.label}
                    onClick={link.onClick}
                    className="flex items-center gap-2 p-2 hover:bg-blue-400/50 hover:text-blue-900 rounded-lg w-full"
                  >
                    {link.icon}
                    <span className="text-xs">{link.label}</span>
                  </button>
                ) : (
                  <Link key={link.href} href={link.href}>
                    <button className="flex items-center gap-2 p-2 hover:bg-blue-400/50 hover:text-blue-900 rounded-lg w-full">
                      {link.icon}
                      <span className="text-xs">{link.label}</span>
                    </button>
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}