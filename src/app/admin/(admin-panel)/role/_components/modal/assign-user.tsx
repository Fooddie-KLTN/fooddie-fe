"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { adminService } from "@/api/admin";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, UserPlus, AlertCircle, UsersIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNotification } from "@/components/ui/notification";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { debounce } from 'lodash';
import { UserProfile } from "@/interface";

interface AssignUserToRoleModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: string;
  roleName: string;
  onSuccess: () => void;
}

const AssignUserToRoleModal = ({
  isOpen,
  onOpenChange,
  roleId,
  roleName,
  onSuccess
}: AssignUserToRoleModalProps) => {
  const { getToken } = useAuth();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { showNotification } = useNotification();

  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(50); // Renamed pageSize to limit

  const ModalContainer = isDesktop ? Dialog : Drawer;
  const ModalContent = isDesktop ? DialogContent : DrawerContent;
  const ModalFooter = isDesktop ? DialogFooter : DrawerFooter;

  // Fetch users that don't have this role, now using search from backend
  const fetchAvailableUsers = useCallback(async (currentSearchQuery: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      // Early return if no token
      if (!token) {
        setError("Authentication token not found.");
        showNotification("Authentication token not found.", "error");
        setIsLoading(false); // Ensure loading state is reset
        return;
      }

      // Use the proper API method, passing limit and search query
      const response = await adminService.Role.getAvailableUsers(
        token,
        roleId,
        limit, // Pass limit instead of page/pageSize
        currentSearchQuery // Pass the current search query
      );

      // Assuming response.data is the array of users
      setAvailableUsers(response.data || []); // Ensure it's an array

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải danh sách người dùng";
      setError(errorMessage);
      showNotification(errorMessage, "error");
      console.error("Error fetching available users:", err);
      setAvailableUsers([]); // Clear users on error
    } finally {
      setIsLoading(false);
    }
  }, [getToken, roleId, limit, showNotification]);

  // Debounce the fetch function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchUsers = useCallback(debounce(fetchAvailableUsers, 300), [fetchAvailableUsers]);

  // Helper function to get user initials
  const getUserInitials = (user: UserProfile): string => {
    if (user.name && user.name.trim()) {
      return user.name.charAt(0).toUpperCase();
    }

    return "U";
  };

  // Handle user selection
  const handleUserSelection = (userId: string, isSelected: boolean) => {
    setSelectedUserIds(prev =>
      isSelected ? [...prev, userId] : prev.filter(id => id !== userId)
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedUserIds.length === 0) {
      const errorMessage = "Vui lòng chọn ít nhất một người dùng";
      setError(errorMessage);
      showNotification(errorMessage, "warning");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
         setError("Authentication token not found.");
         showNotification("Authentication token not found.", "error");
         setIsSubmitting(false);
         return;
      }

      await adminService.Role.assignUsersToRole(token, selectedUserIds, roleId);

      const successMessage = `Đã thêm ${selectedUserIds.length} người dùng vào vai trò ${roleName} thành công`;
      showNotification(successMessage, "success");

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể thêm người dùng vào vai trò";
      setError(errorMessage);
      showNotification(errorMessage, "error");
      console.error("Error assigning users to role:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    debouncedFetchUsers(newQuery);
  };

  // Load users when modal opens (initial fetch)
  useEffect(() => {
    if (isOpen) {
      // Fetch initial list (without search term initially)
      fetchAvailableUsers(""); // Fetch with empty search initially
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds([]);
      setError(null);
      setSearchQuery("");
    }
  }, [isOpen]);

  return (
    <ModalContainer open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className={isDesktop ? "max-w-3xl" : "h-[90vh]"}>
        {isDesktop ? (
          <DialogTitle>Thêm người dùng vào vai trò {roleName}</DialogTitle>
        ) : (
          <DrawerHeader>
            <DrawerTitle>Thêm người dùng vào vai trò {roleName}</DrawerTitle>
          </DrawerHeader>
        )}

        <DialogDescription className="text-md text-gray-500 mb-4">
          Chọn người dùng bạn muốn thêm vào vai trò này. Chỉ những người dùng chưa có vai trò này và không phải Super Admin mới được hiển thị.
        </DialogDescription>

        {/* Search input */}
        <div className="relative mb-4">
          <Input
            placeholder="Tìm kiếm người dùng theo tên, username hoặc email"
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
            disabled={isLoading || isSubmitting}
            aria-label="Tìm kiếm người dùng để gán vai trò"
            aria-controls="available-user-list"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="h-5 w-5" />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div role="alert" className="mb-4 p-3 border border-red-300 bg-red-50 rounded-md flex items-start gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* User list */}
        <div id="available-user-list" className="overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex justify-center items-center h-32" aria-live="polite">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="sr-only">Đang tải người dùng...</span>
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-3">
              <UsersIcon className="h-12 w-12 text-gray-300" aria-hidden="true" />
              {searchQuery
                ? "Không tìm thấy người dùng phù hợp với tìm kiếm"
                : "Không có người dùng nào khả dụng để gán vai trò này"}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {availableUsers.map((user) => (
                <li key={user.id} className="py-3 px-1">
                  <label htmlFor={`user-${user.id}`} className="flex items-center space-x-3 cursor-pointer group">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={(checked) => handleUserSelection(user.id, checked === true)}
                      aria-label={`Chọn ${user.name }`}
                      className="group-hover:border-primary"
                    />

                    <div className="flex items-center space-x-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.avatar || ""}
                          alt={user.name || "User avatar"}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gray-200 text-gray-500 text-sm">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="overflow-hidden">
                        <p className="font-medium truncate group-hover:text-primary">{user.name }</p>
                        <p className="text-md text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ModalFooter className="mt-6 pt-4 border-t">
          <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              aria-label="Hủy thao tác"
            >
              Hủy
            </Button>

            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={selectedUserIds.length === 0 || isSubmitting || isLoading}
              aria-label={`Thêm ${selectedUserIds.length} người dùng đã chọn`}
              aria-disabled={selectedUserIds.length === 0 || isSubmitting || isLoading}
              className="flex items-center justify-center gap-2 min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" aria-hidden="true"></div>
                  <span>Đang thêm...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  <span>Thêm {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''} người dùng</span>
                </>
              )}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </ModalContainer>
  );
};

export default AssignUserToRoleModal;