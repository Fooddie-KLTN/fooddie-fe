"use client";

import { useState, useMemo, useEffect } from "react";
import CategorySection from "./_components/ui/category";
import FoodGrid from "./_components/ui/food-grid";
import HeroSection from "./_components/ui/hero-section";
import PromotionSection from "./_components/ui/promotion";
import FoodRow from "./_components/ui/food-row";
import { FoodPreview, Category, Restaurant } from "@/interface";
import RestaurantCard from "./_components/restaurant-card";
import { guestService, GuestPromotionResponse } from "@/api/guest";
import { useGeo } from "@/context/geolocation-context";
import { useDebounce } from "@/hooks/use-debounce";

export default function Home() {
  const { location } = useGeo();

  const [foods, setFoods] = useState<FoodPreview[]>([]);
  const [topSellingFoods, setTopSellingFoods] = useState<FoodPreview[]>([]);
  const [nearbyFoods, setNearbyFoods] = useState<FoodPreview[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<GuestPromotionResponse[]>([]);

  // Thêm state cho kết quả tìm kiếm
  const [searchedFoods, setSearchedFoods] = useState<FoodPreview[] | null>(null);
  const [suggestFoods, setSuggestFoods] = useState<FoodPreview[]>([]);
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Fetch data từ API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          foodsRes,
          topSellingRes,
          nearbyRes,
          restaurantsRes,
          categoriesRes,
          promotionsRes
        ] = await Promise.all([
          guestService.food.getFoodsWithQuerry(1, 20, location?.lat || 10.7769, location?.lng || 106.6951),
          guestService.food.getTopSellingFoods(1, 8, location?.lat || 10.7769, location?.lng || 106.6951),
          guestService.food.getFoodsWithQuerry(1, 20, location?.lat, location?.lng),
          guestService.restaurant.getPopularRestaurants(location?.lat || 10.7769, location?.lng || 106.6951),
          guestService.category.getCategories(1, 20),
          guestService.promotion.getActivePromotions(1, 10)
        ]);
        setFoods(foodsRes.items ?? []);
        setTopSellingFoods(topSellingRes.items ?? []);
        setNearbyFoods(nearbyRes.items ?? []);
        setRestaurants(restaurantsRes.items ?? []);
        setCategories(categoriesRes.items ?? []);
        setPromotions(promotionsRes?.items ?? []);
      } catch (error) {
        console.error("Không thể lấy dữ liệu:", error);
        setFoods([]);
        setTopSellingFoods([]);
        setNearbyFoods([]);
        setRestaurants([]);
        setCategories([]);
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hàm tìm kiếm món ăn qua API
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchedFoods(null);
      return;
    }
    setLoading(true);
    try {
      const res = await guestService.food.searchFoods(
        searchQuery,
        1,
        20,
        location?.lat || 10.7769,
        location?.lng || 106.6951
      );
      setSearchedFoods(res.items ?? []);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Lỗi tìm kiếm:", error.message);
      }
      setSearchedFoods([]);
    } finally {
      setLoading(false);
    }
  };

  // Gợi ý 3 món ăn khi nhập tìm kiếm
  useEffect(() => {
    const fetchSuggestFoods = async () => {
      if (!debouncedSearch.trim()) {
        setSuggestFoods([]);
        return;
      }
      try {
        const res = await guestService.food.searchFoods(
          debouncedSearch,
          1,
          3,
          location?.lat || 10.7769,
          location?.lng || 106.6951
        );
        setSuggestFoods(res.items ?? []);
      } catch {
        setSuggestFoods([]);
      }
    };
    fetchSuggestFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, location]);

  // Lọc theo danh mục
  const filteredFoods = useMemo(
    () =>
      activeCategory === "All"
        ? foods
        : foods.filter((food) => food.category?.name === activeCategory),
    [foods, activeCategory]
  );

  // Nếu có kết quả tìm kiếm thì ưu tiên hiển thị, không thì hiển thị theo danh mục
  const foodsToShow = searchedFoods !== null ? searchedFoods : filteredFoods;

  // Get foods by restaurant id
  const getFoodsByRestaurantId = (restaurantId: string) => {
    return foods.filter((food) => food.restaurant.id === restaurantId);
  };

  // Định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <>
      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        suggestFoods={suggestFoods} // truyền xuống nếu muốn hiển thị gợi ý
      />

      <div className="container mx-auto px-4 py-10">
        <PromotionSection promotions={promotions} />

        <h1 className="text-2xl font-bold mb-6">Danh sách cửa hàng</h1>
        <div className="container mx-auto px-4 py-8">
          <RestaurantCard restaurants={restaurants} getFoods={getFoodsByRestaurantId} />
        </div>
        <FoodRow
          foods={topSellingFoods}
          formatPrice={formatPrice}
          name="Nổi tiếng"
          viewAllLink="/foods"
        />

        <FoodRow
          foods={nearbyFoods}
          formatPrice={formatPrice}
          name="Gần đây"
          viewAllLink="/foods"
        />

        <CategorySection
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <FoodGrid
          name={activeCategory === "All" ? "Tất cả món ăn" : activeCategory}
          foods={foodsToShow}
          formatPrice={formatPrice}
        />
      </div>
    </>
  );
}