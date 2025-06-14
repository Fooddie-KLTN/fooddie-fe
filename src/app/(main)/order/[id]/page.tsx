"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { adminService } from "@/api/admin";
import { 
  Loader2, 
  ArrowLeft, 
  Package, 
  MapPin, 
  Clock, 
  User, 
  Store, 
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Star,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RatingModal from "./_components/ratting-modal";
import dynamic from "next/dynamic";
import Image from "next/image";

// Import đúng type từ API
import type { OrderResponse } from "@/api/admin";

// Map chỉ load khi client-side
const Map = dynamic(() => import("@/components/common/map"), { ssr: false });

const STATUS_CONFIG = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="w-4 h-4" />,
    bgColor: "bg-amber-500"
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <CheckCircle2 className="w-4 h-4" />,
    bgColor: "bg-blue-500"
  },
  delivering: {
    label: "Đang giao hàng",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    icon: <Truck className="w-4 h-4" />,
    bgColor: "bg-orange-500"
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-4 h-4" />,
    bgColor: "bg-emerald-500"
  },
  canceled: {
    label: "Đã hủy",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="w-4 h-4" />,
    bgColor: "bg-red-500"
  },
  processing_payment: {
    label: "Đang xử lý thanh toán",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: <CreditCard className="w-4 h-4" />,
    bgColor: "bg-purple-500"
  }
};

const formatPrice = (price: string | number) => {
  return Number(price).toLocaleString("vi-VN") + "đ";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("vi-VN", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function OrderDetailPage() {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchOrder = async () => {
      const token = await getToken();
      if (!token || !orderId) return;

      try {
        const res = await adminService.Order.getOrderById(token, orderId);
        setOrder(res);
      } catch (err) {
        console.error("Failed to fetch order", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, getToken]);

  const handleReviewSubmitted = () => {
    // Refresh order data after review is submitted
    const refreshOrder = async () => {
      const token = await getToken();
      if (!token || !orderId) return;
      
      try {
        const res = await adminService.Order.getOrderById(token, orderId);
        setOrder(res);
      } catch (err) {
        console.error("Failed to refresh order", err);
      }
    };
    
    refreshOrder();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-500 mb-6">Đơn hàng có thể đã bị xóa hoặc không tồn tại</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const defaultAddress = order.user.address.find(addr => addr.isDefault) || order.user.address[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Đơn hàng #{order.id.slice(-8).toUpperCase()}
                </h1>
                <p className="text-sm text-gray-500">
                  Đặt lúc {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
            <Badge className={`px-4 py-2 text-sm font-medium border ${statusConfig.color}`}>
              {statusConfig.icon}
              <span className="ml-2">{statusConfig.label}</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Trạng thái đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {Object.entries(STATUS_CONFIG).map(([key, config], index) => {
                    const isActive = key === order.status;
                    const isPassed = Object.keys(STATUS_CONFIG).indexOf(order.status) >= index;
                    
                    return (
                      <div key={key} className="flex flex-col items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          isActive 
                            ? `${config.bgColor} border-transparent text-white` 
                            : isPassed
                            ? 'bg-emerald-500 border-transparent text-white'
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                        }`}>
                          {config.icon}
                        </div>
                        <p className={`text-xs mt-2 text-center ${
                          isActive ? 'text-emerald-600 font-medium' : 'text-gray-500'
                        }`}>
                          {config.label}
                        </p>
                        {index < Object.keys(STATUS_CONFIG).length - 1 && (
                          <div className={`h-0.5 w-full mt-5 -ml-full ${
                            isPassed ? 'bg-emerald-500' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Restaurant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Thông tin nhà hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={order.restaurant.avatar} alt={order.restaurant.name} />
                    <AvatarFallback>{order.restaurant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{order.restaurant.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{order.restaurant.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{order.restaurant.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>{order.restaurant.phoneNumber}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1 mt-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-600">
                        {order.restaurant.address.street}, {order.restaurant.address.ward}, {order.restaurant.address.district}, {order.restaurant.address.city}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items with Individual Rating */}
            <Card>
              <CardHeader>
                <CardTitle>Món ăn đã đặt</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {order.orderDetails.map((item) => (
                  <div key={item.id} className="p-6 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.food.image}
                          alt={item.food.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.food.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{item.food.description}</p>
                        {item.food.discountPercent && Number(item.food.discountPercent) > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm line-through text-gray-400">
                              {formatPrice(item.food.price)}
                            </span>
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-600">
                              -{item.food.discountPercent}%
                            </Badge>
                          </div>
                        )}
                        {item.note && (
                          <div className="flex items-start gap-1 mt-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span className="text-sm text-gray-600">{item.note}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                        <p className="font-semibold text-emerald-600">
                          {formatPrice(item.price)}
                        </p>
                        {/* Individual rating buttons removed */}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Theo dõi đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[400px] rounded-xl overflow-hidden">
                  <Map
                    from={`${order.restaurant.address.street}, ${order.restaurant.address.ward}`}
                    to={defaultAddress ? `${defaultAddress.street}, ${defaultAddress.ward}` : ""}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={order.user.avatar} alt={order.user.name} />
                    <AvatarFallback>{order.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{order.user.name}</h4>
                    <p className="text-sm text-gray-600">{order.user.email}</p>
                    <p className="text-sm text-gray-600">{order.user.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            {defaultAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Địa chỉ giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {defaultAddress.label && (
                      <Badge variant="outline" className="text-xs">
                        {defaultAddress.label}
                      </Badge>
                    )}
                    <p className="text-sm">
                      {defaultAddress.street}
                    </p>
                    <p className="text-sm text-gray-600">
                      {defaultAddress.ward}, {defaultAddress.district}, {defaultAddress.city}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Phương thức:</span>
                  <span className="font-medium">
                    {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Trạng thái:</span>
                  <Badge variant={order.isPaid ? "default" : "outline"} className="text-xs">
                    {order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </Badge>
                </div>
                {order.paymentDate && (
                  <div className="flex justify-between text-sm">
                    <span>Ngày thanh toán:</span>
                    <span>{formatDate(order.paymentDate)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold text-emerald-600">
                  <span>Tổng cộng:</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Note */}
            {order.note && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Ghi chú
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{order.note}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {order.status === 'completed' && order.reviewInfo && !order.reviewInfo.hasReviewedFood && (
                <RatingModal
                  orderDetails={order.orderDetails}
                  onReviewSubmitted={handleReviewSubmitted}
                  trigger={
                    <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600">
                      <Star className="w-4 h-4 mr-2" />
                      Đánh giá đơn hàng
                    </Button>
                  }
                />
              )}
              <Button variant="outline" className="w-full">
                Liên hệ hỗ trợ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
