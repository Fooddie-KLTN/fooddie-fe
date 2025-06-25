'use client';

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { userApi } from '@/api/user';
import { ConversationType } from '@/interface';

interface ChatButtonProps {
  restaurantId: string;
  restaurantOwnerId: string;
  restaurantName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const ChatButton: React.FC<ChatButtonProps> = ({
  restaurantId,
  restaurantOwnerId,
  restaurantName,
  variant = 'default',
  size = 'default',
  className = ''
}) => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleStartChat = async () => {
    if (!user || !token) {
      router.push('/auth/login');
      return;
    }

    try {
      setIsCreating(true);
      
      const conversationData = {
        participantId: restaurantOwnerId,
        restaurantId: restaurantId,
        conversationType: ConversationType.CUSTOMER_SHOP
      };

      await userApi.messenger.createOrGetConversation(token, conversationData);
      router.push('/messenger');
      
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleStartChat}
      disabled={isCreating}
      variant={variant}
      size={size}
      className={`flex items-center space-x-2 ${className}`}
    >
      {isCreating ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      <span>
        {isCreating ? 'Đang kết nối...' : `Nhắn tin với ${restaurantName}`}
      </span>
    </Button>
  );
};