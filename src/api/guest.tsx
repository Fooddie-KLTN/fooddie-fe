import { apiRequest } from "./base-api";
import { FoodPreview, FoodDetail, Restaurant, Category, PromotionType, Review } from "../interface";
import { PaginatedResponse } from "./response.interface";

// Add promotion interface for guest service
export interface GuestPromotionResponse {
  id: string;
  code: string;
  description?: string;
  type: PromotionType;
  discountPercent?: number;
  discountAmount?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  image?: string;
  startDate?: string;
  endDate?: string;
  numberOfUsed?: number;
  maxUsage?: number;
}

export const guestService = {
    food: {
        async getFoodsWithQuerry(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getFoodsWithDiscount(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/with-discount`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getTopSellingFoods(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/top-selling`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getNewestFoods(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/newest`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getFoodsByCategory(
            categoryId: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/category/${categoryId}`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getFoodsByRestaurant(
            restaurantId: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/restaurant/${restaurantId}`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getFoodsByCategoryAndRestaurant(
            categoryId: string,
            restaurantId: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/category/${categoryId}/restaurant/${restaurantId}`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getFoodsWithDiscountByRestaurant(
            restaurantId: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/restaurant/${restaurantId}/with-discount`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getTopSellingFoodsByRestaurant(
            restaurantId: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/restaurant/${restaurantId}/top-selling`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getFoodById(
            id: string,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<FoodDetail> {
            return apiRequest<FoodDetail>(`/foods/${id}`, "GET", { query: { lat, lng } });
        },
        async searchFoods(
            query: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
            radius: number = 5
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/search`, "GET", { query: { query, page, pageSize, lat, lng, radius } });
        },
        async getFoodReviews(
            foodId: string,
            page: number = 1,
            pageSize: number = 10
        ): Promise<PaginatedResponse<Review>> {
            return apiRequest<PaginatedResponse<Review>>(
                `/foods/${foodId}/reviews`,
                "GET",
                { query: { page, pageSize } }
            );
        },
            
        async searchFoodsByName(
            name: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.7009,
            radius: number = 5,
            categoryIds?: string[],
            minPrice?: number,
            maxPrice?: number
        ): Promise<PaginatedResponse<FoodPreview>> {
            return apiRequest<PaginatedResponse<FoodPreview>>(`/foods/by-name`, "GET", {
                query: {
                    name,
                    page,
                    pageSize,
                    lat,
                    lng,
                    radius,
                    ...(categoryIds && categoryIds.length > 0 ? { categoryIds: categoryIds.join(",") } : {}),
                    ...(minPrice !== undefined ? { minPrice } : {}),
                    ...(maxPrice !== undefined ? { maxPrice } : {}),
                }
            });
        },
    },
    restaurant: {
        async getRestaurants(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<Restaurant>> {
            return apiRequest<PaginatedResponse<Restaurant>>(`/restaurants`, "GET", { query: { page, pageSize, lat, lng } });
        },
        getPopularRestaurants: async (
            lat: number = 10.7769,
            lng: number = 106.6951
        ): Promise<{ items: (Restaurant & { foods: FoodPreview[] })[] }> => {
            return apiRequest<{ items: (Restaurant & { foods: FoodPreview[] })[] }>(
                `/restaurants/popular`,
                "GET",
                { query: { lat, lng } }
            );
        },
        async getAllRestaurants(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<Restaurant>> {
            return apiRequest<PaginatedResponse<Restaurant>>(`/restaurants`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getPreviewRestaurants(
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<PaginatedResponse<Restaurant>> {
            return apiRequest<PaginatedResponse<Restaurant>>(`/restaurants/preview`, "GET", { query: { page, pageSize, lat, lng } });
        },
        async getRestaurantById(
            id: string,
            lat: number = 10.7769,
            lng: number = 106.6951,
        ): Promise<Restaurant> {
            return apiRequest<Restaurant>(`/restaurants/${id}`, "GET", { query: { lat, lng } });
        },
        async searchRestaurants(
            name: string,
            page: number = 1,
            pageSize: number = 10,
            lat: number = 10.7769,
            lng: number = 106.6951,
            radius: number = 5
        ): Promise<PaginatedResponse<Restaurant>> {
            return apiRequest<PaginatedResponse<Restaurant>>(`/restaurants/search`, "GET", { query: { name, page, pageSize, lat, lng, radius } });
        },
    },
    category: {
        async getCategories(
            page: number = 1,
            pageSize: number = 20
        ): Promise<PaginatedResponse<Category>> {
            return apiRequest<PaginatedResponse<Category>>(`/categories`, "GET", { query: { page, pageSize } });
        },
        async getCategoryById(id: string): Promise<Category> {
            return apiRequest<Category>(`/categories/${id}`, "GET");
        }
    },
    promotion: {
        /**
         * Get active promotions available for public use
         * These are promotions that are currently valid and can be used by customers
         */
        async getActivePromotions(
            page: number = 1,
            pageSize: number = 10,
            name?: string
        ): Promise<PaginatedResponse<GuestPromotionResponse>> {
            return apiRequest<PaginatedResponse<GuestPromotionResponse>>(`/promotions/all`, "GET", { 
                query: { page, pageSize, ...(name && { name }) } 
            });
        },

        /**
         * Get a specific promotion by ID (public access)
         * Useful for displaying promotion details when user clicks on a promotion
         */
        async getPromotionById(id: string): Promise<GuestPromotionResponse> {
            return apiRequest<GuestPromotionResponse>(`/promotions/${id}`, "GET");
        },

        /**
         * Validate a promotion code
         * Check if a promotion code is valid and can be applied to an order
         */
        async validatePromotionCode(
            code: string,
            orderTotal?: number
        ): Promise<{
            valid: boolean;
            promotion?: GuestPromotionResponse;
            discountAmount?: number;
            error?: string;
        }> {
            return apiRequest<{
                valid: boolean;
                promotion?: GuestPromotionResponse;
                discountAmount?: number;
                error?: string;
            }>(`/promotions/validate`, "POST", { 
                data: { code, orderTotal } 
            });
        }
    }
};