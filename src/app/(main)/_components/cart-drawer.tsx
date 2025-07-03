"use client";

import { useCart } from "@/context/cart-context";
import { useCartDrawer } from "@/context/cart-drawer-context";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import CartGroupByRestaurant from "./grouped-cart";
import { Button } from "@/components/ui/button";

export default function CartDrawer() {
  const { isOpen, closeCartDrawer } = useCartDrawer();
  const { groupedCartItems } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={closeCartDrawer}>
      <SheetContent side="right" className="w-[90vw] md:w-[400px] p-6">
        <h2 className="text-xl font-semibold mb-4 text-brown-800">Giỏ hàng</h2>
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

        {groupedCartItems.length > 0 && (
          <div className="mt-8 border-t pt-4">
            <Button
              className="w-full bg-primary text-white hover:bg-primary/80"
              onClick={() => {
                // optional: navigate to checkout for specific restaurant
              }}
            >
              Tiến hành đặt món
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
