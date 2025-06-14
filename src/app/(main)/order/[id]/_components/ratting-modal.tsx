import React, { useState } from "react";
import { Star, Camera, X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import { adminService } from "@/api/admin";
import { userApi } from "@/api/user";
import { useAuth } from "@/context/auth-context";

interface RatingModalProps {
  orderDetails: Array<{
    food: {
      id: string;
      name: string;
      image: string;
    };
  }>;
  onReviewSubmitted?: () => void;
  trigger?: React.ReactNode;
}

const StarRating = ({ 
  rating, 
  onRatingChange, 
  readonly = false 
}: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          title="Đánh giá"
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRatingChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={`transition-all duration-200 ${
            !readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
          }`}
        >
          <Star
            className={`w-8 h-8 ${
              star <= (hoverRating || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const getRatingText = (rating: number): string => {
  switch (rating) {
    case 1: return "Rất không hài lòng";
    case 2: return "Không hài lòng";
    case 3: return "Bình thường";
    case 4: return "Hài lòng";
    case 5: return "Rất hài lòng";
    default: return "";
  }
};

export default function RatingModal({
  orderDetails,
  onReviewSubmitted,
  trigger
}: RatingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { getToken } = useAuth();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert('Vui lòng nhập nhận xét về đơn hàng');
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) {
        alert('Vui lòng đăng nhập để đánh giá');
        return;
      }

      let imageUrl = '';

      // Upload image if selected
      if (selectedImage) {
        setUploading(true);
        try {
          const uploadResult = await adminService.uploadCoverImage(token, selectedImage);
          imageUrl = uploadResult.imageUrl;
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Có lỗi khi tải ảnh lên. Vui lòng thử lại.');
          return;
        } finally {
          setUploading(false);
        }
      }

      // Submit reviews for all foods in the order
      const reviewPromises = orderDetails.map(item => 
        userApi.review.createFoodReview(token, {
          foodId: item.food.id,
          comment: comment.trim(),
          image: imageUrl,
          rating
        })
      );

      await Promise.all(reviewPromises);

      // Success
      alert('Đánh giá của bạn đã được gửi thành công!');
      setIsOpen(false);
      resetForm();
      onReviewSubmitted?.();

    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Có lỗi khi gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(5);
    setComment("");
    setSelectedImage(null);
    setImagePreview(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleModalClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0">
            <Star className="w-4 h-4 mr-2" />
            Đánh giá đơn hàng
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg mx-auto rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Đánh giá đơn hàng
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Order Foods Preview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Món ăn đã đặt</h3>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {orderDetails.map((item) => (
                <div key={item.food.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <Image
                      src={item.food.image}
                      alt={item.food.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.food.name}</h4>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Đánh giá của bạn sẽ được áp dụng cho tất cả {orderDetails.length} món ăn trong đơn hàng này
            </p>
          </div>

          {/* Rating */}
          <div className="text-center space-y-3">
            <p className="font-medium text-lg">Đánh giá của bạn</p>
            <StarRating rating={rating} onRatingChange={setRating} />
            <p className="text-sm text-gray-600 font-medium">
              {getRatingText(rating)}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nhận xét về đơn hàng <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Chia sẻ trải nghiệm của bạn về đơn hàng này... (tối thiểu 10 ký tự)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none rounded-xl min-h-[100px]"
              rows={4}
              required
            />
            <p className="text-xs text-gray-500">
              {comment.length}/500 ký tự
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Thêm hình ảnh (tùy chọn)
            </label>
            
            {imagePreview ? (
              <div className="relative group">
                <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={400}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  name="remove-image"
                  title="Xóa ảnh"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary cursor-pointer transition-colors group"
                >
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-primary">
                      Chọn ảnh từ thiết bị
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, JPEG (tối đa 5MB)
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || uploading || !comment.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl py-3 h-12"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploading ? 'Đang tải ảnh...' : 'Đang gửi đánh giá...'}
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                Gửi đánh giá cho {orderDetails.length} món ăn
              </>
            )}
          </Button>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              💡 Hướng dẫn viết đánh giá tốt:
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Chia sẻ trải nghiệm thực tế về chất lượng đơn hàng</li>
              <li>• Mô tả về hương vị, phần ăn, cách trình bày</li>
              <li>• Đánh giá tốc độ giao hàng và dịch vụ</li>
              <li>• Đưa ra lời khuyên hữu ích cho người dùng khác</li>
              <li>• Sử dụng ngôn ngữ lịch sự, tích cực</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}