/**
 * Navigation data configuration
 *
 * This file contains the main navigation structure for the application.
 * Each navigation item can be a simple link or a dropdown with sub-items.
 */

import { NavItem } from "@/components/ui/navigation/types";

/**
 * Main navigation items array
 * Each item defines a main navigation entry in the navbar
 */
export const navigation: NavItem[] = [

  {
    title: "Khám phá",
    path: "/search",
    isDropdown: false,
  },
  {
    title: "Cửa hàng của tôi",
    path: "/my-shop",
    isDropdown: false,
  },
];
