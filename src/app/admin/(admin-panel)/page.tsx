"use client";

import React, { useState, useEffect } from 'react';
import LineChart from '@/components/ui/chart/line-chart';
import StatCard from '@/components/ui/chart/stat-card';
import BarChart from '@/components/ui/chart/bar-chart';
import { Calendar1Icon } from 'lucide-react';
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

// Updated interfaces to match actual backend response
interface DashboardStats {
  totalShippers?: number;
  activeShippers?: number;
  completedOrders?: number;
  totalRevenue?: number;
}

// Based on your backend data: {"period":"year","activeShippers":1,"totalDeliveries":2}
interface ShipperStats {
  period: string;
  activeShippers: number;
  totalDeliveries: number;
}

// Based on your backend data
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

// Interface for chart API response that can have nested structure
interface ChartApiResponse {
  labels?: string[];
  values?: number[];
  order?: ChartData;
  revenue?: ChartData;
}

const AdminPage = () => {
    const { getToken } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('year');
    const [selectedMetric] = useState<'overview' | 'orders' | 'revenue'>('overview');
    
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

    // Helper function to safely extract chart data
    const extractChartData = (apiResponse: ChartApiResponse): ChartData => {
        // If response has nested structure (like {order: {labels: [], values: []}})
        if (apiResponse.order) {
            return {
                labels: apiResponse.order.labels || [],
                values: apiResponse.order.values || []
            };
        }
        
        if (apiResponse.revenue) {
            return {
                labels: apiResponse.revenue.labels || [],
                values: apiResponse.revenue.values || []
            };
        }
        
        // If response has flat structure (like {labels: [], values: []})
        return {
            labels: apiResponse.labels || [],
            values: apiResponse.values || []
        };
    };

    // Safe max calculation for charts
    const getSafeMaxValue = (values: number[]): number => {
        if (!values || values.length === 0) return 10;
        const maxValue = Math.max(...values);
        return maxValue > 0 ? maxValue * 1.2 : 10;
    };

    // Safe number access with fallback
    const safeNumber = (value: number | undefined, fallback: number = 0): number => {
        return typeof value === 'number' ? value : fallback;
    };

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
                ? dashboardStatsResult.value as DashboardStats
                : defaultDashboardStats;

            const shipperStats = shipperStatsResult.status === 'fulfilled' 
                ? shipperStatsResult.value as unknown as ShipperStats
                : defaultShipperStats;

            const orderStats = orderStatsResult.status === 'fulfilled' 
                ? orderStatsResult.value as unknown as OrderStats
                : defaultOrderStats;

            // Safely extract chart data
            const orderChartData = orderChartResult.status === 'fulfilled' 
                ? extractChartData(orderChartResult.value as ChartApiResponse)
                : defaultChartData;

            const revenueChartData = revenueChartResult.status === 'fulfilled' 
                ? extractChartData(revenueChartResult.value as ChartApiResponse)
                : defaultChartData;

            // Log any failed requests
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`API call ${index} failed:`, result.reason);
                }
            });

            // Format stats data for StatCard components using actual backend data
            const totalShippers = safeNumber(dashboardStats.totalShippers);
            const activeShippers = safeNumber(shipperStats.activeShippers);
            const totalDeliveries = safeNumber(shipperStats.totalDeliveries);
            const completedOrders = safeNumber(orderStats.completedOrders);
            const totalOrders = safeNumber(orderStats.totalOrders);
            const completionRate = safeNumber(orderStats.completionRate);

            const formattedStats: StatCardData[] = [
                {
                    title: "Tổng Shipper",
                    value: totalShippers.toLocaleString(),
                    previousValue: '0',
                    change: `${activeShippers} shipper đang hoạt động`,
                    isPositive: activeShippers > 0,
                },
                {
                    title: "Shipper Hoạt Động", 
                    value: activeShippers.toLocaleString(),
                    previousValue: '0',
                    change: `${totalDeliveries} giao hàng trong ${getPeriodText(selectedPeriod)}`,
                    isPositive: totalDeliveries > 0,
                },
                {
                    title: "Đơn Hàng Hoàn Thành",
                    value: completedOrders.toLocaleString(),
                    previousValue: totalOrders.toLocaleString(),
                    change: `${completionRate.toFixed(1)}% tỷ lệ hoàn thành`,
                    isPositive: completionRate > 50,
                }
            ];

            setStatsData(formattedStats);
            
            // Set chart data with proper fallbacks
            setChartData({
                order: {
                    labels: orderChartData.labels || [],
                    values: orderChartData.values || []
                },
                revenue: {
                    labels: revenueChartData.labels || [],
                    values: revenueChartData.values || []
                }
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu');
            
            // Set fallback data on error
            setStatsData([
                {
                    title: "Tổng Shipper",
                    value: "0",
                    previousValue: "0",
                    change: "0 shipper đang hoạt động",
                    isPositive: false,
                },
                {
                    title: "Shipper Hoạt Động",
                    value: "0",
                    previousValue: "0",
                    change: `0 giao hàng trong ${getPeriodText(selectedPeriod)}`,
                    isPositive: false,
                },
                {
                    title: "Đơn Hàng Hoàn Thành",
                    value: "0",
                    previousValue: "0",
                    change: "0.0% tỷ lệ hoàn thành",
                    isPositive: false,
                }
            ]);
            
            setChartData({
                order: { labels: [], values: [] },
                revenue: { labels: [], values: [] }
            });
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




    // Loading state
    if (loading) {
        return (
            <div className="p-4">
                <Header 
                    title="Thống kê"
                    description="Đang tải dữ liệu thống kê..."
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
                />
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchDashboardData}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* Header */}
            <Header 
                title="Thống kê"
                description="Quan sát dữ liệu thống kê hệ thống trong thời gian thực"
            />


            {/* Time Filter */}
            <div className="flex flex-wrap space-x-0 space-y-2 sm:space-x-4 sm:space-y-0 mb-6">
                <button
                    onClick={() => handlePeriodChange('year')}
                    className={`px-4 py-2 rounded-lg transition-colors ${selectedPeriod === 'year'
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    12 tháng
                </button>
                <button
                    onClick={() => handlePeriodChange('month')}
                    className={`px-4 py-2 rounded-lg transition-colors ${selectedPeriod === 'month'
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    30 ngày
                </button>
                <button
                    onClick={() => handlePeriodChange('week')}
                    className={`px-4 py-2 rounded-lg transition-colors ${selectedPeriod === 'week'
                            ? 'bg-primary text-white'
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
                            <h2 className="text-xl font-semibold">Đơn hàng theo {getPeriodText(selectedPeriod)}</h2>
                        </div>
                        {chartData.order.values.length > 0 ? (
                            <LineChart
                                data={chartData.order.values}
                                labels={chartData.order.labels}
                                label="Đơn hàng"
                                maxValue={getSafeMaxValue(chartData.order.values)}
                                color="#1E3A8A"
                                fillColor="rgba(30, 58, 138, 0.1)"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                Không có dữ liệu đơn hàng
                            </div>
                        )}
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Doanh thu theo {getPeriodText(selectedPeriod)}</h2>
                        </div>
                        {chartData.revenue.values.length > 0 ? (
                            <BarChart
                                data={chartData.revenue.values}
                                labels={chartData.revenue.labels}
                                label="Doanh thu (VNĐ)"
                                maxValue={getSafeMaxValue(chartData.revenue.values)}
                                backgroundColor="#E5E7EB"
                                borderRadius={4}
                                barThickness={32}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                Không có dữ liệu doanh thu
                            </div>
                        )}
                    </div>
                </>
            )}

            {selectedMetric === 'orders' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Đơn hàng theo {getPeriodText(selectedPeriod)}</h2>
                        <button className="text-blue-500 hover:underline">Chi tiết</button>
                    </div>
                    {chartData.order.values.length > 0 ? (
                        <LineChart
                            data={chartData.order.values}
                            labels={chartData.order.labels}
                            label="Đơn hàng"
                            maxValue={getSafeMaxValue(chartData.order.values)}
                            color="#1E3A8A"
                            fillColor="rgba(30, 58, 138, 0.1)"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Không có dữ liệu đơn hàng
                        </div>
                    )}
                </div>
            )}

            {selectedMetric === 'revenue' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Doanh thu theo {getPeriodText(selectedPeriod)}</h2>
                        <button className="text-blue-500 hover:underline">Chi tiết</button>
                    </div>
                    {chartData.revenue.values.length > 0 ? (
                        <BarChart
                            data={chartData.revenue.values}
                            labels={chartData.revenue.labels}
                            label="Doanh thu (VNĐ)"
                            maxValue={getSafeMaxValue(chartData.revenue.values)}
                            backgroundColor="#E5E7EB"
                            borderRadius={4}
                            barThickness={32}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Không có dữ liệu doanh thu
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPage;