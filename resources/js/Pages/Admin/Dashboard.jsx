import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardStats from '@/Components/DashboardStats';
import TransactionTable from '@/Components/TransactionTable';
import ApiDetailsWidget from '@/Components/ApiDetailsWidget';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { 
    UserGroupIcon, 
    CreditCardIcon, 
    PhoneIcon, 
    TvIcon, 
    LightBulbIcon, 
    WalletIcon,
    Cog6ToothIcon,
    ChartBarIcon,
    ArrowPathIcon,
    BellIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard({ auth, stats, userStats, transactionStats, recentTransactions, chartData, apiDetails }) {
    const [timeRange, setTimeRange] = useState('7days');
    
    // Format large numbers with commas
    const formatNumber = (num) => {
        return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
    };

    // Format currency values
    const formatCurrency = (amount) => {
        return `₦${formatNumber(amount)}`;
    };
    
    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Admin Dashboard</h2>}
        >
            <Head title="Admin Dashboard" />

            <div className="py-6">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-primary to-purple-600 rounded-xl shadow-lg mb-6 overflow-hidden">
                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center">
                        <div className="text-white mb-4 sm:mb-0">
                            <h2 className="text-2xl font-bold">Welcome back, {auth.user.name}!</h2>
                            <p className="opacity-90 mt-1">Here's what's happening with your platform today.</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link href={route('admin.notifications.index')} className="btn bg-base-100 -ws/20 hover:bg-base-100 -ws/30 text-white border-0">
                                <BellIcon className="h-5 w-5 mr-2" />
                                Send Notifications
                            </Link>
                            <Link href={route('admin.settings')} className="btn bg-base-100 -ws/20 hover:bg-base-100 -ws/30 text-white border-0">
                                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                                Settings
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <DashboardStats stats={stats} />
 
                {/* Quick Action Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Link href={route('admin.users')} className="dashboard-card p-5 flex flex-col items-center text-center hover:scale-105 transition-transform">
                        <div className="rounded-full bg-primary-100 p-3 mb-3">
                            <UserGroupIcon className="h-6 w-6 text-primary-600" />
                        </div>
                        <h3 className="font-medium igg-800">Manage Users</h3>
                        <p className="text-xs igg-500 mt-1">{formatNumber(userStats.total)} registered users</p>
                    </Link>
                    
                    <Link href={route('admin.transactions')} className="dashboard-card p-5 flex flex-col items-center text-center hover:scale-105 transition-transform">
                        <div className="rounded-full bg-green-100 p-3 mb-3">
                            <CreditCardIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-medium igg-800">Transactions</h3>
                        <p className="text-xs igg-500 mt-1">{formatNumber(transactionStats.total)} total transactions</p>
                    </Link>
                    
                    <Link href={route('admin.data-plans')} className="dashboard-card p-5 flex flex-col items-center text-center hover:scale-105 transition-transform">
                        <div className="rounded-full bg-yellow-100 p-3 mb-3">
                            <PhoneIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                        <h3 className="font-medium igg-800">Data Plans</h3>
                        <p className="text-xs igg-500 mt-1">Manage service offerings</p>
                    </Link>
                    
                    <Link href={route('admin.wallet-fundings')} className="dashboard-card p-5 flex flex-col items-center text-center hover:scale-105 transition-transform">
                        <div className="rounded-full bg-purple-100 p-3 mb-3">
                            <WalletIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="font-medium igg-800">Wallet Fundings</h3>
                        <p className="text-xs igg-500 mt-1">Manage user deposits</p>
                    </Link>
                </div>

                {/* Charts Section */}
                {/* <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Analytics Overview</h3>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setTimeRange('7days')}
                                className={`px-3 py-1 text-sm rounded-md ${timeRange === '7days' 
                                    ? 'bg-primary text-white' 
                                    : 'bg-base-200 mm--100 igg-700 hover:bg-base-200 mm--200'}`}
                            >
                                7 Days
                            </button>
                            <button 
                                onClick={() => setTimeRange('30days')}
                                className={`px-3 py-1 text-sm rounded-md ${timeRange === '30days' 
                                    ? 'bg-primary text-white' 
                                    : 'bg-base-200 mm--100 igg-700 hover:bg-base-200 mm--200'}`}
                            >
                                30 Days
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="dashboard-card">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium igg-800">Transactions Overview</h3>
                                <div className="flex items-center text-sm igg-500">
                                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                                    Last 7 days
                                </div>
                            </div>
                            {chartData?.transactionsChart && (
                                <Bar 
                                    data={chartData.transactionsChart}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                            },
                                            title: {
                                                display: false,
                                            },
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: {
                                                    drawBorder: false,
                                                }
                                            },
                                            x: {
                                                grid: {
                                                    display: false,
                                                }
                                            }
                                        }
                                    }}
                                    height={300}
                                />
                            )}
                        </div>
                        <div className="dashboard-card">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium igg-800">Revenue Trend</h3>
                                <div className="flex items-center text-sm igg-500">
                                    <BanknotesIcon className="h-4 w-4 mr-1" />
                                    Total: {formatCurrency(stats.totalRevenue)}
                                </div>
                            </div>
                            {chartData?.revenueChart && (
                                <Line 
                                    data={chartData.revenueChart}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                            },
                                            title: {
                                                display: false,
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: {
                                                    drawBorder: false,
                                                }
                                            },
                                            x: {
                                                grid: {
                                                    display: false,
                                                }
                                            }
                                        }
                                    }}
                                    height={300}
                                />
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="dashboard-card lg:col-span-2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium igg-800">User Growth</h3>
                                <div className="flex items-center text-sm igg-500">
                                    <UserGroupIcon className="h-4 w-4 mr-1" />
                                    New users
                                </div>
                            </div>
                            {chartData?.userGrowthChart && (
                                <Line 
                                    data={chartData.userGrowthChart}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                            },
                                            title: {
                                                display: false,
                                            },
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: {
                                                    drawBorder: false,
                                                }
                                            },
                                            x: {
                                                grid: {
                                                    display: false,
                                                }
                                            }
                                        }
                                    }}
                                    height={250}
                                />
                            )}
                        </div>
                        <div className="dashboard-card">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium igg-800">Transaction Types</h3>
                                <div className="flex items-center text-sm igg-500">
                                    <ChartBarIcon className="h-4 w-4 mr-1" />
                                    Distribution
                                </div>
                            </div>
                            <div className="flex justify-center" style={{ height: '250px' }}>
                                {chartData?.transactionTypesChart && (
                                    <Doughnut 
                                        data={chartData.transactionTypesChart}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: {
                                                        boxWidth: 12,
                                                        padding: 15
                                                    }
                                                },
                                                title: {
                                                    display: false,
                                                }, 
                                            },
                                            cutout: '70%'
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                 */}
                {/* User Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="dashboard-card">
                        <h3 className="font-medium igg-800 mb-4">User Distribution</h3>
                        <div style={{ height: '250px' }}>
                            <Pie
                                data={{
                                    labels: ['Regular Users', 'Agents', 'Admins'],
                                    datasets: [
                                        {
                                            data: [userStats.user, userStats.agent, userStats.admin],
                                            backgroundColor: [
                                                'rgba(59, 130, 246, 0.7)',
                                                'rgba(245, 158, 11, 0.7)',
                                                'rgba(239, 68, 68, 0.7)',
                                            ],
                                            borderColor: [
                                                'rgba(59, 130, 246, 1)',
                                                'rgba(245, 158, 11, 1)',
                                                'rgba(239, 68, 68, 1)',
                                            ],
                                            borderWidth: 1,
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                boxWidth: 12,
                                                padding: 15
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                    
                    <div className="dashboard-card lg:col-span-2">
                        <h3 className="font-medium igg-800 mb-4">Transaction Status</h3>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{formatNumber(transactionStats.successful)}</div>
                                <div className="text-sm text-green-800">Successful</div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-yellow-600">{formatNumber(transactionStats.pending)}</div>
                                <div className="text-sm text-yellow-800">Pending</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-red-600">{formatNumber(transactionStats.failed)}</div>
                                <div className="text-sm text-red-800">Failed</div>
                            </div>
                        </div>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                        Success Rate
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-green-600">
                                        {stats.successRate}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-base-200 mm--200">
                                <div style={{ width: `${stats.successRate}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* API Details Widget */}
                <div className="mb-6">
                    <ApiDetailsWidget apiDetails={apiDetails} />
                </div>

                {/* Recent Transactions */}
                <div className="dashboard-card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-medium igg-800">Recent Transactions</h3>
                        <Link 
                            href={route('admin.transactions')} 
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                        >
                            View All
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </Link>
                    </div>
                    <TransactionTable transactions={recentTransactions} />
                </div>
            </div>
        </AdminLayout>
    );
}