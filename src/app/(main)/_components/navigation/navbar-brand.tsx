/**
 * NavbarBrand Component
 *
 * Displays the brand logo and mobile menu toggle button.
 * The component is responsive and shows the toggle button only on mobile devices.
 */

"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { MenuIcon, XIcon } from "lucide-react";
import Brand from "../../../../components/ui/brand";

interface NavbarBrandProps {
  state: boolean;
  setState: (state: boolean) => void;
  showButton?: boolean;
}

export default function NavbarBrand({
  state,
  setState,
  showButton = true,
}: NavbarBrandProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex items-center justify-between py-3 lg:block">
      <Brand className="w-12" width={isMobile ? 96 : 128} />
      
      {/* Enhanced mobile menu toggle */}
      <div className="lg:hidden">
        {showButton && (
          <button
            className="
              relative p-2 rounded-lg font-semibold text-white 
              hover:bg-white/10 active:bg-white/20
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-white/20
              touch-manipulation hover:bg-white
            "
            onClick={() => setState(!state)}
            aria-label={state ? "Close menu" : "Open menu"}
            aria-expanded={state}
          >
            <div className="w-6 h-6 relative">
              {/* Animated hamburger/close icon */}
              <div className={`
                absolute inset-0 transition-all duration-300 ease-in-out
                ${state ? 'rotate-45 opacity-0' : 'rotate-0 opacity-100'}
              `}>
                <MenuIcon className="w-6 h-6" />
              </div>
              <div className={`
                absolute inset-0 transition-all duration-300 ease-in-out
                ${state ? 'rotate-0 opacity-100' : 'rotate-45 opacity-0'}
              `}>
                <XIcon className="w-6 h-6" />
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
