// components/modals/ShipperRatingModal.tsx
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { userApi } from "@/api/user";

export default function ShipperRatingModal({ shipper, trigger, onSubmitted }: {
  shipper: { id: string; name: string; avatar?: string };
  trigger: React.ReactNode;
  onSubmitted?: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const handleSubmit = async () => {
    if (!comment.trim()) return alert("Vui lòng nhập nhận xét");
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        alert("Bạn cần đăng nhập để đánh giá.");
        return;
      }
      
      // Bây giờ token là string, gọi như bình thường
      await userApi.review.createShipperReview(token, {
        shipperId: shipper.id,
        rating,
        comment: comment.trim()
      });
      
      alert("Đã gửi đánh giá tài xế thành công!");
      setOpen(false);
      onSubmitted?.();
    } catch (e) {
      alert("Lỗi khi gửi đánh giá tài xế.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Đánh giá tài xế</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Image src={shipper.avatar || "/bot-avatar.png"} alt={shipper.name} width={40} height={40} className="rounded-full" />
            <div className="font-medium">{shipper.name}</div>
          </div>
          <div className="flex justify-center gap-1">
            {[1,2,3,4,5].map(i => (
              <Star
                key={i}
                onClick={() => setRating(i)}
                className={`w-6 h-6 cursor-pointer ${i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
              />
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tài xế thân thiện, giao hàng nhanh..."
          />
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Star className="w-4 h-4 mr-2" />}
            Gửi đánh giá tài xế
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
