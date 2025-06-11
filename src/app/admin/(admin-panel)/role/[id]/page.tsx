"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { adminService } from "@/api/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash, Users, Plus, Save, KeyRound, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Table, { Column, Action, SortDirection } from "@/app/admin/(admin-panel)/_components/table";
import Pagination from "@/app/admin/(admin-panel)/_components/pagination"
import PermissionsMatrix, {
    Permission,
    PERMISSION_STRUCTURE,
    categoryTranslations,
    actionTranslations
} from "../_components/modal/permission";
import AssignUserToRoleModal from "../_components/modal/assign-user";
import { NotificationProvider, useNotification } from "@/components/ui/notification";
import Image from "next/image";
import * as response from "@/api/response.interface";

// Types
type Role = {
    id: string;
    name: string;
    displayName: string;
    description: string;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
    userCount: number;
    permissions?: string[];
};

// User type to match the API response
type User = {
    id: string;
    username: string;
    email: string;
    name: string | null;
    avatar: string | null;
    isActive: boolean;
    createdAt: string;
};

// Format date utility function
const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
};

// Add this function after the formatDate utility function
const isSuperAdminRole = (role: Role | null): boolean => {
    return role?.name === "super_admin"; // Assuming 'super_admin' identifies the Super Admin role
};

// Wrap the main component with the NotificationProvider
const RoleDetailPageWithNotifications = () => {
    return (
        <NotificationProvider>
            <RoleDetailPage />
        </NotificationProvider>
    );
};

const RoleDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const roleId = params.id as string;
    const { showNotification } = useNotification();

    // Tab state
    const [activeTab, setActiveTab] = useState("details");

    // Role data state
    const [role, setRole] = useState<Role | null>(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const [roleError, setRoleError] = useState<string | null>(null);

    // Users data state
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [sortField, setSortField] = useState<keyof User | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalPages: 1,
        totalItems: 0,
    });

    // Permissions state
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [permissionsError, setPermissionsError] = useState<string | null>(null);

    // Modal state
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
    const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);

    // Fetch role details
    const fetchRoleDetails = async () => {
        if (!roleId) return;

        const token = await getToken();
        if (!token) return;

        setRoleLoading(true);
        setRoleError(null);

        try {
            const response = await adminService.Role.getRoleById(token, roleId);
            setRole(response);
        } catch (error) {
            setRoleError(error instanceof Error ? error.message : "Không thể tải thông tin vai trò");
            console.error("Error fetching role details:", error);
        } finally {
            setRoleLoading(false);
        }
    };

    // Fetch users with this role
    const fetchRoleUsers = async () => {
        if (!roleId) return;

        const token = await getToken();
        if (!token) return;

        setUsersLoading(true);
        setUsersError(null);

        try {
            const response = await adminService.Role.getRoleUsers(
                token,
                roleId,
                pagination.currentPage,
                pagination.pageSize,
                searchQuery
            );

            setUsers(response.data);
            setPagination((prev) => ({
                ...prev,
                totalPages: Math.ceil(response.total / pagination.pageSize) || 1,
                totalItems: response.total,
            }));
        } catch (error) {
            setUsersError(error instanceof Error ? error.message : "Không thể tải danh sách người dùng");
            console.error("Error fetching role users:", error);
        } finally {
            setUsersLoading(false);
        }
    };

    // Update the fetchPermissions function with better type safety
    const fetchPermissions = async () => {
        const token = await getToken();
        if (!token || !roleId) return;

        setPermissionsLoading(true);
        setPermissionsError(null);

        try {
            // First get all available permissions for the UI structure
            const allPermissionsResponse = await adminService.Role.getAllPermissions(token);

            // Then get the role's specific permissions
            const rolePermissionsResponse = await adminService.Role.getRolePermissions(token, roleId);

            // Process permissions to match the permission structure
            const processedPermissions: Permission[] = allPermissionsResponse.map(permissionId => {
                // Ensure we have a string
                const permissionName = typeof permissionId === 'string' ? permissionId : String(permissionId);

                // Find which category this permission belongs to
                let category = 'Other';
                let action = '';

                // Look through our permission structure to find where this permission belongs
                Object.entries(PERMISSION_STRUCTURE).forEach(([cat, perms]) => {
                    if (typeof perms === 'string') {
                        if (perms === permissionName) {
                            category = cat;
                            action = 'GENERAL';
                        }
                    } else if (perms && typeof perms === 'object') {
                        // Safely iterate through permission objects
                        Object.entries(perms).forEach(([act, perm]) => {
                            if (perm === permissionName) {
                                category = cat;
                                action = act;
                            }
                        });
                    }
                });

                return {
                    id: permissionName,
                    name: permissionName,
                    description: `${categoryTranslations[category] || category}: ${actionTranslations[action] || action}`,
                    category: category
                };
            });

            setPermissions(processedPermissions);

            // Set selected permissions from role's permissions
            if (rolePermissionsResponse && rolePermissionsResponse.permissions) {
                setSelectedPermissions(rolePermissionsResponse.permissions);
            }
        } catch (error) {
            setPermissionsError(error instanceof Error ? error.message : "Không thể tải thông tin quyền");
            console.error("Error fetching permissions:", error);
        } finally {
            setPermissionsLoading(false);
        }
    };

    // Handle opening the permissions modal
    const handleOpenPermissionsModal = async () => {
        // Fetch permissions if they haven't been loaded yet
        if (permissions.length === 0) {
            await fetchPermissions();
        }
        setIsPermissionsModalOpen(true);
    };

    // Handle permission selection
    const handlePermissionChange = (permissionId: string, checked: boolean) => {
        if (checked) {
            setSelectedPermissions(prev => [...prev, permissionId]);
        } else {
            setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
        }
    };

    // Handle saving permissions
    const handleSavePermissions = async () => {
        const token = await getToken();
        if (!token || !role) return;

        // Lọc lại chỉ giữ các quyền hợp lệ
        const validPermissionIds = getAllValidPermissionIds();
        const filteredPermissions = selectedPermissions.filter(id => validPermissionIds.includes(id));

        try {
            await adminService.Role.updateRolePermissions(token, role.id, filteredPermissions);
            setIsPermissionsModalOpen(false);
            showNotification("Các quyền của vai trò đã được cập nhật thành công.", "success");
            fetchRoleDetails();
        } catch (error) {
            console.error("Error saving permissions:", error);
            showNotification(
                error instanceof Error ? error.message : "Không thể cập nhật quyền",
                "error"
            );
        }
    };

    // Add this new function to save role changes
    const handleSaveRole = async () => {
        if (!role) return;

        // Basic validation
        if (!role.displayName.trim()) {
            showNotification("Tên vai trò không được để trống", "error");
            return;
        }

        const token = await getToken();
        if (!token) return;

        try {
            // Prepare the data to send to the API
            const roleData: response.RoleFormData = {
                displayName: role.displayName,
                description: role.description || ""
            };

            // Call the API to update the role
            await adminService.Role.updateRole(token, role.id, roleData);

            // Show success message
            showNotification("Thông tin vai trò đã được cập nhật thành công", "success");

            // Refresh role details to show the updated information
            fetchRoleDetails();
        } catch (error) {
            console.error("Error saving role:", error);
            showNotification(
                error instanceof Error ? error.message : "Không thể cập nhật thông tin vai trò",
                "error"
            );
        }
    };

    const handleRemoveUserFromRole = async (userId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này khỏi vai trò?")) {
            return;
        }

        const token = await getToken();
        if (!token) return;

        try {
            await adminService.Role.removeRoleFromUser(token, userId, roleId);
            showNotification("Đã xóa người dùng khỏi vai trò", "success");
            fetchRoleUsers(); // Refresh the user list
        } catch (error) {
            showNotification(
                error instanceof Error ? error.message : "Không thể xóa người dùng khỏi vai trò",
                "error"
            );
            console.error("Error removing user from role:", error);
        }
    };

    // Initial data load
    useEffect(() => {
        fetchRoleDetails();
    }, [roleId]);

    // Load users when tab changes to users or when search/pagination changes
    useEffect(() => {
        if (activeTab === "users") {
            fetchRoleUsers();
        }
    }, [activeTab, pagination.currentPage, pagination.pageSize, searchQuery]);

    // Load permissions when the role is loaded
    useEffect(() => {
        if (role && permissions.length === 0) {
            fetchPermissions();
        }
    }, [role]);

    // Handle tab change
    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };


    // Handle search users
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, currentPage: page }));
    };

    // Handle user selection
    const handleSelectUser = (id: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedUsers(prev => [...prev, id]);
        } else {
            setSelectedUsers(prev => prev.filter(userId => userId !== id));
        }
    };

    // Handle select all users
    const handleSelectAllUsers = (isSelected: boolean) => {
        if (isSelected) {
            setSelectedUsers(users.map(user => user.id));
        } else {
            setSelectedUsers([]);
        }
    };

    // Handle sorting
    const handleSort = (field: keyof User, direction: SortDirection) => {
        setSortField(field);
        setSortDirection(direction);
    };

    // User table actions
    const userActions: Action[] = [
        {
            label: "Xem hồ sơ",
            onClick: (id: string) => router.push(`/admin/user/${id}`),
            icon: <Users className="h-4 w-4" />
        },
        {
            label: "Xóa khỏi vai trò",
            onClick: handleRemoveUserFromRole,
            icon: <Trash className="h-4 w-4" />,
        }
    ];

    // User table columns
    const userColumns: Column<User>[] = [
        {
            header: "Tên",
            accessor: "name" as keyof User,
            sortable: true,
            renderCell: (value, user) => (
                <div className="flex items-center gap-2">
                    {user.avatar ? (
                        <Image
                            src={user.avatar}
                            alt={String(value) || user.username}
                            className="w-8 h-8 rounded-full object-cover"
                            width={32}
                            height={32}
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            {(String(value) || user.username)?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                    )}
                    <span>{String(value) || user.username}</span>
                </div>
            ),
        },
        {
            header: "Email",
            accessor: "email" as keyof User,
            sortable: true,
        },
        {
            header: "Trạng thái",
            accessor: "isActive" as keyof User,
            sortable: true,
            renderCell: (value) => (
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {value ? 'Hoạt động' : 'Không hoạt động'}
                </span>
            )
        },
        {
            header: "Ngày tham gia",
            accessor: "createdAt" as keyof User,
            sortable: true,
            renderCell: (value) => formatDate(new Date(value as string)),
        },
    ];

    function getAllValidPermissionIds() {
        const ids: string[] = [];
        Object.values(PERMISSION_STRUCTURE).forEach(perms => {
            if (typeof perms === "string") {
                ids.push(perms);
            } else if (typeof perms === "object" && perms !== null) {
                ids.push(...Object.values(perms));
            }
        });
        return ids;
    }

    return (
        <div className="p-4 space-y-6">
            {/* Header with back button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Chỉnh sửa vai trò và quyền</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleSaveRole}
                        disabled={roleLoading || isSuperAdminRole(role)}
                        aria-label="Lưu thay đổi vai trò"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && !roleLoading && !isSuperAdminRole(role) && handleSaveRole()}
                        className="flex items-center gap-2"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Lưu thông tin
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => setIsAssignUserModalOpen(true)}
                        disabled={roleLoading || isSuperAdminRole(role)}
                        aria-label="Thêm người dùng vào vai trò"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && !roleLoading && !isSuperAdminRole(role) && setIsAssignUserModalOpen(true)}
                        className="flex items-center gap-2 hover:text-primary hover:outline-primary"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm người dùng
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="w-full max-w-md">
                    <TabsTrigger value="details" className="flex-1">
                        Phân quyền
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex-1">
                        <Users className="h-4 w-4 mr-2" />
                        Người dùng ({role?.userCount || 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="py-4">
                    {roleError && (
                        <div className="mb-4 p-3 border border-red-300 bg-red-50 rounded-md flex items-start gap-2 text-red-700">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <span>{roleError}</span>
                        </div>
                    )}

                    {roleLoading ? (
                        <div className="space-y-4">
                            <div className="w-full h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                    ) : role ? (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>{role.displayName}</CardTitle>
                                        <CardDescription>Mô tả vai trò: {role.description}</CardDescription>
                                    </div>
                                    <Badge
                                        className={
                                            isSuperAdminRole(role)
                                                ? "bg-purple-100 text-purple-800"
                                                : role?.isSystem
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-green-100 text-green-800"
                                        }
                                    >
                                        {isSuperAdminRole(role)
                                            ? "Quản trị viên cao cấp"
                                            : role?.isSystem
                                                ? "Hệ thống"
                                                : "Tùy chỉnh"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Basic Information Section */}
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-700">Thông tin cơ bản</h2>
                                    <div>
                                        <h3 className="text-md font-medium text-gray-500">Tên vai trò</h3>
                                        <Input
                                            type="text"
                                            value={role.displayName}
                                            onChange={(e) => setRole({ ...role, displayName: e.target.value })}
                                            placeholder="Nhập tên vai trò"
                                            className="mt-1 w-full"
                                            disabled={isSuperAdminRole(role)}
                                            aria-label="Tên hiển thị vai trò"
                                        />
                                        {isSuperAdminRole(role) && (
                                            <p className="text-sm text-amber-600 mt-1">
                                                Super Admin là vai trò đặc biệt và không thể chỉnh sửa.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-md font-medium text-gray-500">Mô tả</h3>
                                        <Input
                                            type="text"
                                            value={role.description || ""}
                                            onChange={(e) => setRole({ ...role, description: e.target.value })}
                                            placeholder="Nhập mô tả vai trò"
                                            className="mt-1 w-full"
                                            disabled={isSuperAdminRole(role)}
                                            aria-label="Mô tả vai trò"
                                        />
                                    </div>
                                </div>

                                {/* Permissions Section */}
                                <div className="pt-4 border-t space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-gray-700">Phân quyền</h2>
                                        <Button
                                            variant="outline"
                                            onClick={handleOpenPermissionsModal}
                                            disabled={roleLoading || isSuperAdminRole(role)}
                                            className="flex items-center gap-2"
                                            aria-label="Quản lý quyền"
                                            tabIndex={0}
                                            onKeyDown={(e) => e.key === "Enter" && handleOpenPermissionsModal()}
                                        >
                                            <KeyRound className="h-4 w-4" />
                                            Quản lý quyền
                                        </Button>
                                    </div>
                                </div>

                                {/* Read-only Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                    <div>
                                        <h3 className="text-md font-medium text-gray-500">Ngày tạo</h3>
                                        <p className="mt-1">{formatDate(new Date(role.createdAt))}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-md font-medium text-gray-500">Ngày cập nhật</h3>
                                        <p className="mt-1">{formatDate(new Date(role.updatedAt))}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-md font-medium text-gray-500">Loại quyền</h3>
                                        <p className="mt-1">
                                            {isSuperAdminRole(role)
                                                ? "Quản trị viên cao cấp (không thể chỉnh sửa)"
                                                : role?.isSystem
                                                    ? "Vai trò hệ thống (chỉ có thể chỉnh sửa tên và mô tả)"
                                                    : "Vai trò tùy chỉnh"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Vai trò không tồn tại.</p>
                        </div>
                    )}
                </TabsContent>

                {/* Tab Content: Users List */}
                <TabsContent value="users" className="py-4">
                    {usersError && (
                        <div className="mb-4 p-3 border border-red-300 bg-red-50 rounded-md flex items-start gap-2 text-red-700">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <span>{usersError}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                        <div className="relative flex-1 max-w-md">
                            <Input
                                placeholder="Tìm kiếm người dùng theo tên hoặc email"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="pl-10"
                                disabled={usersLoading}
                                aria-label="Tìm kiếm người dùng"
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <Search className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    {usersLoading ? (
                        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            <Table
                                columns={userColumns}
                                data={users}
                                selectable={true}
                                selectedItems={selectedUsers}
                                onSelectItem={handleSelectUser}
                                onSelectAll={handleSelectAllUsers}
                                showActions={true}
                                actions={userActions}
                                coloredStatus={true}
                                onSort={handleSort}
                                sortField={sortField}
                                sortDirection={sortDirection}
                            />

                            {users.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Không tìm thấy người dùng nào với vai trò này.</p>
                                </div>
                            )}

                            {users.length > 0 && (
                                <div className="mt-4">
                                    <Pagination
                                        currentPage={pagination.currentPage}
                                        pageSize={pagination.pageSize}
                                        pageSizeOptions={[10, 20, 50]}
                                        totalPages={pagination.totalPages}
                                        onPageChange={handlePageChange}
                                        onPageSizeChange={(size) => setPagination((prev) => ({ ...prev, pageSize: size }))}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {role && (
                <AssignUserToRoleModal
                    isOpen={isAssignUserModalOpen}
                    onOpenChange={setIsAssignUserModalOpen}
                    roleId={roleId}
                    roleName={role.displayName}
                    onSuccess={fetchRoleUsers}
                />
            )}

            <PermissionsMatrix
                isOpen={isPermissionsModalOpen}
                onOpenChange={setIsPermissionsModalOpen}
                permissions={permissions}
                selectedPermissions={selectedPermissions}
                onPermissionChange={handlePermissionChange}
                onSave={handleSavePermissions}
                isLoading={permissionsLoading}
                error={permissionsError}
                isSystemRole={role?.isSystem || false}
            />
        </div>
    );
};

export default RoleDetailPageWithNotifications;