"use client";

import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FoodPreview } from "@/interface";

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  suggestFoods?: FoodPreview[]; 
}

export default function HeroSection({ searchQuery, setSearchQuery, onSearch, suggestFoods }: HeroSectionProps) {
  return (
    <div className="relative text-white py-24">
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <Image 
          src="/assets/hero.png" 
          alt="Giao đồ ăn tận nơi"
          fill
          className="object-cover"
          priority
        />
        {/* Lớp phủ tối để dễ đọc chữ */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
      </div>
      
      {/* Nội dung */}
      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-md">Giao đồ ăn tận nơi</h1>
          <p className="mb-6 text-lg md:text-xl drop-shadow-sm">Món ngon mỗi ngày, giao nhanh tận cửa, phục vụ tận tâm. Đặt món ngay!</p>
          <form
            className="flex items-center rounded-md bg-white p-2"
            onSubmit={e => {
              e.preventDefault();
              onSearch();
            }}
          >
            <SearchIcon className="h-5 w-5 ml-2 text-gray-400" />
            <input 
              className="w-full p-2 outline-none text-gray-700"
              type="text" 
              placeholder="Tìm món ăn hoặc nhà hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button className="bg-primary hover:bg-primary/90 hover:text-primary" type="submit">
              Tìm kiếm
            </Button>
          </form>
          {suggestFoods && suggestFoods.length > 0 && (
            <div className="bg-white rounded-md shadow mt-2 p-2 max-w-lg">
              <div className="text-gray-700 font-semibold mb-1">Gợi ý món ăn:</div>
              <ul>
                {suggestFoods.map(food => (
                  <li key={food.id} className="py-1 border-b last:border-b-0">
                    {food.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}