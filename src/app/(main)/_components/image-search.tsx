import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloudIcon } from "lucide-react";

interface Detection {
  bbox: { x1: number; y1: number; x2: number; y2: number };
  class_id: number;
  class_name: string;
  classification_confidence: number;
  detection_confidence: number;
}
interface Props {
  open: boolean;
  onClose: () => void;
}

const highlightColor = "#fb923c"; // Tailwind orange-400

const ImageSearchModal: React.FC<Props> = ({ open, onClose }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // For scaling boxes
  const [imgNatural, setImgNatural] = useState({ width: 1, height: 1 });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setError(null);
    setDetections([]);
    setClassCounts({});
    setLoading(true);

    const file = e.target.files[0];
    setImageUrl(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("http://127.0.0.1:5000/image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Lỗi khi gửi ảnh đến server nhận diện!");
      const data = await res.json();
      setDetections(data.detections || []);
      setClassCounts(data.class_counts || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  // Draw bounding boxes on the image
  const renderBoxes = () => {
    if (!imgRef.current || !detections.length) return null;
    const img = imgRef.current;
    const scaleX = img.width / imgNatural.width;
    const scaleY = img.height / imgNatural.height;

    return detections.map((det, idx) => {
      const { x1, y1, x2, y2 } = det.bbox;
      const left = x1 * scaleX;
      const top = y1 * scaleY;
      const width = (x2 - x1) * scaleX;
      const height = (y2 - y1) * scaleY;
      const isHovered = hoveredIdx === idx;
      return (
        <div
          key={idx}
          style={{
            position: "absolute",
            left,
            top,
            width,
            height,
            border: `2.5px solid ${isHovered ? "#ea580c" : highlightColor}`,
            borderRadius: 10,
            boxSizing: "border-box",
            zIndex: 2,
            cursor: "pointer",
            pointerEvents: "auto",
            background: isHovered
              ? "rgba(251,146,60,0.18)"
              : "rgba(249,115,22,0.07)",
            boxShadow: isHovered
              ? "0 0 0 4px rgba(251,146,60,0.18)"
              : "0 2px 8px rgba(0,0,0,0.04)",
            transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
          }}
          title={det.class_name}
          onClick={() => {
            router.push(`/search?search=${encodeURIComponent(det.class_name)}`);
            onClose();
          }}
          onMouseEnter={() => setHoveredIdx(idx)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              background: isHovered ? "#ea580c" : highlightColor,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              padding: "3px 12px 3px 8px",
              borderRadius: "0 0 12px 0",
              zIndex: 3,
              cursor: "pointer",
              pointerEvents: "auto",
              boxShadow: isHovered
                ? "0 2px 12px rgba(251,146,60,0.18)"
                : "0 2px 6px rgba(0,0,0,0.08)",
              letterSpacing: 0.2,
              transition: "background 0.2s, box-shadow 0.2s",
              outline: isHovered ? "2px solid #ea580c" : "none",
            }}
            onClick={e => {
              e.stopPropagation();
              router.push(`/search?search=${encodeURIComponent(det.class_name)}`);
              onClose();
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {det.class_name}{" "}
            <span style={{ fontWeight: 400, fontSize: 12 }}>
              ({(det.detection_confidence * 100).toFixed(1)}%)
            </span>
          </span>
        </div>
      );
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 relative w-full max-w-lg border border-orange-200 flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-orange-500 text-2xl transition-colors"
          onClick={onClose}
          aria-label="Đóng"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-orange-600 flex items-center gap-2">
          <span role="img" aria-label="camera">📷</span> Tìm kiếm bằng hình ảnh
        </h2>
        {/* Modern file input styled like add-category-modal */}
        <div className="mb-4 flex flex-col items-center w-full">
          {!imageUrl ? (
            <div
              className="w-full flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md cursor-pointer transition hover:border-orange-400"
              onClick={() => !loading && fileInputRef.current?.click()}
              tabIndex={0}
              onKeyDown={e => {
                if ((e.key === "Enter" || e.key === " ") && !loading) {
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              aria-label="Chọn ảnh từ thiết bị"
            >
              <input
                title="Chọn ảnh từ thiết bị"
                id="imageSearchInput"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                disabled={loading}
                tabIndex={-1}
              />
              <div className="space-y-1 text-center w-full flex flex-col items-center justify-center">
                <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <span className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                    Tải lên một tệp
                  </span>
                  <p className="pl-1">hoặc kéo và thả</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP tối đa 2MB</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline mt-2"
                onClick={() => {
                  setImageUrl(null);
                  setDetections([]);
                  setClassCounts({});
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                disabled={loading}
              >
                Chọn ảnh khác
              </button>
            </div>
          )}
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="#fb923c"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="#fb923c"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Đang nhận diện...
          </div>
        )}
        {error && <div className="text-red-500 mb-2">{error}</div>}

        {/* Class summary */}
        {Object.keys(classCounts).length > 0 && (
          <div className="mb-3">
            <div className="font-semibold text-gray-700 mb-1">Kết quả tổng hợp:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(classCounts).map(([name, count]) => (
                <span
                  key={name}
                  className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                >
                  {name}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Image and boxes */}
        <div className="relative w-full flex justify-center min-h-[120px]">
          {imageUrl && (
            <div style={{ position: "relative", display: "inline-block" }}>
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Uploaded"
                style={{
                  maxWidth: 400,
                  maxHeight: 350,
                  borderRadius: 12,
                  display: "block",
                  boxShadow: "0 4px 24px rgba(251,146,60,0.08)",
                  border: "1.5px solid #fcd34d",
                }}
                onLoad={e => {
                  const img = e.currentTarget;
                  setImgNatural({ width: img.naturalWidth, height: img.naturalHeight });
                }}
              />
              {/* Boxes */}
              {renderBoxes()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageSearchModal;