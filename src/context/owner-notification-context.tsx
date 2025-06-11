/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { ORDER_CREATED_SUBSCRIPTION } from '@/lib/graphql/subcriptions/orderSubcriptions';
import { Order } from '@/interface';
import { useAuth } from '@/context/auth-context';

interface OwnerNotificationContextType {
  notifications: Order[];
  clearNotifications: () => void;
  markAsRead: (orderId: string) => void;
  unreadCount: number;
  readOrderIds: Set<string>; // Thêm dòng này
}

const OwnerNotificationContext = createContext<OwnerNotificationContextType>({
  notifications: [],
  clearNotifications: () => {},
  markAsRead: () => {},
  unreadCount: 0,
  readOrderIds: new Set(), // Thêm dòng này
});

interface OwnerNotificationProviderProps {
  children: React.ReactNode;
  restaurantId?: string;
}

export function OwnerNotificationProvider({ children, restaurantId }: OwnerNotificationProviderProps) {
  const [notifications, setNotifications] = useState<Order[]>([]);
  const [readOrderIds, setReadOrderIds] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();

  // Initialize notification sound
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/receive.mp3');
      audioRef.current.volume = 0.7;
    }
  }, []);

  // Subscribe to new orders only if user is authenticated and has restaurantId
  const { data, loading, error } = useSubscription(ORDER_CREATED_SUBSCRIPTION, {
    variables: { restaurantId: restaurantId || '' },
    skip: !user || !restaurantId,
    onData: ({ data }) => {
      if (data?.data?.orderCreated) {
        const newOrder = data.data.orderCreated;
        
        // Play notification sound
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Could not play sound:', e));
        }

        // Add new order to notifications
        setNotifications(prev => {
          const exists = prev.some(order => order.id === newOrder.id);
          if (!exists) {
            return [newOrder, ...prev.slice(0, 9)]; // Keep only last 10 notifications
          }
          return prev;
        });
      }
    },
  });

  const clearNotifications = () => {
    setNotifications([]);
    setReadOrderIds(new Set());
  };

  const markAsRead = (orderId: string) => {
    setReadOrderIds(prev => new Set(prev).add(orderId));
  };

  const unreadCount = notifications.filter(order => !readOrderIds.has(order.id)).length;

  return (
    <OwnerNotificationContext.Provider
      value={{
        notifications,
        clearNotifications,
        markAsRead,
        unreadCount,
        readOrderIds, // Thêm dòng này
      }}
    >
      {children}
    </OwnerNotificationContext.Provider>
  );
}

export const useOwnerNotification = () => {
  const context = useContext(OwnerNotificationContext);
  if (!context) {
    throw new Error('useOwnerNotification must be used within OwnerNotificationProvider');
  }
  return context;
};