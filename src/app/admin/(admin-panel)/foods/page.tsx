'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Category, FoodPreview, Restaurant } from '@/interface';
import Image from 'next/image';
import { 
  Search, Eye, Trash2, 
  Store, Star, Clock, DollarSign, AlertTriangle 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminService } from '@/api/admin';
import { useAuth } from '@/context/auth-context';
import { getFoodStatusText, FOOD_STATUS } from '@/lib/utils';
import { FoodDetailModal } from './_components/food-detail-modal';

export default function AdminFoodsPage() {
  const { getToken } = useAuth();
  const [foods, setFoods] = useState<FoodPreview[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Modal state
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch foods with filters - using backend parameters
  useEffect(() => {
    // Debounce search queries
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      fetchFoods();
    }, searchQuery ? 500 : 0); // 500ms delay for search, immediate for other filters
    
    setSearchDebounce(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [currentPage, selectedRestaurant, selectedStatus, selectedCategory, searchQuery]);

  const fetchFoods = async () => {
    try {
      // Prepare parameters for backend filtering
      const restaurantParam = selectedRestaurant !== 'all' ? selectedRestaurant : '';
      const categoryParam = selectedCategory !== 'all' ? selectedCategory : '';
      const statusParam = selectedStatus !== 'all' ? selectedStatus : '';

      setLoading(true);
      const token = getToken();
      if (!token) return;

      // Call the API with all parameters - let backend handle filtering
      const response = await adminService.food.getFoods(
        token, 
        currentPage,
        20, // limit
        searchQuery, // search
        restaurantParam, // restaurantId
        categoryParam, // categoryId
        statusParam
      );

      // Only basic validation, no frontend filtering since backend handles it
      const validFoods = (response.items || []).filter((food: FoodPreview) => {
        return food && typeof food === 'object' && food.id;
      });

      setFoods(validFoods);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error fetching foods:', error);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await adminService.restaurant.getRestaurants(token, 1, 100);
      
      const validRestaurants = (response.items || []).filter((restaurant: Restaurant) => {
        return restaurant && 
          typeof restaurant === 'object' && 
          restaurant.id && 
          restaurant.name &&
          restaurant.name.trim() !== '';
      });

      setRestaurants(validRestaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await adminService.Category.getCategories(token, 1, 100);

      const validCategories = (response.items || []).filter((category: Category) => {
        return category && 
          typeof category === 'object' && 
          category.id && 
          category.name &&
          category.name.trim() !== '';
      });

      setCategories(validCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchCategories();
  }, []);

  const handleViewFood = (foodId: string) => {
    setSelectedFoodId(foodId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedFoodId(null);
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!foodId) return;
    if (!confirm('Bạn có chắc chắn muốn xóa món ăn này?')) return;
    
    try {
      const token = getToken();
      if (!token) return;

      await adminService.food.deleteFood(token, foodId);
      fetchFoods(); // Refresh the list
    } catch (error) {
      console.error('Error deleting food:', error);
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    switch (status.toLowerCase()) {
      case FOOD_STATUS.AVAILABLE: 
        return 'bg-green-100 text-green-800 border-green-200';
      case FOOD_STATUS.UNAVAILABLE: 
        return 'bg-red-100 text-red-800 border-red-200';
      case FOOD_STATUS.PENDING: 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case FOOD_STATUS.HIDDEN:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case FOOD_STATUS.REJECTED:
        return 'bg-red-100 text-red-800 border-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Safe statistics calculation
  const getStats = () => {
    const validFoods = foods.filter(f => f && f.status);
    return {
      total: validFoods.length,
      available: validFoods.filter(f => f.status === FOOD_STATUS.AVAILABLE).length,
      pending: validFoods.filter(f => f.status === FOOD_STATUS.PENDING).length,
      unavailable: validFoods.filter(f => f.status === FOOD_STATUS.UNAVAILABLE).length,
    };
  };

  const stats = getStats();

  // Handle filter changes - these will trigger the useEffect to fetch new data
  const handleRestaurantFilterChange = (value: string) => {
    setSelectedRestaurant(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleStatusFilterChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleCategoryFilterChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Safe display of restaurant name
  const getRestaurantName = (food: FoodPreview): string => {
    if (food.restaurant && typeof food.restaurant === 'object' && food.restaurant.name) {
      return food.restaurant.name;
    }
    return 'Nhà hàng không xác định';
  };

  // Safe display of category name
  const getCategoryName = (food: FoodPreview): string => {
    if (food.category && typeof food.category === 'object' && food.category.name) {
      return food.category.name;
    }
    if (food.category && typeof food.category === 'string') {
      return food.category;
    }
    return '';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý món ăn</h1>
          <p className="text-gray-600 mt-1">
            Quản lý tất cả món ăn từ các nhà hàng trên hệ thống
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm món ăn, nhà hàng..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>

            {/* Restaurant Filter */}
            <Select value={selectedRestaurant} onValueChange={handleRestaurantFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhà hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhà hàng ({restaurants.length})</SelectItem>
                {restaurants.map((restaurant) => {
                  if (!restaurant || !restaurant.id || !restaurant.name) {
                    return null;
                  }
                  
                  return (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  );
                }).filter(Boolean)}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={handleStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value={FOOD_STATUS.AVAILABLE}>Có sẵn</SelectItem>
                <SelectItem value={FOOD_STATUS.UNAVAILABLE}>Không có sẵn</SelectItem>
                <SelectItem value={FOOD_STATUS.PENDING}>Chờ duyệt</SelectItem>
                <SelectItem value={FOOD_STATUS.HIDDEN}>Ẩn</SelectItem>
                <SelectItem value={FOOD_STATUS.REJECTED}>Bị từ chối</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={handleCategoryFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục ({categories.length})</SelectItem>
                {categories.map((category) => {
                  if (!category || !category.id || !category.name) {
                    return null;
                  }
                  
                  return (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng món ăn</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Món có sẵn</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cần xem xét</p>
                <p className="text-2xl font-bold text-red-600">{stats.unavailable}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Foods Table/Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách món ăn ({foods.length})</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Trang {currentPage} / {totalPages}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {foods.map((food) => {
                if (!food || !food.id) return null;

                return (
                  <div
                    key={food.id}
                    className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    {/* Food Image */}
                    <div className="w-20 h-20 lg:w-16 lg:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {food.image ? (
                        <Image
                          src={food.image}
                          alt={food.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/food-placeholder.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Store className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Food Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {food.name || 'Tên món ăn không có'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Store className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 truncate">
                              {getRestaurantName(food)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                            {food.description || 'Chưa có mô tả'}
                          </p>
                        </div>

                        <div className="flex flex-col lg:items-end gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg text-primary">
                              {Number(food.price || 0).toLocaleString('vi-VN')}đ
                            </span>
                            {food.discountPercent && food.discountPercent > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                -{food.discountPercent}%
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(food.status)}>
                              {getFoodStatusText(food.status)}
                            </Badge>
                            {getCategoryName(food) && (
                              <Badge variant="outline" className="text-xs">
                                {getCategoryName(food)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFood(food.id!)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Xem</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFood(food.id!)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Xóa</span>
                      </Button>
                    </div>
                  </div>
                );
              })}

              {foods.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không tìm thấy món ăn nào
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery || selectedStatus !== 'all' || selectedRestaurant !== 'all' || selectedCategory !== 'all'
                      ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                      : 'Hiện tại không có món ăn nào trong hệ thống'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
              >
                Sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Food Detail Modal */}
      <FoodDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        foodId={selectedFoodId}
      />
    </div>
  );
}