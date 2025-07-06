"use client";

import { useCart } from "@/context/cart-context";
import { useCartDrawer } from "@/context/cart-drawer-context";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import CartGroupByRestaurant from "./grouped-cart";
import { X } from "lucide-react";

export default function CartDrawer() {
  const { isOpen, closeCartDrawer } = useCartDrawer();
  const { groupedCartItems } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={closeCartDrawer}>
      <SheetContent
        side="right"
        className="w-[90vw] md:w-[400px] p-6 overflow-y-auto hide-scrollbar relative"
      >
        {/* Header tùy chỉnh */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-brown-800">Giỏ hàng</h2>
          <button onClick={closeCartDrawer} className="text-gray-600 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {/* Nội dung giỏ hàng */}
        {groupedCartItems.length === 0 ? (
          <p className="text-sm text-gray-600">Không có món nào trong giỏ.</p>
        ) : (
          <div className="space-y-6">
            {groupedCartItems.map((group) => (
              <CartGroupByRestaurant
                key={group.restaurant.id}
                restaurant={group.restaurant}
                items={group.items}
              />
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
