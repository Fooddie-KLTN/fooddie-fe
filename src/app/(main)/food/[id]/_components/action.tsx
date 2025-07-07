'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Share2, AlertTriangle, Check } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { FoodPreview } from '@/interface';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ActionProps {
  food: FoodPreview;
}

export const Action: React.FC<ActionProps> = ({ food }) => {
  const { addToCart } = useCart();
  const router = useRouter();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isSharing, setIsSharing] = useState(false);

  // Check if food is available
  const isAvailable = food.status === 'available';
  const isUnavailable = food.status === 'unavailable';

  const handleAddToCart = async () => {
    if (!isAvailable) {
      toast.error('Món ăn này hiện không có sẵn');
      return;
    }

    if (!food.id) {
      toast.error('Thông tin món ăn không hợp lệ');
      return;
    }

    try {
      setIsAddingToCart(true);
      
      // Add multiple quantities if selected
      for (let i = 0; i < quantity; i++) {
        addToCart(food.id);
      }
      
      toast.success(`Đã thêm ${quantity} ${food.name} vào giỏ hàng`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAvailable) {
      toast.error('Món ăn này hiện không có sẵn');
      return;
    }

    if (!food.id) {
      toast.error('Thông tin món ăn không hợp lệ');
      return;
    }

    try {
      setIsAddingToCart(true);
      
      // Add to cart first
      for (let i = 0; i < quantity; i++) {
        addToCart(food.id);
      }
      
      // Then redirect to checkout
      router.push('/checkout');
    } catch (error) {
      console.error('Error in buy now:', error);
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      
      // Get current page URL
      const currentUrl = window.location.href;
      
      // Try to use the Web Share API first (mobile browsers)
      if (navigator.share) {
        await navigator.share({
          title: food.name,
          text: `Xem món ăn ngon: ${food.name}`,
          url: currentUrl,
        });
        toast.success('Đã chia sẻ thành công!');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(currentUrl);
        toast.success('Đã sao chép liên kết vào clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // If both methods fail, try a manual approach
      try {
        const currentUrl = window.location.href;
        await navigator.clipboard.writeText(currentUrl);
        toast.success('Đã sao chép liên kết vào clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        toast.error('Không thể chia sẻ. Vui lòng thử lại.');
      }
    } finally {
      setTimeout(() => setIsSharing(false), 1000);
    }
  };

  const getStatusInfo = () => {
    switch (food.status) {
      case 'unavailable':
        return {
          text: 'Tạm hết hàng',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertTriangle className="w-4 h-4" />
        };
      case 'pending':
        return {
          text: 'Chờ duyệt',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <AlertTriangle className="w-4 h-4" />
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      {statusInfo && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusInfo.color}`}>
          {statusInfo.icon}
          <span className="font-medium text-sm">{statusInfo.text}</span>
        </div>
      )}

      {/* Quantity Selector - Only show if available */}
      {isAvailable && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Số lượng:</span>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              className="px-3 py-2 hover:bg-gray-50 transition-colors"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(prev => Math.min(10, prev + 1))}
              className="px-3 py-2 hover:bg-gray-50 transition-colors"
              disabled={quantity >= 10}
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isAvailable ? (
          <>
            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isAddingToCart ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang thêm...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Thêm vào giỏ ({quantity})
                </>
              )}
            </Button>

            {/* Buy Now Button */}
            <Button
              onClick={handleBuyNow}
              disabled={isAddingToCart}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white"
            >
              Mua ngay
            </Button>
          </>
        ) : (
          /* Unavailable State */
          <div className="flex-1">
            <Button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-gray-300 text-gray-500 cursor-not-allowed"
            >
              <AlertTriangle className="w-4 h-4" />
              {isUnavailable ? 'Tạm hết hàng' : 'Không có sẵn'}
            </Button>
            <p className="text-sm text-gray-500 text-center mt-2">
              {isUnavailable 
                ? 'Món ăn này hiện tại không có sẵn. Vui lòng thử lại sau.'
                : 'Món ăn đang chờ được duyệt bởi admin.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Secondary Actions - Always available */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          onClick={handleShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Đã sao chép!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Chia sẻ
            </>
          )}
        </Button>
      </div>

      {/* Restaurant Availability Notice */}
      {isAvailable && food.restaurant && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Thời gian chuẩn bị và giao hàng có thể thay đổi tùy theo tình trạng của nhà hàng.
          </p>
        </div>
      )}
    </div>
  );
};