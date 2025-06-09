"use client";

import React, { useState, useEffect } from 'react';
import { Bell, X, User, Package } from 'lucide-react';
import { useOwnerNotification } from '@/context/owner-notification-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function NotificationPopup() {
  const { notifications, clearNotifications, markAsRead, unreadCount, readOrderIds } = useOwnerNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);

  // Show alert popup for new orders
  useEffect(() => {
    if (notifications.length > 0 && unreadCount > 0) {
      setShowNewOrderAlert(true);
      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        setShowNewOrderAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications.length, unreadCount]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  // New order alert popup
  if (showNewOrderAlert && notifications.length > 0) {
    const latestOrder = notifications[0];
    return (
      <div className="fixed top-4 right-4 z-50 bg-white border-l-4 border-orange-500 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in-right">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="bg-orange-100 p-2 rounded-full">
              <Bell className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Đơn hàng mới!</h4>
              <p className="text-sm text-gray-600">
                #{latestOrder.id.slice(-8)} - {formatCurrency(latestOrder.total || 0)}
              </p>
              <p className="text-xs text-gray-500">
                {latestOrder.user?.name} - {formatTime(latestOrder.createdAt)}
              </p>
              <div className="mt-2 flex space-x-2">
                <Link href={`/restaurant/${latestOrder.restaurant?.id}/edit/order-list`}>
                  <Button size="sm" className="text-xs">
                    Xem chi tiết
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => {
                    markAsRead(latestOrder.id);
                    setShowNewOrderAlert(false);
                  }}
                >
                  Đánh dấu đã đọc
                </Button>
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"

            onClick={() => setShowNewOrderAlert(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-40 bg-white rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
      >
        <div className="relative">
          <Bell className="h-6 w-6 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="fixed top-4 right-16 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-96 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Thông báo đơn hàng</h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={clearNotifications}
                    className="text-xs"
                  >
                    Xóa tất cả
                  </Button>
                )}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((order) => {
                  const isRead = readOrderIds.has(order.id);
                  return (
                    <div 
                      key={order.id} 
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !isRead ? 'bg-orange-50' : ''
                      }`}
                      onClick={() => markAsRead(order.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${!isRead ? 'bg-orange-100' : 'bg-gray-100'}`}>
                          <Package className={`h-4 w-4 ${!isRead ? 'text-orange-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-gray-900">
                              Đơn hàng #{order.id.slice(-8)}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatTime(order.createdAt)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center space-x-2 text-xs text-gray-600">
                            <User className="h-3 w-3" />
                            <span>{order.user?.name}</span>
                          </div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            {formatCurrency(order.total || 0)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {order.orderDetails?.length || 0} món
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Chưa có thông báo nào</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}