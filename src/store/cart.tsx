import { useState } from "react";

export function useCart() {
  const [cart, setCart] = useState<any[]>([]);
  function addToCart(item: any) {
    setCart((prev) => [...prev, item]);
  }
  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }
  return { cart, addToCart, removeFromCart };
}
