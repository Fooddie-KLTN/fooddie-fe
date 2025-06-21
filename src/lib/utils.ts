import { FoodPreview } from "@/interface";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrice(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

/**
 * Food availability status constants
 */
export const FOOD_STATUS = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  PENDING: 'pending',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
  REJECTED: 'rejected'
} 

/**
 * Check if a single food item is available for purchase
 */
export function isFoodAvailable(food: FoodPreview): boolean {
  if (!food) return false;
  
  // Food must have 'available' status
  const isStatusAvailable = food.status === FOOD_STATUS.AVAILABLE;
  
  // Restaurant must also be active (if restaurant info is present)
  const isRestaurantActive = !food.restaurant?.status || 
                            food.restaurant.status === 'active' || 
                            food.restaurant.status === 'approved';
  
  return isStatusAvailable && isRestaurantActive;
}

/**
 * Check if a single food item is unavailable
 */
export function isFoodUnavailable(food: FoodPreview): boolean {
  if (!food) return true;
  
  // Food is unavailable if status is explicitly unavailable or if restaurant is inactive
  const isStatusUnavailable = food.status === FOOD_STATUS.UNAVAILABLE;
  const isRestaurantInactive = food.restaurant?.status && 
                              food.restaurant.status !== 'active' && 
                              food.restaurant.status !== 'approved';
  
  return isStatusUnavailable || !!isRestaurantInactive;
}

/**
 * Get all available foods from an array
 * @param foods Array of food items
 * @returns Promise resolving to array of available foods
 */
export function getAvailableFood(foods: FoodPreview[]): Promise<FoodPreview[]> {
  return new Promise((resolve) => {
    try {
      const availableFoods = foods.filter(isFoodAvailable);
      resolve(availableFoods);
    } catch (error) {
      console.error('Error filtering available foods:', error);
      resolve([]);
    }
  });
}

/**
 * Get all available foods synchronously
 * @param foods Array of food items
 * @returns Array of available foods
 */
export function getAvailableFoodSync(foods: FoodPreview[]): FoodPreview[] {
  try {
    return foods.filter(isFoodAvailable);
  } catch (error) {
    console.error('Error filtering available foods:', error);
    return [];
  }
}

/**
 * Get all unavailable foods from an array
 * @param foods Array of food items
 * @returns Promise resolving to array of unavailable foods
 */
export function getUnavailableFood(foods: FoodPreview[]): Promise<FoodPreview[]> {
  return new Promise((resolve) => {
    try {
      const unavailableFoods = foods.filter(isFoodUnavailable);
      resolve(unavailableFoods);
    } catch (error) {
      console.error('Error filtering unavailable foods:', error);
      resolve([]);
    }
  });
}

/**
 * Get all unavailable foods synchronously
 * @param foods Array of food items
 * @returns Array of unavailable foods
 */
export function getUnavailableFoodSync(foods: FoodPreview[]): FoodPreview[] {
  try {
    return foods.filter(isFoodUnavailable);
  } catch (error) {
    console.error('Error filtering unavailable foods:', error);
    return [];
  }
}

/**
 * Get foods by specific status
 * @param foods Array of food items
 * @param status Status to filter by
 * @returns Promise resolving to array of foods with specified status
 */
export function getFoodsByStatus(foods: FoodPreview[], status: string): Promise<FoodPreview[]> {
  return new Promise((resolve) => {
    try {
      const filteredFoods = foods.filter(food => food.status === status);
      resolve(filteredFoods);
    } catch (error) {
      console.error(`Error filtering foods by status ${status}:`, error);
      resolve([]);
    }
  });
}

/**
 * Get foods by specific status synchronously
 * @param foods Array of food items
 * @param status Status to filter by
 * @returns Array of foods with specified status
 */
export function getFoodsByStatusSync(foods: FoodPreview[], status: string): FoodPreview[] {
  try {
    return foods.filter(food => food.status === status);
  } catch (error) {
    console.error(`Error filtering foods by status ${status}:`, error);
    return [];
  }
}

/**
 * Get foods grouped by availability status
 * @param foods Array of food items
 * @returns Promise resolving to object with categorized foods
 */
export function getFoodsGroupedByAvailability(foods: FoodPreview[]): Promise<{
  available: FoodPreview[];
  unavailable: FoodPreview[];
  pending: FoodPreview[];
  hidden: FoodPreview[];
  other: FoodPreview[];
}> {
  return new Promise((resolve) => {
    try {
      const grouped = {
        available: foods.filter(food => food.status === FOOD_STATUS.AVAILABLE && isFoodAvailable(food)),
        unavailable: foods.filter(food => food.status === FOOD_STATUS.UNAVAILABLE || isFoodUnavailable(food)),
        pending: foods.filter(food => food.status === FOOD_STATUS.PENDING),
        hidden: foods.filter(food => food.status === FOOD_STATUS.HIDDEN),
        other: foods.filter(food => !food.status || ![
          FOOD_STATUS.AVAILABLE, 
          FOOD_STATUS.UNAVAILABLE, 
          FOOD_STATUS.PENDING, 
          FOOD_STATUS.HIDDEN
        ].includes(food.status))
      };
      
      resolve(grouped);
    } catch (error) {
      console.error('Error grouping foods by availability:', error);
      resolve({
        available: [],
        unavailable: [],
        pending: [],
        hidden: [],
        other: []
      });
    }
  });
}

/**
 * Get foods statistics
 * @param foods Array of food items
 * @returns Promise resolving to statistics object
 */
export function getFoodStatistics(foods: FoodPreview[]): Promise<{
  total: number;
  available: number;
  unavailable: number;
  pending: number;
  hidden: number;
  availabilityRate: number;
}> {
  return new Promise((resolve) => {
    try {
      const total = foods.length;
      const available = foods.filter(isFoodAvailable).length;
      const unavailable = foods.filter(isFoodUnavailable).length;
      const pending = foods.filter(food => food.status === FOOD_STATUS.PENDING).length;
      const hidden = foods.filter(food => food.status === FOOD_STATUS.HIDDEN).length;
      const availabilityRate = total > 0 ? (available / total) * 100 : 0;

      resolve({
        total,
        available,
        unavailable,
        pending,
        hidden,
        availabilityRate: Math.round(availabilityRate * 100) / 100 // Round to 2 decimal places
      });
    } catch (error) {
      console.error('Error calculating food statistics:', error);
      resolve({
        total: 0,
        available: 0,
        unavailable: 0,
        pending: 0,
        hidden: 0,
        availabilityRate: 0
      });
    }
  });
}

/**
 * Filter foods that can be added to cart (available foods only)
 * @param foods Array of food items
 * @returns Array of foods that can be purchased
 */
export function getCartableFoods(foods: FoodPreview[]): FoodPreview[] {
  return foods.filter(food => {
    // Must be available
    const isAvailable = isFoodAvailable(food);
    
    // Must have valid price
    const hasValidPrice = food.price && (
      typeof food.price === 'number' ? food.price > 0 : parseFloat(food.price.toString()) > 0
    );
    
    // Must have ID for cart operations
    const hasId = !!food.id;
    
    return isAvailable && hasValidPrice && hasId;
  });
}

/**
 * Check if restaurant has any available foods
 * @param restaurant Restaurant object
 * @returns boolean indicating if restaurant has available foods
 */
export function restaurantHasAvailableFoods(restaurant: { foods?: FoodPreview[] }): boolean {
  if (!restaurant.foods || restaurant.foods.length === 0) {
    return false;
  }
  
  return restaurant.foods.some(isFoodAvailable);
}

/**
 * Get user-friendly status text for food status
 * @param status Food status
 * @returns Human-readable status text in Vietnamese
 */
export function getFoodStatusText(status?: string): string {
  switch (status) {
    case FOOD_STATUS.AVAILABLE:
      return 'Có sẵn';
    case FOOD_STATUS.UNAVAILABLE:
      return 'Tạm hết hàng';
    case FOOD_STATUS.PENDING:
      return 'Chờ duyệt';
    case FOOD_STATUS.HIDDEN:
      return 'Đã ẩn';
    case FOOD_STATUS.DELETED:
      return 'Đã xóa';
    case FOOD_STATUS.REJECTED:
      return 'Bị từ chối';
    default:
      return 'Không xác định';
  }
}

/**
 * Get CSS classes for food status badge
 * @param status Food status
 * @returns CSS classes for styling status badge
 */
export function getFoodStatusClasses(status?: string): string {
  switch (status) {
    case FOOD_STATUS.AVAILABLE:
      return 'bg-green-100 text-green-800 border-green-200';
    case FOOD_STATUS.UNAVAILABLE:
      return 'bg-red-100 text-red-800 border-red-200';
    case FOOD_STATUS.PENDING:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case FOOD_STATUS.HIDDEN:
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case FOOD_STATUS.DELETED:
      return 'bg-red-100 text-red-800 border-red-200';
    case FOOD_STATUS.REJECTED:
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}