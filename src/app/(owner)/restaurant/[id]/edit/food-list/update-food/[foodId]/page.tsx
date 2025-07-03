/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { userApi } from "@/api/user";
import { adminService } from "@/api/admin";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/components/ui/notification";
import {
  X,

  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Camera,
  Tag,
  Clock,
  DollarSign,
} from "lucide-react";
import { FoodDetail, Topping } from "@/interface";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FoodForm = {
  name: string;
  description: string;
  price: string;
  discountPercent?: string;
  categoryId: string;
  preparationTime?: string;
  image?: string;
  imageUrls?: string[];
};

export default function UpdateFoodPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { showNotification } = useNotification();
  const params = useParams();
  const restaurantId = Array.isArray(params.id) ? params.id[0] : params.id;
  const foodId = Array.isArray(params.foodId) ? params.foodId[0] : params.foodId;

  const [form, setForm] = useState<FoodForm>({
    name: "",
    description: "",
    price: "",
    discountPercent: "",
    categoryId: "",
    preparationTime: "",
    image: "",
    imageUrls: [],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [toppingName, setToppingName] = useState("");
  const [toppingPrice, setToppingPrice] = useState("");
  const [toppingLoading, setToppingLoading] = useState(false);
  const [toppingImageFile, setToppingImageFile] = useState<File | null>(null);
  const [toppingImagePreview, setToppingImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoryLoading(true);
      try {
        const token = getToken?.();
        if (!token) throw new Error("No token");
        const data = await adminService.Category.getCategories(token, 1, 50);
        setCategories(data.items || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategories([]);
        showNotification("Không thể tải danh mục", "error");
      } finally {
        setCategoryLoading(false);
      }
    };
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch food data
  useEffect(() => {
    const fetchFood = async () => {
      if (!foodId) return;
      setInitialLoading(true);
      setLoading(true);
      try {
        const token = getToken?.();
        if (!token || !restaurantId) throw new Error("No token or restaurant ID");
        const food: FoodDetail = await userApi.food.getFoodById(token, foodId);

        let categoryId = food.category?.id || "";
        if (
          categoryId &&
          categories.length > 0 &&
          !categories.some((cat) => cat.id === categoryId)
        ) {
          categoryId = "";
        }

        setForm({
          name: food.name || "",
          description: food.description || "",
          price: food.price?.toString() || "",
          discountPercent: food.discountPercent?.toString() || "",
          categoryId,
          preparationTime: food.preparationTime?.toString() || "",
          image: food.image || "",
          imageUrls: food.imageUrls || [],
        });
        setPreview(food.image || "");
        setImagePreviews(food.imageUrls || []);
        showNotification("Dữ liệu món ăn đã được tải", "success");
      } catch (err) {
        console.error("Failed to fetch food:", err);
        showNotification("Không thể tải dữ liệu món ăn", "error");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    if (categories.length > 0) {
      fetchFood();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodId, categories]);

  // Fetch toppings when foodId changes
  useEffect(() => {
    const fetchToppings = async () => {
      if (!foodId) return;
      try {
        const token = getToken();
        if (!token) return;
        const data = await userApi.food.getToppings(foodId);
        setToppings(data);
      } catch (err) {
        if (err instanceof Error) {
          console.error("Failed to fetch toppings:", err.message);
          showNotification("Không thể tải dữ liệu topping", "error");
        }
        setToppings([]);
      }
    };
    fetchToppings();
  }, [foodId, getToken, showNotification]);

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
    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);

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

  const handleAddTopping = async () => {
    if (!toppingName.trim() || !toppingPrice.trim()) {
      showNotification("Vui lòng nhập đầy đủ thông tin topping", "warning");
      return;
    }
    
    // Add price validation
    const priceValue = parseFloat(toppingPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      showNotification("Giá topping phải là số dương hợp lệ", "error");
      return;
    }
    
    setToppingLoading(true);
    try {
      const token = getToken();
      if (!token || !foodId) return;

      let toppingImageUrl = "";
      if (toppingImageFile) {
        setUploadProgress(25);
        const apiRequestBody = {
          fileName: toppingImageFile.name,
          fileType: toppingImageFile.type,
          folder: "topping-images",
          isPublic: true,
        };
        const signedUrlResponse = await fetch("/api/gcs-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiRequestBody),
        });

        setUploadProgress(50);
        if (!signedUrlResponse.ok) {
          const errorData = await signedUrlResponse.json().catch(() => ({ message: "Không thể lấy URL tải lên." }));
          throw new Error(errorData.message || `Lỗi khi lấy URL tải lên: ${signedUrlResponse.statusText}`);
        }
        const { url: signedUrl, publicUrl } = await signedUrlResponse.json();
        if (!signedUrl || !publicUrl) throw new Error("Không nhận được URL hợp lệ từ máy chủ.");

        setUploadProgress(75);
        const gcsUploadResponse = await fetch(signedUrl, {
          method: "PUT",
          body: toppingImageFile,
          headers: {
            "Content-Type": toppingImageFile.type,
            "x-goog-acl": "public-read",
          },
        });
        if (!gcsUploadResponse.ok) {
          throw new Error(`Tải ảnh topping lên GCS thất bại: ${gcsUploadResponse.statusText}`);
        }
        toppingImageUrl = publicUrl;
        setUploadProgress(100);
      }

      const newTopping = await userApi.food.addTopping(token, foodId, {
        name: toppingName.trim(),
        price: priceValue, // Send as number, not string
        image: toppingImageUrl,
      } as Topping);

      setToppings((prev) => [...prev, newTopping]);
      setToppingName("");
      setToppingPrice("");
      setToppingImageFile(null);
      setToppingImagePreview(null);
      setUploadProgress(0);
      showNotification("Đã thêm topping thành công", "success");
    } catch (err) {
      if (err instanceof Error) {
        showNotification(err.message || "Không thể thêm topping", "error");
      } else {
        showNotification("Thêm topping thất bại", "error");
      }
    } finally {
      setToppingLoading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveTopping = async (toppingId: string) => {
    setToppingLoading(true);
    try {
      const token = getToken();
      if (!token) return;
      await userApi.food.removeTopping(token, toppingId);
      setToppings((prev) => prev.filter((t) => t.id !== toppingId));
      showNotification("Đã xóa topping", "success");
    } catch (err) {
      if (err instanceof Error) {
        showNotification(err.message || "Không thể xóa topping", "error");
      } else {
        showNotification("Xóa topping thất bại", "error");
      }
    } finally {
      setToppingLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(10);

    try {
      const token = getToken();
      if (!token || !restaurantId || !foodId) throw new Error("No token or restaurant ID or food ID");

      let imageUrl = form.image || "";

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
      const updateData = {
        ...form,
        restaurantId,
        image: imageUrl,
        imageUrls,
      };

      await userApi.food.updateFood(token, foodId, updateData);
      setUploadProgress(100);

      showNotification("Cập nhật món ăn thành công!", "success");
      setTimeout(() => {
        router.push(`/restaurant/${restaurantId}/edit/food-list`);
      }, 1000);
    } catch (err) {
      if (err instanceof Error) {
        showNotification(err.message, "error");
      } else {
        showNotification("Cập nhật món ăn thất bại", "error");
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleToppingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification("Kích thước ảnh không được vượt quá 5MB", "error");
        return;
      }
      setToppingImageFile(file);
      setToppingImagePreview(URL.createObjectURL(file));
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Card className="w-80 p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Đang tải dữ liệu</h3>
              <p className="text-sm text-gray-500">Vui lòng đợi trong giây lát...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50  py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                <ImageIcon className="w-6 h-6 text-primary" />
                Cập nhật món ăn
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    Tên món ăn <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="mt-1"
                    placeholder="Nhập tên món ăn"
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Giá (VND) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="discountPercent">Giảm giá (%)</Label>
                  <Input
                    id="discountPercent"
                    name="discountPercent"
                    type="number"
                    value={form.discountPercent}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="categoryId">
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
                    <SelectTrigger className="mt-1">
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
                <div>
                  <Label htmlFor="preparationTime" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Thời gian chuẩn bị (phút)
                  </Label>
                  <Input
                    id="preparationTime"
                    name="preparationTime"
                    type="number"
                    value={form.preparationTime}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Mô tả chi tiết về món ăn..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Hình ảnh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cover Image */}
              <div>
                <Label htmlFor="image" className="block mb-2">Ảnh đại diện</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </div>
                  {preview && (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <Label htmlFor="imageUrls" className="block mb-2">Thư viện ảnh</Label>
                <Input
                  id="imageUrls"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUrlsChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={src}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Xóa ảnh"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Toppings */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Topping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Topping Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Tên topping"
                  value={toppingName}
                  onChange={(e) => setToppingName(e.target.value)}
                />
                <Input
                  placeholder="Giá"
                  type="number"
                  value={toppingPrice}
                  onChange={(e) => setToppingPrice(e.target.value)}
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleToppingImageChange}
                  className="file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
                />
              </div>

              {toppingImagePreview && (
                <div className="flex justify-center">
                  <img
                    src={toppingImagePreview}
                    alt="Topping preview"
                    className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}

              <Button
                type="button"
                onClick={handleAddTopping}
                disabled={toppingLoading || !toppingName || !toppingPrice}
                className="w-full"
              >
                {toppingLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang thêm...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Thêm topping
                  </div>
                )}
              </Button>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {/* Toppings List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {toppings.map((topping) => (
                  <div key={topping.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {topping.image && (
                      <img
                        src={topping.image}
                        alt={topping.name}
                        className="w-12 h-12 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1">
                      <span className="font-medium">{topping.name}</span>
                      <Badge variant="secondary" className="ml-2 hover:text-primary bg-primary">
                        {Number(topping.price).toLocaleString()}₫
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className=" hover:text-red-600 hover:bg-white/80"
                      onClick={() => handleRemoveTopping(topping.id)}
                      disabled={toppingLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {toppings.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Chưa có topping nào</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              {loading && uploadProgress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Đang cập nhật...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-lg font-semibold hover:text-primary "
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang cập nhật...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    Cập nhật món ăn
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}