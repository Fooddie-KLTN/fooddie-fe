import { FoodPreview, Restaurant } from "@/interface";
import FoodCard from "./food-card";
import Image from "next/image";
import { Star, LockKeyhole } from "lucide-react";

interface Props {
  restaurant: Restaurant;
  foods: FoodPreview[];
}

function formatAddress(address?: {
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
}) {
  if (!address) return "";
  const { street, ward, district, city } = address;
  return [street, ward, district, city].filter(Boolean).join(", ");
}

export default function RestaurantWithFoods({ restaurant, foods }: Props) {
  const isOpen = restaurant.status?.toLowerCase() === "open";

  return (
    <div className="w-full mb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 w-full border-b pb-2">
        {/* Avatar */}
        {restaurant.avatar && (
        <a href={`/restaurant/${restaurant.id}`} className="shrink-0">
            <Image
            src={restaurant.avatar}
            alt={restaurant.name}
            width={72}
            height={72}
            className="rounded-md object-cover hover:opacity-90 transition"
            />
        </a>
        )}


        {/* Info */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{restaurant.name}</h2>
            {restaurant.rating !== undefined && (
              <span className="flex items-center gap-1 text-sm text-yellow-600">
                <Star size={16} className="fill-yellow-400 stroke-yellow-600" />
                {restaurant.rating}
              </span>
            )}
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <LockKeyhole size={14} />
              {isOpen ? "Đang mở cửa" : "Đã đóng cửa"}
            </span>
          </div>
          <div className="text-sm text-gray-700 flex gap-4 mt-1">
            {restaurant.distance && <span>📍 {restaurant.distance} km</span>}
            {restaurant.deliveryTime && (
              <span>⏱ {restaurant.deliveryTime} phút</span>
            )}
          </div>
        </div>
      </div>

      {/* Food cards */}
      <div className="w-full flex flex-wrap gap-4">
        {foods.map((food) => (
          <div
            key={food.id}
            className="w-full sm:w-[48%] md:w-[30%] lg:w-[23%] xl:w-[23%]"
          >
            <FoodCard
              food={food}
              formatPrice={(price) =>
                typeof price === "number"
                  ? price.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })
                  : price
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
