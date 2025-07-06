'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Topping, FoodDetail } from '@/interface';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ToppingSelectModalProps {
  open: boolean;
  onClose: () => void;
  food: FoodDetail;
  toppings?: Topping[];
  onConfirm: (selectedToppingIds: string[]) => void;
}

export const ToppingSelectModal = ({
  open,
  onClose,
  food,
  onConfirm,
}: ToppingSelectModalProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  useEffect(() => {
    if (open) {
      setSelectedIds([]); // reset when modal opens
    }
  }, [open]);

  const handleToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedToppings = (food.toppings || []).filter(t => selectedIds.includes(t.id));
  const toppingsTotal = selectedToppings.reduce((sum, t) => sum + Number(t.price), 0);

  const discount = food.discountPercent || 0;
  const foodPriceAfterDiscount = Number(food.price) * (1 - discount / 100);
  const totalPrice = foodPriceAfterDiscount + toppingsTotal;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-lg">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-center w-full text-lg font-bold text-primary">
            Chọn Topping
          </DialogTitle>
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        {/* Món ăn chính */}
        <div className="text-center">
          <Image
            src={food.image}
            alt={food.name}
            width={120}
            height={120}
            className="mx-auto rounded-md border object-cover"
          />
          <h2 className="text-xl font-bold mt-2">{food.name}</h2>
          {discount > 0 ? (
            <p className="text-sm text-gray-500 mt-1">
              <span className="line-through mr-2">{formatPrice(Number(food.price))}</span>
              <span className="text-primary font-semibold">
                {formatPrice(foodPriceAfterDiscount)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-700 mt-1">{formatPrice(Number(food.price))}</p>
          )}
        </div>

        {/* Topping list */}
        <div className="mt-4 space-y-2">
          {(food.toppings || []).map(topping => (
            <label
              key={topping.id}
              className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`topping-${topping.id}`}
                  checked={selectedIds.includes(topping.id)}
                  onCheckedChange={() => handleToggle(topping.id)}
                />
                <span className="text-sm font-medium">{topping.name}</span>
              </div>
              <span className="text-sm text-gray-600">{formatPrice(Number(topping.price))}</span>
            </label>
          ))}
        </div>

        {/* Tổng giá */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">Tổng cộng:</p>
          <p className="text-xl font-bold text-primary">{formatPrice(totalPrice)}</p>
        </div>

        {/* Nút xác nhận */}
        <div className="mt-4 flex justify-center">
          <Button className="w-full bg-primary text-white hover:bg-primary/90" onClick={() => onConfirm(selectedIds)}>
            Xác nhận
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
