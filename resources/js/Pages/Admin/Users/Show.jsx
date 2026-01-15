import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import TransactionTable from '@/Components/TransactionTable';
import { PencilIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ShowUser({ auth, user, transactions }) {
    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">User Details</h2>}
        >
            <Head title="User Details" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={route('admin.users')} className="flex items-center text-primary-600 hover:text-primary-900">
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            Back to Users
                        </Link>
                    </div>

                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-medium iggyy-updatey-900 mb-4">User Information</h3>
                                <Link href={route('admin.users.edit', user.id)} className="btn-secondary">
                                    <PencilIcon className="h-4 w-4 mr-1" />
                                    Edit User
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Name</p>
                                        <p className="mt-1">{user.name}</p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Email</p>
                                        <p className="mt-1">{user.email}</p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Phone Number</p>
                                        <p className="mt-1">{user.phone_number || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Role</p>
                                        <p className="mt-1 capitalize">{user.role}</p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Wallet Balance</p>
                                        <p className="mt-1">₦{user.wallet_balance}</p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Status</p>
                                        <p className="mt-1">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                                {user.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Joined</p>
                                        <p className="mt-1">{new Date(user.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Transactions */}
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <h3 className="text-lg font-medium iggyy-updatey-900 mb-4">User Transactions</h3>
                            <TransactionTable transactions={transactions} />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
