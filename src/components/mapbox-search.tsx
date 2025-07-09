"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { Input } from '@/components/ui/input';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import React from 'react';

interface MapboxSearchProps {
  onAddressSelect: (address: {
    full: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialAddress?: string;
  initialLatitude?: number | string;
  initialLongitude?: number | string;
  height?: string;
  placeholder?: string;
  className?: string;
  debounceTime?: number;
  useUserLocation?: boolean; // Whether to use user's current location
}

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Custom hook for geolocation
function useGeolocation(enabled: boolean = true) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    const success = (position: GeolocationPosition) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setError(null);
      setLoading(false);
    };

    const error = (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        setError('Permission denied. Please allow location access.');
      }
      setError('Unable to retrieve your location. Please allow location access.');
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 600000, // 10 minutes
    });
  }, [enabled]);

  return useMemo(() => ({ location, error, loading }), [location, error, loading]);
}

const MapboxSearchComponent = ({ 
  onAddressSelect, 
  initialAddress = '',
  initialLatitude,
  initialLongitude,
  height = '300px',
  placeholder = "Tìm địa chỉ...", 
  className = "",
  debounceTime = 1500,
  useUserLocation = true
}: MapboxSearchProps) => {
  const geocoderContainerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const debouncedSearchQuery = useDebounce(searchQuery, debounceTime);
  const geocoderRef = useRef<MapboxGeocoder | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Get user's geolocation
  const { location: userLocation, loading: geoLoading, error: geoError } = useGeolocation(useUserLocation);

  // Convert potential string values to numbers
  const parsedLatitude = initialLatitude ? parseFloat(String(initialLatitude)) : undefined;
  const parsedLongitude = initialLongitude ? parseFloat(String(initialLongitude)) : undefined;

  // Memoize default coordinates calculation
  const defaultCoordinates = useMemo(() => {
    // Priority: provided coordinates > user location > default Vietnam
    if (parsedLatitude && parsedLongitude) {
      return {
        lng: parsedLongitude,
        lat: parsedLatitude,
        zoom: 16
      };
    }
    
    if (useUserLocation && userLocation && !geoError) {
      return {
        lng: userLocation.lng,
        lat: userLocation.lat,
        zoom: 16
      };
    }
    
    // Default to Vietnam (centered on Hanoi)
    return {
      lng: 105.8342,
      lat: 21.0278,
      zoom: 12
    };
  }, [parsedLatitude, parsedLongitude, useUserLocation, userLocation, geoError]);

  // Effect to handle debounced search
  useEffect(() => {
    if (geocoderRef.current && debouncedSearchQuery) {
      geocoderRef.current.query(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    // Wait for geolocation to complete if we're using it
    if (useUserLocation && geoLoading) {
      return;
    }

    // Initialize Mapbox
    if (!geocoderContainerRef.current || !mapContainerRef.current) return;
    
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Initialize the map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [defaultCoordinates.lng, defaultCoordinates.lat],
      zoom: defaultCoordinates.zoom
    });

    // Add navigation controls (zoom +/-)
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Store map in ref
    mapRef.current = map;

    // Create the geocoder (address search)
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      types: 'address,poi,place',
      countries: 'vn',
      language: 'vi',
      placeholder,
      marker: false, // We'll add our own marker
      proximity: userLocation ? { longitude: userLocation.lng, latitude: userLocation.lat } : undefined, // Fix: use object instead of array
    });
    
    // Store geocoder in ref for access in the debounced effect
    geocoderRef.current = geocoder;

    // Add geocoder to the container
    geocoder.addTo(geocoderContainerRef.current);

    // Handle input changes for debouncing
    geocoder.on('input', (e) => {
      setSearchQuery(e.target.value);
    });

    // Set up the result handler
    geocoder.on('result', (e) => {
      // When a location is selected
      const coordinates = e.result.center;
      const address = e.result.place_name;
      
      // Update map view
      map.flyTo({
        center: coordinates,
        zoom: 16,
        essential: true
      });
      
      // Remove existing marker if present
      if (markerRef.current) {
        markerRef.current.remove();
      }
      
      // Add marker at the selected location
      const marker = new mapboxgl.Marker({ color: '#FF5733' })
        .setLngLat(coordinates)
        .addTo(map);
      
      // Store marker reference for future removal
      markerRef.current = marker;

      // Pass selected location data to parent component
      onAddressSelect({
        full: address,
        latitude: coordinates[1], // Mapbox returns [longitude, latitude]
        longitude: coordinates[0],
      });
    });

    // Handle map click to set location manually
    map.on('click', (e) => {
      const coordinates = e.lngLat.toArray();
      
      // Reverse geocode to get address for the clicked point
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxToken}&language=vi`)
        .then(response => response.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            const address = data.features[0].place_name;
            
            // Update search input with this address
            if (geocoderRef.current) {
              geocoderRef.current.setInput(address);
            }
            
            // Remove existing marker if present
            if (markerRef.current) {
              markerRef.current.remove();
            }
            
            // Add marker at the clicked location
            const marker = new mapboxgl.Marker({ color: '#FF5733' })
              .setLngLat(coordinates)
              .addTo(map);
            
            // Store marker reference
            markerRef.current = marker;
            
            // Pass selected location data to parent component
            onAddressSelect({
              full: address,
              latitude: coordinates[1],
              longitude: coordinates[0],
            });
          }
        })
        .catch(err => console.error('Error during reverse geocoding:', err));
    });

    // Initialize a marker if coordinates are provided
    if (parsedLatitude && parsedLongitude) {
      const marker = new mapboxgl.Marker({ color: '#FF5733' })
        .setLngLat([parsedLongitude, parsedLatitude])
        .addTo(map);
      
      markerRef.current = marker;
    } else if (useUserLocation && userLocation && !geoError && !initialAddress) {
      // Auto-populate with user location if no initial address provided
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${userLocation.lng},${userLocation.lat}.json?access_token=${mapboxToken}&language=vi`)
        .then(response => response.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            const address = data.features[0].place_name;
            
            // Update search input with user's address
            if (geocoderRef.current) {
              geocoderRef.current.setInput(address);
            }
            
            // Add marker at user's location
            const marker = new mapboxgl.Marker({ color: '#4285F4' }) // Blue for user location
              .setLngLat([userLocation.lng, userLocation.lat])
              .addTo(map);
            
            markerRef.current = marker;
            
            // Pass user's location to parent
            onAddressSelect({
              full: address,
              latitude: userLocation.lat,
              longitude: userLocation.lng,
            });
          }
        })
        .catch(err => console.error('Error getting user location address:', err));
    }

    // Initialize with address if provided
    if (initialAddress && geocoder) {
      geocoder.setInput(initialAddress);
    }

    // Clean up on unmount
    setIsLoaded(true);
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (geocoderRef.current) {
        geocoderRef.current.onRemove();
        geocoderRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  // Include userLocation and geoLoading in dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress, parsedLatitude, parsedLongitude, placeholder, userLocation, geoLoading, defaultCoordinates]);

  return (
    <div className={`mapbox-search-container ${className}`}>
      {/* Geocoder container */}
      <div ref={geocoderContainerRef} className="w-full mb-3" />
      
      {/* Loading states */}
      {((useUserLocation && geoLoading) || !isLoaded) && (
        <div className="my-2 w-full">
          <Input 
            disabled 
            placeholder={
              useUserLocation && geoLoading 
                ? "Đang xác định vị trí của bạn..." 
                : "Đang tải..."
            } 
          />
        </div>
      )}
      
      {/* Geolocation error */}
      {useUserLocation && geoError && (
        <div className="my-2 w-full">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              {geoError}
            </p>
          </div>
        </div>
      )}
      
      {/* Map container with dynamic height */}
      <div 
        ref={mapContainerRef} 
        className="w-full rounded-md border border-gray-300 overflow-hidden mt-2" 
        style={{ height }}
      />
      
      {/* Help text */}
      <p className="text-xs text-gray-500 mt-1">
        *Bạn có thể nhấp vào bản đồ để chọn vị trí chính xác hơn
        {useUserLocation && userLocation && (
          <span className="text-blue-600"> • Vị trí hiện tại được hiển thị bằng chấm xanh</span>
        )}
      </p>
    </div>
  );
};

// Memoize to avoid unnecessary rerenders
const MapboxSearch = React.memo(MapboxSearchComponent);

export default MapboxSearch;