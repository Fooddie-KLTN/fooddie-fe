'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FoodPreview } from '@/interface';
import { useAuth } from '@/context/auth-context';
import { getFoodStatusText, getFoodStatusClasses, formatPrice } from '@/lib/utils';
import Image from 'next/image';
import {
  Store,
  MapPin,
  Clock,
  Star,
  Users,
  Calendar,
  DollarSign,
  Tag,
  AlertTriangle,
  ImageIcon,

} from 'lucide-react';
import { guestService } from '@/api/guest';

interface FoodDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodId: string | null;
}

export function FoodDetailModal({ isOpen, onClose, foodId }: FoodDetailModalProps) {
  const { getToken } = useAuth();
  const [food, setFood] = useState<FoodPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen && foodId) {
      fetchFoodDetail();
    }
  }, [isOpen, foodId]);

  const fetchFoodDetail = async () => {
    if (!foodId) return;

    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) return;

      const response = await guestService.food.getFoodById( foodId);
      setFood(response);
      setSelectedImageIndex(0);
    } catch (error) {
      console.error('Error fetching food detail:', error);
      setError('Không thể tải thông tin món ăn');
    } finally {
      setLoading(false);
    }
  };

  const getRestaurantName = (food: FoodPreview): string => {
    if (food.restaurant && typeof food.restaurant === 'object' && food.restaurant.name) {
      return food.restaurant.name;
    }
    return 'Nhà hàng không xác định';
  };

  const getCategoryName = (food: FoodPreview): string => {
    if (food.category && typeof food.category === 'object' && food.category.name) {
      return food.category.name;
    }
    if (food.category && typeof food.category === 'string') {
      return food.category;
    }
    return 'Chưa phân loại';
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getImages = (food: FoodPreview): string[] => {
    const images: string[] = [];
    
    // Add main image
    if (food.image) {
      images.push(food.image);
    }
    
    // Add additional images from imageUrls array
    if (food.imageUrls && Array.isArray(food.imageUrls)) {
      food.imageUrls.forEach(url => {
        if (url && !images.includes(url)) {
          images.push(url);
        }
      });
    }
    
    return images;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Chi tiết món ăn</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchFoodDetail} className="mt-4">
                Thử lại
              </Button>
            </div>
          </div>
        ) : food ? (
          <div className="space-y-6">
            {/* Food Images */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Main Image */}
                  <div className="space-y-4">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {getImages(food).length > 0 ? (
                        <Image
                          src={getImages(food)[selectedImageIndex]}
                          alt={food.name}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/food-placeholder.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-16 h-16" />
                        </div>
                      )}
                    </div>

                    {/* Image Thumbnails */}
                    {getImages(food).length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {getImages(food).map((image, index) => (
                          <button
                            title='Click to view this image'
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                              selectedImageIndex === index
                                ? 'border-primary'
                                : 'border-gray-200'
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`${food.name} ${index + 1}`}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {food.name}
                      </h2>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className={getFoodStatusClasses(food.status)}>
                          {getFoodStatusText(food.status)}
                        </Badge>
                        {getCategoryName(food) && (
                          <Badge variant="outline">
                            <Tag className="w-3 h-3 mr-1" />
                            {getCategoryName(food)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(food.price || 0)}
                        </span>
                      </div>
                      {food.discountPercent && food.discountPercent > 0 && (
                        <Badge variant="destructive" className="text-sm">
                          -{food.discountPercent}% OFF
                        </Badge>
                      )}
                    </div>

                    {/* Restaurant Info */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Store className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold">Nhà hàng</span>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {getRestaurantName(food)}
                      </p>
                      {food.restaurant && typeof food.restaurant === 'object' && (
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          {food.restaurant.phoneNumber && (
                            <p>📞 {food.restaurant.phoneNumber}</p>
                          )}
                          {food.restaurant.address && (
                            <div className="flex items-start gap-1">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>
                                {typeof food.restaurant.address === 'object'
                                  ? `${food.restaurant.address.street}, ${food.restaurant.address.ward}, ${food.restaurant.address.district}, ${food.restaurant.address.city}`
                                  : food.restaurant.address
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      {food.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">
                            {food.rating.toFixed(1)} ⭐
                          </span>
                        </div>
                      )}
                      {food.soldCount && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">
                            Đã bán {food.soldCount}
                          </span>
                        </div>
                      )}
                      {food.preparationTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            {food.preparationTime} phút
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {food.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Mô tả món ăn</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {food.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin chi tiết</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">ID món ăn</label>
                      <p className="text-sm text-gray-900 font-mono">{food.id}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Trạng thái</label>
                      <p className="text-sm text-gray-900">{getFoodStatusText(food.status)}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Danh mục</label>
                      <p className="text-sm text-gray-900">{getCategoryName(food)}</p>
                    </div>

                    {food.tag && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Thẻ</label>
                        <p className="text-sm text-gray-900">{food.tag}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ngày tạo</label>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(food.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Cập nhật lần cuối</label>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(food.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {food.popular && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phổ biến</label>
                        <p className="text-sm text-green-600 font-medium">✅ Món ăn phổ biến</p>
                      </div>
                    )}

                    {food.distance && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Khoảng cách</label>
                        <p className="text-sm text-gray-900">{food.distance} km</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}