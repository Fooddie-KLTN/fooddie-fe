/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import { Restaurant } from "@/interface";
import "mapbox-gl/dist/mapbox-gl.css";

// Initialize Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZHVjcXVhbjExMDYiLCJhIjoiY21ha3J6MTJjMDE0YTJscTBvcGYxNGY3OSJ9.6xAhWXzp9u-JtoX7xGKWPA';

interface MapViewProps {
  restaurants: Restaurant[];
  center: { lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  onMapClick: (lat: number, lng: number) => void;
}

export default function MapView({
  restaurants,
  center,
  userLocation,
  selectedRestaurant,
  onRestaurantSelect,
  onMapClick
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const router = useRouter();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom: 12,
      attributionControl: false,
      performanceMetricsCollection: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    let clickTimeout: NodeJS.Timeout;
    map.current.on('click', (e) => {
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        const { lat, lng } = e.lngLat;
        onMapClick(lat, lng);
      }, 200); // Reduced timeout for better responsiveness
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [onMapClick]);

  // Update map center with better performance and immediate response
  useEffect(() => {
    if (map.current) {
      // Use flyTo with shorter duration for immediate response
      map.current.flyTo({
        center: [center.lng, center.lat],
        zoom: 12,
        duration: 500, // Reduced duration
        essential: true
      });
    }
  }, [center]);

  // Add/update user location marker
  useEffect(() => {
    if (!map.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    if (userLocation) {
      const userMarkerElement = document.createElement('div');
      userMarkerElement.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #3b82f6;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `;

      userMarkerRef.current = new mapboxgl.Marker({
        element: userMarkerElement,
        anchor: 'center' // Important: anchor to center
      })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(
          new mapboxgl.Popup({ 
            offset: 15,
            closeButton: false,
            closeOnClick: false,
            anchor: 'bottom'
          }).setHTML('<div class="text-sm font-medium p-2">Vị trí của bạn</div>')
        )
        .addTo(map.current);
    }
  }, [userLocation]);

  // Add/update restaurant markers with FIXED hover behavior
  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    restaurants.forEach((restaurant) => {
      const safeToNumber = (value: string | number | undefined): number | null => {
        if (value === undefined || value === null) return null;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? null : num;
      };

      const lat = safeToNumber(restaurant.latitude) || safeToNumber(restaurant.address?.latitude);
      const lng = safeToNumber(restaurant.longitude) || safeToNumber(restaurant.address?.longitude);

      if (!lat || !lng) return;

      const isSelected = selectedRestaurant?.id === restaurant.id;
      
      // Create marker element with FIXED positioning
      const markerElement = document.createElement('div');
      markerElement.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${isSelected ? '#f97316' : '#ef4444'};
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        transition: transform 0.1s ease;
        position: relative;
      `;
      
      markerElement.innerHTML = '🍽️';

      const getAddressString = (restaurant: Restaurant): string => {
        if (restaurant.address) {
          const { street, ward, district, city } = restaurant.address;
          return [street, ward, district, city].filter(Boolean).join(', ') || 'Không có địa chỉ';
        }
        return typeof restaurant.address === 'string' ? restaurant.address : 'Không có địa chỉ';
      };

      const popupContent = `
        <div class="restaurant-popup">
          <div class="flex items-center gap-3 p-3 min-w-[260px]">
            <img 
              src="${restaurant.avatar || '/placeholder-restaurant.jpg'}" 
              alt="${restaurant.name}"
              class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              onerror="this.src='/placeholder-restaurant.jpg'"
            />
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 mb-1 truncate text-sm">${restaurant.name}</h3>
              <p class="text-xs text-gray-600 mb-2 line-clamp-2">${getAddressString(restaurant)}</p>
              <div class="flex items-center gap-2 text-xs text-gray-500 mb-2">
                ${restaurant.rating ? `<span class="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded">⭐ ${restaurant.rating}</span>` : ''}
                ${restaurant.distance ? `<span class="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">📍 ${restaurant.distance} km</span>` : ''}
              </div>
              <button 
                class="popup-visit-btn w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
                onclick="window.visitRestaurant('${restaurant.id}')"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ 
        offset: 15,
        className: 'restaurant-popup-container',
        closeButton: false,
        closeOnClick: false,
        maxWidth: 'none',
        anchor: 'bottom'
      }).setHTML(popupContent);

      // Create marker with PROPER anchor
      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center' // This is CRUCIAL - prevents the positioning issue
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      let hoverTimeout: NodeJS.Timeout;
      let isHovered = false;

      const showPopup = () => {
        if (!popup.isOpen()) {
          popup.addTo(map.current!);
        }
      };

      const hidePopup = () => {
        setTimeout(() => {
          if (!isHovered && popup.isOpen()) {
            popup.remove();
          }
        }, 200);
      };

      // Simplified hover behavior - no scale transform to avoid positioning issues
      markerElement.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        isHovered = true;
        
        // Only change appearance, no transform
        markerElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        markerElement.style.zIndex = '1000';
        
        hoverTimeout = setTimeout(() => {
          if (isHovered) {
            showPopup();
          }
        }, 300);
      });
      
      markerElement.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        isHovered = false;
        
        markerElement.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        markerElement.style.zIndex = '1';
        
        hidePopup();
      });

      // Handle marker click with navigation
      let clickCount = 0;
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        clickCount++;
        
        if (clickCount === 1) {
          setTimeout(() => {
            if (clickCount === 1) {
              onRestaurantSelect(restaurant);
            }
            clickCount = 0;
          }, 250);
        } else if (clickCount === 2) {
          clickCount = 0;
          router.push(`/restaurant/${restaurant.id}`);
        }
      });

      // Handle popup hover
      popup.on('open', () => {
        const popupElement = popup.getElement();
        if (popupElement) {
          popupElement.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            isHovered = true;
          });
          
          popupElement.addEventListener('mouseleave', () => {
            isHovered = false;
            hidePopup();
          });
        }
      });

      markersRef.current.push(marker);
    });

    // Add global function for popup button clicks
    (window as any).visitRestaurant = (restaurantId: string) => {
      router.push(`/restaurant/${restaurantId}`);
    };

    return () => {
      // Cleanup global function
      delete (window as any).visitRestaurant;
    };
  }, [restaurants, selectedRestaurant, onRestaurantSelect, router]);

  // Auto-open popup for selected restaurant
  useEffect(() => {
    if (!selectedRestaurant || !map.current) return;

    const markerIndex = restaurants.findIndex(r => r.id === selectedRestaurant.id);
    if (markerIndex !== -1 && markersRef.current[markerIndex]) {
      const marker = markersRef.current[markerIndex];
      const popup = marker.getPopup();
      if (popup && !popup.isOpen()) {
        popup.addTo(map.current);
      }
    }
  }, [selectedRestaurant, restaurants]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      <style jsx global>{`
        .restaurant-popup-container .mapboxgl-popup-content {
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          border: 1px solid #e5e7eb;
          background: white;
        }
        
        .restaurant-popup-container .mapboxgl-popup-tip {
          border-top-color: #ffffff;
        }

        .restaurant-popup {
          background: white;
          border-radius: 6px;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .popup-visit-btn:hover {
          background-color: #ea580c !important;
        }

        /* Ensure markers stay centered */
        .mapboxgl-marker {
          will-change: transform;
        }
      `}</style>
    </div>
  );
}