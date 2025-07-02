// context/cart-drawer-context.tsx
"use client";
import { createContext, useContext, useState } from "react";

const CartDrawerContext = createContext<{
  isOpen: boolean;
  toggleCartDrawer: () => void;
  closeCartDrawer: () => void;
}>({ isOpen: false, toggleCartDrawer: () => {}, closeCartDrawer: () => {} });

export const CartDrawerProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setOpen] = useState(false);
  const toggleCartDrawer = () => setOpen((prev) => !prev);
  const closeCartDrawer = () => setOpen(false);

  return (
    <CartDrawerContext.Provider value={{ isOpen, toggleCartDrawer, closeCartDrawer }}>
      {children}
    </CartDrawerContext.Provider>
  );
};

export const useCartDrawer = () => useContext(CartDrawerContext);
