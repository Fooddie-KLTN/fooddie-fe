import { useSubscription } from '@apollo/client';
import { useAuth } from '@/context/auth-context';
import { ORDER_STATUS_SUBSCRIPTION } from '@/lib/graphql/subcriptions/orderSubcriptions';

interface OrderStatusUpdate {
  id: string;
  status: string;
  updatedAt: string;
}

export function useOrderStatusSubscription() {
  const { user } = useAuth();
  
  const { data, loading, error } = useSubscription(ORDER_STATUS_SUBSCRIPTION, {
    variables: { userId: user?.id || '' },
    skip: !user?.id,
    onError: (error) => {
      console.error('Order status subscription error:', error);
    }
  });

  return {
    orderStatusUpdate: data?.orderStatusUpdated as OrderStatusUpdate | null,
    loading,
    error
  };
}