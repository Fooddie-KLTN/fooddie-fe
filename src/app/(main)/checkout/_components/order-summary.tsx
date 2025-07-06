/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CheckIcon } from 'lucide-react';
import Image from 'next/image';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// Format price safely
const formatPrice = (price: number | undefined | null): string => {
  if (typeof price !== 'number' || isNaN(price)) return '0 ₫';
  return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

interface OrderSummaryProps {
  displayCartItems: any[];
  totalPrice: number;
  shippingFee: number;
  distance: number;
  total: number;
  calculating: boolean;
  selectedUserAddressId: string | null;
  onOrder: () => void;
  formatPrice?: (price: number | undefined | null) => string;
  promotions?: { id: string; code: string; description?: string }[];
  selectedPromotionCode?: string | null;
  onSelectPromotion?: (promotionCode: string) => void;
}

export const OrderSummary = ({
  displayCartItems,
  totalPrice,
  shippingFee,
  distance,
  total,
  calculating,
  selectedUserAddressId,
  onOrder,
  promotions = [],
  selectedPromotionCode,
  onSelectPromotion,
}: OrderSummaryProps) => {
  const getDiscountedPrice = (price: number, discountPercent?: number) => {
    if (!discountPercent || discountPercent <= 0) return price;
    return price - (price * discountPercent) / 100;
  };

  return (
    <Card className="shadow-lg border border-gray-100 rounded-xl sticky top-8">
      <CardHeader className="flex flex-row items-center gap-2 border-b pb-2">
        <ShoppingCart className="text-primary" />
        <CardTitle className="text-lg font-bold">Tóm tắt đơn hàng</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-gray-100">
          {displayCartItems.map((item) => {
            const discounted = getDiscountedPrice(Number(item.price), item.discountPercent);
            const toppingTotal = (item.toppings || []).reduce((sum: number, t: any) => sum + Number(t.price), 0);
            const itemTotal = (discounted + toppingTotal) * item.quantity;

            return (
              <div key={item.uuid || item.id} className="flex items-start py-3 gap-3">
                <Image 
                  src={item.image} 
                  alt={item.name} 
                  width={48} 
                  height={48} 
                  className="rounded-md object-cover border" 
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.restaurant?.name}</div>
                  {item.discountPercent > 0 ? (
                    <div className="text-xs text-muted-foreground">
                      <span className="line-through mr-1">{formatPrice(item.price)}</span>
                      <span className="text-red-500 font-semibold">{formatPrice(discounted)}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">{formatPrice(item.price)}</div>
                  )}
                  {/* Toppings */}
                  {item.toppings?.length > 0 && (
                    <ul className="text-xs text-gray-500 list-disc pl-4 mt-1">
                      {item.toppings.map((topping: any) => (
                        <li key={topping.id}>
                          {topping.name} (+{formatPrice(Number(topping.price))})
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="text-xs mt-1">x{item.quantity}</div>
                </div>
                <div className="font-semibold text-base whitespace-nowrap">
                  {formatPrice(itemTotal)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tính tổng */}
        <div className="flex justify-between mt-4 text-base">
          <span className="text-gray-600">Tạm tính:</span>
          <span className="font-semibold">
            {formatPrice(
              displayCartItems.reduce((acc, item) => acc + (item.total || 0), 0)
            )}
          </span>
        </div>

        <div className="flex justify-between mt-2 text-base">
          <span className="text-gray-600">Phí vận chuyển:</span>
          <span className="font-semibold">{formatPrice(shippingFee)}</span>
        </div>
        <div className="flex justify-between mt-2 text-base">
          <span className="text-gray-600">Khoảng cách:</span>
          <span className="font-semibold">{distance} km</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-3 border-t pt-3">
          <span>Tổng cộng:</span>
          <span className="text-primary">{formatPrice(total)}</span>
        </div>

        {calculating && <div className="text-center text-sm text-gray-500 py-2">Đang tính toán...</div>}

        {/* Promotion select */}
        {promotions.length > 0 && (
          <div className="flex justify-between mt-4 text-base items-center">
            <span className="text-gray-600">Khuyến mãi:</span>
            <Select
              value={selectedPromotionCode || ""}
              onValueChange={val => onSelectPromotion?.(val)}
            >
              <SelectTrigger className="border rounded px-2 py-1 min-w-[160px]">
                <SelectValue placeholder="Không áp dụng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không áp dụng</SelectItem>
                {promotions.map(promo => (
                  <SelectItem key={promo.id} value={promo.code}>
                    {promo.code} {promo.description ? `- ${promo.description}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full text-base font-bold bg-primary text-white hover:bg-primary/90 transition disabled:opacity-60 py-3 rounded-lg"
          size="lg"
          disabled={!selectedUserAddressId}
          onClick={onOrder}
        >
          <span className="flex items-center gap-2">
            <CheckIcon className="w-5 h-5" />
            Xác nhận đơn hàng
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
};
