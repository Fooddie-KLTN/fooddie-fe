/**
 * @fileoverview Layout chính của ứng dụng bao quanh tất cả các trang trong đường dẫn (main).
 */
"use client";
import Footer from "@/components/footer";
import Navbar from "@/components/ui/navigation/navbar";
import { CartProvider } from "@/context/cart-context";
import { AuthModalProvider } from "@/context/modal-context";
import React from "react";
import "../../styles/globals.css";
import { GeoLocationProvider } from "@/context/geolocation-context";
import { NotificationProvider } from "@/components/ui/notification";
import ChatWidget from "@/components/common/chat-widget";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { HomeIcon } from "lucide-react";

// Path mapping for breadcrumbs
const pathMap: Record<string, { label: string; parent?: string }> = {
  "/": { label: "Trang chủ" },
  "/search": { label: "Tìm kiếm" },
  "/food": { label: "Món ăn" },
  "/food/[id]": { label: "Chi tiết món ăn", parent: "/food" },
  "/restaurant": { label: "Nhà hàng" },
  "/restaurant/[id]": { label: "Chi tiết nhà hàng", parent: "/restaurant" },
  "/restaurant/[id]/all": { label: "Tất cả món ăn", parent: "/restaurant/[id]" },
  "/order": { label: "Đơn hàng" },
  "/order/[id]": { label: "Chi tiết đơn hàng", parent: "/order" },
  "/checkout": { label: "Thanh toán" },
  "/profile": { label: "Hồ sơ" },
  "/about": { label: "Giới thiệu" },
};

// Utility to match dynamic routes
const getBreadcrumbTrail = (pathname: string) => {
  // Skip breadcrumb for home page
  if (pathname === "/") return [];
  
  const segments = pathname.split("/").filter(Boolean);
  let path = "";
  let matchedKey = "";
  let trail: { href: string; label: string }[] = [];

  // Try to match the path to a key in pathMap, replacing dynamic segments with [id]
  for (let i = 0; i < segments.length; i++) {
    path += "/" + segments[i];
    let testPath = path;
    // Try to match dynamic segments
    if (!pathMap[testPath]) {
      // Replace UUIDs or any ID with [id]
      testPath = testPath.replace(/\/[^\/]+$/, "/[id]");
    }
    if (pathMap[testPath]) {
      matchedKey = testPath;
      trail.push({
        href: path,
        label: pathMap[testPath].label,
      });
    }
  }

  // Walk up the parent chain if needed
  let parent = pathMap[matchedKey]?.parent;
  while (parent) {
    // Find the actual href for the parent
    let parentHref = parent;
    // If parent is dynamic, reconstruct href from segments
    if (parent.includes("[id]")) {
      const segs = pathname.split("/");
      const parentSegs = parent.split("/");
      const idx = parentSegs.findIndex((s) => s === "[id]");
      if (idx > -1 && segs[idx]) {
        parentHref = parent.replace("[id]", segs[idx]);
      }
    }
    trail.unshift({
      href: parentHref,
      label: pathMap[parent].label,
    });
    parent = pathMap[parent]?.parent;
  }

  // Always add home
  trail.unshift({
    href: "/",
    label: pathMap["/"].label,
  });

  // Remove duplicates
  const seen = new Set();
  trail = trail.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });

  return trail;
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbTrail(pathname);

  return (
    <>
      <NotificationProvider>
        <AuthModalProvider>
          <CartProvider>
            <GeoLocationProvider>
              <Navbar />
              {/* Only show breadcrumb if not on home page */}
              {breadcrumbs.length > 0 && (
                <div className="container mx-auto px-4 py-2 bg-gray-50">
                  <Breadcrumb>
                    <BreadcrumbList>
                      {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={crumb.href}>
                          <BreadcrumbItem>
                            {idx === 0 ? (
                              <BreadcrumbLink href={crumb.href} aria-label="Trang chủ">
                                <HomeIcon className="w-4 h-4 inline mr-1" />
                                {crumb.label}
                              </BreadcrumbLink>
                            ) : idx === breadcrumbs.length - 1 ? (
                              <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink href={crumb.href}>
                                {crumb.label}
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                          {idx < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                        </React.Fragment>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              )}
              {children}
              <ChatWidget />
            </GeoLocationProvider>
          </CartProvider>
        </AuthModalProvider>
        <Footer />
      </NotificationProvider>
    </>
  );
}
