import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PinVerification from '@/Pages/User/PinVerification';
import {
    PhoneIcon,
    TvIcon,
    LightBulbIcon,
    WalletIcon,
    ArrowPathIcon,
    ClockIcon,
    CheckCircleIcon,
    PlusIcon,
    EyeSlashIcon,
    EyeIcon,
    WifiIcon,
    UserPlusIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function Dashboard({ auth, transactionStats, recentTransactions, serviceUsage }) {
    const { flash, errors } = usePage().props;
    const [showPinVerification, setShowPinVerification] = useState(false);
    const [showBalance, setShowBalance] = useState(false);
    
    useEffect(() => {
        // Check if there's a message about PIN verification
        if (errors?.pin_verification_required) {
            setShowPinVerification(true);
        }
    }, [errors]);

    // If PIN verification is needed, show the PIN verification component
    if (showPinVerification && !auth.user.isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50">
                <PinVerification 
                    onVerified={() => setShowPinVerification(false)}
                />
            </div>
        );
    }

    // Format wallet balance
    const formatBalance = (balance) => {
        return Number(balance || 0).toLocaleString('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2
        });
    };

    // Format amount
    const formatAmount = (amount) => {
        return Number(amount || 0).toLocaleString('en-NG', {
            minimumFractionDigits: 2
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Wallet Card */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                            <h3 className="text-lg font-medium text-white/90">Wallet Balance</h3>
                            <div className="mt-1 flex items-center">
                                <p className="text-3xl font-bold">
                                    {showBalance ? formatBalance(auth.user.wallet_balance) : '******'}
                                </p>
                                <button 
                                    onClick={() => setShowBalance(!showBalance)}
                                    className="ml-3 p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    {showBalance ? 
                                        <EyeSlashIcon className="h-5 w-5" /> : 
                                        <EyeIcon className="h-5 w-5" />
                                    }
                                </button>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <Link
                                href={route('wallet')}
                                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                                <PlusIcon className="h-5 w-5 mr-1" />
                                Fund Wallet
                            </Link>
                            <Link
                                href={route('wallet')}
                                className="inline-flex items-center px-4 py-2 bg-white/20 text-white hover:bg-white/30 rounded-lg text-sm font-medium transition-colors duration-200 border border-white/30"
                            >
                                <WalletIcon className="h-5 w-5 mr-1" />
                                Manage
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Buy Now Pay Later Banner */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full -ml-36 -mb-36"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex-1">
                            <h2 className="text-2xl md:text-3xl font-bold mb-2">
                                Buy Now, Pay Later
                            </h2>
                            <p className="text-white/90 text-lg mb-4">
                                <span className="font-semibold">We Got You Covered!</span>
                            </p>
                            <p className="text-white/80 mb-6 max-w-md">
                                Get airtime, data, or electricity now and repay in 30 days. 
                                No stress, just convenience with flexible payment terms.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    href={route('borrow.airtime')}
                                    className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                >
                                    <PhoneIcon className="h-5 w-5 mr-2" />
                                    Borrow Airtime
                                </Link>
                                <Link
                                    href={route('borrow.data')}
                                    className="inline-flex items-center justify-center px-5 py-2.5 bg-white/20 hover:bg-white/30 transition-colors duration-200 border border-white/30 rounded-lg"
                                >
                                    <WifiIcon className="h-5 w-5 mr-2" />
                                    Borrow Data
                                </Link>
                                <Link
                                    href={route('borrow.electricity')}
                                    className="inline-flex items-center justify-center px-5 py-2.5 bg-white/20 hover:bg-white/30 transition-colors duration-200 border border-white/30 rounded-lg"
                                >
                                    <LightBulbIcon className="h-5 w-5 mr-2" />
                                    Borrow Electricity
                                </Link>
                            </div>
                        </div>
                        <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-6xl md:text-7xl font-bold text-white/30 mb-2">
                                        +
                                    </div>
                                    <p className="text-white/60 text-sm font-medium">
                                        Available Now
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
                                <p className="mt-2 text-2xl font-semibold text-gray-900">{transactionStats?.total || 0}</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <ArrowPathIcon className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Total transactions made</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Successful</h3>
                                <p className="mt-2 text-2xl font-semibold text-gray-900">{transactionStats?.successful || 0}</p>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg">
                                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Completed transactions</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                                <p className="mt-2 text-2xl font-semibold text-gray-900">{transactionStats?.pending || 0}</p>
                            </div>
                            <div className="p-2 bg-yellow-50 rounded-lg">
                                <ClockIcon className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Awaiting confirmation</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Referrals</h3>
                                <p className="mt-2 text-2xl font-semibold text-gray-900">{transactionStats?.refe || 0}</p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <UserPlusIcon className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Total referrals</p>
                    </div>
                </div>

                {/* Total Spent This Month */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium text-white/90">Total Spent This Month</h3>
                            <p className="mt-1 text-3xl font-bold">
                                ₦{formatAmount(transactionStats?.total_amount || 0)}
                            </p>
                        </div>
                        <div>
                            <div className="rounded-full bg-white/20 p-3">
                                <ArrowTrendingUpIcon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link 
                            href={route('airtime')}
                            className="group p-5 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
                        >
                            <div className="rounded-full bg-blue-50 p-3 mb-3 group-hover:bg-blue-100">
                                <PhoneIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="font-medium text-gray-800">Buy Airtime</h3>
                            <p className="text-xs text-gray-500 mt-1">Recharge any network</p>
                        </Link>

                        <Link 
                            href={route('data')}
                            className="group p-5 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
                        >
                            <div className="rounded-full bg-green-50 p-3 mb-3 group-hover:bg-green-100">
                                <WifiIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="font-medium text-gray-800">Buy Data</h3>
                            <p className="text-xs text-gray-500 mt-1">Internet bundles</p>
                        </Link>

                        <Link 
                            href={route('cable')}
                            className="group p-5 border border-gray-200 rounded-lg hover:border-yellow-500 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
                        >
                            <div className="rounded-full bg-yellow-50 p-3 mb-3 group-hover:bg-yellow-100">
                                <TvIcon className="h-6 w-6 text-yellow-600" />
                            </div>
                            <h3 className="font-medium text-gray-800">Cable TV</h3>
                            <p className="text-xs text-gray-500 mt-1">Pay TV subscriptions</p>
                        </Link>

                        <Link 
                            href={route('electricity')}
                            className="group p-5 border border-gray-200 rounded-lg hover:border-red-500 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
                        >
                            <div className="rounded-full bg-red-50 p-3 mb-3 group-hover:bg-red-100">
                                <LightBulbIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="font-medium text-gray-800">Electricity</h3>
                            <p className="text-xs text-gray-500 mt-1">Pay electricity bills</p>
                        </Link>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-gray-800">Recent Transactions</h3>
                        <Link
                            href={route('transactions')}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                        >
                            View All
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </Link>
                    </div>

                    {recentTransactions && recentTransactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Reference
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {transaction.reference}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {transaction.type}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                ₦{formatAmount(transaction.amount)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    transaction.status === 'success' 
                                                        ? 'bg-green-100 text-green-800'
                                                        : transaction.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {transaction.created_at}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No recent transactions found</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}