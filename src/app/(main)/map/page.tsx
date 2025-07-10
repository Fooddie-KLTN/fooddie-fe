"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { guestService } from "@/api/guest";
import { Restaurant } from "@/interface";
import { useNotification } from "@/components/ui/notification";
import MapView from "./_components/map-view";
import FallbackMap from "./_components/fallback-map";
import RestaurantSidebar from "./_components/restaurant-sidebar";
import LocationControls from "./_components/location-controls";
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
  const [canUseMap, setCanUseMap] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Check WebGL support and Mapbox token
  useEffect(() => {
    const checkMapSupport = () => {
      try {
        // Check if we have the token
        if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
          showNotification("Chuyển sang chế độ danh sách do thiếu cấu hình bản đồ", "warning");
          setCanUseMap(false);
          setMapInitialized(true);
          return;
        }

        // Check WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
          showNotification("Chuyển sang chế độ danh sách do trình duyệt không hỗ trợ WebGL", "warning");
          setCanUseMap(false);
        } else {
          setCanUseMap(true);
        }
      } catch (error) {
        console.error('Error checking map support:', error);
        showNotification("Chuyển sang chế độ danh sách do lỗi khởi tạo", "warning");
        setCanUseMap(false);
      }
      
      setMapInitialized(true);
    };

    checkMapSupport();
  }, [showNotification]);

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

  // Memoize map view component with error boundary
  const memoizedMapView = useMemo(() => {
    if (!mapInitialized) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
            <p className="text-gray-600">Đang khởi tạo bản đồ...</p>
          </div>
        </div>
      );
    }

    if (canUseMap) {
      try {
        return (
          <MapView
            restaurants={restaurants}
            center={mapCenter}
            userLocation={userLocation}
            selectedRestaurant={selectedRestaurant}
            onRestaurantSelect={handleRestaurantSelect}
            onMapClick={handleMapClick}
          />
        );
      } catch (error) {
        console.error('Error rendering MapView:', error);
        return (
          <FallbackMap
            restaurants={restaurants}
            selectedRestaurant={selectedRestaurant}
            onRestaurantSelect={handleRestaurantSelect}
          />
        );
      }
    } else {
      return (
        <FallbackMap
          restaurants={restaurants}
          selectedRestaurant={selectedRestaurant}
          onRestaurantSelect={handleRestaurantSelect}
        />
      );
    }
  }, [
    mapInitialized,
    canUseMap,
    restaurants,
    mapCenter,
    userLocation,
    selectedRestaurant,
    handleRestaurantSelect,
    handleMapClick
  ]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header - Fixed at top */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {canUseMap ? 'Bản đồ nhà hàng' : 'Danh sách nhà hàng'}
              </h1>
              <p className="text-gray-600 text-sm">
                {canUseMap 
                  ? 'Khám phá các nhà hàng gần bạn trên bản đồ'
                  : 'Danh sách các nhà hàng gần bạn'
                }
              </p>
              {!canUseMap && mapInitialized && (
                <p className="text-sm text-amber-600 mt-1">
                  💡 Đang sử dụng chế độ danh sách
                </p>
              )}
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
      </div>

      {/* Location Controls - Fixed below header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <LocationControls
            onGetLocation={handleGetLocation}
            geoLoading={geoLoading}
            userLocation={userLocation}
            onRadiusChange={setRadius}
            radius={radius}
          />
        </div>
      </div>

      {/* Main Content - Flex grow to fill remaining space */}
      <div className="flex-1 relative overflow-hidden">
        <div className="flex h-full">
          {/* Restaurant Sidebar - Fixed width with scroll */}
          <div className={`
            w-80 flex-shrink-0 bg-white border-r
            ${showSidebar ? 'block' : 'hidden lg:block'} 
            ${showSidebar ? 'absolute inset-y-0 left-0 z-50 shadow-xl lg:relative lg:shadow-none' : ''}
            h-full overflow-y-auto
          `}>
            <RestaurantSidebar
              restaurants={restaurants}
              loading={loading}
              selectedRestaurant={selectedRestaurant}
              onRestaurantSelect={handleRestaurantSelect}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
            />
          </div>

          {/* Map/List View - Flex grow to fill remaining space */}
          <div className="flex-1 h-full">
            {loading && restaurants.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
                  <p className="text-gray-600">Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : (
              memoizedMapView
            )}
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

      {/* Status Info - Fixed at bottom */}
      <div className="bg-white border-t flex-shrink-0 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 flex-wrap text-sm text-gray-600">
            {userLocation ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-green-500" />
                Vị trí hiện tại: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </span>
            ) : geoLoading ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                Đang lấy vị trí hiện tại...
              </span>
            ) : (
              <span>Chưa có thông tin vị trí. Nhấn &quot;Lấy vị trí hiện tại&quot; để cập nhật.</span>
            )}
            
            {/* View mode indicator */}
            <span className={`text-xs px-2 py-1 rounded ${
              canUseMap 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {canUseMap ? 'Chế độ bản đồ' : 'Chế độ danh sách'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}