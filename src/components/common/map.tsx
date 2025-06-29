// src/components/common/map.tsx
"use client";
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";


interface Props {
  shipperLocation?: {
    shipperId: string;
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  userLocation?: {
    lat: number;
    lng: number;
  };
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;
const carIconUrl = "/car.png"; // Use /public/car.png

const Map: React.FC<Props> = ({ shipperLocation, userLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const shipperMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [106.660172, 10.762622],
      zoom: 12,
    });

    return () => mapRef.current?.remove();
  }, []);

  // Add/Update user marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (userMarkerRef.current) userMarkerRef.current.remove();
    userMarkerRef.current = new mapboxgl.Marker({ color: "blue" })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(mapRef.current);
  }, [userLocation]);

  // Add/Update shipper marker (car icon)
  useEffect(() => {
    if (!mapRef.current || !shipperLocation) return;

    if (shipperMarkerRef.current) shipperMarkerRef.current.remove();
    // Custom car icon
    const el = document.createElement("img");
    el.src = carIconUrl;
    el.style.width = "32px";
    el.style.height = "32px";
    shipperMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([shipperLocation.longitude, shipperLocation.latitude])
      .addTo(mapRef.current);

    mapRef.current.flyTo({
      center: [shipperLocation.longitude, shipperLocation.latitude],
      zoom: 14,
      speed: 1.2,
    });
  }, [shipperLocation]);

  // Draw route using Mapbox Directions API
  useEffect(() => {
    if (
      !mapRef.current ||
      !userLocation ||
      !shipperLocation
    )
      return;

    const getRoute = async () => {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${shipperLocation.longitude},${shipperLocation.latitude};${userLocation.lng},${userLocation.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      const route = data.routes[0]?.geometry;

      // Remove old route
      if (mapRef.current && mapRef.current.getSource("route")) {
        if (mapRef.current.getLayer("route")) {
          mapRef.current.removeLayer("route");
        }
        mapRef.current.removeSource("route");
      }

      if (route && mapRef.current) {
        mapRef.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: route,
            properties: {}, // Fix: add properties field
          },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any); // TypeScript workaround for Mapbox types

        mapRef.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#3b82f6", "line-width": 4 },
        });
      }
    };

    getRoute();
  }, [userLocation, shipperLocation]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default Map;
