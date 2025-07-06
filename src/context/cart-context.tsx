"use client";

import { guestService } from "@/api/guest";
import { FoodDetail, FoodPreview, Topping } from "@/interface";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNotification } from "@/components/ui/notification";
import { ToppingSelectModal } from "@/app/(main)/_components/topping-selection";

// Cart item kèm id nhà hàng
interface CartItem {
  uuid: string; // 👈 ID duy nhất
  foodId: string;
  quantity: number;
  restaurantId: string;

  name: string;
  description: string;
  image: string;
  price: number;
  discountPercent?: number;

  toppings: {
    id: string;
    name: string;
    price: number;
  }[];
}



interface GroupedCartItem {
  restaurant: FoodPreview["restaurant"];
  items: CartItem[]; // ✅ Dùng đúng kiểu `CartItem` đã mở rộng
}

interface CartContextType {
  cartItems: CartItem[];
  groupedCartItems: GroupedCartItem[];
  addToCart: (itemId: string) => void;
  addToCartWithToppings: (food: FoodDetail, selectedToppingIds: string[]) => void;
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
  const [pendingFood, setPendingFood] = useState<FoodDetail | null>(null);
  const [toppingOptions, setToppingOptions] = useState<Topping[]>([]);
  const [toppingModalOpen, setToppingModalOpen] = useState(false);
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

  const generateCartItemUUID = (foodId: string, toppingIds: string[]) => {
    const sortedIds = [...toppingIds].sort(); // để đảm bảo consistent
    return `${foodId}__${sortedIds.join("-")}`;
  };
  
  const updateGroupedItems = async () => {
    const groupedMap = new Map<string, GroupedCartItem>();
  
    for (const item of cartItems) {
      try {
        const food = await guestService.food.getFoodById(item.foodId);
        if (!food || !food.restaurant) continue;
  
        const cartItem: CartItem = {
          uuid: item.uuid ?? crypto.randomUUID(),
          foodId: item.foodId,
          name: item.name,
          description: item.description,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          discountPercent: item.discountPercent,
          restaurantId: item.restaurantId,
          toppings: item.toppings || [],
        };
  
        if (!groupedMap.has(item.restaurantId)) {
          groupedMap.set(item.restaurantId, {
            restaurant: food.restaurant,
            items: [],
          });
        }
  
        groupedMap.get(item.restaurantId)!.items.push(cartItem);
      } catch (err) {
        console.warn("Error grouping item:", err);
      }
    }
  
    setGroupedCartItems(Array.from(groupedMap.values()));
  };
  

  const addToCart = async (foodId: string) => {
    try {
      const food = await guestService.food.getFoodById(foodId);
      if (!food || !food.restaurant?.id) {
        showNotification("Món ăn không hợp lệ.", "error");
        return;
      }
  
      const toppings = await guestService.food.getToppingsByFoodId(foodId);
  
      if (toppings.length === 0) {
        // Không có topping, thêm thẳng vào giỏ
        setCartItems((prev) => [
          ...prev,
          {
            uuid: food.id,
            foodId: food.id,
            name: food.name,
            description: food.description,
            image: food.image,
            price: Number(food.price),
            discountPercent: food.discountPercent || 0, // 👈 Thêm dòng này
            quantity: 1,
            restaurantId: food.restaurant.id,
            toppings:[],
          } as CartItem // 👈 ép kiểu rõ ràng
        ]);
        
        showNotification("Đã thêm món vào giỏ hàng.", "success");
      } else {
        // Có topping → mở modal cho người dùng chọn
        setPendingFood(food);
        setToppingOptions(toppings);
        setToppingModalOpen(true);
      }
    } catch {
      showNotification("Lỗi khi thêm món vào giỏ hàng.", "error");
    }
  };

  const addToCartWithToppings = (
    food: FoodDetail,
    selectedToppingIds: string[]
  ) => {
    const selectedToppings = (food.toppings || [])
      .filter((t) => selectedToppingIds.includes(t.id!))
      .map((t) => ({
        id: t.id!,
        name: t.name,
        price: Number(t.price),
      }));
  
    const uuid = generateCartItemUUID(food.id!, selectedToppingIds);
  
    // Nếu item đã tồn tại, tăng số lượng
    const existingIndex = cartItems.findIndex((item) => item.uuid === uuid);
  
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      const newItem: CartItem = {
        uuid,
        foodId: food.id!,
        name: food.name,
        description: food.description,
        image: food.image,
        price: Number(food.price),
        discountPercent: food.discountPercent || 0,
        quantity: 1,
        restaurantId: food.restaurant.id!,
        toppings: selectedToppings,
      };
  
      setCartItems((prev) => [...prev, newItem]);
    }
  
    setToppingModalOpen(false);
    showNotification("Đã thêm món vào giỏ hàng.", "success");
  };
  


  const updateQuantity = (uuid: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(uuid);
      return;
    }
  
    setCartItems((prev) =>
      prev.map(item =>
        item.uuid === uuid ? { ...item, quantity } : item
      )
    );
  };
  
  const removeFromCart = (uuid: string) => {
    setCartItems((prev) => prev.filter(item => item.uuid !== uuid));
    showNotification("Đã xoá món khỏi giỏ hàng.", "info");
  };
  

  const getCartItems = async (): Promise<(FoodPreview & {
    uuid: string;
    quantity: number;
    discountPercent?: number;
    toppings?: Topping[];
    price: number;
    total: number;
  })[]> => {
    const results: (FoodPreview & {
      uuid: string;
      quantity: number;
      discountPercent?: number;
      toppings?: Topping[];
      price: number;
      total: number;
    })[] = [];
  
    for (const cartItem of cartItems) {
      try {
        const food = await guestService.food.getFoodById(cartItem.foodId);
        if (food) {
          const basePrice = Number(food.price);
          const discountPercent = cartItem.discountPercent ?? food.discountPercent ?? 0;
          const discountedPrice = basePrice - (basePrice * discountPercent) / 100;
          const toppingTotal = cartItem.toppings?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
          const total = (discountedPrice + toppingTotal) * cartItem.quantity;
  
          results.push({
            ...food,
            uuid: cartItem.uuid,
            quantity: cartItem.quantity,
            discountPercent,
            toppings: cartItem.toppings,
            price: basePrice,
            total,
          });
        }
      } catch (error) {
        console.warn("Lỗi khi getCartItems", error);
      }
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
        addToCartWithToppings,
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
      {pendingFood && (
      <ToppingSelectModal
        open={toppingModalOpen}
        food={pendingFood}
        toppings={toppingOptions}
        onConfirm={(selectedIds) => addToCartWithToppings(pendingFood, selectedIds)}
        onClose={() => {
          setToppingModalOpen(false);
          setPendingFood(null);
        }}
      />
    )}


    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};
