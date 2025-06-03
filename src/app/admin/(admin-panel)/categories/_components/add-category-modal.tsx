"use client";

import { useState, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { adminService, CategoryResponse } from "@/api/admin";
import { useAuth } from "@/context/auth-context";
import { UploadCloudIcon } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreated?: (newCategoryList: CategoryResponse[]) => void;
}

const AddCategoryForm: React.FC<Props> = ({ onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

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
      const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setError("Định dạng tệp không hợp lệ. Chỉ chấp nhận PNG, JPG, GIF, WEBP.");
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

  const handleSubmit = async () => {
    if (!name) {
      setError("Vui lòng nhập tên danh mục.");
      return;
    }
    if (!imageFile) {
      setError("Vui lòng chọn hình ảnh cho danh mục.");
      return;
    }

    setLoading(true);
    setError(null);
    let finalImageGcsUrl = ""; // This will be the public URL from GCS

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
      }

      // Step 1: Get the signed URL from your Next.js API route
      // Send file metadata as JSON to your API route.
      const apiRequestBody = {
        fileName: imageFile.name,
        fileType: imageFile.type,
        folder: "category-images",
        isPublic: true, // Ensure the file is public
      };

      const signedUrlResponse = await fetch("/api/gcs-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiRequestBody),
      });

      if (!signedUrlResponse.ok) {
        const errorData = await signedUrlResponse.json().catch(() => ({ message: "Không thể lấy URL tải lên." }));
        throw new Error(errorData.message || `Lỗi khi lấy URL tải lên: ${signedUrlResponse.statusText}`);
      }

      const { url: signedUrl, publicUrl } = await signedUrlResponse.json(); // Destructure 'url' as 'signedUrl'
      if (!signedUrl || !publicUrl) {
        throw new Error("Không nhận được URL hợp lệ từ máy chủ.");
      }
      
      finalImageGcsUrl = publicUrl; // Store the final public URL

      // Step 2: Upload the file directly to GCS using the signed URL
      const gcsUploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: imageFile,
        headers: {
          "Content-Type": imageFile.type,
          "x-goog-acl": "public-read", // Set ACL to public-read for the object
        },
      });

      if (!gcsUploadResponse.ok) {
        // Attempt to get error message from GCS if available (often XML)
        const gcsErrorText = await gcsUploadResponse.text();
        console.error("GCS Upload Error Text:", gcsErrorText);
        throw new Error(`Tải ảnh lên GCS thất bại: ${gcsUploadResponse.statusText}`);
      }

      // Step 3: Create category with the GCS public URL
      await adminService.Category.createCategory(token, { name, image: finalImageGcsUrl });

      if (onCreated) {
        const res = await adminService.Category.getCategories(token, 1, 10);
        onCreated(res.items);
      }
      onClose();
    } catch (err) {
      let errorMessage = "Đã xảy ra lỗi không xác định.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error("Error in handleSubmit:", err);
    } finally {
      setLoading(false);
    }
  };

  // Remove the outer modal div. The DialogContent or DrawerContent from the parent will provide the modal shell.
  // The AddCategoryForm should just be the form's content.
  return (
    // The Dialog/Drawer in the parent page already provides the modal structure.
    // This component should only render the form's content.
    // The parent's DialogContent/DrawerContent usually has padding, so you might not need p-4 here.
    // Adjust styling as needed once the outer wrapper is removed.
    <div className="flex flex-col h-full"> {/* Use flex-col and h-full if you want it to fill the parent DialogContent/DrawerContent */}
      {/* Modal Header - This can be part of the Dialog/Drawer's header or kept here if preferred */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Thêm Danh Mục Mới</h2>

      </div>

      {/* Modal Body */}
      <div className="p-6 space-y-6 overflow-y-auto flex-grow"> {/* Added flex-grow and overflow-y-auto */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        <div>
          <Label htmlFor="categoryName" className="text-sm font-medium text-gray-700">Tên danh mục</Label>
          <Input
            id="categoryName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Trà sữa, Cà phê, Bánh ngọt"
            className="mt-1"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="categoryImage" className="text-sm font-medium text-gray-700">Hình ảnh danh mục</Label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Xem trước hình ảnh" className="mx-auto h-32 w-auto object-contain rounded-md" />
              ) : (
                <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <div className="flex text-sm text-gray-600 justify-center">
                <label
                  htmlFor="categoryImage"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                >
                  <span>{imageFile ? imageFile.name : "Tải lên một tệp"}</span>
                  <Input
                    id="categoryImage"
                    name="categoryImage"
                    type="file"
                    className="sr-only"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    onChange={handleImageChange}
                    disabled={loading}
                  />
                </label>
                {!imageFile && <p className="pl-1">hoặc kéo và thả</p>}
              </div>
              {!imageFile && <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP tối đa 2MB</p>}
              {imageFile && <Button variant="link" size="sm" className="text-xs text-red-500 hover:text-red-700 mt-1" onClick={() => { setImageFile(null); setImagePreview(null); (document.getElementById('categoryImage') as HTMLInputElement).value = ''; }} disabled={loading}>Xóa ảnh</Button>}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg mt-auto"> {/* Added mt-auto to push footer to bottom */}
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button className=" hover:text-primary" onClick={handleSubmit} disabled={loading || !name || !imageFile}>
          {loading ? "Đang xử lý..." : "Thêm Danh Mục"}
        </Button>
      </div>
    </div>
  );
};

export default AddCategoryForm;