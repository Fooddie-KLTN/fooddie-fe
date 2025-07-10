"use client";

import { useCart } from "@/context/cart-context";
import { Restaurant } from "@/interface";
import Image from "next/image";
import Link from "next/link";

interface Props {
  restaurant: Restaurant;
  items: {
    uuid: string;
    foodId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    discountPercent?: number;
    toppings?: {
      id: string;
      name: string;
      price: number;
    }[];
  }[];
}

export default function CartGroupByRestaurant({ restaurant, items }: Props) {
  const { updateQuantity, removeFromCart } = useCart();

  const formatPrice = (price: number) =>
    price.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const getDiscountedPrice = (price: number, discountPercent?: number) => {
    if (!discountPercent || discountPercent <= 0) return price;
    return price - (price * discountPercent) / 100;
  };

  const total = items.reduce((acc, item) => {
    const basePrice = getDiscountedPrice(item.price, item.discountPercent);
    const toppingTotal =
      item.toppings?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
    return acc + (basePrice + toppingTotal) * item.quantity;
  }, 0);

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      {/* Header nhà hàng */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-base">{restaurant.name}</div>
      </div>

      {/* Danh sách món */}
      <div className="space-y-4">
        {items.map((item) => {
          const discountedPrice = getDiscountedPrice(
            item.price,
            item.discountPercent
          );
          const toppingTotal =
            item.toppings?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
          const itemTotal =
            (discountedPrice + toppingTotal) * item.quantity;

          return (
            <div
              key={item.uuid}
              className="relative flex gap-3 items-start border-b pb-4"
            >
              {/* Nút xoá */}
              <button
                onClick={() => removeFromCart(item.uuid)}
                className="absolute top-0 right-0 text-red-500 text-base px-2 py-1 hover:text-red-600"
              >
                Xóa
              </button>

              {/* Ảnh món */}
              <Image
                src={item.image}
                alt={item.name}
                width={60}
                height={60}
                className="rounded-md object-cover border"
              />

              {/* Nội dung */}
              <div className="flex-1 space-y-1">
                <div className="font-medium text-sm">{item.name}</div>

                <div className="text-xs text-muted-foreground">
                  {item.discountPercent && item.discountPercent > 0 ? (
                    <>
                      <span className="line-through mr-2 text-gray-400">
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
                    {item.toppings.map((topping) => (
                      <li key={topping.id}>
                        {topping.name} (+{formatPrice(topping.price)})
                      </li>
                    ))}
                  </ul>
                )}

                {/* Quantity */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                  
                    type="number"
                    min={1}
                    className="w-14 border rounded text-center text-sm"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.uuid, Number(e.target.value))
                    }
                  />
                  <div className="font-semibold text-sm text-right ml-auto">
                    {formatPrice(itemTotal)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tổng tiền & Thanh toán */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm font-semibold">
          Tổng: {formatPrice(total)}
        </div>
        <Link
          href={`/checkout?restaurantId=${restaurant.id}`}
          className="text-white bg-primary hover:text-primary hover:bg-white hover:border hover:border-black px-4 py-2 rounded text-sm font-medium"
        >
          Thanh toán
        </Link>
      </div>
    </div>
  );
}
