import React from 'react';

interface PriceSectionProps {
  price: number;
  discountPercent: number;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  formatPrice: (price: number) => string;
}

const PriceSection = ({ 
  price, 
  discountPercent, 

  formatPrice 
}: PriceSectionProps) => {
  const priceValue = Number(price) || 0;
  const discount = Number(discountPercent) || 0;
  const finalPrice = discount > 0 
    ? priceValue * (1 - discount / 100)
    : priceValue;

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <div className="text-3xl font-bold text-primary">
          {formatPrice(finalPrice)}
        </div>
        {discount > 0 && (
          <div className="text-sm text-gray-500 line-through">
            {formatPrice(priceValue)}
          </div>
        )}
      </div>
      
    </div>
  );
};

export default PriceSection;