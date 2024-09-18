import { Button } from "@/components/ui/button";
import { FaUserAlt, FaPen, FaCompass, FaHandHoldingHeart, FaInfo, FaEnvelopeOpenText, FaHome, FaInbox, FaBars } from 'react-icons/fa';
import Link from "next/link";

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const navLinks = [
  { href: '/profile', icon: <FaUserAlt className="h-4 w-4" />, label: 'Profile' },
  { href: '/letterhome', icon: <FaHome className="h-4 w-4" />, label: 'Home' },
  { href: '/letterwrite', icon: <FaPen className="h-4 w-4" />, label: 'Write' },
  { href: '/discovery', icon: <FaCompass className="h-4 w-4" />, label: 'Discover' },
  { href: '/about', icon: <FaInfo className="h-4 w-4" />, label: 'About' },
  { href: '/contact', icon: <FaEnvelopeOpenText className="h-4 w-4" />, label: 'Contact' },
];

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 bg-blue-600 p-3 flex justify-around items-center text-[#333333] border-t border-[#E6E6E6] shadow-md">
      <Link href="/myletters">
        <Button variant="ghost" className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-blue-700 rounded-lg">
          <FaInbox className="h-4 w-4 hover:text-[#666666]" />
          <span className="text-xs">Letters</span>
        </Button>
      </Link>
      <Link href="/donate">
        <Button variant="ghost" className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-blue-700 rounded-lg">
          <FaHandHoldingHeart className="h-4 w-4 hover:text-[#666666]" />
          <span className="text-xs">Donate</span>
        </Button>
      </Link>
      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-blue-700 rounded-lg">
            <FaBars className="h-4 w-4 hover:text-[#666666]" />
            <span className="text-xs">Menu</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-3/4 bg-blue-600 p-4">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" className="flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-blue-700 rounded-lg w-full">
                  {link.icon}
                  <span className="text-xs">{link.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </nav>
  );
}
