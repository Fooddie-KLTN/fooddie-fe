"use client";

import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FoodPreview } from "@/interface";
import { useRouter } from "next/navigation";

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  suggestFoods?: FoodPreview[]; 
}

export default function HeroSection({ searchQuery, setSearchQuery, onSearch, suggestFoods }: HeroSectionProps) {
  const router = useRouter();

  const handleSuggestionClick = (food: FoodPreview) => {
    setSearchQuery(food.name);
    router.push(`/food/${food.id}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

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
          
          <div className="relative">
            <form
              className="flex items-center rounded-md bg-white p-2 shadow-lg"
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

            {/* Modern dropdown suggestions */}
            {suggestFoods && suggestFoods.length > 0 && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-200 mt-2 z-30 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Gợi ý cho &quot;{searchQuery}&quot;
                  </h3>
                </div>
                
                <div className="py-2">
                  {suggestFoods.map((food) => (
                    <div
                      key={food.id}
                      className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-b border-gray-50 last:border-b-0"
                      onClick={() => handleSuggestionClick(food)}
                    >
                      {/* Food image */}
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={food.image || '/assets/food-placeholder.png'}
                          alt={food.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      {/* Food info */}
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {food.name}
                          </p>
                          <div className="flex items-center space-x-1 ml-2">
                            {food.discountPercent && food.discountPercent > 0 && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                                -{food.discountPercent}%
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 truncate">
                            {food.restaurant?.name}
                          </p>
                          <div className="flex items-center space-x-2">
                            {food.discountPercent && food.discountPercent > 0 ? (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-400 line-through">
                                  {formatPrice(Number(food.price))}
                                </span>
                                <span className="text-sm font-semibold text-red-500">
                                  {formatPrice(Number(food.price) * (1 - Number(food.discountPercent) / 100))}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-semibold text-gray-900">
                                {formatPrice(Number(food.price))}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Rating and sold count */}
                        <div className="flex items-center mt-1 space-x-3">
                          {food.rating && (
                            <div className="flex items-center space-x-1">
                              <span className="text-yellow-400">⭐</span>
                              <span className="text-xs text-gray-600">{food.rating}</span>
                            </div>
                          )}
                          {food.soldCount && food.soldCount > 0 && (
                            <span className="text-xs text-gray-500">
                              Đã bán {food.soldCount}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrow icon */}
                      <div className="ml-2 flex-shrink-0">
                        <svg 
                          className="w-4 h-4 text-gray-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 5l7 7-7 7" 
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* View all results */}
                <div className="p-3 border-t border-gray-100">
                  <button
                    onClick={onSearch}
                    className="w-full text-center text-sm text-primary hover:text-primary font-medium py-2 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Xem tất cả kết quả cho &quot;{searchQuery}&quot;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}