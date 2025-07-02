"use client";

import { guestService } from "@/api/guest";
import { FoodPreview } from "@/interface";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNotification } from "@/components/ui/notification";

// Cart item kèm id nhà hàng
interface CartItem {
  foodId: string;
  quantity: number;
  restaurantId: string;
}

interface GroupedCartItem {
  restaurant: FoodPreview["restaurant"];
  items: (FoodPreview & { quantity: number })[];
}

interface CartContextType {
  cartItems: CartItem[];
  groupedCartItems: GroupedCartItem[];
  addToCart: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  getCartItems: () => Promise<(FoodPreview & { quantity: number })[]>;
  getCartItemsGrouped: () => Promise<Record<string, (FoodPreview & { quantity: number })[]>>;
  getTotalItems: () => number;
  getTotalPrice: () => Promise<number>;
  removeInvalidCartItems: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [groupedCartItems, setGroupedCartItems] = useState<GroupedCartItem[]>([]);
  const { showNotification } = useNotification();

  useEffect(() => {
    const stored = localStorage.getItem("multiCartItems");
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch {
        setCartItems([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("multiCartItems", JSON.stringify(cartItems));
    updateGroupedItems();
  }, [cartItems]);

  const updateGroupedItems = async () => {
    const groupedMap = new Map<string, GroupedCartItem>();

    for (const item of cartItems) {
      try {
        const food = await guestService.food.getFoodById(item.foodId);
        if (!food || !food.restaurant) continue;

        if (!groupedMap.has(food.restaurant.id)) {
          groupedMap.set(food.restaurant.id, {
            restaurant: food.restaurant,
            items: [],
          });
        }

        groupedMap.get(food.restaurant.id)!.items.push({ ...food, quantity: item.quantity });
      } catch {
        // ignore
      }
    }

    setGroupedCartItems(Array.from(groupedMap.values()));
  };

  const addToCart = async (itemId: string) => {
    try {
      const food = await guestService.food.getFoodById(itemId);
      if (!food || !food.restaurant?.id) {
        showNotification("Món ăn không hợp lệ.", "error");
        return;
      }

      setCartItems((prevItems) => {
        const existing = prevItems.find(item => item.foodId === itemId);
        if (existing) {
          return prevItems.map(item =>
            item.foodId === itemId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prevItems, { foodId: itemId, quantity: 1, restaurantId: food.restaurant.id }];
      });

      showNotification("Đã thêm món vào giỏ hàng.", "success");
    } catch {
      showNotification("Lỗi khi thêm món vào giỏ hàng.", "error");
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter(item => item.foodId !== itemId));
    showNotification("Đã xoá món khỏi giỏ hàng.", "info");
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map(item =>
        item.foodId === itemId ? { ...item, quantity } : item
      )
    );
  };

  const getCartItems = async (): Promise<(FoodPreview & { quantity: number })[]> => {
    const results: (FoodPreview & { quantity: number })[] = [];
    for (const cartItem of cartItems) {
      try {
        const food = await guestService.food.getFoodById(cartItem.foodId);
        if (food) {
          results.push({ ...food, quantity: cartItem.quantity });
        }
      } catch {}
    }
    return results;
  };

  const getCartItemsGrouped = async (): Promise<Record<string, (FoodPreview & { quantity: number })[]>> => {
    const grouped: Record<string, (FoodPreview & { quantity: number })[]> = {};
    for (const item of cartItems) {
      try {
        const food = await guestService.food.getFoodById(item.foodId);
        if (!food) continue;

        if (!grouped[item.restaurantId]) {
          grouped[item.restaurantId] = [];
        }
        grouped[item.restaurantId].push({ ...food, quantity: item.quantity });
      } catch {}
    }
    return grouped;
  };

  const getTotalItems = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  const getTotalPrice = async () => {
    const items = await getCartItems();
    return items.reduce((acc, item) => acc + item.quantity * Number(item.price), 0);
  };

  const removeInvalidCartItems = async () => {
    const valid: CartItem[] = [];
    for (const item of cartItems) {
      try {
        const food = await guestService.food.getFoodById(item.foodId);
        if (food) valid.push(item);
      } catch {}
    }
    setCartItems(valid);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        groupedCartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartItems,
        getCartItemsGrouped,
        getTotalItems,
        getTotalPrice,
        removeInvalidCartItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};
