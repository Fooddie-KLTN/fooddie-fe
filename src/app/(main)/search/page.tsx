"use client";

import { useEffect, useMemo, useState } from "react";
import { guestService } from "@/api/guest";
import { FoodPreview, Category, Restaurant } from "@/interface";
import { useDebounce } from "@/hooks/use-debounce";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { CameraIcon, SlidersHorizontal, X, Filter } from "lucide-react";
import ImageSearchModal from "../_components/image-search";
//import RestaurantWithFoods from "../_components/restaurant-with-foods";

type FoodSortType = 'newest' | 'nearby' | 'hot' | 'most_review' | 'most_buy' | 'rating' | 'price' | 'name';

const priceRanges = [
  { label: "Dưới 50.000đ", value: "under50", min: 0, max: 50000 },
  { label: "50.000đ - 100.000đ", value: "50to100", min: 50000, max: 100000 },
  { label: "Trên 100.000đ", value: "over100", min: 100000, max: Infinity },
];

const radiusOptions = [
  { label: "1 km", value: 1 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "20 km", value: 20 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
  { label: "Tất cả", value: 999999 },
];

const sortOptions: { label: string; value: FoodSortType }[] = [
  { label: "Mới nhất", value: "newest" },
  { label: "Gần nhất", value: "nearby" },
  { label: "Phổ biến", value: "hot" },
  { label: "Nhiều đánh giá", value: "most_review" },
  { label: "Bán chạy", value: "most_buy" },
  { label: "Đánh giá cao", value: "rating" },
  { label: "Giá tăng dần", value: "price" },
  { label: "Tên A-Z", value: "name" },
];

export default function FoodSearchPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 400);

  const [foods, setFoods] = useState<FoodPreview[]>([]);
  const [allFoods, setAllFoods] = useState<FoodPreview[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [radius, setRadius] = useState(1000);
  const [sortBy, setSortBy] = useState<FoodSortType>('newest');
  const [loading, setLoading] = useState(false);
  const [showingAll, setShowingAll] = useState(true);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Price filter logic
  const minPrice = useMemo(() => {
    if (selectedPrices.length === 0) return undefined;
    return Math.min(...selectedPrices.map(val => priceRanges.find(r => r.value === val)?.min ?? 0));
  }, [selectedPrices]);
  const maxPrice = useMemo(() => {
    if (selectedPrices.length === 0) return undefined;
    return Math.max(...selectedPrices.map(val => priceRanges.find(r => r.value === val)?.max ?? Infinity));
  }, [selectedPrices]);
  
  // Check if all categories are selected
  const isAllCategoriesSelected = selectedCategories.length === categories.length && categories.length > 0;

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0 && selectedCategories.length < categories.length) count++;
    if (selectedPrices.length > 0) count++;
    if (radius !== 1000) count++;
    return count;
  }, [selectedCategories.length, categories.length, selectedPrices.length, radius]);

  useEffect(() => {
    if (foods.length > 0) {
      console.log("🧾 First food item:", foods[0]);
    }
  }, [foods]);

  // Fetch categories and initial foods
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const categoriesRes = await guestService.category.getCategories(1, 50);
        const fetchedCategories = categoriesRes.items ?? [];
        setCategories(fetchedCategories);
        setSelectedCategories(fetchedCategories.map(cat => cat.id));
        
        setLoading(true);
        const foodsRes = await guestService.food.searchFoodsByName(
          "",
          1,
          100,
          10.7769,
          106.7009,
          radius,
          fetchedCategories.map(cat => cat.id),
          undefined,
          undefined,
          sortBy
        );
        setAllFoods(foodsRes.items ?? []);
        setFoods(foodsRes.items ?? []);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch all foods when showing all
  const fetchAllFoods = async () => {
    setLoading(true);
    try {
      const res = await guestService.food.searchFoodsByName(
        "",
        1,
        100,
        10.7769,
        106.7009,
        radius,
        selectedCategories,
        minPrice,
        maxPrice === Infinity ? undefined : maxPrice,
        sortBy
      );
      setAllFoods(res.items ?? []);
      setFoods(res.items ?? []);
      setShowingAll(true);
    } catch (error) {
      console.error("Error fetching all foods:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch foods by search and filters
  useEffect(() => {
    if (!debouncedSearch.trim() && !showingAll) {
      setFoods([]);
      return;
    }
    
    if (showingAll && !debouncedSearch.trim()) {
      let filtered = allFoods;
      
      if (selectedCategories.length > 0 && selectedCategories.length < categories.length) {
        filtered = filtered.filter(food => 
          selectedCategories.includes(food.category?.id ?? "")
        );
      }
      
      if (minPrice !== undefined || maxPrice !== undefined) {
        filtered = filtered.filter(food => {
          const price = Number(food.price);
          const min = minPrice ?? 0;
          const max = maxPrice === Infinity ? Number.MAX_VALUE : (maxPrice ?? Number.MAX_VALUE);
          return price >= min && price <= max;
        });
      }
      
      setFoods(filtered);
      return;
    }

    setLoading(true);
    setShowingAll(false);
    guestService.food.searchFoodsByName(
      debouncedSearch,
      1,
      30,
      10.7769,
      106.7009,
      radius,
      selectedCategories,
      minPrice,
      maxPrice === Infinity ? undefined : maxPrice,
      sortBy
    )
    .then(res => {
      const nameSearch = debouncedSearch.trim().toLowerCase();
      const matched = (res.items ?? []).filter(food =>
        food.name.toLowerCase().includes(nameSearch) ||
        food.description?.toLowerCase().includes(nameSearch)
      );
      setFoods(matched);
    })
    .finally(() => setLoading(false));
  }, [debouncedSearch, selectedCategories, minPrice, maxPrice, radius, sortBy, showingAll, allFoods, categories.length]);

  // Handle category checkbox
  const handleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Handle "ALL" categories checkbox
  const handleAllCategories = () => {
    if (isAllCategoriesSelected) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(cat => cat.id));
    }
  };

  // Handle price checkbox
  const handlePrice = (value: string) => {
    setSelectedPrices(prev =>
      prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
    );
  };

  // Handle sort change
  const handleSortChange = (value: FoodSortType) => {
    setSortBy(value);
  };

  // Handle show all button
  const handleShowAll = () => {
    setSearch("");
    fetchAllFoods();
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories(categories.map(cat => cat.id));
    setSelectedPrices([]);
    setRadius(1000);
  };

  // // Change the groupedFoods to a flatter structure for better display
  // const displayFoods = useMemo(() => {
  //   // Option 1: Show individual foods in a grid
  //   return foods;
  // }, [foods]);
  
  // Alternative: Group by restaurant but display differently
  const groupedByRestaurant = useMemo(() => {
    const map = new Map<string, { restaurant: Restaurant; foods: FoodPreview[] }>();
  
    for (const food of foods) {
      const rid = food.restaurant?.id;
      if (!rid) continue;
  
      if (!map.has(rid)) {
        map.set(rid, { restaurant: food.restaurant, foods: [food] });
      } else {
        map.get(rid)!.foods.push(food);
      }
    }
  
    return Array.from(map.values()).sort((a, b) => b.foods.length - a.foods.length);
  }, [foods]);

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Clear filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Bộ lọc đã chọn</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-orange-600 hover:text-orange-700"
          >
            Xóa tất cả
          </Button>
        </div>
      )}

      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-900">Danh mục</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <Checkbox
              checked={isAllCategoriesSelected}
              onCheckedChange={handleAllCategories}
            />
            <span className="font-medium text-gray-700">Tất cả</span>
          </label>
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Checkbox
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() => handleCategory(cat.id)}
              />
              <span className="text-gray-700">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price ranges */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-900">Khoảng giá</h3>
        <div className="space-y-2">
          {priceRanges.map(range => (
            <label key={range.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Checkbox
                checked={selectedPrices.includes(range.value)}
                onCheckedChange={() => handlePrice(range.value)}
              />
              <span className="text-gray-700">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Radius */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-900">Bán kính giao hàng</h3>
        <Select value={radius.toString()} onValueChange={val => setRadius(Number(val))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn bán kính" />
          </SelectTrigger>
          <SelectContent>
            {radiusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tìm kiếm món ăn</h1>
          <p className="text-gray-600">Khám phá hàng ngàn món ăn ngon từ các nhà hàng gần bạn</p>
        </div>
        
        {/* Search Bar */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[300px]">
                <Input
                  className="pl-4 pr-12 py-3 text-lg border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  placeholder="Tìm kiếm món ăn, nhà hàng..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-orange-100 transition-colors"
                  title="Tìm kiếm bằng hình ảnh"
                  onClick={() => setOpenImageModal(true)}
                >
                  <CameraIcon className="h-5 w-5 text-orange-500" />
                </button>
              </div>
              <Button 
                onClick={handleShowAll}
                variant="outline"
                className="whitespace-nowrap px-6 py-3"
              >
                Hiển thị tất cả
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-80 shrink-0">
            <Card className="sticky top-6 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal className="h-5 w-5 text-gray-700" />
                  <h2 className="font-semibold text-lg text-gray-900">Bộ lọc</h2>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-700">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </div>
                <FiltersContent />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile Filter Button + Sort */}
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div className="flex items-center gap-4">
                {/* Mobile Filters Button */}
                <Button
                  variant="outline"
                  className="lg:hidden flex items-center gap-2"
                  onClick={() => setShowMobileFilters(true)}
                >
                  <Filter className="h-4 w-4" />
                  Bộ lọc
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                {/* Results count */}
                <span className="text-sm text-gray-600">
                  {loading ? "Đang tải..." : `${foods.length} kết quả`}
                </span>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:block">Sắp xếp:</span>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                  Đang tải món ăn...
                </div>
              </div>
            )}

            {/* Empty States */}
            {!loading && foods.length === 0 && !showingAll && debouncedSearch.trim() && (
              <Card className="shadow-sm">
                <CardContent className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CameraIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy món ăn</h3>
                  <p className="text-gray-600 mb-4">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                  <Button onClick={handleShowAll} variant="outline">
                    Xem tất cả món ăn
                  </Button>
                </CardContent>
              </Card>
            )}

            {!loading && foods.length === 0 && !debouncedSearch.trim() && !showingAll && (
              <Card className="shadow-sm">
                <CardContent className="text-center py-16">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Bắt đầu tìm kiếm</h3>
                  <p className="text-gray-600 mb-4">Nhập tên món ăn để tìm kiếm hoặc xem tất cả</p>
                  <Button onClick={handleShowAll}>
                    Hiển thị tất cả món ăn
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Results - Horizontal Scrollable Layout */}
            {!loading && foods.length > 0 && (
              <div className="space-y-8">
                {groupedByRestaurant.map(group => (
                  <div key={group.restaurant.id} className="space-y-4">
                    {/* Restaurant Header */}
                    <div className="border-b border-gray-200 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {group.restaurant.avatar ? (
                            <img 
                              src={group.restaurant.avatar} 
                              alt={group.restaurant.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                              <span className="text-orange-600 font-bold text-lg">
                                {group.restaurant.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-gray-900 truncate">
                            {group.restaurant.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            {group.restaurant.rating && (
                              <span className="flex items-center gap-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="font-medium">{group.restaurant.rating}</span>
                              </span>
                            )}
                            {group.restaurant.distance && (
                              <span className="flex items-center gap-1">
                                <span>📍</span>
                                {group.restaurant.distance} km
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <span>🍽️</span>
                              {group.foods.length} món
                            </span>
                            {group.restaurant.deliveryTime && (
                              <span className="flex items-center gap-1">
                                <span>⏱️</span>
                                {group.restaurant.deliveryTime} phút
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Scrollable Foods */}
                    <div className="relative">
                      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2" 
                           style={{ scrollSnapType: 'x mandatory' }}>
                        {group.foods.map(food => (
                          <Card 
                            key={food.id} 
                            className="flex-shrink-0 w-64 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                            style={{ scrollSnapAlign: 'start' }}
                          >
                            <div className="aspect-[4/3] relative overflow-hidden">
                              <img 
                                src={food.image || food.imageUrls?.[0] || '/placeholder-food.jpg'} 
                                alt={food.name}
                                className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                              />
                              {food.discountPercent && (
                                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-sm">
                                  -{food.discountPercent}%
                                </div>
                              )}
                              {food.status === 'soldout' && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white font-semibold">Hết hàng</span>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-sm">
                                {food.name}
                              </h4>
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                                {food.description}
                              </p>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-orange-600 text-sm">
                                  {typeof food.price === 'number' 
                                    ? food.price.toLocaleString('vi-VN') + 'đ'
                                    : food.price
                                  }
                                </span>
                                {food.rating && (
                                  <span className="text-xs text-gray-600 flex items-center gap-1">
                                    <span className="text-yellow-500">⭐</span>
                                    {food.rating}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                {food.preparationTime && (
                                  <span className="flex items-center gap-1">
                                    <span>⏱️</span>
                                    {food.preparationTime} phút
                                  </span>
                                )}
                                {food.soldCount && (
                                  <span className="flex items-center gap-1">
                                    <span>🔥</span>
                                    Đã bán {food.soldCount}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        {/* Show more card */}
                        {group.foods.length > 5 && (
                          <Card className="flex-shrink-0 w-32 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 border-gray-300">
                            <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center">
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                                <span className="text-orange-600 text-sm">→</span>
                              </div>
                              <span className="text-sm text-gray-600 font-medium">
                                Xem thêm
                              </span>
                              <span className="text-xs text-gray-500 mt-1">
                                +{group.foods.length - 5} món
                              </span>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      
                      {/* Scroll indicators - optional */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow-md hidden group-hover:block">
                        <span className="text-gray-600 text-sm">→</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Alternative: Simple Food Grid (commented out)
            {!loading && foods.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {foods.map(food => (
                  <Card key={food.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square relative overflow-hidden">
                      <img 
                        src={food.image || food.imageUrls?.[0] || '/placeholder-food.jpg'} 
                        alt={food.name}
                        className="w-full h-full object-cover"
                      />
                      {food.discountPercent && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          -{food.discountPercent}%
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                        {food.name}
                      </h4>
                      <p className="text-sm text-orange-600 mb-2">
                        {food.restaurant?.name}
                      </p>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {food.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-orange-600">
                          {typeof food.price === 'number' 
                            ? food.price.toLocaleString('vi-VN') + 'đ'
                            : food.price
                          }
                        </span>
                        {food.rating && (
                          <span className="text-sm text-gray-600">
                            ⭐ {food.rating}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        {food.preparationTime && (
                          <span>⏱️ {food.preparationTime} phút</span>
                        )}
                        {food.restaurant?.distance && (
                          <span>📍 {food.restaurant.distance} km</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            */}
          </main>
        </div>

        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[85vh] overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Bộ lọc</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileFilters(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
                <FiltersContent />
              </div>
              <div className="p-4 border-t bg-white">
                <Button
                  className="w-full"
                  onClick={() => setShowMobileFilters(false)}
                >
                  Áp dụng bộ lọc
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Image search modal */}
      <ImageSearchModal open={openImageModal} onClose={() => setOpenImageModal(false)} />
    </div>
  );
}