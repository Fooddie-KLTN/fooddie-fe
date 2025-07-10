import { Restaurant } from "@/interface";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface FallbackMapProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
}

export default function FallbackMap({
  restaurants,
  selectedRestaurant,
  onRestaurantSelect
}: FallbackMapProps) {
  const router = useRouter();

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="text-center mb-6">
        <MapPin className="h-12 w-12 text-orange-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold mb-2">Chế độ xem danh sách</h3>
        <p className="text-sm text-gray-600">Bản đồ không khả dụng, hiển thị danh sách nhà hàng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {restaurants.map((restaurant) => (
          <Card
            key={restaurant.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRestaurant?.id === restaurant.id ? 'ring-2 ring-orange-500' : ''
            }`}
            onClick={() => onRestaurantSelect(restaurant)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <img
                  src={restaurant.avatar || '/images/placeholder-restaurant.jpg'}
                  alt={restaurant.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{restaurant.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {restaurant.address?.street}, {restaurant.address?.ward}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {restaurant.rating && <span>⭐ {restaurant.rating}</span>}
                      {restaurant.distance && <span>📍 {restaurant.distance} km</span>}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/restaurant/${restaurant.id}`);
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Xem
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}