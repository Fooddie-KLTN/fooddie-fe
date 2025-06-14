"use client";

import { JSX, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { formatDate, formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  BadgeCheck,
  ClockIcon,
  Package,
  Truck,
  XCircle,

  CheckCircle2,

} from "lucide-react";
import { Order } from "@/interface";
import { userApi } from "@/api/user";
import { PaginatedResponse } from "@/api/response.interface";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  delivering: "Đang giao",
  completed: "Hoàn thành",
  canceled: "Đã hủy",
  processing_payment: "Đang xử lý thanh toán",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  delivering: "bg-orange-50 text-orange-700 border-orange-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  canceled: "bg-red-50 text-red-700 border-red-200",
  processing_payment: "bg-purple-50 text-purple-700 border-purple-200",
};

const STATUS_ICONS: Record<string, JSX.Element> = {
  pending: <ClockIcon className="w-4 h-4" />,
  confirmed: <Package className="w-4 h-4" />,
  delivering: <Truck className="w-4 h-4" />,
  completed: <BadgeCheck className="w-4 h-4" />,
  canceled: <XCircle className="w-4 h-4" />,
  processing_payment: <ClockIcon className="w-4 h-4" />,
};

const PAGE_SIZE = 5;

const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-2 flex-1">
        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        <div className="h-3 bg-gray-100 rounded w-1/4"></div>
      </div>
      <div className="h-6 bg-gray-100 rounded-full w-20"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
    <div className="flex justify-between items-center">
      <div className="h-4 bg-gray-100 rounded w-1/5"></div>
      <div className="h-8 bg-gray-100 rounded w-20"></div>
    </div>
  </div>
);

// const StarRating = ({
//   rating,
//   onRatingChange,
//   readonly = false,
// }: {
//   rating: number;
//   onRatingChange?: (rating: number) => void;
//   readonly?: boolean;
// }) => {
//   return (
//     <div className="flex gap-1">
//       {[1, 2, 3, 4, 5].map((star) => (
//         <button
//           title="Click to rate"
//           key={star}
//           type="button"
//           disabled={readonly}
//           onClick={() => !readonly && onRatingChange?.(star)}
//           className={`transition-colors ${
//             !readonly ? "hover:scale-110" : ""
//           }`}
//         >
//           <Star
//             className={`w-6 h-6 ${
//               star <= rating
//                 ? "fill-yellow-400 text-yellow-400"
//                 : "text-gray-300"
//             }`}
//           />
//         </button>
//       ))}
//     </div>
//   );
// };

// const RatingModal = ({
//   order,
//   onSubmit,
// }: {
//   order: Order;
//   onSubmit: (rating: number, comment: string, images: File[]) => void;
// }) => {
//   const [rating, setRating] = useState(5);
//   const [comment, setComment] = useState("");
//   const [images, setImages] = useState<File[]>([]);
//   const [previewUrls, setPreviewUrls] = useState<string[]>([]);
//   const [isOpen, setIsOpen] = useState(false);

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(e.target.files || []);
//     setImages((prev) => [...prev, ...files].slice(0, 3)); // Max 3 images

//     // Create preview URLs
//     files.forEach((file) => {
//       const url = URL.createObjectURL(file);
//       setPreviewUrls((prev) => [...prev, url].slice(0, 3));
//     });
//   };

//   const removeImage = (index: number) => {
//     setImages((prev) => prev.filter((_, i) => i !== index));
//     setPreviewUrls((prev) => {
//       const newUrls = prev.filter((_, i) => i !== index);
//       URL.revokeObjectURL(prev[index]); // Clean up
//       return newUrls;
//     });
//   };

//   const handleSubmit = () => {
//     onSubmit(rating, comment, images);
//     setIsOpen(false);
//     setRating(5);
//     setComment("");
//     setImages([]);
//     setPreviewUrls([]);
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       <DialogTrigger asChild>
//         <Button
//           size="sm"
//           className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0"
//         >
//           <Star className="w-4 h-4 mr-1" />
//           Đánh giá
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="max-w-md mx-auto rounded-2xl">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-bold text-center">
//             Đánh giá đơn hàng
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-6 py-4">
//           {/* Restaurant Info */}
//           <div className="text-center">
//             <h3 className="font-semibold text-lg">{order.restaurant?.name}</h3>
//             <p className="text-gray-500 text-sm">
//               {formatDate(order.createdAt || "")}
//             </p>
//           </div>

//           {/* Rating */}
//           <div className="text-center space-y-2">
//             <p className="font-medium">Đánh giá của bạn</p>
//             <StarRating rating={rating} onRatingChange={setRating} />
//             <p className="text-sm text-gray-500">
//               {rating === 1 && "Rất không hài lòng"}
//               {rating === 2 && "Không hài lòng"}
//               {rating === 3 && "Bình thường"}
//               {rating === 4 && "Hài lòng"}
//               {rating === 5 && "Rất hài lòng"}
//             </p>
//           </div>

//           {/* Comment */}
//           <div className="space-y-2">
//             <label className="text-sm font-medium">Nhận xét (tùy chọn)</label>
//             <Textarea
//               placeholder="Chia sẻ trải nghiệm của bạn về món ăn, dịch vụ..."
//               value={comment}
//               onChange={(e) => setComment(e.target.value)}
//               className="resize-none rounded-xl"
//               rows={3}
//             />
//           </div>

//           {/* Image Upload */}
//           <div className="space-y-3">
//             <label className="text-sm font-medium flex items-center gap-2">
//               <Camera className="w-4 h-4" />
//               Thêm hình ảnh (tối đa 3 ảnh)
//             </label>

//             {previewUrls.length > 0 && (
//               <div className="grid grid-cols-3 gap-2">
//                 {previewUrls.map((url, index) => (
//                   <div key={index} className="relative group">
//                     <Image
//                       src={url}
//                       alt={`Preview ${index + 1}`}
//                       width={80}
//                       height={80}
//                       className="w-full h-20 object-cover rounded-lg"
//                     />
//                     <button
//                       onClick={() => removeImage(index)}
//                       className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
//                     >
//                       ×
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {images.length < 3 && (
//               <div className="relative">
//                 <Input
//                   type="file"
//                   accept="image/*"
//                   multiple
//                   onChange={handleImageChange}
//                   className="hidden"
//                   id="image-upload"
//                 />
//                 <label
//                   htmlFor="image-upload"
//                   className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary cursor-pointer transition-colors"
//                 >
//                   <ImageIcon className="w-5 h-5 text-gray-400" />
//                   <span className="text-sm text-gray-500">Chọn ảnh</span>
//                 </label>
//               </div>
//             )}
//           </div>

//           {/* Submit Button */}
//           <Button
//             onClick={handleSubmit}
//             className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl py-3"
//           >
//             Gửi đánh giá
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

const OrderPage = () => {
  const [tab, setTab] = useState<"current" | "completed" | "history">("current");
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyStatus, setHistoryStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  // Fetch current orders (not completed/canceled)
  useEffect(() => {
    if (tab !== "current") return;
    setLoading(true);
    const fetchCurrentOrders = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await userApi.order.getMyOrders(token, 1, 50);
        setCurrentOrders(
          res.items.filter(
            (order) =>
              order.status !== "completed" && order.status !== "canceled"
          )
        );
      } catch {
        setCurrentOrders([]);
      }
      setLoading(false);
    };
    fetchCurrentOrders();
  }, [tab, getToken]);

  // Fetch completed orders
  useEffect(() => {
    if (tab !== "completed") return;
    setLoading(true);
    const fetchCompletedOrders = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await userApi.order.getMyOrders(token, 1, 50, "completed");
        setCompletedOrders(res.items);
      } catch {
        setCompletedOrders([]);
      }
      setLoading(false);
    };
    fetchCompletedOrders();
  }, [tab, getToken]);

  // Fetch history orders (paginated, filtered)
  useEffect(() => {
    if (tab !== "history") return;
    setLoading(true);
    const fetchHistoryOrders = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const statusParam = historyStatus ? historyStatus : undefined;
        const res: PaginatedResponse<Order> = await userApi.order.getMyOrders(
          token,
          historyPage,
          PAGE_SIZE,
          statusParam
        );
        setHistoryOrders(res.items);
        setHistoryTotalPages(res.totalPages || 1);
      } catch {
        setHistoryOrders([]);
        setHistoryTotalPages(1);
      }
      setLoading(false);
    };
    fetchHistoryOrders();
  }, [tab, historyPage, historyStatus, getToken]);

  // const handleRatingSubmit = async (
  //   orderId: string,
  //   rating: number,
  //   comment: string,
  //   images: File[]
  // ) => {
  //   try {
  //     const token = await getToken();
  //     if (!token) return;

  //     // Here you would typically upload images first and get URLs
  //     // Then submit the rating with the image URLs
  //     console.log("Submitting rating:", { orderId, rating, comment, images });

  //     // Update the order status locally to show it's been rated
  //     setCompletedOrders((prev) =>
  //       prev.map((order) =>
  //         order.id === orderId
  //           ? { ...order, hasRated: true, userRating: rating }
  //           : order
  //       )
  //     );
  //   } catch (error) {
  //     console.error("Error submitting rating:", error);
  //   }
  // };

  const TabButton = ({
    active,
    onClick,
    children,
    count,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    count?: number;
  }) => (
    <button
      className={`flex-1 py-4 px-4 text-center font-medium transition-all duration-200 relative ${
        active
          ? "text-emerald-600 bg-white border-b-2 border-emerald-500 shadow-sm"
          : "text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700"
      }`}
      onClick={onClick}
    >
      <span className="flex items-center justify-center gap-2">
        {children}
        {count !== undefined && count > 0 && (
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700"
          >
            {count}
          </Badge>
        )}
      </span>
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
          <p className="text-gray-500 mt-2">
            Quản lý và theo dõi đơn hàng của bạn
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <TabButton
            active={tab === "current"}
            onClick={() => setTab("current")}
            count={currentOrders.length}
          >
            <Package className="w-4 h-4" />
            Đang xử lý
          </TabButton>
          <TabButton
            active={tab === "completed"}
            onClick={() => setTab("completed")}
            count={completedOrders.length}
          >
            <CheckCircle2 className="w-4 h-4" />
            Hoàn thành
          </TabButton>
          <TabButton
            active={tab === "history"}
            onClick={() => setTab("history")}
          >
            <ClockIcon className="w-4 h-4" />
            Lịch sử
          </TabButton>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Orders Tab */}
          {tab === "current" && (
            <div className="space-y-4">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : currentOrders.length === 0 ? (
                <div className="text-center text-gray-400 py-16">
                  <Package className="mx-auto mb-4 w-16 h-16 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">
                    Không có đơn hàng đang xử lý
                  </h3>
                  <p className="text-sm">Hãy đặt món ăn yêu thích của bạn</p>
                  <Button asChild className="mt-4">
                    <Link href="/search">Khám phá món ăn</Link>
                  </Button>
                </div>
              ) : (
                currentOrders.map((order) => (
                  <Link href={`/order/${order.id}`} key={order.id}>
                    <Card className="rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-emerald-600 transition-colors">
                              {order.restaurant?.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Đặt lúc:{" "}
                              {order.createdAt
                                ? formatDate(order.createdAt)
                                : ""}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`px-3 py-1 rounded-full border ${STATUS_COLORS[
                              order.status || "pending"
                            ]}`}
                          >
                            {STATUS_ICONS[order.status || "pending"]}
                            <span className="ml-2">
                              {STATUS_LABELS[order.status || ""] || order.status}
                            </span>
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-lg font-bold text-emerald-600">
                            {formatPrice(order.total || 0)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="group-hover:bg-emerald-50 group-hover:border-emerald-300"
                          >
                            Chi tiết
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Completed Orders Tab */}
          {tab === "completed" && (
            <div className="space-y-4">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : completedOrders.length === 0 ? (
                <div className="text-center text-gray-400 py-16">
                  <CheckCircle2 className="mx-auto mb-4 w-16 h-16 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">
                    Chưa có đơn hàng hoàn thành
                  </h3>
                  <p className="text-sm">
                    Các đơn hàng đã hoàn thành sẽ xuất hiện ở đây
                  </p>
                </div>
              ) : (
                completedOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">
                            {order.restaurant?.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Hoàn thành:{" "}
                            {order.createdAt
                              ? formatDate(order.createdAt)
                              : ""}
                          </p>
                          {/* {order.userRating && (
                            <div className="flex items-center gap-2 mt-2">
                              <StarRating rating={order.userRating} readonly />
                              <span className="text-sm text-gray-500">
                                Đã đánh giá
                              </span>
                            </div>
                          )} */}
                        </div>
                        <Badge
                          variant="outline"
                          className="px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="ml-2">Hoàn thành</span>
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-lg font-bold text-emerald-600">
                          {formatPrice(order.total || 0)}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/order/${order.id}`}>Chi tiết</Link>
                          </Button>
                          {/* {!order.hasRated && !order.userRating && (
                            <RatingModal
                              order={order}
                              onSubmit={(rating, comment, images) =>
                                handleRatingSubmit(
                                  order.id || "",
                                  rating,
                                  comment,
                                  images
                                )
                              }
                            />
                          )} */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-600 hover:bg-emerald-50"
                          >
                            Đặt lại
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* History Tab */}
          {tab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700">
                  Lọc theo trạng thái:
                </span>
                <Select
                  value={historyStatus || "all"}
                  onValueChange={(value) => {
                    setHistoryStatus(value === "all" ? "" : value);
                    setHistoryPage(1);
                  }}
                >
                  <SelectTrigger
                    className="w-48 bg-white"
                    aria-label="Lọc theo trạng thái"
                  >
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="canceled">Đã hủy</SelectItem>
                    <SelectItem value="processing_payment">
                      Đang xử lý thanh toán
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : historyOrders.length === 0 ? (
                <div className="text-center text-gray-400 py-16">
                  <ClockIcon className="mx-auto mb-4 w-16 h-16 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">Không có đơn hàng</h3>
                  <p className="text-sm">Chưa có đơn hàng nào với bộ lọc này</p>
                </div>
              ) : (
                historyOrders.map((order) => (
                  <Link href={`/order/${order.id}`} key={order.id}>
                    <Card className="rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900">
                              {order.restaurant?.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {order.createdAt ? formatDate(order.createdAt) : ""}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`px-3 py-1 rounded-full border ${STATUS_COLORS[
                              order.status || "pending"
                            ]}`}
                          >
                            {STATUS_ICONS[order.status || "pending"]}
                            <span className="ml-2">
                              {STATUS_LABELS[order.status || ""] || order.status}
                            </span>
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-lg font-bold text-emerald-600">
                            {formatPrice(order.total || 0)}
                          </div>
                          <Button variant="outline" size="sm">
                            Chi tiết
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={historyPage <= 1}
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    className="px-4"
                  >
                    Trước
                  </Button>
                  <span className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                    Trang{" "}
                    <span className="font-semibold">{historyPage}</span> /{" "}
                    {historyTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={historyPage >= historyTotalPages}
                    onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    className="px-4"
                  >
                    Sau
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderPage;