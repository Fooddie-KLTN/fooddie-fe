"use client";

import { Restaurant } from "@/interface";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, Loader2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface RestaurantSidebarProps {
  restaurants: Restaurant[];
  loading: boolean;
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

export default function RestaurantSidebar({
  restaurants,
  loading,
  selectedRestaurant,
  onRestaurantSelect,
  onLoadMore,
  hasMore
}: RestaurantSidebarProps) {
  const router = useRouter();

  const handleVisitRestaurant = (restaurantId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nhà hàng gần đây
        </h2>
        <p className="text-sm text-gray-600">
          Tìm thấy {restaurants.length} nhà hàng
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            isSelected={selectedRestaurant?.id === restaurant.id}
            onSelect={() => onRestaurantSelect(restaurant)}
            onVisit={(e) => handleVisitRestaurant(restaurant.id, e)}
          />
        ))}

        {/* Load More Button */}
        {hasMore && (
          <div className="pt-4">
            <Button
              onClick={onLoadMore}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang tải...
                </>
              ) : (
                'Tải thêm nhà hàng'
              )}
            </Button>
          </div>
        )}

        {/* No more restaurants */}
        {!hasMore && restaurants.length > 0 && (
          <div className="text-center text-sm text-gray-500 py-4">
            Đã hiển thị tất cả nhà hàng trong khu vực
          </div>
        )}

        {/* No restaurants found */}
        {!loading && restaurants.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy nhà hàng
            </h3>
            <p className="text-gray-600 text-sm">
              Không có nhà hàng nào trong khu vực này. Thử tìm kiếm ở vị trí khác.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  isSelected: boolean;
  onSelect: () => void;
  onVisit: (e: React.MouseEvent) => void;
}

function RestaurantCard({ restaurant, isSelected, onSelect, onVisit }: RestaurantCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-orange-500 shadow-md' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Restaurant Image */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <Image
              src={restaurant.avatar || '/placeholder-restaurant.jpg'}
              alt={restaurant.name}
              fill
              className="object-cover rounded-lg"
              sizes="56px"
            />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
          </div>

          {/* Restaurant Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {restaurant.name}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="p-1 h-auto ml-1"
                onClick={onVisit}
                title="Xem chi tiết"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            {/* Rating and Distance */}
            <div className="flex items-center gap-2 mb-1">
              {restaurant.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-medium">{restaurant.rating}</span>
                </div>
              )}
              {restaurant.distance && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {restaurant.distance} km
                </Badge>
              )}
            </div>

            {/* Address */}
            <div className="flex items-start gap-1 mb-2">
              <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {restaurant.address?.street && restaurant.address?.district && restaurant.address?.ward
                  ? `${restaurant.address.street}, ${restaurant.address.ward}, ${restaurant.address.district}`
                  : 'Không có địa chỉ'
                }
              </p>
            </div>

            {/* Additional Info */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              {restaurant.phoneNumber && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{restaurant.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}