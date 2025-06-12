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
import { HomeIcon, ChevronRightIcon } from "lucide-react";

// Enhanced path mapping for breadcrumbs with more detailed routes
const pathMap: Record<string, { label: string; parent?: string; icon?: React.ReactNode }> = {
  "/": { label: "Trang chủ", icon: <HomeIcon className="w-4 h-4" /> },
  "/search": { label: "Tìm kiếm món ăn", parent: "/" },
  "/food": { label: "Món ăn", parent: "/" },
  "/food/[id]": { label: "Chi tiết món ăn", parent: "/food" },
  "/restaurant": { label: "Nhà hàng", parent: "/" },
  "/restaurant/[id]": { label: "Chi tiết nhà hàng", parent: "/restaurant" },
  "/restaurant/[id]/all": { label: "Tất cả món ăn", parent: "/restaurant/[id]" },
  "/restaurant/[id]/menu": { label: "Thực đơn", parent: "/restaurant/[id]" },
  "/order": { label: "Đơn hàng", parent: "/" },
  "/order/[id]": { label: "Chi tiết đơn hàng", parent: "/order" },
  "/order/history": { label: "Lịch sử đơn hàng", parent: "/order" },
  "/checkout": { label: "Thanh toán", parent: "/" },
  "/cart": { label: "Giỏ hàng", parent: "/" },
  "/profile": { label: "Hồ sơ cá nhân", parent: "/" },
  "/profile/edit": { label: "Chỉnh sửa hồ sơ", parent: "/profile" },
  "/profile/orders": { label: "Đơn hàng của tôi", parent: "/profile" },
  "/about": { label: "Giới thiệu", parent: "/" },
  "/contact": { label: "Liên hệ", parent: "/" },
  "/help": { label: "Trợ giúp", parent: "/" },
  "/terms": { label: "Điều khoản sử dụng", parent: "/" },
  "/privacy": { label: "Chính sách bảo mật", parent: "/" },
};

// Enhanced utility to match dynamic routes
const getBreadcrumbTrail = (pathname: string) => {
  // Skip breadcrumb for home page
  if (pathname === "/") return [];
  
  const segments = pathname.split("/").filter(Boolean);
  const trail: { href: string; label: string; isActive: boolean }[] = [];
  
  // Build path progressively
  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    currentPath += "/" + segments[i];
    let matchedPath = currentPath;
    
    // Try to match exact path first
    if (!pathMap[matchedPath]) {
      // Try to match with dynamic segment
      const pathParts = currentPath.split("/");
      const dynamicPath = pathParts.slice(0, -1).join("/") + "/[id]";
      if (pathMap[dynamicPath]) {
        matchedPath = dynamicPath;
      }
    }
    
    if (pathMap[matchedPath]) {
      trail.push({
        href: currentPath,
        label: pathMap[matchedPath].label,
        isActive: i === segments.length - 1,
      });
    }
  }
  
  // Build complete trail with parents
  const completeTrail: { href: string; label: string; isActive: boolean; icon?: React.ReactNode }[] = [];
  const processedPaths = new Set<string>();
  
  // Add home first
  completeTrail.push({
    href: "/",
    label: pathMap["/"].label,
    isActive: false,
    icon: pathMap["/"].icon,
  });
  processedPaths.add("/");
  
  // Process each item in trail
  for (const item of trail) {
    // Find the matching template path
    let templatePath = "";
    for (const [key] of Object.entries(pathMap)) {
      if (key === item.href || (key.includes("[id]") && item.href.match(key.replace("[id]", "[^/]+")))) {
        templatePath = key;
        break;
      }
    }
    
    // Add parent paths if not already added
    const addParentPaths = (path: string) => {
      const config = pathMap[path];
      if (config?.parent && !processedPaths.has(config.parent)) {
        addParentPaths(config.parent);
        
        // Reconstruct parent href
        let parentHref = config.parent;
        if (config.parent.includes("[id]")) {
          const currentSegments = item.href.split("/");
          const parentSegments = config.parent.split("/");
          const idIndex = parentSegments.findIndex(seg => seg === "[id]");
          if (idIndex !== -1 && currentSegments[idIndex]) {
            parentHref = config.parent.replace("[id]", currentSegments[idIndex]);
          }
        }
        
        completeTrail.push({
          href: parentHref,
          label: pathMap[config.parent].label,
          isActive: false,
          icon: pathMap[config.parent].icon,
        });
        processedPaths.add(config.parent);
      }
    };
    
    if (templatePath) {
      addParentPaths(templatePath);
    }
    
    // Add current item if not already added
    if (!processedPaths.has(item.href)) {
      completeTrail.push({
        ...item,
        icon: pathMap[templatePath]?.icon,
      });
      processedPaths.add(item.href);
    }
  }
  
  return completeTrail;
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
              {/* Enhanced breadcrumb with better styling */}
              {breadcrumbs.length > 0 && (
                <div className="border-b bg-gray-50/50 backdrop-blur-sm sticky top-24 z-40">
                  <div className="container mx-auto px-4 py-3">
                    <Breadcrumb>
                      <BreadcrumbList className="flex-wrap">
                        {breadcrumbs.map((crumb, idx) => (
                          <React.Fragment key={`${crumb.href}-${idx}`}>
                            <BreadcrumbItem className="flex items-center">
                              {crumb.isActive ? (
                                <BreadcrumbPage className="flex items-center gap-1.5 font-medium text-primary">
                                  {crumb.icon}
                                  <span className="max-w-[200px] truncate" title={crumb.label}>
                                    {crumb.label}
                                  </span>
                                </BreadcrumbPage>
                              ) : (
                                <BreadcrumbLink 
                                  href={crumb.href}
                                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors duration-200"
                                  title={crumb.label}
                                >
                                  {crumb.icon}
                                  <span className="max-w-[150px] truncate">
                                    {crumb.label}
                                  </span>
                                </BreadcrumbLink>
                              )}
                            </BreadcrumbItem>
                            {idx < breadcrumbs.length - 1 && (
                              <BreadcrumbSeparator className="text-muted-foreground/60">
                                <ChevronRightIcon className="w-4 h-4" />
                              </BreadcrumbSeparator>
                            )}
                          </React.Fragment>
                        ))}
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                </div>
              )}
              <main className="min-h-screen">
                {children}
              </main>
              <ChatWidget />
            </GeoLocationProvider>
          </CartProvider>
        </AuthModalProvider>
        <Footer />
      </NotificationProvider>
    </>
  );
}
