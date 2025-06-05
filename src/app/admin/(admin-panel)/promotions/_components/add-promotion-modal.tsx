"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminService, PromotionType } from "@/api/admin";
import { useAuth } from "@/context/auth-context";
import { UploadCloudIcon } from "lucide-react";
import { DateRangePicker } from "@/components/date-picker-range";

interface AddPromotionFormProps {
  onClose: () => void;
}

interface FormData {
  code: string;
  description: string;
  type: PromotionType;
  discountPercent?: number;
  discountAmount?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  image?: string;
  maxUsage?: number;
}

const AddPromotionForm: React.FC<AddPromotionFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    code: "",
    description: "",
    type: PromotionType.FOOD_DISCOUNT,
    discountPercent: undefined,
    discountAmount: undefined,
    minOrderValue: undefined,
    maxDiscountAmount: undefined,
    image: "",
    maxUsage: undefined,
  });

  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["discountPercent", "discountAmount", "minOrderValue", "maxDiscountAmount", "maxUsage"].includes(name)
        ? (value === "" ? undefined : Number(value))
        : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value as PromotionType,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Kích thước tệp không được vượt quá 2MB.");
        setImageFile(null);
        setImagePreview(null);
        if (e.target) e.target.value = "";
        return;
      }
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError(
          "Định dạng tệp không hợp lệ. Chỉ chấp nhận PNG, JPG, GIF, WEBP."
        );
        setImageFile(null);
        setImagePreview(null);
        if (e.target) e.target.value = "";
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const uploadImageToGCS = async (file: File): Promise<string> => {
    const apiRequestBody = {
      fileName: file.name,
      fileType: file.type,
      folder: "promotion-images",
      isPublic: true,
    };

    const signedUrlResponse = await fetch("/api/gcs-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody),
    });

    if (!signedUrlResponse.ok) {
      const errorData = await signedUrlResponse
        .json()
        .catch(() => ({ message: "Không thể lấy URL tải lên." }));
      throw new Error(
        errorData.message || `Lỗi khi lấy URL tải lên: ${signedUrlResponse.statusText}`
      );
    }

    const { url: signedUrl, publicUrl } = await signedUrlResponse.json();
    if (!signedUrl || !publicUrl) {
      throw new Error("Không nhận được URL hợp lệ từ máy chủ.");
    }

    const gcsUploadResponse = await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
        "x-goog-acl": "public-read",
      },
    });

    if (!gcsUploadResponse.ok) {
      const gcsErrorText = await gcsUploadResponse.text();
      console.error("GCS Upload Error Text:", gcsErrorText);
      throw new Error(`Tải ảnh lên GCS thất bại: ${gcsUploadResponse.statusText}`);
    }

    return publicUrl;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.code || !formData.description) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      setIsLoading(false);
      return;
    }

    // Validate based on promotion type
    if (formData.type === PromotionType.FOOD_DISCOUNT) {
      if (!formData.discountPercent && !formData.discountAmount) {
        setError("Vui lòng nhập giá trị giảm giá.");
        setIsLoading(false);
        return;
      }
      if (formData.discountPercent && (formData.discountPercent <= 0 || formData.discountPercent > 100)) {
        setError("Phần trăm giảm giá phải từ 1 đến 100.");
        setIsLoading(false);
        return;
      }
    }

    // Validate date range
    if (dateRange.start && dateRange.end && dateRange.start > dateRange.end) {
      setError("Ngày bắt đầu không thể sau ngày kết thúc.");
      setIsLoading(false);
      return;
    }

    try {
      const token = getToken();
      if (!token) throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");

      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImageToGCS(imageFile);
      }

      await adminService.Promotion.createPromotion(token, {
        code: formData.code,
        description: formData.description,
        type: formData.type,
        discountPercent: formData.discountPercent,
        discountAmount: formData.discountAmount,
        minOrderValue: formData.minOrderValue,
        maxDiscountAmount: formData.maxDiscountAmount,
        image: imageUrl,
        maxUsage: formData.maxUsage,
        startDate: dateRange.start?.toISOString(),
        endDate: dateRange.end?.toISOString(),
      });
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Error creating promotion:", err);
      } else {
        setError("Không thể lưu khuyến mãi. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!imageFile && !imagePreview) return;
    setIsLoading(true);
    setError(null);

    try {
      let filePath = "";
      if (formData.image) {
        const url = new URL(formData.image);
        const pathParts = url.pathname.split("/");
        filePath = pathParts.slice(2).join("/");
      }

      if (filePath) {
        await fetch("/api/gcs-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: [filePath] }),
        });
      }
      setImageFile(null);
      setImagePreview(null);
      setFormData((prev) => ({ ...prev, image: "" }));
      (document.getElementById("promotionImage") as HTMLInputElement).value = "";
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không thể xóa ảnh. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 grid gap-4">
      <h2 className="text-2xl font-bold text-gray-800">
        Thêm mã giảm giá mới
      </h2>

      <div className="grid gap-1">
        <Label htmlFor="code" className="text-base">
          Mã code *
        </Label>
        <Input
          id="code"
          name="code"
          type="text"
          value={formData.code}
          onChange={handleChange}
          placeholder="Nhập mã khuyến mãi (VD: SALE50)"
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="description" className="text-base">
          Mô tả *
        </Label>
        <Input
          id="description"
          name="description"
          type="text"
          value={formData.description}
          onChange={handleChange}
          placeholder="Mô tả khuyến mãi"
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="type" className="text-base">
          Loại khuyến mãi *
        </Label>
        <Select
          value={formData.type}
          onValueChange={handleSelectChange}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn loại khuyến mãi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PromotionType.FOOD_DISCOUNT}>
              Giảm giá món ăn
            </SelectItem>
            <SelectItem value={PromotionType.SHIPPING_DISCOUNT}>
              Giảm phí vận chuyển
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditional fields based on promotion type */}
      {formData.type === PromotionType.FOOD_DISCOUNT && (
        <>
          <div className="grid gap-1">
            <Label htmlFor="discountPercent" className="text-base">
              Giảm giá (%)
            </Label>
            <Input
              id="discountPercent"
              name="discountPercent"
              type="number"
              min={1}
              max={100}
              value={formData.discountPercent || ""}
              onChange={handleChange}
              placeholder="Nhập phần trăm giảm"
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="discountAmount" className="text-base">
              Hoặc giảm giá cố định (VND)
            </Label>
            <Input
              id="discountAmount"
              name="discountAmount"
              type="number"
              min={1}
              value={formData.discountAmount || ""}
              onChange={handleChange}
              placeholder="Nhập số tiền giảm cố định"
              disabled={isLoading}
            />
          </div>
        </>
      )}

      {formData.type === PromotionType.SHIPPING_DISCOUNT && (
        <div className="grid gap-1">
          <Label htmlFor="discountAmount" className="text-base">
            Giảm phí vận chuyển (VND)
          </Label>
          <Input
            id="discountAmount"
            name="discountAmount"
            type="number"
            min={1}
            value={formData.discountAmount || ""}
            onChange={handleChange}
            placeholder="Nhập số tiền giảm phí ship (để trống = miễn phí hoàn toàn)"
            disabled={isLoading}
          />
        </div>
      )}

      <div className="grid gap-1">
        <Label htmlFor="minOrderValue" className="text-base">
          Giá trị đơn hàng tối thiểu
        </Label>
        <Input
          id="minOrderValue"
          name="minOrderValue"
          type="number"
          min={0}
          value={formData.minOrderValue || ""}
          onChange={handleChange}
          placeholder="Để trống nếu không yêu cầu"
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="maxDiscountAmount" className="text-base">
          Giảm giá tối đa
        </Label>
        <Input
          id="maxDiscountAmount"
          name="maxDiscountAmount"
          type="number"
          min={0}
          value={formData.maxDiscountAmount || ""}
          onChange={handleChange}
          placeholder="Để trống nếu không giới hạn"
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="maxUsage" className="text-base">
          Số lần sử dụng tối đa
        </Label>
        <Input
          id="maxUsage"
          name="maxUsage"
          type="number"
          min={1}
          value={formData.maxUsage || ""}
          onChange={handleChange}
          placeholder="Để trống nếu không giới hạn"
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-1">
        <Label className="text-base">Thời gian áp dụng</Label>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          placeholder="Chọn khoảng thời gian áp dụng"
          minDate={new Date()}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500">
          Để trống nếu mã không có thời hạn
        </p>
      </div>

      <div className="grid gap-1">
        <Label htmlFor="promotionImage" className="text-base">
          Ảnh khuyến mãi
        </Label>
        <div className="flex flex-col items-center">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-2 w-32 h-32 object-cover rounded border"
            />
          ) : (
            <UploadCloudIcon className="mt-2 w-12 h-12 text-gray-400" />
          )}
          <Input
            id="promotionImage"
            name="promotionImage"
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            onChange={handleImageChange}
            disabled={isLoading}
            className="mt-2"
          />
          {!imageFile && (
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF, WEBP tối đa 2MB
            </p>
          )}
          {imageFile && (
            <Button
              variant="link"
              size="sm"
              className="text-xs text-red-500 hover:text-red-700 mt-1"
              type="button"
              onClick={handleRemoveImage}
              disabled={isLoading}
            >
              Xóa ảnh
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <div className="flex justify-end gap-2 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Đang lưu..." : "Lưu mã giảm giá"}
        </Button>
      </div>
    </form>
  );
};

export default AddPromotionForm;
