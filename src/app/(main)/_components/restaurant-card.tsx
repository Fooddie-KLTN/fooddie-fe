import React, { useState, useEffect } from 'react';
import { Restaurant, FoodPreview } from '@/interface';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Star, ChevronRight, ChevronLeft, ArrowRight, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';

interface RestaurantCardProps {
    restaurants: Restaurant[];
    getFoods: (restaurantId: string) => FoodPreview[];
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurants, getFoods }) => {
    const router = useRouter();
    const { addToCart } = useCart();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isChanging, setIsChanging] = useState(false);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);
    const [showFoods, setShowFoods] = useState(false);

    const activeRestaurant = restaurants[activeIndex];
    const foods = activeRestaurant ? getFoods(activeRestaurant.id) : [];

    // Reset animations when restaurant changes
    useEffect(() => {
        setShowFoods(false);
        const timer = setTimeout(() => {
            setShowFoods(true);
        }, 300);
        return () => clearTimeout(timer);
    }, [activeIndex]);

    if (!activeRestaurant) return null;

    const nextRestaurant = () => {
        setIsChanging(true);
        setDirection('right');
        setActiveIndex((prevIndex) => (prevIndex + 1) % restaurants.length);
        setTimeout(() => setIsChanging(false), 500);
    };

    const prevRestaurant = () => {
        setIsChanging(true);
        setDirection('left');
        setActiveIndex((prevIndex) => (prevIndex - 1 + restaurants.length) % restaurants.length);
        setTimeout(() => setIsChanging(false), 500);
    };

    const handleFoodClick = (foodId: string | undefined) => {
        if (!foodId) return;
        router.push(`/food/${foodId}`);
    };

    const handleAddToCart = (e: React.MouseEvent, food: FoodPreview) => {
        e.stopPropagation();
        if (food.id) {
            addToCart(food.id);
        }
    };

    const handleBuyNow = (e: React.MouseEvent, food: FoodPreview) => {
        e.stopPropagation();
        if (food.id) {
            addToCart(food.id);
            router.push('/checkout');
        }
    };

    return (
        <div className="w-full bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100 
                        flex flex-col lg:flex-row
                        min-h-[600px] sm:min-h-[650px] md:min-h-[700px] lg:min-h-[500px] xl:min-h-[550px]
                        max-h-none lg:max-h-[500px] xl:max-h-[550px]">
            
            {/* Restaurant Info Section */}
            <div className="w-full lg:w-1/2 relative">
                {/* Background Image */}
                <div className="relative h-64 sm:h-80 md:h-96 lg:h-full">
                    <div className={`
                        w-full h-full transition-all duration-500 ease-in-out
                        ${isChanging ? 'scale-110 opacity-40' : 'scale-100 opacity-100'}
                    `}>
                        <Image
                            src={activeRestaurant.backgroundImage || `https://source.unsplash.com/random/800x600/?restaurant-${activeRestaurant.id}`}
                            alt={activeRestaurant.name}
                            width={800}
                            height={800}
                            className="w-full h-full object-cover"
                            priority
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                </div>

                {/* Restaurant Info Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 text-white">
                    {/* Top Section - Rating */}
                    <div className="flex justify-between items-start">
                        <div className="flex space-x-1 sm:space-x-2">
                            {restaurants.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveIndex(idx)}
                                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 
                                        ${idx === activeIndex ? 'bg-white scale-125' : 'bg-white/50 scale-100'}
                                        hover:bg-white hover:scale-110`}
                                    aria-label={`View restaurant ${idx + 1}`}
                                />
                            ))}
                        </div>
                        <div className="bg-yellow-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full 
                                      text-xs sm:text-sm font-medium flex items-center animate-pulse">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 fill-current" /> 
                            4.8
                        </div>
                    </div>

                    {/* Bottom Section - Restaurant Details */}
                    <div className={`
                        transition-all duration-500 ease-out
                        ${isChanging
                            ? `opacity-0 transform ${direction === 'right' ? 'translate-x-20' : '-translate-x-20'}`
                            : 'opacity-100 translate-x-0'
                        }
                    `}>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 leading-tight">
                            {activeRestaurant.name}
                        </h1>
                        <p className="text-gray-200 mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 text-sm sm:text-base">
                            {activeRestaurant.description}
                        </p>

                        {/* Restaurant Info */}
                        <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
                            <span className="flex items-center text-xs sm:text-sm">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 text-red-400 flex-shrink-0" />
                                <span className="truncate">{activeRestaurant.distance}</span>
                            </span>
                            <span className="flex items-center text-xs sm:text-sm">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 text-yellow-400 flex-shrink-0" />
                                {activeRestaurant.deliveryTime} phút
                            </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6">
                            <span className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 sm:px-3 sm:py-1 
                                           rounded-full transform transition-transform hover:scale-105">
                                Fast Food
                            </span>
                            <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 sm:px-3 sm:py-1 
                                           rounded-full transform transition-transform hover:scale-105">
                                Delivery
                            </span>
                            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 sm:px-3 sm:py-1 
                                           rounded-full transform transition-transform hover:scale-105">
                                Top Rated
                            </span>
                        </div>

                        {/* CTA Button */}
                        <Link
                            href={`/restaurant/${activeRestaurant.id}`}
                            className="bg-orange-500 hover:bg-orange-600 text-white 
                                     py-2 px-4 sm:py-3 sm:px-6 rounded-lg text-center font-medium 
                                     transition-all duration-300 inline-flex items-center justify-center 
                                     w-full sm:w-auto text-sm sm:text-base
                                     hover:shadow-lg hover:scale-105 active:scale-95"
                        >
                            Xem cửa hàng 
                            <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* Navigation Buttons */}
                {restaurants.length > 1 && (
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 flex justify-between w-full px-2 sm:px-4 z-10">
                        <button
                            onClick={prevRestaurant}
                            className="bg-black/30 hover:bg-black/50 text-white p-1.5 sm:p-2 rounded-full 
                                     transition-all duration-300 hover:scale-110 active:scale-90 hover:shadow-lg"
                            aria-label="Previous restaurant"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                        </button>
                        <button
                            onClick={nextRestaurant}
                            className="bg-black/30 hover:bg-black/50 text-white p-1.5 sm:p-2 rounded-full 
                                     transition-all duration-300 hover:scale-110 active:scale-90 hover:shadow-lg"
                            aria-label="Next restaurant"
                        >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                        </button>
                    </div>
                )}
            </div>

            {/* Foods Section */}
            <div className="w-full lg:w-1/2 flex flex-col">
                <div className="p-4 sm:p-6 flex-1 overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Menu nổi tiếng</h2>
                        <Link
                            href={`/restaurant/${activeRestaurant.id}`}
                            className="text-orange-500 flex items-center text-sm font-medium hover:underline 
                                     group transition-all self-start sm:self-auto"
                        >
                            Xem tất cả 
                            <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                    </div>

                    {/* Foods List */}
                    <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-80 lg:max-h-96 overflow-y-auto 
                                  scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {foods.length > 0 ? (
                            foods.map((food, index) => (
                                <div
                                    onClick={() => handleFoodClick(food.id)}
                                    key={food.id}
                                    className={`flex border border-gray-100 rounded-xl p-3 hover:shadow-md 
                                              transition-all duration-500 hover:-translate-y-1 hover:border-orange-200 
                                              cursor-pointer bg-white
                                              ${showFoods ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                                    style={{ transitionDelay: `${index * 100}ms` }}
                                >
                                    {/* Food Image */}
                                    <div className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-lg overflow-hidden 
                                                  flex-shrink-0 relative group">
                                        <Image
                                            src={food.image}
                                            alt={food.name}
                                            width={96}
                                            height={96}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 
                                                      transition-opacity duration-300"></div>
                                    </div>

                                    {/* Food Details */}
                                    <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                                        <div className="flex flex-col h-full justify-between">
                                            {/* Food Name */}
                                            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 
                                                         line-clamp-2 leading-tight mb-1">
                                                {food.name}
                                            </h3>

                                            {/* Price and Actions */}
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                                                <p className="text-red-600 font-medium text-sm sm:text-base order-2 sm:order-1">
                                                    {new Intl.NumberFormat('vi-VN').format(Number(food.price))} VND
                                                </p>
                                                
                                                {/* Action Buttons */}
                                                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 order-1 sm:order-2">
                                                    <button
                                                        onClick={(e) => handleAddToCart(e, food)}
                                                        className="bg-orange-100 text-orange-600 px-2 py-1 sm:px-3 sm:py-1 
                                                                 rounded-full text-xs sm:text-sm font-medium
                                                                 hover:bg-orange-600 hover:text-white transition-all duration-300
                                                                 active:scale-95 hover:shadow-md flex items-center justify-center
                                                                 min-w-0 truncate"
                                                    >
                                                        <ShoppingBag className="w-3 h-3 mr-1 flex-shrink-0" />
                                                        <span className="hidden sm:inline">Thêm vào giỏ</span>
                                                        <span className="sm:hidden">Thêm</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleBuyNow(e, food)}
                                                        className="bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1 
                                                                 rounded-full text-xs sm:text-sm font-medium
                                                                 hover:bg-red-600 transition-all duration-300
                                                                 active:scale-95 hover:shadow-md"
                                                    >
                                                        Mua ngay
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 sm:py-10 text-gray-500 animate-pulse">
                                <p className="text-sm sm:text-base">
                                    Không có món ăn nào trong menu của nhà hàng này.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantCard;