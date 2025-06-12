"use client";

import { useEffect, useMemo, useState } from "react";
import { guestService } from "@/api/guest";
import { FoodPreview, Category } from "@/interface";
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
import FoodCard from "../_components/food-card";

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
  { label: "Tất cả", value: 999999 }, // Use a large number for "All"
];

export default function FoodSearchPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [foods, setFoods] = useState<FoodPreview[]>([]);
  const [allFoods, setAllFoods] = useState<FoodPreview[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [radius, setRadius] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [showingAll, setShowingAll] = useState(true); // Start with showing all

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

  // Format price function
  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  // Fetch categories and initial foods
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch categories
        const categoriesRes = await guestService.category.getCategories(1, 50);
        const fetchedCategories = categoriesRes.items ?? [];
        setCategories(fetchedCategories);
        
        // Set all categories as selected initially
        setSelectedCategories(fetchedCategories.map(cat => cat.id));
        
        // Fetch all foods on initial load
        setLoading(true);
        const foodsRes = await guestService.food.searchFoodsByName(
          "",
          1,
          100,
          10.7769,
          106.7009,
          radius,
          fetchedCategories.map(cat => cat.id), // Use all category IDs
          undefined,
          undefined
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
        maxPrice === Infinity ? undefined : maxPrice
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
      // If showing all and no search, apply filters to all foods
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
      maxPrice === Infinity ? undefined : maxPrice
    )
      .then(res => setFoods(res.items ?? []))
      .finally(() => setLoading(false));
  }, [debouncedSearch, selectedCategories, minPrice, maxPrice, radius, showingAll, allFoods, categories.length]);

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

  // Handle show all button
  const handleShowAll = () => {
    setSearch("");
    fetchAllFoods();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Tìm kiếm món ăn</h1>
      
      <div className="mb-6 flex gap-2 flex-wrap">
        <Input
          className="border rounded px-3 py-2 w-full max-w-md"
          placeholder="Nhập tên món ăn hoặc nhà hàng..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button 
          onClick={handleShowAll}
          variant="outline"
          className="whitespace-nowrap"
        >
          Hiển thị tất cả
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters */}
        <aside className="md:w-1/4">
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Danh mục</h2>
            {/* ALL categories option */}
            <label className="flex items-center gap-2 mb-2 font-medium border-b pb-1">
              <Checkbox
                checked={isAllCategoriesSelected}
                onCheckedChange={handleAllCategories}
              />
              Tất cả
            </label>
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-2 mb-1">
                <Checkbox
                  checked={selectedCategories.includes(cat.id)}
                  onCheckedChange={() => handleCategory(cat.id)}
                />
                {cat.name}
              </label>
            ))}
          </div>
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Khoảng giá</h2>
            {priceRanges.map(range => (
              <label key={range.value} className="flex items-center gap-2 mb-1">
                <Checkbox
                  checked={selectedPrices.includes(range.value)}
                  onCheckedChange={() => handlePrice(range.value)}
                />
                {range.label}
              </label>
            ))}
          </div>
          <div>
            <h2 className="font-semibold mb-2">Bán kính</h2>
            <Select value={radius.toString()} onValueChange={val => setRadius(Number(val))}>
              <SelectTrigger className="border rounded px-2 py-1 w-full">
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
        </aside>

        {/* Food results */}
        <main className="flex-1">
          {loading && <div className="text-center py-8">Đang tải...</div>}
          {!loading && foods.length === 0 && !showingAll && debouncedSearch.trim() && (
            <div className="text-center py-8">Không tìm thấy món ăn phù hợp.</div>
          )}
          {!loading && foods.length === 0 && !debouncedSearch.trim() && !showingAll && (
            <div className="text-center py-8">
              <p className="mb-4">Nhập tên món ăn để tìm kiếm hoặc</p>
              <Button onClick={handleShowAll} variant="outline">
                Hiển thị tất cả món ăn
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {foods.map(food => (
              <FoodCard
                key={food.id}
                food={food}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}