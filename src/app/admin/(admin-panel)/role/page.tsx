"use client";
import { useState, useEffect, useCallback } from "react";
import { PlusIcon, Edit2Icon, TrashIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { adminService } from "@/api/admin";
import * as response from "@/api/response.interface";

// Import shared admin components

import { useAuth } from "@/context/auth-context";

// Import the real AddRoleForm component
import AddRoleForm from "./_components/modal/add-role";
import { useRouter } from "next/navigation";
import Table, { Action, Column, SortDirection } from "../_components/table";
import Header from "../_components/header";
import SearchAndFilters from "../_components/search-and-filter";
import Pagination from "../_components/pagination";

// Interface for Role data - using the existing interface from API
type Role = response.RoleDetailResponse;

interface PaginationState {
    currentPage: number;
    totalPages: number;
    pageSize: number;
}

/**
 * @component RoleAdminPage
 *
 * @description
 * Trang quản lý vai trò cho admin, hiển thị danh sách các vai trò từ API,
 * cho phép tìm kiếm, lọc, thêm, sửa và xóa vai trò.
 *
 * @returns {React.ReactElement} Trang quản lý vai trò
 */
const RoleAdminPage: React.FC = () => {
    const { getToken } = useAuth();
    const router = useRouter(); // Use Next.js router for navigation
    // Get the authentication token

    // State for roles data
    const [roles, setRoles] = useState<Role[]>([]);
    const [isError, setIsError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // UI State
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortField, setSortField] = useState<keyof Role | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState<boolean>(false);
    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: 1,
        totalPages: 1,
        pageSize: 10
    });

    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Fetch roles from API
    const fetchRoles = useCallback(async () => {

        const token = await getToken();
        if (!token) return;

        setIsLoading(true);
        setIsError(false);

        try {
            const response = await adminService.Role.getRoles(
                token,
                pagination.currentPage,
                pagination.pageSize
            );

            setRoles(response.data);
            setPagination(prev => ({
                ...prev,
                totalPages: Math.ceil(response.total / pagination.pageSize) || 1
            }));
        } catch (error) {
            setIsError(true);
            setErrorMessage(error instanceof Error ? error.message : "Failed to load roles");
            console.error("Error fetching roles:", error);
        } finally {
            setIsLoading(false);
        }
    }, [pagination.currentPage, pagination.pageSize]);

    // Initial load and reload when pagination changes
    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    // Filter roles based on search query
    const filteredRoles = roles.filter((role) =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort roles based on sort field and direction
    const sortedRoles = [...filteredRoles];
    if (sortField && sortDirection) {
        sortedRoles.sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            } else {
                // Fallback for other types or mixed types (treat as strings)
                const stringA = String(aValue);
                const stringB = String(bValue);
                return sortDirection === 'asc'
                    ? stringA.localeCompare(stringB)
                    : stringB.localeCompare(stringA);
            }
        });
    }

    // Paginate the sorted roles (client-side pagination as backup)
    const paginatedRoles = sortedRoles;

    // Handle sorting
    const handleSort = (field: keyof Role, direction: SortDirection) => {
        setSortField(field);
        setSortDirection(direction);
    };

    // Handle role checkbox selection
    const handleCheckRole = (id: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedRoles(prev => [...prev, id]);
        } else {
            setSelectedRoles(prev => prev.filter(roleId => roleId !== id));
        }
    };

    // Handle "select all" checkbox
    const handleCheckAll = (isSelected: boolean) => {
        if (isSelected) {
            const allIds = paginatedRoles.map(role => role.id);
            setSelectedRoles(allIds);
        } else {
            setSelectedRoles([]);
        }
    };

    // Handle pagination changes
    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
        setSelectedRoles([]);
    };

    const handlePageSizeChange = (size: number) => {
        setPagination(prev => ({
            ...prev,
            pageSize: size,
            currentPage: 1
        }));
        setSelectedRoles([]);
    };

    // Handle role deletion using the API
    const handleDeleteRole = async (id: string) => {
        const token = await getToken();
        if (!token) return;
        if (!window.confirm("Are you sure you want to delete this role?")) {
            return;
        }

        setIsLoading(true);
        try {
            await adminService.Role.deleteRole(token, id);

            // Remove from local state after successful deletion
            setRoles(prevRoles => prevRoles.filter(role => role.id !== id));
            setSelectedRoles(prev => prev.filter(roleId => roleId !== id));

        } catch (error) {
            setIsError(true);
            setErrorMessage(error instanceof Error ? error.message : "Failed to delete role");
            console.error("Error deleting role:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Define header actions
    const headerActions = [
        {
            label: "Thêm vai trò",
            icon: <PlusIcon className="w-5 h-5" />,
            onClick: () => setIsAddRoleModalOpen(true),
            variant: 'primary' as const,
        },
    ];

    // Define the actions for each role row
    const roleActions: Action[] = [
        {
            label: "Chỉnh sửa vai trò",
            icon: <Edit2Icon className="h-4 w-4" />,
            onClick: (id) => router.push(`/admin/role/${id}`), // Placeholder - could open modal or navigate
        },
        {
            label: "Xóa vai trò",
            icon: <TrashIcon className="h-4 w-4" />,
            onClick: (id) => handleDeleteRole(id),
        }
    ];



    // Role table columns configuration
    const roleColumns: Column<Role>[] = [
        {
            header: "Tên vai trò",
            accessor: "displayName" as keyof Role,
            sortable: true,
        },
        {
            header: "Loại vai trò",
            accessor: "isSystem" as keyof Role,
            sortable: true,
            renderCell: (value) => (
                <span className={`px-2 py-1 rounded-full text-md font-medium ${value ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                    {value ? 'Hệ thống' : 'Tùy chỉnh'}
                </span>
            )
        },
        {
            header: "Mô tả",
            accessor: "description" as keyof Role,
            sortable: true,
        },
        {
            header: "Ngày tạo",
            accessor: "createdAt" as keyof Role,
            sortable: true,
            renderCell: (value) => {
                const date = new Date(value as string);
                return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
            }
        },
        {
            header: "Số tài khoản",
            accessor: "userCount" as keyof Role,
            sortable: true,
            renderCell: (value) => (
                <span className="text-center block">{value as number}</span>
            )
        },
    ];
    // Handle retry on error
    const handleRetry = () => {
        fetchRoles();
    };

    return (
        <div className="p-4">
            {/* Header */}
            <Header
                title="Quản lý vai trò"
                description="Tạo và quản lý các vai trò người dùng"
                actions={headerActions}
            />

            {/* Main Content */}
            <>
                <SearchAndFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Tìm vai trò"
                />

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <p>Loading roles...</p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col justify-center items-center h-64">
                            <p className="text-red-500">Error loading roles</p>
                            <p className="text-md text-gray-500">{errorMessage}</p>
                            <button
                                onClick={handleRetry}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : paginatedRoles.length === 0 ? (
                        <div className="flex justify-center items-center h-64">
                            <p>No roles found matching your criteria.</p>
                        </div>
                    ) : (
                        <Table
                            columns={roleColumns}
                            data={paginatedRoles}
                            selectable={true}
                            selectedItems={selectedRoles}
                            onSelectItem={handleCheckRole}
                            onSelectAll={handleCheckAll}
                            showActions={true}
                            actions={roleActions}
                            onSort={handleSort}
                            sortField={sortField}
                            sortDirection={sortDirection}
                        />
                    )}
                </div>

                {/* Only show pagination if there are roles to display */}
                {!isLoading && !isError && filteredRoles.length > 0 && (
                    <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        pageSize={pagination.pageSize}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        pageSizeOptions={[5, 10, 20]}
                    />
                )}
            </>

            {/* Add Role Modal/Drawer */}
            {isDesktop ? (
                <Dialog open={isAddRoleModalOpen} onOpenChange={setIsAddRoleModalOpen}>
                    <DialogContent className="p-0">
                        <DialogTitle className="sr-only">Thêm vai trò mới</DialogTitle>
                        <AddRoleForm
                            onClose={() => setIsAddRoleModalOpen(false)}
                            onSuccess={fetchRoles}
                        />
                    </DialogContent>
                </Dialog>
            ) : (
                <Drawer
                    open={isAddRoleModalOpen}
                    onOpenChange={setIsAddRoleModalOpen}
                    direction="bottom"
                    snapPoints={[0.8]}
                >
                    <DrawerContent className="p-0 rounded-t-lg max-h-[80vh]">
                        <div className="overflow-y-auto">
                            <AddRoleForm
                                onClose={() => setIsAddRoleModalOpen(false)}
                                onSuccess={fetchRoles}
                            />
                        </div>
                    </DrawerContent>
                </Drawer>
            )}
        </div>
    );
};

export default RoleAdminPage;