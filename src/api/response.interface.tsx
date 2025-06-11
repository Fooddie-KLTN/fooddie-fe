import { Order, UserProfile } from "@/interface";

export interface PaginatedResponse<T> {
    items: T[];
    totalItems: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface OrderResponse {
  order: Order;
  paymentUrl?: string;
  checkoutId?: string;
}

export interface CalculateOrderResponse {
    foodTotal: number;
    shippingFee: number;
    distance: number;
    total: number;
    }

    /**
 * Thông tin vai trò trả về từ API
 * @interface
 * @property {string} id - Mã định danh của vai trò
 * @property {string} name - Tên vai trò
 * @property {'System' | 'Custom'} type - Loại vai trò (System hoặc Custom)
 * @property {string} createdAt - Ngày tạo vai trò
 * @property {number} accountCount - Số tài khoản sử dụng vai trò này
 */
export interface RoleDetailResponse {
    id: string;
    name: string;
    displayName: string;
    description: string;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
    userCount: number;
}
/**
 * Dữ liệu để tạo hoặc cập nhật vai trò
 * @interface
 * @property {string} displayName - Tên vai trò
 * @property {string} description - Mô tả vai trò
 */
export interface RoleFormData {
    displayName: string;
    description: string;
}

/**
 * Kết quả trả về khi lấy danh sách vai trò
 * @interface
 * @property {RoleDetailResponse[]} data - Danh sách thông tin vai trò
 * @property {number} total - Tổng số vai trò trong hệ thống
 */
export interface GetRolesResponse {
    data: RoleDetailResponse[];
    total: number;
}
/**
 * Interface cho response lấy danh sách người dùng theo vai trò
 */
export interface GetRoleUsersResponse {
    /**
     * Danh sách thông tin người dùng
     */
    data: UserInRoleResponse[];
    
    /**
     * Tổng số người dùng thuộc vai trò
     */
    total: number;
}

/**
 * Interface cho thông tin người dùng trong response của role users
 */
export interface UserInRoleResponse {
    id: string;
    username: string;
    email: string;
    name: string | null;
    avatar: string | null;
    isActive: boolean;
    createdAt: string;
}
/**
 * Kết quả trả về khi lấy danh sách người dùng
 * @interface
 * @property {UserResponse[]} data - Danh sách thông tin người dùng
 * @property {number} total - Tổng số người dùng trong hệ thống
 */ 
export interface GetUsersResponse {
    data: UserProfile[];
    total: number;
}
