import { Card } from "@/components/ui/card";
import { StarIcon, MapPinIcon, ClockIcon, ShoppingCartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import Image from "next/image";
import { FoodPreview } from "@/interface/index";

interface FoodCardProps {
    food: FoodPreview;
    formatPrice: (price: number) => string;
}

export default function FoodCard({ food, formatPrice }: FoodCardProps) {
    const { addToCart } = useCart();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!food.id) {
            console.error("Food ID is missing");
            return;
        }
        addToCart(food.id);
    };

    const handleBuyNow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!food.id) {
            console.error("Food ID is missing");
            return;
        }
        addToCart(food.id);
        window.location.href = "/checkout";
    };

    const handleOnClick = () => {
        window.location.href = `/food/${food.id}`;
    }
    
    const finalPrice = food.discountPercent && food.discountPercent > 0
        ? Number(food.price) * (1 - food.discountPercent / 100)
        : Number(food.price);

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer w-72 h-96 flex flex-col">
            <div className="relative h-48 flex-shrink-0">
                <Image
                    src={food.image}
                    alt={food.name}
                    fill
                    className="object-cover"
                    sizes="288px"
                    onClick={handleOnClick}
                />
                
                {/* Popular badge */}
                {food.popular && (
                    <span className="absolute top-2 right-2 bg-primary text-white text-xs py-1 px-2 rounded-md z-10">
                        Popular
                    </span>
                )}
                
                {/* Discount badge */}
                {food.discountPercent && food.discountPercent > 0 && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-xs py-1 px-2 rounded-md z-10">
                        -{food.discountPercent}%
                    </span>
                )}
                
                {/* Action buttons */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            onClick={handleAddToCart}
                            variant="outline"
                            size="sm"
                            className="flex items-center justify-center gap-1 bg-white/90 hover:text-primary hover:bg-white/80"
                        >
                            <ShoppingCartIcon className="h-3.5 w-3.5" />
                            Giỏ hàng
                        </Button>
                        <Button
                            onClick={handleBuyNow}
                            variant="default"
                            size="sm"
                            className="bg-primary hover:bg-white hover:text-primary"
                        >
                            Mua ngay
                        </Button>
                    </div>
                </div>
            </div>
            
            <div className="p-4 flex-1 flex flex-col" onClick={handleOnClick}>
                {/* Food name and rating */}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base line-clamp-1 flex-1 mr-2">{food.name}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium">{food.rating}</span>
                    </div>
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">{food.description}</p>
                
                <div className="mt-auto">
                    {/* Price */}
                    <div className="mb-2">
                        <span className="font-bold text-primary">{formatPrice(finalPrice)}</span>
                        {food.discountPercent && food.discountPercent > 0 && (
                            <span className="text-xs text-gray-400 line-through ml-2">
                                {formatPrice(Number(food.price))}
                            </span>
                        )}
                    </div>
                    
                    {/* Restaurant info */}
                    <div className="space-y-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1 line-clamp-1">
                            <MapPinIcon className="h-3 w-3 flex-shrink-0" /> 
                            <span className="truncate">{food.restaurant?.name}</span>
                        </p>
                        {food.restaurant?.deliveryTime && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <ClockIcon className="h-3 w-3 flex-shrink-0" /> 
                                {food.restaurant.deliveryTime} mins
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}