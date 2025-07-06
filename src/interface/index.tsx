/* eslint-disable @typescript-eslint/no-explicit-any */
import { BackendUser } from "@/api/auth";
import { FOOD_STATUS } from "@/lib/utils";

export enum RestaurantStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface Category {
  id: string;
  name: string;
  image: string;
  icon?: string;
}

// --- Interfaces ---
export interface Province {
  id: number;
  name: string;
}
 
export interface District {
  id: number;
  name: string;
}

export interface Ward {
  id: number;
  name: string;
}

export interface Address {
    id?: string; // Unique ID for each address (e.g., UUID or DB ID)
    label?: string; // Optional label like "Home", "Work"
    street: string;
    ward: string;
    district: string;
    city: string;
    isDefault?: boolean; // Mark one as default
    latitude?: number; // For precise location
    longitude?: number; // For precise location
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  birthday?: string;
  address?: Address[]; // Changed to array

  currentAddress?: Address; // Optional: Current address for quick access
}

/**
 * Interface for restaurant details
 */
export interface Restaurant {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  status?: string;
  phoneNumber?: string;
  openTime?: string;
  closeTime?: string;
  licenseCode?: string;
  distance?: number | string; // Distance in km
  deliveryTime?: number | string; // Delivery time in minutes
  rating?: number; // Average rating
  certificateImage?: string;
  backgroundImage?: string;
  latitude?: string | number;  // It appears as string in your data
  longitude?: string | number; // It appears as string in your data
  foods?: FoodPreview[];
  owner?: {
    id: string;
    name: string;
    username?: string;
    email?: string;
    phone?: string | null;
    avatar?: string | null;
    isActive?: boolean;
    role?: {
      id: string;
      name: string;
      displayName: string;
      description: string;
      isSystem: boolean;
    }
  };
  address?: {
    id?: string;
    street: string;
    ward: string;
    district: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
}

// Type for food status using the FOOD_STATUS const
export type FoodStatus = typeof FOOD_STATUS[keyof typeof FOOD_STATUS];

/**
 * Food preview interface for lists, cards, and rows
 */
export interface FoodPreview {
  id?: string;
  imageUrls: string[]; // Array of image URLs
  name: string;
  description: string;
  price: number | string; // Price can be a number or string
  image: string;
  discountPercent?: number;
  status?: FoodStatus; // Now uses the FOOD_STATUS const type
  tag?: string;
  preparationTime?: number;
  rating?: number;
  popular?: boolean;
  distance?: number; // Distance in km
  purchasedNumber?: number; // Renamed to match backend
  createdAt?: Date;
  updatedAt?: Date;
  soldCount?: number; // Number of items sold
  
  // Related information
  category?: Category;
  restaurant: Restaurant;
}

export interface Review {
  id?: string;
  foodId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  image: string; // Optional image URL for the review
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

/**
 * Detailed food information with complete data
 */
export interface FoodDetail extends FoodPreview {
  soldCount: number; // Number of items sold

  // Full related objects
  category: Category;
  restaurant: Restaurant;
  toppings?: Topping[]; // Optional toppings array

  reviews?: Review[]; // Optional reviews array

  totalReviews?: number; // <-- Added: total number of reviews
}

export interface Topping {
  id: string;
  name: string;
  price: number | string; // Price can be a number or string
  image?: string; // Optional image URL
  isAvailable?: boolean; // Optional availability flag
  createdAt?: Date;
  updatedAt?: Date;
}
/**
 * Cart item format compatible with cart context
 */
export interface CartItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
  discountPercent?: number;
  restaurantId?: string;
}

export interface OrderDetail {
  id: string;
  order: string | Order; // Usually just orderId, but can be populated
  food: FoodPreview;
  varity?: string;
  quantity: number;
  price: number | string;
  note?: string;
}

export enum PromotionType {
  FOOD_DISCOUNT = 'FOOD_DISCOUNT',
  SHIPPING_DISCOUNT = 'SHIPPING_DISCOUNT'
}

export interface Promotion {
  id: string;
  code: string;
  description?: string;
  type: PromotionType;
  discountPercent?: number;
  discountAmount?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  image?: string;
  startDate?: Date;
  endDate?: Date;
  numberOfUsed?: number;
  maxUsage?: number;
}

export interface Order {
  id: string;
  user?: UserProfile;
  restaurant?: Restaurant;
  total?: number;
  note?: string;
  status?: 'pending' | 'confirmed' | 'delivering' | 'shipper_received' | 'completed' | 'canceled' | 'processing_payment' | string;
  createdAt: string;
  updatedAt: string;
  promotionCode?: Promotion;
  date?: string;
  address?: Address;
  orderDetails: OrderDetail[];
  shippingDetail?: ShippingDetail;
  paymentMethod?: string;
  paymentDate?: string;
  isPaid: boolean;
}

export enum ShippingStatus {
    PENDING = 'PENDING',
    SHIPPING = 'SHIPPING',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    RETURNED = 'RETURNED',
}

export interface ShippingDetail {
  id?: string;
  order: Order;
  shipper: UserProfile;
  status: ShippingStatus;
}

/**
 * Helper function to convert food to cart item
 */
export function foodToCartItem(food: FoodPreview, quantity: number = 1): CartItem {
  return {
    id: food.id || '',
    name: food.name,
    description: food.description,
    price: food.price ? parseFloat(food.price.toString()) : 0,
    image: food.image,
    quantity: quantity,
    discountPercent: food.discountPercent,
    restaurantId: food.restaurant?.id
  };
}

/**
 * Type guard to check if a food status is valid
 */
export function isValidFoodStatus(status: string): status is FoodStatus {
  return Object.values(FOOD_STATUS).includes(status as FoodStatus);
}

/**
 * Helper function to safely get food status with fallback
 */
export function getFoodStatus(food: FoodPreview): FoodStatus {
  if (food.status && isValidFoodStatus(food.status)) {
    return food.status;
  }
  return FOOD_STATUS.PENDING; // Default fallback
}

export enum ConversationType {
  CUSTOMER_SHOP = 'customer_shop',
  CUSTOMER_SHIPPER = 'customer_shipper',
  SUPPORT = 'support'
}

export interface Message {
  id: string;
  conversation: Conversation | string;
  sender: BackendUser | UserProfile;
  content: string;
  messageType?: string; // 'text', 'image', 'file', 'location', 'order_update'
  attachmentUrl?: string;
  attachmentType?: string;
  isRead: boolean;
  readAt?: Date;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any; // For storing additional data like order info, location coordinates, etc.
  replyToMessageId?: string; // For reply functionality
}

export interface Conversation {
  id: string;
  participant1: UserProfile;
  participant2: UserProfile;
  lastMessage?: string;
  lastMessageAt?: Date;
  isBlocked: boolean;
  blockedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
  conversationType: ConversationType;
  orderId?: string; // Required for customer-shipper conversations
  restaurantId?: string; // Required for customer-shop conversations
}

/**
 * DTO interfaces for messenger
 */
export interface CreateConversationDto {
  participantId?: string; //  shipper ID if type is CUSTOMER_SHIPPER
  orderId?: string; // Required for shipper conversations
  restaurantId?: string; // Required for shop conversations
  conversationType?: ConversationType;
}

export interface SendMessageDto {
  conversationId: string;
  content: string;
  messageType?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  replyToMessageId?: string;
  metadata?: any;
}

export interface Notification {
  id: string;
  description?: string | null;
  content?: string | null;
  receiveUser?: string | null;
  createdAt: string; // or Date, but your BE returns ISO string
  isRead?: boolean | null;
  type?: string | null;
}

export type OwnerNotification =
  | ({
      type: "order";
      total: number;
      user?: { name: string };
      orderDetails?: { length: number };
    } & { id: string; createdAt: string })
  | ({
      type: "message";
      content: string;
      sender: string;
    } & { id: string; createdAt: string });