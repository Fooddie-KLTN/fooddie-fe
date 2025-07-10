"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Loader2, Target } from "lucide-react";

interface LocationControlsProps {
  onGetLocation: () => void;
  geoLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  onRadiusChange: (radius: number) => void;
  radius: number;
}

const radiusOptions = [
  { label: "1 km", value: 1 },
  { label: "2 km", value: 2 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "20 km", value: 20 },
];

export default function LocationControls({
  onGetLocation,
  geoLoading,
  userLocation,
  onRadiusChange,
  radius
}: LocationControlsProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Location Button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onGetLocation}
              disabled={geoLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {geoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Target className="h-4 w-4" />
              )}
              {geoLoading ? 'Đang lấy vị trí...' : 'Lấy vị trí hiện tại'}
            </Button>

            {userLocation && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-green-500" />
                <span>
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Radius Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Bán kính:
            </span>
            <Select
              value={radius.toString()}
              onValueChange={(value) => onRadiusChange(Number(value))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {radiusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 flex-1">
            💡 Nhấn vào bản đồ để tìm kiếm nhà hàng ở khu vực mới
          </div>
        </div>
      </CardContent>
    </Card>
  );
}