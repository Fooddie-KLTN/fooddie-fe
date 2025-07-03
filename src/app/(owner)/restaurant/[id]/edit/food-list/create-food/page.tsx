"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { userApi } from "@/api/user";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/components/ui/notification";
import {
  X,

  Plus,
  ArrowLeft,
  Save,
  Camera,
  Tag,
  Clock,
  DollarSign,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { guestService } from "@/api/guest";

export default function CreateFoodPage() {
    const router = useRouter();
    const params = useParams();
    const { getToken } = useAuth();
    const { showNotification } = useNotification();
    const restaurantId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        discountPercent: "",
        categoryId: "",
        preparationTime: "",
        image: "",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const fetchCategories = async () => {
            setCategoryLoading(true);
            try {
                const res = await guestService.category.getCategories(1, 100);
                setCategories(res.items);
                showNotification("Danh mục đã được tải", "success");
            } catch (err) {
                console.error("Failed to fetch categories:", err);
                setCategories([]);
                showNotification("Không thể tải danh mục", "error");
            } finally {
                setCategoryLoading(false);
            }
        };
        fetchCategories();
    }, [showNotification]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showNotification("Kích thước ảnh không được vượt quá 5MB", "error");
                return;
            }
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
            showNotification("Ảnh đã được chọn", "success");
        }
    };

    const handleImageUrlsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
        
        if (validFiles.length !== files.length) {
            showNotification("Một số ảnh có kích thước quá lớn (>5MB) đã bị loại bỏ", "warning");
        }
        
        setImageFiles(validFiles);
        setImagePreviews(validFiles.map((file) => URL.createObjectURL(file)));
        if (validFiles.length > 0) {
            showNotification(`Đã chọn ${validFiles.length} ảnh`, "success");
        }
    };

    const handleRemoveImage = (idx: number) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== idx));
        setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
        showNotification("Đã xóa ảnh", "info");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setUploadProgress(10);
        
        try {
            const token = getToken();
            if (!token || !restaurantId) throw new Error("No token or restaurant ID");

            let imageUrl = "";
            
            // Cover image upload
            if (imageFile) {
                setUploadProgress(25);
                const apiRequestBody = {
                    fileName: imageFile.name,
                    fileType: imageFile.type,
                    folder: "food-images",
                    isPublic: true,
                };
                const signedUrlResponse = await fetch("/api/gcs-upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(apiRequestBody),
                });
                
                if (!signedUrlResponse.ok) {
                    const errorData = await signedUrlResponse.json().catch(() => ({ message: "Không thể lấy URL tải lên." }));
                    throw new Error(errorData.message || `Lỗi khi lấy URL tải lên: ${signedUrlResponse.statusText}`);
                }
                const { url: signedUrl, publicUrl } = await signedUrlResponse.json();
                if (!signedUrl || !publicUrl) throw new Error("Không nhận được URL hợp lệ từ máy chủ.");

                setUploadProgress(50);
                const gcsUploadResponse = await fetch(signedUrl, {
                    method: "PUT",
                    body: imageFile,
                    headers: {
                        "Content-Type": imageFile.type,
                        "x-goog-acl": "public-read",
                    },
                });
                if (!gcsUploadResponse.ok) {
                    throw new Error(`Tải ảnh lên GCS thất bại: ${gcsUploadResponse.statusText}`);
                }
                imageUrl = publicUrl;
            }

            // Gallery images upload
            const imageUrls: string[] = [];
            if (imageFiles.length > 0) {
                setUploadProgress(60);
                for (let i = 0; i < imageFiles.length; i++) {
                    const file = imageFiles[i];
                    const apiRequestBody = {
                        fileName: file.name,
                        fileType: file.type,
                        folder: "food-images",
                        isPublic: true,
                    };
                    const signedUrlResponse = await fetch("/api/gcs-upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(apiRequestBody),
                    });
                    
                    if (!signedUrlResponse.ok) {
                        const errorData = await signedUrlResponse.json().catch(() => ({ message: "Không thể lấy URL tải lên." }));
                        throw new Error(errorData.message || `Lỗi khi lấy URL tải lên: ${signedUrlResponse.statusText}`);
                    }
                    const { url: signedUrl, publicUrl } = await signedUrlResponse.json();
                    if (!signedUrl || !publicUrl) throw new Error("Không nhận được URL hợp lệ từ máy chủ.");

                    const gcsUploadResponse = await fetch(signedUrl, {
                        method: "PUT",
                        body: file,
                        headers: {
                            "Content-Type": file.type,
                            "x-goog-acl": "public-read",
                        },
                    });
                    if (!gcsUploadResponse.ok) {
                        throw new Error(`Tải ảnh lên GCS thất bại: ${gcsUploadResponse.statusText}`);
                    }
                    imageUrls.push(publicUrl);
                    setUploadProgress(60 + (i + 1) * (20 / imageFiles.length));
                }
            }

            if (!imageUrl && imageUrls.length > 0) {
                imageUrl = imageUrls[0];
            }

            setUploadProgress(90);
            const result = await userApi.food.createFood(token, {
                ...form,
                restaurantId,
                image: imageUrl,
                imageUrls,
            });
            console.log("Food created successfully:", result);
            setUploadProgress(100);
            
            showNotification("Tạo món ăn thành công!", "success");
            setTimeout(() => {
                router.push(`/restaurant/${restaurantId}/edit/food-list`);
            }, 1000);
        } catch (err) {
            if (err instanceof Error) {
                showNotification(err.message, "error");
            } else {
                showNotification("Tạo món ăn thất bại", "error");
            }
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="min-h-screen ">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Modern Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/80 transition-all duration-200 shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                    </div>
                    
                    <div className="text-center">
                        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-md rounded-2xl px-8 py-4 shadow-lg border border-white/20">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center">
                                <Plus className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                                    Thêm món ăn mới
                                </h1>
                                <p className="text-sm text-gray-600">Tạo món ăn mới cho nhà hàng của bạn</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information Card */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <Tag className="w-4 h-4" />
                                </div>
                                <h2 className="text-lg font-semibold">Thông tin cơ bản</h2>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        Tên món ăn <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        className="h-12 rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200"
                                        placeholder="Nhập tên món ăn"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-amber-600" />
                                        Giá (VND) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        value={form.price}
                                        onChange={handleChange}
                                        required
                                        className="h-12 rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discountPercent" className="text-sm font-medium text-gray-700">
                                        Giảm giá (%)
                                    </Label>
                                    <Input
                                        id="discountPercent"
                                        name="discountPercent"
                                        type="number"
                                        value={form.discountPercent}
                                        onChange={handleChange}
                                        className="h-12 rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200"
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="categoryId" className="text-sm font-medium text-gray-700">
                                        Danh mục <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={form.categoryId}
                                        onValueChange={(value) =>
                                            setForm((prev) => ({ ...prev, categoryId: value }))
                                        }
                                        disabled={categoryLoading}
                                        required
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500/20">
                                            <SelectValue placeholder="Chọn danh mục" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="preparationTime" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                        Thời gian chuẩn bị (phút)
                                    </Label>
                                    <Input
                                        id="preparationTime"
                                        name="preparationTime"
                                        type="number"
                                        value={form.preparationTime}
                                        onChange={handleChange}
                                        className="h-12 rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                    Mô tả món ăn
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    className="rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200 resize-none"
                                    placeholder="Mô tả chi tiết về món ăn, nguyên liệu, hương vị..."
                                    rows={4}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Images Section */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <Camera className="w-4 h-4" />
                                </div>
                                <h2 className="text-lg font-semibold">Hình ảnh món ăn</h2>
                            </div>
                        </div>
                        <div className="p-6 space-y-8">
                            {/* Cover Image */}
                            <div className="space-y-4">
                                <Label className="text-sm font-medium text-gray-700">Ảnh đại diện món ăn</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 transition-all duration-200 hover:border-amber-400 hover:bg-amber-50/50">
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="image" className="cursor-pointer">
                                        <div className="flex flex-col items-center gap-4">
                                            {preview ? (
                                                <div className="relative">
                                                    <img
                                                        src={preview}
                                                        alt="Preview"
                                                        className="w-32 h-32 object-cover rounded-xl border-4 border-white shadow-lg"
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <span className="text-white text-sm font-medium">Thay đổi ảnh</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                                                    <Camera className="w-8 h-8 text-amber-600" />
                                                </div>
                                            )}
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-gray-700">
                                                    {preview ? "Nhấn để thay đổi ảnh" : "Nhấn để chọn ảnh đại diện"}
                                                </p>
                                                <p className="text-xs text-gray-500">PNG, JPG lên đến 5MB</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Gallery Images */}
                            <div className="space-y-4">
                                <Label className="text-sm font-medium text-gray-700">Thư viện ảnh (Tùy chọn)</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 transition-all duration-200 hover:border-amber-400 hover:bg-amber-50/50">
                                    <Input
                                        id="imageUrls"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUrlsChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="imageUrls" className="cursor-pointer">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                                                <Plus className="w-6 h-6 text-amber-600" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-gray-700">Thêm nhiều ảnh</p>
                                                <p className="text-xs text-gray-500">Chọn nhiều ảnh để tạo thư viện</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {imagePreviews.map((src, idx) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={src}
                                                    alt={`Preview ${idx + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg border-2 border-white shadow-md"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                                                    title="Xóa ảnh"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-6">
                        {loading && uploadProgress > 0 && (
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span className="font-medium">Đang tạo món ăn...</span>
                                    <span className="font-mono">{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                                        style={{ width: `${uploadProgress}%` }}
                                    >
                                        {uploadProgress > 20 && (
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Đang tạo món ăn...
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Save className="w-5 h-5" />
                                    Tạo món ăn
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}