'use client';

import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '../../lib/graphql/apolloClient';
import { OwnerNotificationProvider } from '@/context/owner-notification-context';
import { NotificationPopup } from '@/components/owner/notification-popup';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { userApi } from '@/api/user';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, getToken } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string>('');

  // Fetch user's restaurant ID
  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (user) {
        try {
          const token = getToken();
          if (token) {
            const restaurant = await userApi.restaurant.getMyRestaurant(token);
            if (restaurant?.id) {
              setRestaurantId(restaurant.id);
            }
          }
        } catch (error) {
          console.error('Error fetching restaurant:', error);
        }
      }
    };

    fetchRestaurantId();
  }, [user, getToken]);

  return (
    <ApolloProvider client={apolloClient}>
      <OwnerNotificationProvider restaurantId={restaurantId}>
        {children}
        {/* Only show notification popup if user has a restaurant */}
        {restaurantId && <NotificationPopup />}
      </OwnerNotificationProvider>
    </ApolloProvider>
  );
}