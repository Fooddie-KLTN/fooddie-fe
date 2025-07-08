import { Order } from '@/interface';
import { X, User, MapPin, Clock, Phone, Package, DollarSign, Truck, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSubscription } from '@apollo/client';
import { SHIPPER_LOCATION_SUBSCRIPTION } from '@/lib/graphql/subcriptions/shipperSubcriptions';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Map component loaded dynamically
const Map = dynamic(() => import("@/components/common/map"), { ssr: false });

// Shipper Location interface
export interface ShipperLocation {
  shipperId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

// Shipper Location Subscriber component
function ShipperLocationSubscriber({
  shipperId,
  onData,
}: {
  shipperId: string;
  onData: (data: { shipperLocationUpdated: ShipperLocation }) => void;
}) {
  useSubscription(SHIPPER_LOCATION_SUBSCRIPTION, {
    variables: { shipperId },
    skip: !shipperId,
    onData: ({ data }) => {
      if (data?.data?.shipperLocationUpdated) {
        onData({ shipperLocationUpdated: data.data.shipperLocationUpdated });
      }
    }
  });
  return null;
}

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, newStatus: string) => void;
  isUpdating?: boolean;
}

export function OrderDetailModal({ 
  order, 
  isOpen, 
  onClose, 
  onUpdateStatus,
  isUpdating = false 
}: OrderDetailModalProps) {
  const [shipperLocationData, setShipperLocationData] = useState<{ shipperLocationUpdated: ShipperLocation } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // Set user location when order changes
  useEffect(() => {
    if (order && order.address) {
      setUserLocation({
        lat: order.address.latitude || 0,
        lng: order.address.longitude || 0,
      });
    }
  }, [order]);

  // Add this useEffect to refetch order when status changes to shipper_received or delivering
  useEffect(() => {
    if (order && (order.status === "shipper_received" || order.status === "delivering")) {
      // Trigger a refetch of the order to get shipper information
      // This assumes you have access to a refetch function or can emit an event
      console.log(`[DEBUG] Order status changed to ${order.status}, should refetch order data`);
    }
  }, [order?.status]);

  if (!isOpen || !order) return null;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'confirmed': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'shipper_received': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'delivering': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-600 border-green-200';
      case 'canceled': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusButtons = () => {
    if (!onUpdateStatus) return null;

    switch (order.status) {
      case 'pending':
        return (
          <div className="flex space-x-3">
            <Button
              onClick={() => onUpdateStatus(order.id, 'confirmed')}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
            </Button>
            <Button
              onClick={() => onUpdateStatus(order.id, 'canceled')}
              disabled={isUpdating}
              variant="destructive"
            >
              Hủy đơn hàng
            </Button>
          </div>
        );
      case 'confirmed':
        return (
          <Button
            onClick={() => onUpdateStatus(order.id, 'delivering')}
            disabled={isUpdating}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isUpdating ? 'Đang xử lý...' : 'Bắt đầu giao hàng'}
          </Button>
        );
      case 'delivering':
        return (
          <Button
            onClick={() => onUpdateStatus(order.id, 'completed')}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isUpdating ? 'Đang xử lý...' : 'Hoàn thành đơn hàng'}
          </Button>
        );
      default:
        return null;
    }
  };

  // Find shipper info if available
  const shipper = order.shippingDetail?.shipper;
  const hasShippingDetail = order.shippingDetail && (order.status === "shipper_received" || order.status === "delivering");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Chi tiết đơn hàng #{order.id.slice(-8)}</h2>
              <p className="text-amber-100 text-sm">{formatTime(order.createdAt)}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status || 'pending')} bg-white`}>
                {order.status?.toUpperCase() || 'PENDING'}
              </span>
              <button
                title='Đóng'
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className={`grid grid-cols-1 ${hasShippingDetail ? 'xl:grid-cols-3' : 'lg:grid-cols-2'} gap-8`}>
            {/* Customer Information */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-600" />
                  Thông tin khách hàng
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Tên:</span> {order.user?.name || 'Ẩn danh'}
                  </p>
                  {order.user?.phone && (
                    <p className="text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {order.user.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  Địa chỉ giao hàng
                </h3>
                <p className="text-gray-700">
                  {order.address ? 
                    [order.address.street, order.address.ward, order.address.district, order.address.city]
                      .filter(Boolean)
                      .join(', ') 
                    : 'Chưa có địa chỉ'
                  }
                </p>
              </div>

              {order.note && (
                <div className="bg-yellow-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Ghi chú</h3>
                  <p className="text-gray-700">{order.note}</p>
                </div>
              )}

              {/* Order Timeline */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Thời gian
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Đặt hàng:</span> {formatTime(order.createdAt)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Cập nhật cuối:</span> {formatTime(order.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  Chi tiết đơn hàng
                </h3>
                <div className="space-y-3">
                  {order.orderDetails?.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white rounded-lg p-3">
                      {item.food?.image && (
                        <img
                          src={item.food.image}
                          alt={item.food.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.food?.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} x {Number(item.price).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {(Number(item.price) * item.quantity).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    Tổng tiền
                  </h3>
                  <p className="text-2xl font-bold text-amber-600">
                    {(order.total || 0).toLocaleString('vi-VN')}đ
                  </p>
                </div>
                {order.promotionCode && (
                  <p className="text-sm text-gray-600 mt-2">
                    Đã áp dụng mã: {order.promotionCode.code}
                  </p>
                )}
              </div>
            </div>

            {/* Shipping & Map Section - Only show when status is shipper_received or delivering */}
            {hasShippingDetail && (
              <div className="space-y-6">
                {/* Shipper Info */}
                {shipper && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-purple-600" />
                      Thông tin tài xế
                    </h3>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={shipper.avatar} alt={shipper.name} />
                        <AvatarFallback>{shipper.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{shipper.name}</h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {shipper.phone}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.status === "shipper_received" 
                            ? "Tài xế đang đến nhà hàng" 
                            : "Tài xế đang giao hàng"
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        // Add your chat functionality here
                        alert(`Mở chat với tài xế: ${shipper.name}`);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Nhắn tin với tài xế
                    </Button>
                  </div>
                )}

                {/* Map Section */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    Theo dõi đơn hàng
                  </h3>
                  <div className="w-full h-[300px] rounded-lg overflow-hidden bg-gray-100">
                    {order.shippingDetail?.shipper?.id && (
                      <ShipperLocationSubscriber
                        shipperId={order.shippingDetail.shipper.id}
                        onData={setShipperLocationData}
                      />
                    )}
                    <Map
                      shipperLocation={shipperLocationData?.shipperLocationUpdated}
                      userLocation={userLocation}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {order.status === "shipper_received" 
                      ? "Tài xế đang trên đường đến nhà hàng" 
                      : "Tài xế đang giao hàng đến khách hàng"
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Action Buttons */}
        {getStatusButtons() && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              {getStatusButtons()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}