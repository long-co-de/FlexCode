import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardStats from '@/Components/DashboardStats';
import TransactionTable from '@/Components/TransactionTable';
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
    BanknotesIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ExclamationCircleIcon as ExclamationIcon
} from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard({ auth, stats, userStats, transactionStats, recentTransactions, borrowingStats, recentBorrowings, chartData }) {
    const [timeRange, setTimeRange] = useState('7days');

    // Format large numbers with commas
    const formatNumber = (num) => {
        if (!num && num !== 0) return "0";
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Format currency values
    const formatCurrency = (amount) => {
        return `₦${formatNumber(amount)}`;
    };

    return (
        <AdminLayout
            user={auth.user}
            header="Admin Dashboard"
        >
            <Head title="Admin Dashboard" />

            <div className="py-6">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg mb-6 overflow-hidden">
                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center">
                        <div className="text-white mb-4 sm:mb-0">
                            <h2 className="text-2xl font-bold">Welcome back, {auth.user.name}!</h2>
                            <p className="opacity-90 mt-1">Here's what's happening with your platform today.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link 
                                href={route('admin.notifications.index')} 
                                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                            >
                                <BellIcon className="h-5 w-5 mr-2" />
                                Send Notifications
                            </Link>
                            <Link 
                                href={route('admin.settings')} 
                                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                            >
                                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                                Settings
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <DashboardStats stats={stats} />

                {/* Quick Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Link 
                        href={route('admin.users')} 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                    >
                        <div className="rounded-full bg-blue-100 p-3 mb-3">
                            <UserGroupIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-medium text-gray-800">Manage Users</h3>
                        <p className="text-xs text-gray-500 mt-1">{formatNumber(userStats.total)} registered users</p>
                    </Link>

                    <Link 
                        href={route('admin.transactions')} 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                    >
                        <div className="rounded-full bg-green-100 p-3 mb-3">
                            <CreditCardIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-medium text-gray-800">Transactions</h3>
                        <p className="text-xs text-gray-500 mt-1">{formatNumber(transactionStats.total)} total transactions</p>
                    </Link>

                    <Link 
                        href={route('admin.data-plans')} 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                    >
                        <div className="rounded-full bg-yellow-100 p-3 mb-3">
                            <PhoneIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                        <h3 className="font-medium text-gray-800">Data Plans</h3>
                        <p className="text-xs text-gray-500 mt-1">Manage service offerings</p>
                    </Link>

                    <Link 
                        href={route('admin.wallet-fundings')} 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                    >
                        <div className="rounded-full bg-purple-100 p-3 mb-3">
                            <WalletIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="font-medium text-gray-800">Wallet Fundings</h3>
                        <p className="text-xs text-gray-500 mt-1">Manage user deposits</p>
                    </Link>
                </div>

                {/* Borrowing Stats Cards */}
                {borrowingStats && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-700 text-sm">Active Borrowings</h3>
                                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <p className="text-2xl font-bold text-blue-600">{formatNumber(borrowingStats.active_borrowings || 0)}</p>
                                <p className="text-xs text-gray-500 mt-1">Borrowings in progress</p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-700 text-sm">Overdue Borrowings</h3>
                                    <ExclamationIcon className="h-5 w-5 text-red-600" />
                                </div>
                                <p className="text-2xl font-bold text-red-600">{formatNumber(borrowingStats.overdue_borrowings || 0)}</p>
                                <p className="text-xs text-gray-500 mt-1">Past due date</p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-700 text-sm">Paid Borrowings</h3>
                                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                </div>
                                <p className="text-2xl font-bold text-green-600">{formatNumber(borrowingStats.paid_borrowings || 0)}</p>
                                <p className="text-xs text-gray-500 mt-1">Successfully repaid</p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-700 text-sm">Interest Generated</h3>
                                    <BanknotesIcon className="h-5 w-5 text-amber-600" />
                                </div>
                                <p className="text-2xl font-bold text-amber-600">₦{formatNumber(borrowingStats.total_interest_generated || 0)}</p>
                                <p className="text-xs text-gray-500 mt-1">Total interest earned</p>
                            </div>
                        </div>

                        {/* View All Borrowings Button */}
                        <div className="mb-6">
                            <Link 
                                href={route('admin.borrowings.index')}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                                <DocumentTextIcon className="h-5 w-5 mr-2" />
                                View All Borrowings ({formatNumber(borrowingStats.total_borrowings || 0)} total)
                            </Link>
                        </div>
                    </>
                )}

                {/* Charts Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-800">Analytics Overview</h3>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setTimeRange('7days')}
                                className={`px-3 py-1 text-sm rounded-md ${timeRange === '7days' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                7 Days
                            </button>
                            <button 
                                onClick={() => setTimeRange('30days')}
                                className={`px-3 py-1 text-sm rounded-md ${timeRange === '30days' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                30 Days
                            </button>
                        </div>
                    </div>
                    
                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Transactions Chart */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-medium text-gray-800">Transactions Overview</h3>
                                <div className="flex items-center text-sm text-gray-500">
                                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                                    Last 7 days
                                </div>
                            </div>
                            {chartData?.transactionsChart && (
                                <div className="h-[300px]">
                                    <Bar 
                                        data={chartData.transactionsChart}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'top',
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
                                    />
                                </div>
                            )}
                        </div>

                        {/* Revenue Chart */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-medium text-gray-800">Revenue Trend</h3>
                                <div className="flex items-center text-sm text-gray-500">
                                    <BanknotesIcon className="h-4 w-4 mr-1" />
                                    Total: {formatCurrency(stats.totalRevenue)}
                                </div>
                            </div>
                            {chartData?.revenueChart && (
                                <div className="h-[300px]">
                                    <Line 
                                        data={chartData.revenueChart}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'top',
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
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* User Growth Chart */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-medium text-gray-800">User Growth</h3>
                                <div className="flex items-center text-sm text-gray-500">
                                    <UserGroupIcon className="h-4 w-4 mr-1" />
                                    New users
                                </div>
                            </div>
                            {chartData?.userGrowthChart && (
                                <div className="h-[250px]">
                                    <Line 
                                        data={chartData.userGrowthChart}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'top',
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
                                    />
                                </div>
                            )}
                        </div>

                        {/* Transaction Types Chart */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-medium text-gray-800">Transaction Types</h3>
                                <div className="flex items-center text-sm text-gray-500">
                                    <ChartBarIcon className="h-4 w-4 mr-1" />
                                    Distribution
                                </div>
                            </div>
                            <div className="h-[250px]">
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
                                            },
                                            cutout: '70%'
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Distribution & Transaction Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* User Distribution */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="font-medium text-gray-800 mb-6">User Distribution</h3>
                        <div className="h-[250px]">
                            <Pie
                                data={{
                                    labels: ['Regular Users', 'Agents', 'Admins'],
                                    datasets: [
                                        {
                                            data: [userStats.user || 0, userStats.agent || 0, userStats.admin || 0],
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

                    {/* Transaction Status */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
                        <h3 className="font-medium text-gray-800 mb-6">Transaction Status</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{formatNumber(transactionStats.successful || 0)}</div>
                                <div className="text-sm text-green-800">Successful</div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-yellow-600">{formatNumber(transactionStats.pending || 0)}</div>
                                <div className="text-sm text-yellow-800">Pending</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-red-600">{formatNumber(transactionStats.failed || 0)}</div>
                                <div className="text-sm text-red-800">Failed</div>
                            </div>
                        </div>
                        <div className="pt-4">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                        Success Rate
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-green-600">
                                        {stats.successRate || 0}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                                <div 
                                    style={{ width: `${stats.successRate || 0}%` }} 
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Borrowings */}
                {recentBorrowings && recentBorrowings.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium text-gray-800">Recent Borrowings</h3>
                                <Link
                                    href={route('admin.borrowings.index')}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                                >
                                    View All Borrowings
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Ref</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-700">Total Due</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {recentBorrowings.map((borrowing) => (
                                        <tr key={borrowing.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 font-mono text-xs text-gray-600">{borrowing.reference}</td>
                                            <td className="py-3 px-4 text-gray-700">{borrowing.user?.name}</td>
                                            <td className="py-3 px-4 capitalize text-gray-700">{borrowing.type}</td>
                                            <td className="py-3 px-4 text-right font-medium text-gray-800">₦{formatNumber(borrowing.amount)}</td>
                                            <td className="py-3 px-4 text-right font-medium text-gray-800">₦{formatNumber(borrowing.total_amount)}</td>
                                            <td className="py-3 px-4 text-sm text-gray-700">{new Date(borrowing.due_date).toLocaleDateString()}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${borrowing.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                                        borrowing.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                                            borrowing.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {borrowing.status.charAt(0).toUpperCase() + borrowing.status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Recent Transactions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-800">Recent Transactions</h3>
                            <Link
                                href={route('admin.transactions')}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                            >
                                View All
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                    <TransactionTable transactions={recentTransactions} />
                </div>
            </div>
        </AdminLayout>
    );
}