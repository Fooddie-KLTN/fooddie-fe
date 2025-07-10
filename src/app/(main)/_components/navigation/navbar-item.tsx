/**
 * NavigationItems Component
 *
 * Renders the main navigation items with dropdown functionality.
 * Handles both desktop and mobile navigation layouts.
 */

"use client";

import {
  NavigationItemsProps,
  NavItem,
  SubNavItem,
} from "@/app/(main)/_components/navigation/types";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * SubNavItem Component - Renders a single dropdown navigation item
 */
const SubNavItemComponent = ({ item }: { item: SubNavItem }) => (
  <Link
    href={item.path}
    className="
      block transition-colors hover:bg-gray-50 rounded-md p-3
      lg:hover:bg-gray-50 hover:bg-white/10
      touch-manipulation
    "
  >
    <div className="max-w-xs flex gap-3 text-base">
      <span className="flex-none text-primary lg:text-primary text-white">
        {item.icon}
      </span>
      <span className="flex-1 text-white lg:text-black font-semibold">
        {item.title}
        <p className="lg:pr-6 text-wrap break-after-all text-white/70 lg:text-teriary font-light mt-1">
          {item.desc}
        </p>
      </span>
    </div>
  </Link>
);

export default function NavigationItems({
  navigation,
  dropdownState,
  setDropdownState,
}: NavigationItemsProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownState({ isActive: false, idx: dropdownState.idx });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownState.idx, setDropdownState]);

  const toggleDropdown = (idx: number) => {
    setDropdownState({
      idx,
      isActive:
        dropdownState.idx === idx ? !dropdownState.isActive : true,
    });
  };

  return (
    <div
      ref={dropdownRef}
      className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-2 lg:space-y-0"
    >
      {navigation.map((item: NavItem, idx: number) => (
        <li className="flex-none" key={`nav-item-${idx}`}>
          {item.isDropdown ? (
            // Dropdown navigation item
            <div className="relative">
              <button
                title="Toggle dropdown"
                type="button"
                className="
                  w-full font-semibold text-white hover:text-primary 
                  flex items-center justify-between gap-1 text-base 
                  p-3 lg:p-2 rounded-lg lg:rounded-md 
                  hover:bg-white lg:hover:bg-gray-50 
                  transition-all duration-200 ease-in-out
                  touch-manipulation
                  active:bg-white lg:active:bg-gray-100 hover:bg-white
                "
                onClick={() => toggleDropdown(idx)}
                aria-expanded={
                  dropdownState.idx === idx && dropdownState.isActive
                }
                aria-haspopup="true"
              >
                {item.title}
                <div className={`
                  transition-transform duration-200 ease-in-out
                  ${dropdownState.idx === idx && dropdownState.isActive 
                    ? 'rotate-180' 
                    : 'rotate-0'
                  }
                `}>
                  <ChevronDownIcon className="h-4 w-4" />
                </div>
              </button>

              {/* Dropdown menu */}
              {item.isDropdown &&
                dropdownState.idx === idx &&
                dropdownState.isActive && (
                  <div
                    className="
                      mt-2 z-10 bg-white/5 lg:bg-background 
                      lg:border lg:shadow-md lg:mt-0 lg:rounded-xl 
                      w-full lg:w-72 rounded-lg
                      animate-in slide-in-from-top-2 fade-in-0
                      lg:absolute
                    "
                    style={{
                      top: "100%",
                      left: 0,
                    }}
                  >
                    <ul className="mx-auto mt-2 flex flex-col gap-1 lg:gap-2 p-2 lg:p-4">
                      {item.navs?.map((navItem, subIdx: number) => (
                        <li
                          key={`subnav-${idx}-${subIdx}`}
                          className="group"
                        >
                          <SubNavItemComponent item={navItem} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ) : (
            // Regular navigation link
            <Link
              href={item.path}
              className="
                block text-navigation text-white hover:text-primary 
                p-3 lg:p-2 rounded-lg lg:rounded-md 
                hover:bg-white lg:hover:bg-gray-50 
                transition-all duration-200 ease-in-out
                font-semibold touch-manipulation
                active:bg-white lg:active:bg-gray-100
              "
            >
              {item.title}
            </Link>
          )}
        </li>
      ))}
    </div>
  );
}
