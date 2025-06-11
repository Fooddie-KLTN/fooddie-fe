"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { adminService } from "@/api/admin";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AddRoleFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const AddRoleForm: React.FC<AddRoleFormProps> = ({ onClose, onSuccess }) => {
  const router = useRouter();
  const { getToken } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    description: ""
  });
  
  // Form status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    description?: string;
    general?: string;
  }>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = "Tên vai trò không được để trống";
    }
    
    if (formData.description.length > 500) {
      newErrors.description = "Mô tả không được quá 500 ký tự";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const token = await getToken();
    if (!token) {
      setErrors({ general: "Không thể xác thực người dùng" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      
      const response = await adminService.Role.createRole(token, {
        displayName: formData.displayName,
        description: formData.description,
      });
      
      // Call success callback if provided (will refresh the role list)
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the modal
      onClose();
      
      // Navigate to the role detail page with the new role ID
      if (response && response.id) {
        router.push(`/admin/role/${response.id}`);
      }
      
    } catch (error) {
      setErrors({
        general: error instanceof Error 
          ? error.message 
          : "Có lỗi xảy ra khi tạo vai trò"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Thêm vai trò mới</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Đóng"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onClose()}
        >
        </button>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 border border-red-300 bg-red-50 rounded-md flex items-start gap-2 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-base font-medium">
            Tên vai trò <span className="text-red-500">*</span>
          </Label>
          <Input
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="Nhập tên vai trò"
            aria-required="true"
            aria-invalid={!!errors.displayName}
            className={errors.displayName ? "border-red-300" : ""}
            disabled={isSubmitting}
          />
          {errors.displayName && (
            <p className="text-md text-red-500">{errors.displayName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-medium">
            Mô tả
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả vai trò (không bắt buộc)"
            rows={4}
            aria-invalid={!!errors.description}
            className={errors.description ? "border-red-300" : ""}
            disabled={isSubmitting}
          />
          <p className="text-md text-gray-500">
            {formData.description.length}/500 ký tự
          </p>
          {errors.description && (
            <p className="text-md text-red-500">{errors.description}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2"
            tabIndex={0}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2"
            tabIndex={0}
          >
            {isSubmitting ? "Đang xử lý..." : "Thêm vai trò"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddRoleForm;