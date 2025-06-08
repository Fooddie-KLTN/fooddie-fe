"use client";

import { useEffect, useMemo, useState } from "react";
import { guestService } from "@/api/guest";
import { FoodPreview, Category } from "@/interface";
import { useDebounce } from "@/hooks/use-debounce";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const priceRanges = [
  { label: "Dưới 50.000đ", value: "under50", min: 0, max: 50000 },
  { label: "50.000đ - 100.000đ", value: "50to100", min: 50000, max: 100000 },
  { label: "Trên 100.000đ", value: "over100", min: 100000, max: Infinity },
];

const radiusOptions = [
  { label: "1 km", value: 1 },
  { label: "3 km", value: 3 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
    { label: "20 km", value: 20 },
    { label: "50 km", value: 50 },
    { label: "100 km", value: 100 },
];

export default function FoodSearchPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [foods, setFoods] = useState<FoodPreview[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [radius, setRadius] = useState(5);
  const [loading, setLoading] = useState(false);

  // Price filter logic
  const minPrice = useMemo(() => {
    if (selectedPrices.length === 0) return undefined;
    return Math.min(...selectedPrices.map(val => priceRanges.find(r => r.value === val)?.min ?? 0));
  }, [selectedPrices]);
  const maxPrice = useMemo(() => {
    if (selectedPrices.length === 0) return undefined;
    return Math.max(...selectedPrices.map(val => priceRanges.find(r => r.value === val)?.max ?? Infinity));
  }, [selectedPrices]);

  // Fetch categories
  useEffect(() => {
    guestService.category.getCategories(1, 50).then(res => {
      setCategories(res.items ?? []);
    });
  }, []);

  // Fetch foods by search and filters
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setFoods([]);
      return;
    }
    setLoading(true);
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
  }, [debouncedSearch, selectedCategories, minPrice, maxPrice, radius]);

  // Handle category checkbox
  const handleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Handle price checkbox
  const handlePrice = (value: string) => {
    setSelectedPrices(prev =>
      prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Tìm kiếm món ăn</h1>
      <form
        onSubmit={e => { e.preventDefault(); }}
        className="mb-6 flex gap-2"
      >
        <Input
          className="border rounded px-3 py-2 w-full max-w-md"
          placeholder="Nhập tên món ăn hoặc nhà hàng..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </form>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters */}
        <aside className="md:w-1/4">
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Danh mục</h2>
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
          {loading && <div>Đang tải...</div>}
          {!loading && foods.length === 0 && (
            <div>Không tìm thấy món ăn phù hợp.</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {foods.map(food => (
              <div key={food.id} className="border rounded-lg p-4 bg-white shadow">
                <img
                  src={food.image}
                  alt={food.name}
                  className="w-full h-40 object-cover rounded mb-2"
                />
                <h3 className="font-bold text-lg">{food.name}</h3>
                <div className="text-sm text-gray-500 mb-1">{food.category?.name}</div>
                <div className="mb-1">
                  <span className="font-semibold text-primary">
                    {typeof food.price === "number"
                      ? food.price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
                      : food.price}
                  </span>
                  {food.discountPercent && (
                    <span className="ml-2 text-red-500">-{food.discountPercent}%</span>
                  )}
                </div>
                <div className="text-sm text-gray-700 mb-1">
                  Nhà hàng: <span className="font-medium">{food.restaurant?.name}</span>
                </div>
                <div className="text-xs text-gray-400">{food.description}</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}