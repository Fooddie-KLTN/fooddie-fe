"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { guestService } from "@/api/guest";
import { Restaurant } from "@/interface";
import { useNotification } from "@/components/ui/notification";
import MapView from "./_components/map-view";
import RestaurantSidebar from "./_components/restaurant-sidebar";
import LocationControls from "./_components/location-controls";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Menu, X } from "lucide-react";
import { useGeo } from "@/context/geolocation-context";

export default function MapPage() {
  const { location, loading: geoLoading, error: geoError } = useGeo();
  const { showNotification } = useNotification();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 10.7769, // Default to Ho Chi Minh City
    lng: 106.6951
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5); // km
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false); // For mobile toggle

  // Show geo error notification
  useEffect(() => {
    if (geoError) {
      showNotification(geoError, "warning");
    }
  }, [geoError, showNotification]);

  // Update map center when user location changes
  useEffect(() => {
    if (location?.lat && location?.lng) {
      const newLocation = { lat: location.lat, lng: location.lng };
      setMapCenter(newLocation);
      setUserLocation(newLocation);
    }
  }, [location]);

  // Memoize fetch function to prevent unnecessary re-renders
  const fetchRestaurants = useCallback(async (resetData = false, centerLat = mapCenter.lat, centerLng = mapCenter.lng) => {
    try {
      setLoading(true);
      
      const currentPage = resetData ? 1 : page;
      
      console.log(`Fetching restaurants for page ${currentPage}, lat: ${centerLat}, lng: ${centerLng}`);
      
      const response = await guestService.restaurant.getAllRestaurants(
        currentPage,
        20, // pageSize
        centerLat,
        centerLng
      );

      if (resetData) {
        setRestaurants(response.items);
        setPage(2);
      } else {
        setRestaurants(prev => [...prev, ...response.items]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(response.items.length === 20);
      
      if (response.items.length === 0 && resetData) {
        showNotification("Không tìm thấy nhà hàng nào trong khu vực này", "info");
      }
      
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      showNotification("Không thể tải danh sách nhà hàng. Vui lòng thử lại!", "error");
      setRestaurants([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, showNotification]);

  // Debounced fetch for map center changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      fetchRestaurants(true, mapCenter.lat, mapCenter.lng);
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [mapCenter.lat, mapCenter.lng]);

  // Memoize handlers to prevent re-renders
  const handleGetLocation = useCallback(async () => {
    try {
      if (!("geolocation" in navigator)) {
        showNotification("Trình duyệt của bạn không hỗ trợ định vị!", "error");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setMapCenter(newLocation);
          setUserLocation(newLocation);
          showNotification("Đã cập nhật vị trí của bạn!", "success");
        },
        (err) => {
          console.error("Error getting location:", err);
          let errorMessage = "Không thể lấy vị trí hiện tại!";
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Bạn đã từ chối quyền truy cập vị trí. Vui lòng bật định vị trong cài đặt trình duyệt!";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Thông tin vị trí không khả dụng!";
              break;
            case err.TIMEOUT:
              errorMessage = "Quá thời gian chờ lấy vị trí!";
              break;
          }
          
          showNotification(errorMessage, "error");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } catch (error) {
      console.error("Error getting location:", error);
      showNotification("Có lỗi xảy ra khi lấy vị trí!", "error");
    }
  }, [showNotification]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setMapCenter({ lat, lng });
    setSelectedRestaurant(null);
    showNotification("Đang tìm kiếm nhà hàng trong khu vực mới...", "info");
  }, [showNotification]);

  const handleRestaurantSelect = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
    
    // Safe function to convert coordinates
    const safeToNumber = (value: string | number | undefined): number | null => {
      if (value === undefined || value === null) return null;
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return isNaN(num) ? null : num;
    };

    const lat = safeToNumber(restaurant.latitude) || safeToNumber(restaurant.address?.latitude);
    const lng = safeToNumber(restaurant.longitude) || safeToNumber(restaurant.address?.longitude);

    if (lat && lng) {
      setMapCenter({ lat, lng });
    } else {
      console.warn('Restaurant has no valid coordinates:', restaurant.name);
      showNotification(`Nhà hàng "${restaurant.name}" không có thông tin vị trí chính xác`, "warning");
    }
  }, [showNotification]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchRestaurants(false);
    }
  }, [loading, hasMore, fetchRestaurants]);

  // Memoize expensive computations
  const memoizedMapView = useMemo(() => (
    <MapView
      restaurants={restaurants}
      center={mapCenter}
      userLocation={userLocation}
      selectedRestaurant={selectedRestaurant}
      onRestaurantSelect={handleRestaurantSelect}
      onMapClick={handleMapClick}
    />
  ), [restaurants, mapCenter, userLocation, selectedRestaurant, handleRestaurantSelect, handleMapClick]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bản đồ nhà hàng
              </h1>
              <p className="text-gray-600">
                Khám phá các nhà hàng gần bạn trên bản đồ
              </p>
            </div>
            
            {/* Mobile Sidebar Toggle */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span className="ml-2">
                {showSidebar ? 'Đóng' : `Nhà hàng (${restaurants.length})`}
              </span>
            </Button>
          </div>
        </div>

        {/* Location Controls */}
        <LocationControls
          onGetLocation={handleGetLocation}
          geoLoading={geoLoading}
          userLocation={userLocation}
          onRadiusChange={setRadius}
          radius={radius}
        />

        {/* Main Content */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Restaurant Sidebar - Hidden on mobile, shown in desktop */}
            <div className={`
              lg:col-span-1 
              ${showSidebar ? 'block' : 'hidden lg:block'} 
              ${showSidebar ? 'absolute inset-0 z-50 lg:relative lg:z-auto' : ''}
              ${showSidebar ? 'bg-white lg:bg-transparent' : ''}
              ${showSidebar ? 'p-4 lg:p-0' : ''}
              ${showSidebar ? 'shadow-xl lg:shadow-none' : ''}
              ${showSidebar ? 'rounded-lg lg:rounded-none' : ''}
            `}>
              <div className="h-full">
                <RestaurantSidebar
                  restaurants={restaurants}
                  loading={loading}
                  selectedRestaurant={selectedRestaurant}
                  onRestaurantSelect={handleRestaurantSelect}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                />
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="h-full overflow-hidden">
                {loading && restaurants.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
                      <p className="text-gray-600">Đang tải bản đồ...</p>
                    </div>
                  </div>
                ) : (
                  memoizedMapView
                )}
              </Card>
            </div>
          </div>

          {/* Mobile Overlay Background */}
          {showSidebar && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}
        </div>

        {/* Status Info */}
        <div className="mt-4 text-center text-sm text-gray-600">
          {userLocation ? (
            <span className="flex items-center justify-center gap-1">
              <MapPin className="h-4 w-4 text-green-500" />
              Vị trí hiện tại: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </span>
          ) : geoLoading ? (
            <span className="flex items-center justify-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
              Đang lấy vị trí hiện tại...
            </span>
          ) : (
            <span>Chưa có thông tin vị trí. Nhấn &quot;Lấy vị trí hiện tại&quot; để cập nhật.</span>
          )}
        </div>
      </div>
    </div>
  );
}