/**
 * Navbar Component
 *
 * Main navigation component for the application.
 * Provides responsive navigation with dropdowns, search, and user actions.
 *
 * Features:
 * - Responsive design for mobile and desktop
 * - Dropdown menus for navigation categories
 * - User authentication status handling
 * - Search functionality
 * - Cart and notification integration
 */

"use client";

import NavbarBrand from "@/app/(main)/_components/navigation/navbar-brand";
import { navigation } from "@/app/(main)/_components/navigation/navbar-data";
import NavbarMenu from "@/app/(main)/_components/navigation/navbar-menu";
import { useAuth } from "@/context/auth-context";
import { useAuthModal } from "@/context/modal-context";
import useScreen from "@/hooks/use-screen";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [state, setState] = useState<boolean>(false);
  const [dropdownState, setDropdownState] = useState({
    isActive: false,
    idx: 0,
  });

  const { user } = useAuth();
  const { openModal } = useAuthModal();
  const windowDimensions = useScreen();

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    if (windowDimensions.width >= 1024 && state) {
      setState(false);
    }
  }, [windowDimensions.width, state]);

  // Close dropdown when clicking outside navigation
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".nav-menu")) {
        setDropdownState({ isActive: false, idx: 0 });
      }
    };

    if (dropdownState.isActive) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [dropdownState.isActive]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (state) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [state]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-primary shadow-md">
        <nav className="relative">
          <div className="items-center gap-x-6 px-4 max-w-screen-2xl mx-auto lg:flex lg:px-8">
            <NavbarBrand state={state} setState={setState} />
            <NavbarMenu
              state={state}
              navigation={navigation}
              dropdownState={dropdownState}
              setDropdownState={setDropdownState}
              user={user}
              openModal={openModal}
              windowDimensions={windowDimensions}
            />
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {state && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-40"
          onClick={() => setState(false)}
        />
      )}
    </>
  );
}
