"use client";

import React, { useState, useEffect } from 'react';
import LineChart from '@/components/ui/chart/line-chart';
import StatCard from '@/components/ui/chart/stat-card';
import BarChart from '@/components/ui/chart/bar-chart';
import { Calendar1Icon, ChevronRightIcon } from 'lucide-react';
import { adminService } from '@/api/admin';
import { useAuth } from '@/context/auth-context';

// Import reusable components
import Header from '@/app/admin/(admin-panel)/_components/header';

type TimePeriod = 'year' | 'month' | 'week';

interface StatCardData {
  title: string;
  value: string;
  previousValue: string;
  change: string;
  isPositive: boolean;
}

interface ChartData {
  labels: string[];
  values: number[];
}

// Update interfaces to match backend response
interface DashboardStats {
  totalShippers: number;
  activeShippers: number;
  completedOrders: number;
  totalRevenue: number;
}

interface ShipperStats {
  period: string;
  activeShippers: number;
  totalDeliveries: number;
}

interface OrderStats {
  period: string;
  totalOrders: number;
  completedOrders: number;
  completionRate: number;
  breakdown: Array<{
    status: string;
    count: number;
    percentage: string;
  }>;
}

const AdminPage = () => {
    const { getToken } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('year');
    const [selectedMetric, ] = useState<'overview' | 'orders' | 'revenue'>('overview');
    
    // State for API data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statsData, setStatsData] = useState<StatCardData[]>([]);
    const [chartData, setChartData] = useState<{
        order: ChartData;
        revenue: ChartData;
    }>({
        order: { labels: [], values: [] },
        revenue: { labels: [], values: [] }
    });

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = getToken();
            if (!token) {
                setError('Không tìm thấy token xác thực');
                return;
            }

            // Fetch all data with better error handling
            const results = await Promise.allSettled([
                adminService.dashboard.getDashboardStats(token),
                adminService.dashboard.getShipperStats(token, selectedPeriod),
                adminService.dashboard.getOrderCompletionStats(token, selectedPeriod),
                adminService.dashboard.getChartData(token, selectedPeriod, 'orders'),
                adminService.dashboard.getChartData(token, selectedPeriod, 'revenue')
            ]);

            // Process results and handle any failures
            const [
                dashboardStatsResult,
                shipperStatsResult,
                orderStatsResult,
                orderChartResult,
                revenueChartResult
            ] = results;

            // Default values
            const defaultDashboardStats: DashboardStats = {
                totalShippers: 0,
                activeShippers: 0,
                completedOrders: 0,
                totalRevenue: 0
            };

            const defaultShipperStats: ShipperStats = {
                period: selectedPeriod,
                activeShippers: 0,
                totalDeliveries: 0
            };

            const defaultOrderStats: OrderStats = {
                period: selectedPeriod,
                totalOrders: 0,
                completedOrders: 0,
                completionRate: 0,
                breakdown: []
            };

            const defaultChartData: ChartData = {
                labels: [],
                values: []
            };

            // Extract successful results or use defaults
            const dashboardStats = dashboardStatsResult.status === 'fulfilled' 
                ? dashboardStatsResult.value 
                : defaultDashboardStats;

            const shipperStats = shipperStatsResult.status === 'fulfilled' 
                ? shipperStatsResult.value 
                : defaultShipperStats;

            const orderStats = orderStatsResult.status === 'fulfilled' 
                ? orderStatsResult.value 
                : defaultOrderStats;

            const orderChartData = orderChartResult.status === 'fulfilled' 
                ? orderChartResult.value 
                : defaultChartData;

            const revenueChartData = revenueChartResult.status === 'fulfilled' 
                ? revenueChartResult.value 
                : defaultChartData;

            // Log any failed requests
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`API call ${index} failed:`, result.reason);
                }
            });

            // Format stats data for StatCard components using actual backend data
            const formattedStats: StatCardData[] = [
                {
                    title: "Tổng Shipper",
                    value: dashboardStats.totalShippers?.toLocaleString() || '0',
                    previousValue: '0', // Since backend doesn't provide previous period data
                    change: `${shipperStats.activeShippers} shipper đang hoạt động`,
                    isPositive: shipperStats.activeShippers > 0,
                },
                {
                    title: "Shipper Hoạt Động",
                    value: shipperStats.activeShippers?.toLocaleString() || '0',
                    previousValue: '0',
                    change: `${shipperStats.totalDeliveries} giao hàng trong ${getPeriodText(selectedPeriod)}`,
                    isPositive: shipperStats.totalDeliveries > 0,
                },
                {
                    title: "Đơn Hàng Hoàn Thành",
                    value: orderStats.completedOrders?.toLocaleString() || '0',
                    previousValue: orderStats.totalOrders?.toLocaleString() || '0',
                    change: `${orderStats.completionRate?.toFixed(1) || '0'}% tỷ lệ hoàn thành`,
                    isPositive: orderStats.completionRate > 50,
                }
            ];

            setStatsData(formattedStats);
            
            // Set chart data with proper fallbacks
            setChartData({
                order: {
                    labels: orderChartData.order?.labels || orderChartData.labels || [],
                    values: orderChartData.order?.values || orderChartData.values || []
                },
                revenue: {
                    labels: revenueChartData.revenue?.labels || revenueChartData.labels || [],
                    values: revenueChartData.revenue?.values || revenueChartData.values || []
                }
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get period text
    const getPeriodText = (period: TimePeriod): string => {
        switch (period) {
            case 'year': return 'năm';
            case 'month': return 'tháng';
            case 'week': return 'tuần';
            default: return 'kỳ';
        }
    };

    // Fetch data when component mounts or period changes
    useEffect(() => {
        fetchDashboardData();
    }, [selectedPeriod]);

    // Handle period change
    const handlePeriodChange = (period: TimePeriod) => {
        setSelectedPeriod(period);
    };

    // Header configuration
    const headerActions = [
        {
            label: "Export Report",
            icon: <ChevronRightIcon className="w-5 h-5" />,
            onClick: () => console.log("Export report"),
            variant: 'secondary' as const,
        },
    ];


    // Loading state
    if (loading) {
        return (
            <div className="p-4">
                <Header 
                    title="Thống kê"
                    description="Đang tải dữ liệu thống kê..."
                    actions={headerActions}
                />
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="p-4">
                <Header 
                    title="Thống kê"
                    description="Có lỗi xảy ra khi tải dữ liệu"
                    actions={headerActions}
                />
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchDashboardData}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Get safe chart data for rendering

    return (
        <div className="p-4">
            {/* Header */}
            <Header 
                title="Thống kê"
                description="Quan sát dữ liệu thống kê hệ thống trong thời gian thực"
                actions={headerActions}
            />


            {/* Time Filter */}
            <div className="flex flex-wrap space-x-0 space-y-2 sm:space-x-4 sm:space-y-0 mb-6">
                <button
                    onClick={() => handlePeriodChange('year')}
                    className={`px-4 py-2 rounded-lg transition-colors ${selectedPeriod === 'year'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    12 tháng
                </button>
                <button
                    onClick={() => handlePeriodChange('month')}
                    className={`px-4 py-2 rounded-lg transition-colors ${selectedPeriod === 'month'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    30 ngày
                </button>
                <button
                    onClick={() => handlePeriodChange('week')}
                    className={`px-4 py-2 rounded-lg transition-colors ${selectedPeriod === 'week'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    7 ngày
                </button>
                <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300">
                    <Calendar1Icon className="w-5 h-5" />
                    Chọn chu kỳ
                </button>
            </div>

            {/* Content based on selected tab */}
            {selectedMetric === 'overview' && (
                <>
                    {/* Statistical Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {statsData.map((card, index) => (
                            <StatCard key={index} {...card} />
                        ))}
                    </div>

                    {/* Line Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Đơn hàng</h2>
                        </div>
                        <LineChart
                            data={chartData.order.values}
                            labels={chartData.order.labels}
                            label="Đơn hàng"
                            maxValue={Math.max(...chartData.order.values) * 1.2}
                            color="#1E3A8A"
                            fillColor="rgba(30, 58, 138, 0.1)"
                        />
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Doanh số</h2>
                        </div>
                        <BarChart
                            data={chartData.revenue.values}
                            labels={chartData.revenue.labels}
                            label="Doanh số"
                            maxValue={Math.max(...chartData.revenue.values) * 1.2}
                            backgroundColor="#E5E7EB"
                            borderRadius={4}
                            barThickness={32}
                        />
                    </div>
                </>
            )}

            {selectedMetric === 'orders' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Đơn hàng</h2>
                        <button className="text-blue-500 hover:underline">Chi tiết</button>
                    </div>
                    <LineChart
                        data={chartData.order.values}
                        labels={chartData.order.labels}
                        label="Đơn hàng"
                        maxValue={Math.max(...chartData.order.values) * 1.2}
                        color="#1E3A8A"
                        fillColor="rgba(30, 58, 138, 0.1)"
                    />
                </div>
            )}

            {selectedMetric === 'revenue' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Doanh số</h2>
                        <button className="text-blue-500 hover:underline">Chi tiết</button>
                    </div>
                    <BarChart
                        data={chartData.revenue.values}
                        labels={chartData.revenue.labels}
                        label="Doanh số"
                        maxValue={Math.max(...chartData.revenue.values) * 1.2}
                        backgroundColor="#E5E7EB"
                        borderRadius={4}
                        barThickness={32}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminPage;