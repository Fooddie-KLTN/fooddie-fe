'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { userApi } from '@/api/user';
import { OwnerNotificationProvider } from '@/context/owner-notification-context';
import { NotificationPopup } from '@/components/owner/notification-popup';
import { Sidebar } from './_components/sidebar';

export default function EditRestaurantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, getToken, loading: authLoading } = useAuth();
    const [restaurantId, setRestaurantId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // Fetch user's restaurant ID and validate ownership
    useEffect(() => {
        const fetchAndValidateRestaurant = async () => {
            if (user && !authLoading) {
                try {
                    const token = getToken();
                    if (token) {
                        console.log('🏪 Fetching restaurant for user:', user.id);
                        const restaurant = await userApi.restaurant.getMyRestaurant(token);
                        if (restaurant?.id) {
                            console.log('✅ Found restaurant:', restaurant.id);
                            setRestaurantId(restaurant.id);
                        } else {
                            console.log('❌ No restaurant found for user');
                            setError('Bạn chưa có nhà hàng nào để quản lý');
                        }
                    } else {
                        console.log('❌ No token available');
                        setError('Vui lòng đăng nhập để tiếp tục');
                    }
                } catch (error) {
                    console.error('❌ Error fetching restaurant:', error);
                    setError('Có lỗi xảy ra khi tải thông tin nhà hàng');
                } finally {
                    setLoading(false);
                }
            } else if (!authLoading && !user) {
                console.log('❌ No user found, stopping restaurant fetch');
                setError('Vui lòng đăng nhập để truy cập trang này');
                setLoading(false);
            }
        };

        fetchAndValidateRestaurant();
    }, [user, getToken, authLoading]);

    // Show loading while auth or restaurant data is loading
    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Đang tải thông tin nhà hàng...</p>
                    <p className="text-gray-400 text-sm mt-2">Vui lòng đợi trong giây lát</p>
                </div>
            </div>
        );
    }

    // Show error if no user, no restaurant, or other errors
    if (!user || !restaurantId || error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {!user ? 'Vui lòng đăng nhập' : 'Không thể truy cập'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {error || 'Có lỗi xảy ra khi tải thông tin'}
                    </p>
                    <div className="space-y-3">
                        {!user ? (
                            <a
                                href="/auth/login"
                                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Đăng nhập ngay
                            </a>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors mr-2"
                                >
                                    Thử lại
                                </button>
                                <a
                                    href="/owner/register-restaurant"
                                    className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Đăng ký nhà hàng
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <OwnerNotificationProvider restaurantId={restaurantId}>
            <div className="flex h-screen bg-background">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10">
                    {/* Header Section */}
                    <div className="mb-6 pb-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    Quản lý nhà hàng
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Cập nhật thông tin và quản lý hoạt động nhà hàng của bạn
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>Đang hoạt động</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    {children}
                </main>

                {/* Notification Popup */}
                <NotificationPopup />
            </div>
        </OwnerNotificationProvider>
    );
}
