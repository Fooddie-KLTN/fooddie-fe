import { useEffect, useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { guestService } from "@/api/guest";
import { Review } from "@/interface";
import { Star } from "lucide-react";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  foodId: string;
}

const PAGE_SIZE = 10;

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${star <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
      />
    ))}
    <span className="ml-1 text-sm">{Number(rating).toFixed(1)}</span>
  </div>
);

export default function ReviewModal({ open, onClose, foodId }: ReviewModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchReviews = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await guestService.food.getFoodReviews(foodId, pageNum, PAGE_SIZE);
      setReviews(prev => pageNum === 1 ? res.items : [...prev, ...res.items]);
      setHasMore((res.items?.length || 0) === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [foodId]);

  useEffect(() => {
    if (open) {
      setPage(1);
      fetchReviews(1);
    }
  }, [open, fetchReviews]);

  // Infinite scroll
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => {
      const el = scrollRef.current;
      if (!el || loading || !hasMore) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        setPage((prev) => prev + 1);
      }
    };
    const el = scrollRef.current;
    el?.addEventListener("scroll", handleScroll);
    return () => el?.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, open]);

  useEffect(() => {
    if (page > 1) fetchReviews(page);
  }, [page, fetchReviews]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tất cả đánh giá</DialogTitle>
        </DialogHeader>
        <div ref={scrollRef} className="overflow-y-auto flex-1 pr-2" style={{ maxHeight: "60vh" }}>
          {reviews.length === 0 && !loading && <div className="text-center text-gray-500 py-8">Chưa có đánh giá nào.</div>}
          {reviews.map((review) => (
            <div key={review.id} className="p-4 bg-gray-50 rounded-lg mb-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">{review.user?.name || "Ẩn danh"}</div>
                <StarRating rating={review.rating} />
              </div>
              <p className="text-sm text-gray-700">{review.comment}</p>
              {review.image && (
                <img
                  src={review.image}
                  alt="Review"
                  className="mt-2 max-h-40 rounded object-cover"
                  style={{ maxWidth: "100%" }}
                />
              )}
              <div className="text-xs text-gray-500 mt-2">
                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
          ))}
          {loading && <div className="text-center py-4 text-gray-400">Đang tải...</div>}
          {!hasMore && reviews.length > 0 && <div className="text-center py-2 text-gray-400">Đã hiển thị tất cả đánh giá.</div>}
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="w-full mt-2">Đóng</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}