import { useState } from "react";
import { GuestPromotionResponse } from "@/api/guest";

interface PromotionSectionProps {
  promotions: GuestPromotionResponse[];
}

function getPromotionTypeLabel(type: string) {
  if (type === "FOOD_DISCOUNT") return "Giảm giá món ăn";
  if (type === "SHIPPING_DISCOUNT") return "Giảm phí vận chuyển";
  return "Khuyến mãi";
}

export default function PromotionSection({ promotions }: PromotionSectionProps) {
  const [startIdx, setStartIdx] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const visiblePromotions = promotions.slice(startIdx, startIdx + 2);

  const canPrev = startIdx > 0;
  const canNext = startIdx + 2 < promotions.length;

  const handlePrev = () => {
    if (canPrev) {
      setDirection("left");
      setStartIdx(startIdx - 2);
    }
  };

  const handleNext = () => {
    if (canNext) {
      setDirection("right");
      setStartIdx(startIdx + 2);
    }
  };

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold mb-6">Ưu đãi đặc biệt</h2>
      <div className="relative flex items-center">
        <button
          onClick={handlePrev}
          disabled={!canPrev}
          className={`absolute left-0 z-10 bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-opacity duration-200 ${
            canPrev ? "opacity-100" : "opacity-30 cursor-not-allowed"
          }`}
          aria-label="Xem khuyến mãi trước"
        >
          &#8592;
        </button>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 mx-12">
          {visiblePromotions.map((promo) => (
            <div
              key={promo.id}
              className={`
                rounded-xl overflow-hidden relative h-48 bg-cover bg-center
                transition-all duration-500 ease-in-out
                ${direction === "right" ? "animate-fade-in-right" : ""}
                ${direction === "left" ? "animate-fade-in-left" : ""}
              `}
              style={{ backgroundImage: `url(${promo.image})` }}
              onAnimationEnd={() => setDirection(null)}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40 p-6 flex flex-col justify-end">
                <h3 className="text-white text-xl font-bold">
                  {getPromotionTypeLabel(promo.type)}
                </h3>
                <p className="text-white text-sm mb-2">{promo.description}</p>
                <div className="flex items-center">
                  <span className="bg-primary text-white text-sm py-1 px-2 rounded-md">{promo.code}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleNext}
          disabled={!canNext}
          className={`absolute right-0 z-10 bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-opacity duration-200 ${
            canNext ? "opacity-100" : "opacity-30 cursor-not-allowed"
          }`}
          aria-label="Xem khuyến mãi tiếp"
        >
          &#8594;
        </button>
      </div>
    </div>
  );
}