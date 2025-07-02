"use client";

import { FoodPreview, Restaurant } from "@/interface";
import Image from "next/image";
import { useCart } from "@/context/cart-context";
import Link from "next/link";

interface Props {
  restaurant: Restaurant;
  items: (FoodPreview & { quantity: number })[];
}

export default function CartGroupByRestaurant({ restaurant, items }: Props) {
  const { updateQuantity, removeFromCart } = useCart();

  const total = items.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0
  );

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      {/* Nhà hàng */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-base">{restaurant.name}</div>
        <Link
          href={`/checkout?restaurantId=${restaurant.id}`}
          className="text-sm text-primary hover:underline font-medium"
        >
          Thanh toán
        </Link>
      </div>

      {/* Danh sách món */}
      <div className="space-y-3">
        {items.map((food) => (
          <div key={food.id} className="flex items-center gap-3">
            <Image
              src={food.image || ""}
              alt={food.name}
              width={50}
              height={50}
              className="rounded-md object-cover"
            />
            <div className="flex-1">
              <div className="font-medium">{food.name}</div>
              <div className="text-sm text-muted-foreground">
                {Number(food.price).toLocaleString("vi-VN")} đ
              </div>
            </div>
            <input
                type="number"
                className="w-14 border rounded text-center text-sm"
                value={food.quantity}
                min={1}
                onChange={(e) => {
                    const value = Number(e.target.value);
                    if (food.id) updateQuantity(food.id, value);
                }}
                />
                <button
                onClick={() => {
                    if (food.id) removeFromCart(food.id);
                }}
                className="text-red-500 text-sm hover:underline"
                >
                Xoá
                </button>

          </div>
        ))}
      </div>

      {/* Tổng tiền */}
      <div className="mt-3 text-right text-sm font-semibold">
        Tổng: {total.toLocaleString("vi-VN")} đ
      </div>
    </div>
  );
}
