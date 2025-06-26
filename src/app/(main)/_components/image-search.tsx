import React, { useRef, useState } from "react";

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
            window?.event?.stopPropagation?.();
            console.log("Detection clicked:", det);
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
              console.log("Label clicked:", det);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 relative w-full max-w-lg border border-orange-200">
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
        <input
          title="Chọn ảnh để nhận diện"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4 block w-full file:rounded-full file:border-0 file:bg-orange-50 file:text-orange-700 file:font-semibold file:px-4 file:py-2 file:mr-4"
        />
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

        {/* Detection details */}
        {detections.length > 0 && (
          <div className="mt-5">
            <h3 className="font-semibold mb-2 text-gray-700">Chi tiết nhận diện:</h3>
            <ul className="space-y-1">
              {detections.map((det, idx) => (
                <li
                  key={idx}
                  className={`flex items-center gap-2 cursor-pointer rounded px-2 py-1 transition-colors ${
                    hoveredIdx === idx
                      ? "bg-orange-100 text-orange-700 shadow"
                      : "hover:bg-orange-50"
                  }`}
                  onClick={() => console.log("Detection clicked:", det)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <span className="font-medium">{det.class_name}</span>
                  <span className="text-xs">
                    (Độ tin cậy: {(det.detection_confidence * 100).toFixed(1)}%)
                  </span>
                  <span className="text-xs text-gray-400">
                    [{det.bbox.x1}, {det.bbox.y1}, {det.bbox.x2}, {det.bbox.y2}]
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSearchModal;