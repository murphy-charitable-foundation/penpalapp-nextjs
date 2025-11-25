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
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../app/firebaseConfig";
import { useUser } from "../../contexts/UserContext";
import LoadingSpinner from "../loading/LoadingSpinner";
import { useNavigation } from "../../contexts/NavigationContext";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [ isPending, startTransition ] = useTransition();
  const [showSpinner, setShowSpinner] = useState(false);
  const router = useRouter();
  const { userType } = useUser();
  const { setIsNavigating } = useNavigation();

  // useEffect(() => {
  //   if (isPending) {
  //     // Only show spinner if loading takes longer than 200ms
  //     const timer = setTimeout(() => setShowSpinner(true), 200);
  //     return () => clearTimeout(timer);
  //   } else {
  //     setShowSpinner(false);
  //   }
  // }, [isPending]);

  const handleNavigation = (href) => {
    setIsMenuOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      setIsNavigating(true);
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
      setIsNavigating(false);
    }
  };

  const getAllNavLinks = () => {
    const baseLinks = [
      {
        href: "/profile",
        icon: <FaUserAlt className="h-4 w-4" />,
        label: "Profile",
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
      {
        onClick: handleLogout,
        icon: <FaSignOutAlt className="h-4 w-4" />,
        label: "Logout",
      },
    ];

    // Only add these links if userType is not 'child'
    if (userType !== 'child') {
      baseLinks.splice(2, 0, { // Insert after Home
        href: "/discovery",
        icon: <FaCompass className="h-4 w-4" />,
        label: "Discover",
      });
    }

    return baseLinks;
  };

  const navLinks = getAllNavLinks();
  
  if (userType === null) {
    return null;
  }

  return (
    <>
      {showSpinner && <LoadingSpinner />}
      <nav className="fixed inset-x-0 bottom-0 bg-blue-100 p-3 flex justify-around items-center text-zinc-900 border-t border-[#E6E6E6] shadow-md">
        
          <button 
            onClick={() => handleNavigation('/letterhome')}
            className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-blue-400/50 hover:text-blue-900 rounded-lg p-2">
            <FaInbox className="h-4 w-4" />
            <span className="text-xs">Letterhome</span>
          </button>
        
        {userType !== 'child' && (
          
            <button 
              onClick={() => handleNavigation('/donate')}
              className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-blue-400/50 hover:text-blue-900 rounded-lg p-2">
              <FaHandHoldingHeart className="h-4 w-4" />
              <span className="text-xs">Sponsor</span>
            </button>
          
        )}
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
                    
                      <button 
                        key={link.href}
                        onClick={ ()=> handleNavigation(link.href)}
                        className="flex items-center gap-2 p-2 hover:bg-blue-400/50 hover:text-blue-900 rounded-lg w-full">
                        {link.icon}
                        <span className="text-xs">{link.label}</span>
                      </button>
                    
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}