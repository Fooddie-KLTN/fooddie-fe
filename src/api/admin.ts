// adminApi.ts
import { UserProfile } from "@/interface";
import { apiRequest } from "./base-api";
import * as response from "./response.interface";



/**
 * Thông tin người dùng trả về từ API
 * @interface
 * @property {string} id - Mã định danh của người dùng
 * @property {string} name - Tên người dùng
 * @property {string} email - Địa chỉ email của người dùng
 * @property {string} group - Nhóm học của người dùng
 * @property {number} courses - Số khóa học đã đăng ký
 * @property {string} createdAt - Ngày tạo tài khoản (đã định dạng)
 * @property {string} status - Trạng thái tài khoản (Active/Inactive)
 */
interface UserResponse {
    id: string;
    name: string;
    email: string;
    group: string;
    courses: number;
    createdAt: string;
    status: string;
}

/**
 * Kết quả trả về khi lấy danh sách người dùng
 * @interface
 * @property {UserResponse[]} data - Danh sách thông tin người dùng
 * @property {number} total - Tổng số người dùng trong hệ thống
 */
interface GetUsersResponse {
    data: UserResponse[]; 
    total: number;
}

/**
 * Thông tin về vai trò và quyền hạn
 * @interface
 * @property {string} role - Tên vai trò của người dùng
 * @property {string[]} permissions - Danh sách quyền hạn được cấp
 */
interface RoleResponse {
    role: string;
    permissions: string[];
}



interface StoreResponse {
    id: string;
    name: string;
    phoneNumber: string;
    address: string;
    status: 'pending' | 'approved' | 'rejected';
    location: string;
    createdAt: string;
    owner: string;
  }
  
  interface GetStoresResponse {
    items: StoreResponse[];
    totalItems: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }

  export interface CategoryResponse {
  id: string;
  name: string;
  image: string;
  foodCount: number; // Changed from foods: any[]
}
  
  interface GetCategoriesResponse {
    items: CategoryResponse[];
    totalItems: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
  
  interface CreateCategoryDto {
    name: string;
    image: string;
  }

  export interface OrderResponse {
    id: string;
    status: string;
    createdAt: string;
    total: string;
    note: string;
    address: {
      location: string;
      fullName: string;
    };
    restaurant: {
      name: string;
      location: string;
    };
    orderDetails: {
      food: {
        name: string;
      };
      quantity: string;
      price: string;
      note: string;
    }[];
  }
  

export enum PromotionType {
  FOOD_DISCOUNT = 'FOOD_DISCOUNT',
  SHIPPING_DISCOUNT = 'SHIPPING_DISCOUNT'
}

export interface PromotionResponse {
  id: string;
  code: string;
  description?: string;
  type: PromotionType;
  discountPercent?: number;
  discountAmount?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  image?: string;
  startDate?: string; // ISO string from API
  endDate?: string;   // ISO string from API
  numberOfUsed?: number;
  maxUsage?: number;
}

interface CreatePromotionDto {
  code: string;
  description?: string;
  type: PromotionType;
  discountPercent?: number;
  discountAmount?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  image?: string;
  startDate?: string; // ISO string to API
  endDate?: string;   // ISO string to API
  maxUsage?: number;
}

interface UpdatePromotionDto {
  code?: string;
  description?: string;
  type?: PromotionType;
  discountPercent?: number;
  discountAmount?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  image?: string;
  startDate?: string; // ISO string to API
  endDate?: string;   // ISO string to API
  maxUsage?: number;
}

// Add missing interface
interface GetPromotionsResponse {
  items: PromotionResponse[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Các dịch vụ API cho phần quản trị hệ thống
 * 
 * Cung cấp các phương thức để tương tác với API backend cho các chức năng quản trị,
 * bao gồm quản lý người dùng, khóa học, và phân quyền.
 * 
 * @namespace
 */
export const adminService = {
    /**
     * Lấy thông tin vai trò và quyền hạn của người dùng hiện tại
     * 
     * @param {string} token - Token xác thực của admin
     * @returns {Promise<RoleResponse>} - Thông tin vai trò và danh sách quyền hạn
     * @throws {Error} Khi không thể kết nối với máy chủ hoặc không có quyền truy cập
     */
    async getMyRole(token: string): Promise<RoleResponse> {
        try {
            return await apiRequest<RoleResponse>('/role/user-role-and-permission', 'GET', { token });
        } catch (error) {
            console.error('Lỗi API quản trị:', error);
            throw error;
        }
    },

    /**
     * Các phương thức quản lý người dùng
     * 
     * @namespace
     */
    User: {
        /**
         * Lấy danh sách người dùng trong hệ thống
         * 
         * @param {string} token - Token xác thực của admin
         * @param {number} [page=1] - Số trang hiện tại
         * @param {number} [pageSize=10] - Số người dùng trên mỗi trang
         * @returns {Promise<GetUsersResponse>} - Danh sách người dùng và thông tin phân trang
         * @property {UserResponse[]} data - Danh sách thông tin người dùng
         * @property {number} total - Tổng số người dùng trong hệ thống
         * @throws {Error} Khi không thể kết nối với máy chủ hoặc không có quyền truy cập
         */
        async getUsers(token: string, page: number = 1, pageSize: number = 10): Promise<GetUsersResponse> {
            try {
                const response = await apiRequest<UserResponse[]>('/users', 'GET', { 
                    token,
                    query: { page, pageSize }
                });
                
                return {
                    data: response.map((user) => ({
                        id: user.id,
                        name: user.name || 'N/A',
                        email: user.email || 'N/A',
                        group: user.group || '-',
                        courses: user.courses || 0,
                        createdAt: new Date(user.createdAt).toLocaleDateString('vi-VN'),
                        status: user.status || 'Inactive'
                    })),
                    total: response.length // Hoặc sử dụng response.total nếu API cung cấp
                };
            } catch (error) {
                console.error('Lỗi API quản trị:', error);
                throw error;
            }
        },        
    },

    Store: {
      async getStores(
        token: string,
        page: number = 1,
        pageSize: number = 10,
        status?: string  // <-- thêm tham số lọc status
      ): Promise<GetStoresResponse> {
        try {
          return await apiRequest<GetStoresResponse>('/restaurants', 'GET', {
            token,
            query: {
              page,
              pageSize,
              ...(status ? { status } : {})  // chỉ thêm status nếu có
            }
          });
        } catch (error) {
          console.error("Lỗi API cửa hàng:", error);
          throw error;
        }
      }
    },
    

      Category: {
        async getCategories(
          token: string,
          page: number = 1,
          pageSize: number = 10
        ): Promise<GetCategoriesResponse> {
          try {
            return await apiRequest<GetCategoriesResponse>("/categories", "GET", {
              token,
              query: { page, pageSize },
            });
          } catch (error) {
            console.error("Lỗi API danh mục:", error);
            throw error;
          }
        },
    
        async createCategory(
          token: string,
          data: CreateCategoryDto
        ): Promise<CategoryResponse> {
          try {
            return await apiRequest<CategoryResponse>("/categories", "POST", {
              token,
              data,
            });
          } catch (error) {
            console.error("Lỗi tạo danh mục:", error);
            throw error;
          }
        },

        async updateCategory(
          token: string,
          id: string,
          data: Partial<{ name: string; image: string }>
        ): Promise<CategoryResponse> {
          try {
            return await apiRequest<CategoryResponse>(`/categories/${id}`, "PUT", {
              token,
              data,
            });
          } catch (error) {
            console.error("Lỗi cập nhật danh mục:", error);
            throw error;
          }
        },
    
        async deleteCategory(token: string, id: string): Promise<void> {
          try {
            await apiRequest<void>(`/categories/${id}`, "DELETE", {
              token,
            });
          } catch (error) {
            console.error("Lỗi xóa danh mục:", error);
            throw error;
          }
        },
      },
      Order: {
        async getOrdersByUser(token: string, userId: string): Promise<OrderResponse[]> {
          try {
            return await apiRequest<OrderResponse[]>(`/orders/user/${userId}`, 'GET', { token });
          } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng theo user:', error);
            throw error;
          }
        },
    
        async getOrderById(token: string, id: string): Promise<OrderResponse> {
          try {
            return await apiRequest<OrderResponse>(`/orders/${id}`, 'GET', { token });
          } catch (error) {
            console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
            throw error;
          }
        },

        async getMyOrders(token: string): Promise<OrderResponse[]> {
          return await apiRequest<OrderResponse[]>('/orders/my', 'GET', { token });
        },
      },
      Promotion: {
        async getPromotions(token: string, page = 1, pageSize = 10): Promise<PromotionResponse[]> {
      try {
        const response = await apiRequest<PromotionResponse[] | GetPromotionsResponse>("/promotions", "GET", {
          token,
          query: { page, pageSize },
        });
        
        // Handle both array and paginated response
        if (Array.isArray(response)) {
          return response;
        } else {
          return response.items;
        }
      } catch (error) {
        console.error("Error fetching promotions:", error);
        throw error;
      }
    },
    async createPromotion(token: string, data: CreatePromotionDto): Promise<PromotionResponse> {
      return await apiRequest<PromotionResponse>("/promotions", "POST", { token, data });
    },
    async updatePromotion(token: string, id: string, data: UpdatePromotionDto): Promise<PromotionResponse> {
      return await apiRequest<PromotionResponse>(`/promotions/${id}`, "PUT", { token, data });
    },
    async deletePromotion(token: string, id: string): Promise<void> {
      await apiRequest<void>(`/promotions/${id}`, "DELETE", { token });
    },
  },
	Role: {
		/**
		 * Lấy danh sách vai trò trong hệ thống với phân trang
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {number} [page=1] - Trang hiện tại
		 * @param {number} [pageSize=10] - Số vai trò trên mỗi trang
		 * @param {string} [search=""] - Từ khóa tìm kiếm (tên vai trò)
		 * @returns {Promise<GetRolesResponse>} - Danh sách vai trò và thông tin phân trang
		 */
		async getRoles(
			token: string,
			page: number = 1,
			pageSize: number = 10,
			search: string = ""
		): Promise<response.GetRolesResponse> {
			try {
				const query: Record<string, string | number> = {
					page,
					pageSize
				};

				if (search) {
					query.search = search;
				}

				const response = await apiRequest<response.RoleDetailResponse[]>(
					'/role',
					'GET',
					{
						token,
						query
					}
				);

				return {
					data: response,
					total: response.length
				};
			} catch (error) {
				console.error('Lỗi API lấy danh sách vai trò:', error);
				throw error;
			}
		},

		/**
		 * Lấy thông tin chi tiết của một vai trò
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string} id - ID của vai trò cần lấy thông tin
		 * @returns {Promise<RoleDetailResponse>} - Thông tin chi tiết của vai trò
		 */
		async getRoleById(token: string, id: string): Promise<response.RoleDetailResponse> {
			try {
				return await apiRequest<response.RoleDetailResponse>(
					`/role/${id}`,
					'GET',
					{ token }
				);
			} catch (error) {
				console.error(`Lỗi API lấy thông tin vai trò ID=${id}:`, error);
				throw error;
			}
		},

		/**
		 * Tạo một vai trò mới
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {RoleFormData} data - Thông tin vai trò cần tạo
		 * @returns {Promise<RoleDetailResponse>} - Thông tin vai trò sau khi tạo
		 */
		async createRole(token: string, data: response.RoleFormData): Promise<response.RoleDetailResponse> {
			try {
				return await apiRequest<response.RoleDetailResponse>(
					'/role',
					'POST',
					{
						token,
						data
					}
				);
			} catch (error) {
				console.error('Lỗi API tạo vai trò mới:', error);
				throw error;
			}
		},

		/**
		 * Cập nhật thông tin vai trò
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string} id - ID của vai trò cần cập nhật
		 * @param {RoleFormData} data - Thông tin vai trò cần cập nhật
		 * @returns {Promise<RoleDetailResponse>} - Thông tin vai trò sau khi cập nhật
		 */
		async updateRole(token: string, id: string, data: response.RoleFormData): Promise<response.RoleDetailResponse> {
			try {
				return await apiRequest<response.RoleDetailResponse>(
					`/role/${id}`,
					'PUT',
					{
						token,
						data
					}
				);
			} catch (error) {
				console.error(`Lỗi API cập nhật vai trò ID=${id}:`, error);
				throw error;
			}
		},

		/**
		 * Xóa một vai trò
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string} id - ID của vai trò cần xóa
		 * @returns {Promise<void>} - Không có dữ liệu trả về nếu thành công
		 */
		async deleteRole(token: string, id: string): Promise<void> {
			try {
				await apiRequest<void>(
					`/role/${id}`,
					'DELETE',
					{ token }
				);
			} catch (error) {
				console.error(`Lỗi API xóa vai trò ID=${id}:`, error);
				throw error;
			}
		},

		/**
		 * Lấy danh sách tất cả quyền trong hệ thống
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @returns {Promise<string[]>} - Danh sách quyền
		 */
		async getAllPermissions(token: string): Promise<string[]> {
			try {
				return await apiRequest<string[]>(
					'/role/permissions',
					'GET',
					{ token }
				);
			} catch (error) {
				console.error('Lỗi API lấy danh sách quyền:', error);
				throw error;
			}
		},

		/**
		 * Lấy danh sách người dùng thuộc vai trò cụ thể
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string} roleId - ID của vai trò cần lấy danh sách người dùng
		 * @param {number} [page=1] - Trang hiện tại
		 * @param {number} [pageSize=10] - Số người dùng trên mỗi trang
		 * @param {string} [search=""] - Từ khóa tìm kiếm (tên hoặc email)
		 * @returns {Promise<GetRoleUsersResponse>} - Danh sách người dùng và thông tin phân trang
		 */
		async getRoleUsers(
			token: string,
			roleId: string,
			page: number = 1,
			pageSize: number = 10,
			search: string = ""
		): Promise<response.GetRoleUsersResponse> {
			try {
				const query: Record<string, string | number> = {
					page,
					pageSize
				};

				if (search) {
					query.search = search;
				}

				const users = await apiRequest<UserProfile[]>(
					`/role/${roleId}/users`,
					'GET',
					{
						token,
						query
					}
				);

				const mappedUsers = users.map(user => ({
					id: user.id,
					username:  user.name || '',
					email: user.email || '',
					name: user.name || user.email || '',
					avatar: user.avatar || null,
		  createdAt:  new Date().toISOString(),
		  isActive: true,
				}));

				return {
					data: mappedUsers,
					total: users.length
				};
			} catch (error) {
				console.error(`Lỗi API lấy danh sách người dùng thuộc vai trò ID=${roleId}:`, error);
				throw error;
			}
		},

		/**
		 * Gán vai trò cho người dùng
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string} userId - ID của người dùng
		 * @param {string} roleId - ID của vai trò cần gán
		 * @returns {Promise<void>} - Không có dữ liệu trả về nếu thành công
		 */
		async assignRoleToUser(token: string, userId: string, roleId: string): Promise<void> {
			try {
				await apiRequest<void>(
					`/role/assign`,
					'POST',
					{
						token,
						data: { userId, roleId }
					}
				);
			} catch (error) {
				console.error(`Lỗi API gán vai trò ID=${roleId} cho người dùng ID=${userId}:`, error);
				throw error;
			}
		},

		/**
		 * Xóa vai trò khỏi người dùng
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string} userId - ID của người dùng
		 * @param {string} roleId - ID của vai trò cần xóa
		 * @returns {Promise<void>} - Không có dữ liệu trả về nếu thành công
		 */
		async removeRoleFromUser(token: string, userId: string, roleId: string): Promise<void> {
			try {
				await apiRequest<void>(
					`/role/remove`,
					'POST',
					{
						token,
						data: { userId, roleId }
					}
				);
			} catch (error) {
				console.error(`Lỗi API xóa vai trò ID=${roleId} khỏi người dùng ID=${userId}:`, error);
				throw error;
			}
		},

		/**
		 * Cập nhật quyền hạn cho vai trò
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string} roleId - ID của vai trò cần cập nhật quyền
		 * @param {string[]} permissions - Danh sách quyền hạn mới
		 * @returns {Promise<response.RoleDetailResponse>} - Thông tin vai trò sau khi cập nhật
		 */
		async updateRolePermissions(token: string, roleId: string, permissions: string[]): Promise<response.RoleDetailResponse> {
			try {
				return await apiRequest<response.RoleDetailResponse>(
					`/role/${roleId}/permissions`,
					'PUT',
					{
						token,
						data: { permissions }
					}
				);
			} catch (error) {
				console.error(`Lỗi API cập nhật quyền hạn cho vai trò ID=${roleId}:`, error);
				throw error;
			}
		},

		/**
		 * Kiểm tra quyền hạn của người dùng hiện tại
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string} permission - Quyền hạn cần kiểm tra
		 * @returns {Promise<{hasPermission: boolean}>} - Kết quả kiểm tra quyền hạn
		 */
		async checkUserPermission(token: string, permission: string): Promise<{ hasPermission: boolean }> {
			try {
				return await apiRequest<{ hasPermission: boolean }>(
					`/role/check-permission`,
					'POST',
					{
						token,
						data: { permission }
					}
				);
			} catch (error) {
				console.error(`Lỗi API kiểm tra quyền hạn "${permission}":`, error);
				throw error;
			}
		},

		/**
		 * Lấy danh sách người dùng chưa được gán vai trò cụ thể, có hỗ trợ tìm kiếm.
		 * Backend endpoint expects 'limit' for size and 'search' for term.
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string} roleId - ID của vai trò
		 * @param {number} [limit=50] - Số lượng người dùng tối đa trả về (maps to backend 'limit')
		 * @param {string} [search=""] - Từ khóa tìm kiếm (tên, username hoặc email)
		 * @returns {Promise<response.GetUsersResponse>} - Danh sách người dùng và tổng số (lưu ý: backend hiện tại không trả về total, nên total sẽ dựa trên length)
		 */
		async getAvailableUsers(
			token: string,
			roleId: string,
			limit: number = 50, // Changed pageSize to limit, updated default
			search: string = ""
		): Promise<response.GetUsersResponse> {
			try {
				// Construct query parameters matching the backend endpoint
				const query: Record<string, string | number> = {
					limit // Use limit instead of pageSize
				};

				// Add search term if provided
				if (search && search.trim() !== "") {
					query.search = search.trim();
				}

				// Make the API request
				const usersResponse = await apiRequest<UserProfile[]>(
					`/role/${roleId}/users/available`, // Correct endpoint
					'GET',
					{
						token,
						query // Send the correctly structured query object
					}
				);

				// Map response if necessary (assuming UserResponse structure is consistent)
				// Backend currently returns User[] directly, so mapping might not be needed
				// unless frontend requires a different structure.
				const mappedData = usersResponse.map(user => ({
					id: user.id,
					name: user.name  || 'N/A', // Ensure name fallback
					email: user.email || 'N/A',
					username:  'N/A',
					avatar: user.avatar || '/images/default-avatar.png', // Default avatar
				}));

				// Return the expected structure
				// Note: The backend endpoint doesn't seem to return a total count.
				// We are returning the length of the received array as total.
				return {
					data: mappedData,
					total: mappedData.length
				};
			} catch (error) {
				console.error(`Lỗi API lấy danh sách người dùng khả dụng cho vai trò ID=${roleId}:`, error);
				// Consider re-throwing or returning a specific error structure
				throw error;
			}
		},

		/**
		 * Gán nhiều người dùng vào vai trò
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string[]} userIds - Danh sách ID người dùng
		 * @param {string} roleId - ID của vai trò cần gán
		 * @returns {Promise<void>} - Không có dữ liệu trả về nếu thành công
		 */
		async assignUsersToRole(token: string, userIds: string[], roleId: string): Promise<void> {
			try {
				await apiRequest<void>(
					`/role/${roleId}/assign-users`,
					'POST',
					{
						token,
						data: { userIds, roleId }
					}
				);
			} catch (error) {
				console.error(`Lỗi API gán nhiều người dùng vào vai trò ID=${roleId}:`, error);
				throw error;
			}
		},

		/**
		 * Xóa nhiều người dùng khỏi vai trò
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string[]} userIds - Danh sách ID người dùng
		 * @param {string} roleId - ID của vai trò cần xóa
		 * @returns {Promise<void>} - Không có dữ liệu trả về nếu thành công
		 */
		async removeUsersFromRole(token: string, userIds: string[], roleId: string): Promise<void> {
			try {
				await apiRequest<void>(
					`/role/${roleId}/users/remove`,
					'POST',
					{
						token,
						data: { userIds, roleId }
					}
				);
			} catch (error) {
				console.error(`Lỗi API xóa nhiều người dùng khỏi vai trò ID=${roleId}:`, error);
				throw error;
			}
		},

		/**
		 * Lấy danh sách quyền dựa trên vai trò
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string} roleId - ID của vai trò cần lấy quyền
		 * @returns {Promise<{permissions: string[]}>} - Danh sách quyền của vai trò
		 */
		async getRolePermissions(token: string, roleId: string): Promise<{ permissions: string[] }> {
			try {
				const response = await apiRequest<{ permissions: string[] } | string[]>(
					`/role/${roleId}/permissions`,
					'GET',
					{ token }
				);

				// Handle different response formats
				if (Array.isArray(response)) {
					return {
						permissions: response.map(perm =>
							typeof perm === 'string' ? perm : (perm as { name?: string }).name || ''
						).filter(Boolean)
					};
				}

				return response as { permissions: string[] };
			} catch (error) {
				console.error(`Lỗi API lấy quyền hạn của vai trò ID=${roleId}:`, error);
				throw error;
			}
		},

		/**
		 * Phân nhóm quyền hạn theo module
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @returns {Promise<Record<string, string[]>>} - Quyền hạn được phân nhóm theo module
		 */
		async getGroupedPermissions(token: string): Promise<Record<string, string[]>> {
			try {
				return await apiRequest<Record<string, string[]>>(
					'/role/permissions/grouped',
					'GET',
					{ token }
				);
			} catch (error) {
				console.error('Lỗi API lấy quyền hạn theo nhóm:', error);
				throw error;
			}
		},

		/**
		 * Đặt vai trò làm vai trò mặc định cho người dùng mới
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @param {string} roleId - ID của vai trò cần đặt làm mặc định
		 * @returns {Promise<response.RoleDetailResponse>} - Thông tin vai trò sau khi cập nhật
		 */
		async setDefaultRole(token: string, roleId: string): Promise<response.RoleDetailResponse> {
			try {
				return await apiRequest<response.RoleDetailResponse>(
					`/role/${roleId}/set-default`,
					'PUT',
					{ token }
				);
			} catch (error) {
				console.error(`Lỗi API đặt vai trò mặc định ID=${roleId}:`, error);
				throw error;
			}
		},

		/**
		 * Lấy vai trò mặc định
		 * 
		 * @param {string} token - Token xác thực của admin
		 * @returns {Promise<response.RoleDetailResponse>} - Thông tin vai trò mặc định
		 */
		async getDefaultRole(token: string): Promise<response.RoleDetailResponse> {
			try {
				return await apiRequest<response.RoleDetailResponse>(
					'/role/default',
					'GET',
					{ token }
				);
			} catch (error) {
				console.error('Lỗi API lấy vai trò mặc định:', error);
				throw error;
			}
		}
	},
};