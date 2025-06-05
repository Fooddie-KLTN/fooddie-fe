"use client";

import { useEffect, useState } from "react";
import { CloudUploadIcon, FilterIcon, PlusIcon, SortAscIcon, TrashIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { adminService, PromotionResponse, PromotionType } from "@/api/admin";

import Header from "@/app/admin/(admin-panel)/_components/header";
import SearchAndFilters from "@/app/admin/(admin-panel)/_components/search-and-filter";
import Table, { Column, Action } from "@/app/admin/(admin-panel)/_components/table";
import Pagination from "@/app/admin/(admin-panel)/_components/pagination";
import AddPromotionForm from "./_components/add-promotion-modal";
import { Promotion } from "@/interface";
import { useAuth } from "@/context/auth-context";

type SortDirection = 'asc' | 'desc' | null;

const PromotionsAdminPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [, setIsCsvModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Promotion | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
  const [selectedPromotions, setSelectedPromotions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
  });

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { getToken } = useAuth();

  const fetchPromotions = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const response = await adminService.Promotion.getPromotions(token, pagination.currentPage, pagination.pageSize);
      setPromotions(response);
      setPagination((prev) => ({
        ...prev,
        totalPages: Math.ceil(response.length / pagination.pageSize),
      }));
    } catch (err) {
      console.error("Failed to fetch promotions:", err);
      setPromotions([]);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [pagination.currentPage, pagination.pageSize]);

  const filteredPromotions = (promotions ?? []).filter((promo) =>
    promo.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPromotions = [...filteredPromotions];
  if (sortField && sortDirection) {
    sortedPromotions.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }

  const paginatedData = sortedPromotions.slice(
    (pagination.currentPage - 1) * pagination.pageSize,
    pagination.currentPage * pagination.pageSize
  );

  const handleCheckAll = (checked: boolean) => {
    if (checked) {
      setSelectedPromotions(paginatedData.map((p) => p.id));
    } else {
      setSelectedPromotions([]);
    }
  };

  const handleCheckPromotion = (id: string, checked: boolean) => {
    setSelectedPromotions((prev) =>
      checked ? [...prev, id] : prev.filter((pid) => pid !== id)
    );
  };

  const handleSort = (field: keyof Promotion, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination({
      currentPage: 1,
      pageSize: size,
      totalPages: Math.ceil(promotions.length / size),
    });
  };

  const handleDelete = async (id: string) => {
    const token = getToken();
    if (!token) return;
    
    try {
      await adminService.Promotion.deletePromotion(token, id);
      await fetchPromotions(); // Refresh the list
    } catch (err) {
      console.error("Failed to delete promotion:", err);
    }
  };

  const handlePromotionAdded = () => {
    fetchPromotions(); // Refresh the list when a new promotion is added
    setIsAddModalOpen(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getPromotionTypeLabel = (type: PromotionType) => {
    switch (type) {
      case PromotionType.FOOD_DISCOUNT:
        return "Giảm giá món ăn";
      case PromotionType.SHIPPING_DISCOUNT:
        return "Giảm phí vận chuyển";
      default:
        return "N/A";
    }
  };

  const promotionColumns: Column<PromotionResponse>[] = [
    { header: "Mã", accessor: "code", sortable: true },
    { header: "Mô tả", accessor: "description", sortable: true },
    { 
      header: "Loại khuyến mãi", 
      accessor: "type", 
      sortable: true,
      renderCell: (_, row) => getPromotionTypeLabel(row.type)
    },
    { 
      header: "Giảm giá (%)", 
      accessor: "discountPercent", 
      sortable: true,
      renderCell: (_, row) => row.discountPercent ? `${row.discountPercent}%` : "N/A"
    },
    { 
      header: "Giảm giá (VND)", 
      accessor: "discountAmount", 
      sortable: true,
      renderCell: (_, row) => formatCurrency(row.discountAmount)
    },
    { 
      header: "Đơn tối thiểu", 
      accessor: "minOrderValue", 
      sortable: true,
      renderCell: (_, row) => formatCurrency(row.minOrderValue)
    },
    { 
      header: "Giảm tối đa", 
      accessor: "maxDiscountAmount", 
      sortable: true,
      renderCell: (_, row) => formatCurrency(row.maxDiscountAmount)
    },
    { 
      header: "Ngày bắt đầu", 
      accessor: "startDate", 
      sortable: true,
      renderCell: (_, row) => formatDate(row.startDate)
    },
    { 
      header: "Ngày kết thúc", 
      accessor: "endDate", 
      sortable: true,
      renderCell: (_, row) => formatDate(row.endDate)
    },
    { 
      header: "Sử dụng", 
      accessor: "numberOfUsed", 
      sortable: true,
      renderCell: (_, row) => `${row.numberOfUsed || 0}${row.maxUsage ? `/${row.maxUsage}` : ''}`
    },
  ];

  const promotionActions: Action[] = [
    {
      label: "Xóa",
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: (id) => handleDelete(id),
    },
  ];

  const filterControls = (
    <>
      <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
        <SortAscIcon className="w-5 h-5" />
        <span>Sort</span>
      </button>
      <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
        <FilterIcon className="w-5 h-5" />
        <span>Filter</span>
      </button>
    </>
  );

  const headerActions = [
    {
      label: "Thêm nhiều",
      icon: <CloudUploadIcon className="w-5 h-5" />,
      onClick: () => setIsCsvModalOpen(true),
      variant: "secondary" as const,
    },
    {
      label: "Thêm mã",
      icon: <PlusIcon className="w-5 h-5" />,
      onClick: () => setIsAddModalOpen(true),
      variant: "primary" as const,
    },
  ];

  return (
    <div className="p-4">
      <Header
        title="Quản lý mã giảm giá"
        description="Theo dõi, tạo và chỉnh sửa các mã giảm giá"
        actions={headerActions}
      />

      <SearchAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm theo mã code"
        additionalFilters={filterControls}
      />

      <div className="overflow-x-auto">
        <Table<PromotionResponse>
          columns={promotionColumns}
          data={paginatedData}
          selectable={true}
          selectedItems={selectedPromotions}
          onSelectItem={handleCheckPromotion}
          onSelectAll={handleCheckAll}
          showActions={true}
          actions={promotionActions}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
        />
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10, 20, 50]}
      />

      {/* Modal Thêm mã */}
      {isDesktop ? (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="p-0 h-screen w-screen overflow-auto">
            <DialogTitle className="sr-only">Thêm mã mới</DialogTitle>
            <AddPromotionForm onClose={handlePromotionAdded} />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DrawerContent className="h-screen p-0 overflow-auto">
            <DialogTitle className="sr-only">Thêm mã mới</DialogTitle>
            <AddPromotionForm onClose={handlePromotionAdded} />
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

export default PromotionsAdminPage;


