/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { ORDER_CREATED_SUBSCRIPTION } from '@/lib/graphql/subcriptions/orderSubcriptions';
import { MESSAGE_SENT_SUBSCRIPTION } from '@/lib/graphql/subcriptions/messengerSubscriptions';
import { useAuth } from '@/context/auth-context';
import { OwnerNotification } from '@/interface';
import { apiRequest } from "@/api/base-api";

interface OwnerNotificationContextType {
  notifications: OwnerNotification[];
  clearNotifications: () => void;
  markAsRead: (id: string) => void;
  unreadCount: number;
  readIds: Set<string>;
}

const OwnerNotificationContext = createContext<OwnerNotificationContextType>({
  notifications: [],
  clearNotifications: () => {},
  markAsRead: () => {},
  unreadCount: 0,
  readIds: new Set(),
});

interface OwnerNotificationProviderProps {
  children: React.ReactNode;
  restaurantId?: string;
}

export function OwnerNotificationProvider({ children, restaurantId }: OwnerNotificationProviderProps) {
  const [notifications, setNotifications] = useState<OwnerNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [conversationIds, setConversationIds] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();
  const ownerId = user?.id; // Always use this for ownerId
  const { getToken } = useAuth();

  // Notification sound
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/receive.mp3');
      audioRef.current.volume = 0.7;
    }
  }, []);

  // Order notifications
  useSubscription(ORDER_CREATED_SUBSCRIPTION, {
    variables: { restaurantId: restaurantId || '' },
    skip: !user || !restaurantId,
    onData: ({ data }) => {
      const order = data?.data?.orderCreated;
      if (order) {
        setNotifications(prev => [
          {
            id: order.id,
            type: "order",
            createdAt: order.createdAt,
            total: order.total || 0,
            user: order.user,
            orderDetails: order.orderDetails,
          },
          ...prev,
        ]);
        if (audioRef.current) audioRef.current.play().catch(() => {});
      }
    },
  });


  useEffect(() => {
    async function fetchConversationIds() {
      try {
        const token = await getToken(); 
        if (!token) return;
        const ids = await apiRequest<string[]>(
          "/messenger/conversation-ids",
          "GET",
          { token }
        );
        console.log(ids)
        setConversationIds(ids);
      } catch (err) {
        console.error("Failed to fetch conversation IDs", err);
      }
    }
    fetchConversationIds();
  }, [ user]);

  const clearNotifications = () => {
    setNotifications([]);
    setReadIds(new Set());
  };

  const markAsRead = (id: string) => {
    setReadIds(prev => new Set(prev).add(id));
  };

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  return (
    <>
      {conversationIds.map((id) => (
        <MessageSubscription
          key={id}
          conversationId={id}
          ownerId={ownerId}
          audioRef={audioRef}
          onMessage={(msg) => {
            // Only push notification if the sender is NOT the owner/user
            if (msg.sender.id === ownerId) return;
            setNotifications((prev) => [
              {
                id: msg.id,
                type: "message",
                createdAt: msg.createdAt,
                content: msg.content,
                sender: typeof msg.sender === "string" ? "" : msg.sender.name,
              },
              ...prev,
            ]);
          }}
        />
      ))}
      <OwnerNotificationContext.Provider
        value={{
          notifications,
          clearNotifications,
          markAsRead,
          unreadCount,
          readIds,
        }}
      >
        {children}
      </OwnerNotificationContext.Provider>
    </>
  );
}

export const useOwnerNotification = () => {
  const context = useContext(OwnerNotificationContext);
  if (!context) {
    throw new Error('useOwnerNotification must be used within OwnerNotificationProvider');
  }
  return context;
};

function MessageSubscription({
  conversationId,
  ownerId,
  onMessage,
  audioRef,
}: {
  conversationId: string;
  ownerId?: string; // still optional, but always passed from user?.id
  onMessage: (msg: any) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  useSubscription(MESSAGE_SENT_SUBSCRIPTION, {
    variables: { conversationId },
    skip: !conversationId,
    onData: ({ data }) => {
      const msg = data?.data?.messageSent;
      if (msg && msg.sender.id !== ownerId) {
        onMessage(msg);
        if (audioRef.current) audioRef.current.play().catch(() => {});
      }
    },
  });
  return null;
}