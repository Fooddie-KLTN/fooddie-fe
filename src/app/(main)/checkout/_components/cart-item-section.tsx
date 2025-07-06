/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

interface Topping {
  id: string;
  name: string;
  price: number;
}

interface CartItemDisplay {
  uuid: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  discountPercent?: number;
  restaurant?: { name: string };
  toppings?: Topping[];
}

interface CartItemsSectionProps {
  displayCartItems: CartItemDisplay[];
  onUpdateQuantity: (uuid: string, qty: number) => void;
  onRemoveFromCart: (uuid: string) => void;
  formatPrice: (price: number) => string;
}

export const CartItemsSection = ({
  displayCartItems,
  onUpdateQuantity,
  onRemoveFromCart,
  formatPrice,
}: CartItemsSectionProps) => {
  const getDiscountedPrice = (price: number, discount?: number) => {
    if (!discount || discount <= 0) return price;
    return price - (price * discount) / 100;
  };

  return (
    <Card className="shadow-md border border-gray-100 rounded-xl p-0">
      <CardHeader className="flex flex-row items-center gap-2 border-b pb-2">
        <ShoppingCart className="text-primary" />
        <CardTitle className="text-lg font-bold">Chọn món & số lượng</CardTitle>
      </CardHeader>
      <CardContent>
        {displayCartItems.length === 0 ? (
          <div className="text-gray-500 text-center py-6">Giỏ hàng của bạn đang trống.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayCartItems.map((item) => {
              const discountedPrice = getDiscountedPrice(item.price, item.discountPercent);
              const toppingTotal = item.toppings?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
              const itemTotal = (discountedPrice + toppingTotal) * item.quantity;

              return (
                <div key={item.uuid} className="flex items-start py-4 gap-4">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="rounded-md object-cover border"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.restaurant?.name}</div>
                    <div className="text-xs">
                      {item.discountPercent && item.discountPercent > 0 ? (
                        <>
                          <span className="line-through text-gray-400 mr-2">
                            {formatPrice(item.price)}
                          </span>
                          <span className="text-red-500 font-semibold">
                            {formatPrice(discountedPrice)}
                          </span>
                        </>
                      ) : (
                        <span>{formatPrice(item.price)}</span>
                      )}
                    </div>

                    {/* Topping */}
                    {item.toppings && item.toppings.length > 0 && (
                      <ul className="text-xs text-gray-500 list-disc pl-4 mt-1">
                      {item.toppings.map((topping: any) => (
                        <li key={topping.id}>
                          {topping.name} (+{formatPrice(Number(topping.price))})
                        </li>
                      ))}
                    </ul>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => onUpdateQuantity(item.uuid, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => onUpdateQuantity(item.uuid, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => onRemoveFromCart(item.uuid)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-right whitespace-nowrap">
                    {formatPrice(itemTotal)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
