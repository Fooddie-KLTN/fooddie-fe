/**
 * Navigation data configuration
 *
 * This file contains the main navigation structure for the application.
 * Each navigation item can be a simple link or a dropdown with sub-items.
 */

import { NavItem } from "@/app/(main)/_components/navigation/types";
import { MapPin, UtensilsCrossed } from "lucide-react";

/**
 * Main navigation items array
 * Each item defines a main navigation entry in the navbar
 */
export const navigation: NavItem[] = [
  {
    title: "Khám phá",
    path: "#",
    isDropdown: true,
    navs: [
      {
        title: "Nhà hàng",
        desc: "Tìm kiếm và khám phá các nhà hàng gần bạn",
        path: "/map",
        icon: <MapPin className="h-5 w-5" />,
      },
      {
        title: "Thực ăn",
        desc: "Duyệt qua các món ăn ngon và đa dạng",
        path: "/search",
        icon: <UtensilsCrossed className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Cửa hàng của tôi",
    path: "/my-shop",
    isDropdown: false,
  },
];