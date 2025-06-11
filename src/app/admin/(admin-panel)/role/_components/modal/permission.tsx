import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, AlertCircle, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface Permission {
  id: string;
  name: string;
  description: string;
  category?: string;
}

export interface PermissionAction {
  [key: string]: string;
}

export interface PermissionsByCategory {
  [category: string]: string | PermissionAction;
}

export interface GroupedPermissions {
  [category: string]: Permission[];
}

interface PermissionsMatrixProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: Permission[];
  selectedPermissions: string[];
  onPermissionChange: (permissionId: string, checked: boolean) => void;
  onSave: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isSystemRole: boolean;
}

// Cấu trúc phân quyền theo định dạng yêu cầu
export const PERMISSION_STRUCTURE: PermissionsByCategory = {
  ROLE: {
    CREATE: 'ROLE_CREATE',
    WRITE: 'ROLE_UPDATE',
    READ: 'ROLE_READ',
    DELETE: 'ROLE_DELETE',
    ALL: 'ROLE_LIST',
  },
  USER: {
    CREATE: 'USER_CREATE',
    WRITE: 'USER_UPDATE',
    READ: 'USER_READ',
    DELETE: 'USER_DELETE',
    ALL: 'USER_LIST',
  },
  RULE: {
    CREATE: 'RULE_CREATE',
    WRITE: 'RULE_UPDATE',
    READ: 'RULE_READ',
    DELETE: 'RULE_DELETE',
    ALL: 'RULE_LIST',
  },
  STORE: {
    CREATE: 'STORE_CREATE',
    WRITE: 'STORE_UPDATE',
    READ: 'STORE_READ',
    DELETE: 'STORE_DELETE',
    ALL: 'STORE_LIST',
  },
  CATEGORY: {
    CREATE: 'CATEGORY_CREATE',
    WRITE: 'CATEGORY_UPDATE',
    READ: 'CATEGORY_READ',
    DELETE: 'CATEGORY_DELETE',
    ALL: 'CATEGORY_LIST',
  },
  ORDER: {
    CREATE: 'ORDER_CREATE',
    WRITE: 'ORDER_UPDATE',
    READ: 'ORDER_READ',
    DELETE: 'ORDER_DELETE',
    ALL: 'ORDER_LIST',
  },
  SHIPPER: {
    CREATE: 'SHIPPER_CREATE',
    WRITE: 'SHIPPER_UPDATE',
    READ: 'SHIPPER_READ',
    DELETE: 'SHIPPER_DELETE',
    ALL: 'SHIPPER_LIST',
  },
  DASHBOARD: {
    CREATE: 'DASHBOARD_CREATE',
    WRITE: 'DASHBOARD_UPDATE',
    READ: 'DASHBOARD_READ',
    DELETE: 'DASHBOARD_DELETE',
    ALL: 'DASHBOARD_LIST',
  },
  PROMOTION: {
    CREATE: 'PROMOTION_CREATE',
    WRITE: 'PROMOTION_UPDATE',
    READ: 'PROMOTION_READ',
    DELETE: 'PROMOTION_DELETE',
    ALL: 'PROMOTION_LIST',
  },
};

// Lấy danh sách category từ PERMISSION_STRUCTURE
export const categoryTranslations: Record<string, string> = {
  ROLE: "Vai trò",
  USER: "Tài khoản",
  RULE: "Quy tắc",
  STORE: "Cửa hàng",
  CATEGORY: "Danh mục",
  ORDER: "Đơn hàng",
  SHIPPER: "Shipper",
  DASHBOARD: "Bảng điều khiển",
  PROMOTION: "Khuyến mãi",
};

// Lấy danh sách action từ PERMISSION_STRUCTURE (chỉ các action thực sự có)
export const actionTranslations: Record<string, string> = {
  CREATE: "Tạo mới",
  WRITE: "Chỉnh sửa",
  READ: "Xem",
  DELETE: "Xóa",
  ALL: "Xem danh sách",
};

// Hàm hỗ trợ định dạng tên hành động
export const formatActionName = (action: string): string => {
  return actionTranslations[action] || action.toLowerCase().replace(/_/g, ' ');
};

// Hàm tạo mô tả chi tiết cho quyền
export const createPermissionDescription = (action: string, category: string): string => {
  const actionText = actionTranslations[action] || action;
  const categoryText = categoryTranslations[category] || category;
  
  return `${actionText} ${categoryText.toLowerCase()}`;
};

const PermissionsMatrix = ({
  isOpen,
  onOpenChange,
  permissions,
  selectedPermissions,
  onPermissionChange,
  onSave,
  isLoading,
  error,
}: PermissionsMatrixProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Khởi tạo tất cả các danh mục ở trạng thái mở rộng
  useEffect(() => {
    const grouped: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      const category = permission.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });
    
    // Initialize all categories as expanded
    const initialExpanded: Record<string, boolean> = {};
    Object.keys(grouped).forEach(category => {
      initialExpanded[category] = true;
    });
    
    setExpandedCategories(initialExpanded);
  }, [permissions]);

  // Lọc danh mục dựa trên từ khóa tìm kiếm
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return Object.keys(PERMISSION_STRUCTURE);
    
    return Object.keys(PERMISSION_STRUCTURE).filter(category => {
      // Kiểm tra tên danh mục tiếng Việt
      const categoryVI = categoryTranslations[category] || category;
      if (categoryVI.toLowerCase().includes(searchQuery.toLowerCase())) return true;
      
      // Kiểm tra các quyền trong danh mục này
      const categoryPerms = PERMISSION_STRUCTURE[category];
      if (typeof categoryPerms === 'string') {
        return categoryPerms.toLowerCase().includes(searchQuery.toLowerCase());
      }
      
      return Object.entries(categoryPerms).some(([action]) => {
        const actionVI = actionTranslations[action] || action;
        return actionVI.toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  }, [searchQuery]);

  const handleSave = async () => {
    await onSave();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Chuyển đổi trạng thái mở rộng danh mục
  const handleToggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Kiểm tra xem danh mục có được chọn hoàn toàn không
  const isCategoryFullySelected = (category: string): boolean => {
    const categoryPerms = PERMISSION_STRUCTURE[category];
    
    if (typeof categoryPerms === 'string') {
      return selectedPermissions.includes(categoryPerms);
    }
    
    return Object.values(categoryPerms).every(permId => 
      selectedPermissions.includes(permId)
    );
  };

  // Kiểm tra xem danh mục có được chọn một phần không
  const isCategoryPartiallySelected = (category: string): boolean => {
    const categoryPerms = PERMISSION_STRUCTURE[category];
    
    if (typeof categoryPerms === 'string') {
      return false; // Quyền đơn chỉ có thể được chọn hoặc không
    }
    
    const permIds = Object.values(categoryPerms);
    const selectedCount = permIds.filter(permId => selectedPermissions.includes(permId)).length;
    
    return selectedCount > 0 && selectedCount < permIds.length;
  };

  // Xử lý chọn tất cả quyền trong một danh mục
  const handleSelectCategory = (category: string, checked: boolean, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    const categoryPerms = PERMISSION_STRUCTURE[category];
    
    if (typeof categoryPerms === 'string') {
      onPermissionChange(categoryPerms, checked);
      return;
    }
    
    Object.values(categoryPerms).forEach(permId => {
      onPermissionChange(permId, checked);
    });
  };

  // Đếm số quyền trong một danh mục
  const countPermissionsInCategory = (category: string): number => {
    const categoryPerms = PERMISSION_STRUCTURE[category];
    if (typeof categoryPerms === 'string') return 1;
    return Object.keys(categoryPerms).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản lý phân quyền</DialogTitle>
          <DialogDescription>
            Chọn các quyền mà vai trò này sẽ được cấp. Người dùng sẽ kế thừa tất cả các quyền của vai trò.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-3 border border-red-300 bg-red-50 rounded-md flex items-start gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Tìm kiếm quyền..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 w-full"
            aria-label="Tìm kiếm quyền"
          />
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Không tìm thấy quyền nào khớp với từ khóa tìm kiếm.</p>
              </div>
            ) : (
              filteredCategories.map(category => {
                const categoryPerms = PERMISSION_STRUCTURE[category];
                return (
                  <div key={category} className="border rounded-md overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
                    <div 
                      className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer"
                      onClick={() => handleToggleCategoryExpansion(category)}
                      onKeyDown={(e) => e.key === "Enter" && handleToggleCategoryExpansion(category)}
                      tabIndex={0}
                      aria-expanded={expandedCategories[category]}
                      aria-controls={`category-content-${category}`}
                      role="button"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          id={`category-${category}`}
                          checked={isCategoryFullySelected(category)}
                          onCheckedChange={(checked) => handleSelectCategory(category, checked === true)}
                          aria-label={`Chọn tất cả quyền ${categoryTranslations[category] || category}`}
                          className={`${isCategoryPartiallySelected(category) ? "opacity-70" : ""} h-5 w-5`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label 
                          htmlFor={`category-${category}`}
                          className="font-medium text-lg cursor-pointer text-gray-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {categoryTranslations[category] || category} 
                          <span className="text-md text-gray-500 ml-1 font-normal">
                            ({countPermissionsInCategory(category)})
                          </span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isCategoryFullySelected(category) && (
                          <span className="text-sm font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            Đã chọn tất cả
                          </span>
                        )}
                        {isCategoryPartiallySelected(category) && (
                          <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            Đã chọn một phần
                          </span>
                        )}
                        {expandedCategories[category] ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                    
                    {expandedCategories[category] && (
                      <div 
                        id={`category-content-${category}`}
                        className="p-4 bg-white border-t"
                      >
                        {typeof categoryPerms === 'string' ? (
                          <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                            <Checkbox 
                              id={`perm-${categoryPerms}`}
                              checked={selectedPermissions.includes(categoryPerms)}
                              onCheckedChange={(checked) => onPermissionChange(categoryPerms, checked === true)}
                              className="mt-0.5 h-5 w-5"
                              aria-label={`Quyền quản lý ${categoryTranslations[category]}`}
                            />
                            <div>
                              <Label 
                                htmlFor={`perm-${categoryPerms}`}
                                className="font-medium cursor-pointer text-gray-800"
                              >
                                {categoryTranslations.SETTING}
                              </Label>
                              <p className="text-base text-gray-600 mt-1">
                                Quản lý toàn bộ cài đặt hệ thống
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(categoryPerms).map(([action, permId]) => (
                              <div 
                                key={permId} 
                                className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <Checkbox 
                                  id={`perm-${permId}`}
                                  checked={selectedPermissions.includes(permId)}
                                  onCheckedChange={(checked) => onPermissionChange(permId, checked === true)}
                                  className="mt-0.5 h-5 w-5"
                                  aria-label={`Quyền ${actionTranslations[action]} ${categoryTranslations[category]}`}
                                />
                                <div>
                                  <Label 
                                    htmlFor={`perm-${permId}`}
                                    className="font-medium cursor-pointer text-gray-800"
                                  >
                                    {formatActionName(action)}
                                  </Label>
                                  <p className="text-base text-gray-600 mt-1">
                                    {createPermissionDescription(action, category)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="mt-2 sm:mt-0"
            tabIndex={0}
            aria-label="Hủy thay đổi"
            onKeyDown={(e) => e.key === "Enter" && onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="mt-2 sm:mt-0 bg-blue-600 hover:bg-blue-700"
            tabIndex={0}
            aria-label="Lưu thay đổi phân quyền"
            onKeyDown={(e) => e.key === "Enter" && !isLoading  && handleSave()}
          >
            <Save className="h-4 w-4 mr-2" />
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionsMatrix;