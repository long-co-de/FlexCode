import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import TransactionTable from '@/Components/TransactionTable';
import {
    PencilIcon,
    ArrowLeftIcon,
    EnvelopeIcon,
    PhoneIcon,
    CurrencyDollarIcon,
    UserCircleIcon,
    CalendarIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function ShowUser({ auth, user, transactions }) {
    return (
        <AdminLayout
            user={auth.user}
            
        >
            <Head title={`${user.name} - User Details`} />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href={route('admin.users')}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 mb-2"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to Users
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        User Details
                    </h2>
                </div>
                <div className="mt-3 sm:mt-0 flex space-x-3">
                    <Link
                        href={route('admin.users.toggle-active', user.id)}
                        method="patch"
                        as="button"
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${user.is_active
                                ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:hover:bg-yellow-900/30'
                                : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30'
                            }`}
                    >
                        {user.is_active ? 'Disable User' : 'Enable User'}
                    </Link>
                    <Link
                        href={route('admin.users.edit', user.id)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-medium"
                    >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit User
                    </Link>
                </div>
            </div>
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* User Profile Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0">
                            {/* User Avatar and Basic Info */}
                            <div className="flex items-center space-x-4 flex-1">
                                <div className="relative">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                                        <UserCircleIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-white dark:border-gray-800 ${user.is_active ? 'bg-green-500' : 'bg-gray-400'
                                        }`} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {user.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full
                                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                                user.role === 'agent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            ID: {user.id}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto">
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                                    <div className="flex items-center space-x-2">
                                        <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                                        ₦{parseFloat(user.wallet_balance).toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                                    <div className="flex items-center space-x-2">
                                        <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined</span>
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-2">
                                        {new Date(user.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                                    <div className="flex items-center space-x-2">
                                        <ShieldCheckIcon className={`h-5 w-5 ${user.is_active
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-gray-600 dark:text-gray-400'
                                            }`} />
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                                    </div>
                                    <div className="text-lg font-semibold mt-2">
                                        <span className={`${user.is_active ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-400'}`}>
                                            {user.is_active ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Contact Information */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Contact Information
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0">
                                                <EnvelopeIcon className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
                                                <p className="mt-1 text-gray-900 dark:text-gray-100">{user.email}</p>
                                                <div className="mt-2">
                                                    <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded">
                                                        Verified
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0">
                                                <PhoneIcon className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                                                <p className="mt-1 text-gray-900 dark:text-gray-100">
                                                    {user.phone_number || (
                                                        <span className="text-gray-400 dark:text-gray-500 italic">
                                                            Not provided
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0">
                                                <UserCircleIcon className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">User Role</p>
                                                <div className="mt-1">
                                                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full inline-flex items-center
                                                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                                            user.role === 'agent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                                                        {user.role === 'admin' && <ShieldCheckIcon className="h-4 w-4 mr-2" />}
                                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0 text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Referrer</p>
                                                <div className="mt-1">
                                                    {user.referrer ? (
                                                        <Link 
                                                            href={route('admin.users.show', user.referrer.id)}
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                                                        >
                                                            {user.referrer.name} ({user.referrer.email})
                                                        </Link>
                                                    ) : (
                                                        <span className="text-gray-400 dark:text-gray-500 italic">None</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Referrals List */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-6">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Referred Users ({user.referrals?.length || 0})
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {user.referrals && user.referrals.length > 0 ? (
                                                user.referrals.map((referred) => (
                                                    <tr key={referred.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{referred.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{referred.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {new Date(referred.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <Link 
                                                                href={route('admin.users.show', referred.id)}
                                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                                                            >
                                                                View
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                                                        No referrals found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Account Status & Actions */}
                        <div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Account Status
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className={`p-4 rounded-lg ${user.is_active
                                                ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800/30'
                                                : 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/30'
                                            }`}>
                                            <div className="flex items-center">
                                                {user.is_active ? (
                                                    <ShieldCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                                                ) : (
                                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                                                )}
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    Account is {user.is_active ? 'Active' : 'Disabled'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                {user.is_active
                                                    ? 'This user can access all features and perform transactions.'
                                                    : 'This user account is currently disabled and cannot perform any actions.'}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                Quick Actions
                                            </h4>
                                            <div className="space-y-2">
                                                <Link
                                                    href={route('admin.users.edit', user.id)}
                                                    className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm"
                                                >
                                                    <PencilIcon className="h-4 w-4 mr-2" />
                                                    Edit Profile
                                                </Link>
                                                <Link
                                                    href={route('admin.users.toggle-active', user.id)}
                                                    method="patch"
                                                    as="button"
                                                    className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm w-full ${user.is_active
                                                            ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:hover:bg-yellow-900/30'
                                                            : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30'
                                                        }`}
                                                >
                                                    {user.is_active ? 'Disable Account' : 'Enable Account'}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Recent Transactions
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        All transactions made by {user.name}
                                    </p>
                                </div>
                                <div className="mt-3 sm:mt-0">
                                    <Link
                                        href={route('admin.transactions', { user_id: user.id })}
                                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                    >
                                        View all transactions →
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <TransactionTable 
                                    transactions={transactions} 
                                    viewRoute="admin.transactions.show"
                                />
                            </div>

                            {transactions.data && transactions.data.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                                        <CurrencyDollarIcon className="h-full w-full" />
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        No Transactions Found
                                    </h4>
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                                        This user hasn't made any transactions yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Information (Hidden on mobile) */}
                    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hidden lg:block">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                            Additional Information
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                                <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{user.id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                    {new Date(user.updated_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Account Created</p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Email Verified</p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">Yes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}