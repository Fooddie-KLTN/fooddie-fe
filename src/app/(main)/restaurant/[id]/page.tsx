'use client';

import { useState, useEffect } from 'react';
import { Restaurant, FoodPreview, RestaurantStatus, ConversationType } from '@/interface';
import { RestaurantSkeleton } from './_components/skeleton';
import { RestaurantHeader } from './_components/header';
import { RestaurantInfo } from './_components/info';
import { RestaurantMenu } from './_components/menu';
import { useParams, useRouter } from 'next/navigation';
import { guestService } from '@/api/guest';
import { useGeo } from '@/context/geolocation-context';
import { useAuth } from '@/context/auth-context';
import { userApi } from '@/api/user';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';


// Format price helper function
const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
};

export default function RestaurantPage() {
    const { id } = useParams();
    const { location } = useGeo(); 
    const {  getToken } = useAuth();
    const router = useRouter();

    const restaurantId = id as string;

    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [foods, setFoods] = useState<FoodPreview[]>([]);
    const [creatingConversation, setCreatingConversation] = useState(false);

    useEffect(() => {
        const getRestaurantData = async () => {
            try {
                if (!id) {
                    console.error('No restaurant ID provided');
                    return;
                }
                const data = await guestService.restaurant.getRestaurantById(restaurantId, location?.lat, location?.lng);
                setRestaurant(data);
                if (data.status !== RestaurantStatus.APPROVED) {
                    console.warn('Restaurant is not active:', data.status);
                }
                if (!data.foods || data.foods.length === 0) {
                    console.warn('No foods found for this restaurant');
                }
                setFoods(data.foods || []);
            } catch (error) {
                console.error('Failed to fetch restaurant data:', error);
            } finally {
                setLoading(false);
            }
        };

        getRestaurantData();
    }, [restaurantId, location?.lat, location?.lng, id]);

    const handleStartConversation = async () => {
        const token = await getToken();
        console.log('Token:', token);
        console.log('Restaurant Owner:', restaurant?.owner);
        if ( !token || !restaurant) {
            // If not logged in, redirect to login or show auth modal
            //router.push('/auth/login');
            return;
        }

        try {
            setCreatingConversation(true);
            
            // Create or get existing conversation with restaurant owner
            const conversationData = {
                restaurantId: restaurant.id,
                conversationType: ConversationType.CUSTOMER_SHOP
            };

            await userApi.messenger.createOrGetConversation(token, conversationData);
            
            // Navigate to messenger page
            router.push('/messenger');
            
        } catch (error) {
            console.error('Failed to create conversation:', error);
            // You might want to show a toast notification here
        } finally {
            setCreatingConversation(false);
        }
    };

    if (loading) {
        return <RestaurantSkeleton />;
    }

    if (!restaurant) {
        return <div className="container py-10">Restaurant not found</div>;
    }

    return (
        <div className="pb-10 px-10">
            <RestaurantHeader restaurant={restaurant} />

            <div className="container mt-6">
                {/* Restaurant Info Section */}
                <RestaurantInfo restaurant={restaurant} />
                
                {/* Contact Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Liên hệ với nhà hàng</h3>
                    <div className="flex flex-wrap gap-3">
                        {/* Message Button */}
                        <Button
                            onClick={handleStartConversation}
                            disabled={creatingConversation}
                            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2"
                        >
                            {creatingConversation ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <MessageCircle className="w-4 h-4" />
                            )}
                            <span>
                                {creatingConversation ? 'Đang kết nối...' : 'Nhắn tin'}
                            </span>
                        </Button>

           
                    </div>
                    
                    {/* Info text */}
                    <p className="text-sm text-gray-500 mt-3">
                        Bạn có thể liên hệ trực tiếp với nhà hàng để hỏi về món ăn, đặt bàn hoặc các thông tin khác.
                    </p>
                    
                    {/* Restaurant contact info */}
                    {restaurant.phoneNumber && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Số điện thoại:</span> {restaurant.phoneNumber}
                            </p>
                        </div>
                    )}
                </div>

                {/* Menu Section */}
                <h2 className="text-2xl font-bold mb-4">Thực đơn</h2>
                <p className="text-gray-500 mb-4">Chọn món ăn yêu thích của bạn từ thực đơn dưới đây.</p>
                
                <RestaurantMenu foods={foods} formatPrice={formatPrice} />
            </div>
        </div>
    );
}