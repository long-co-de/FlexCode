import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    DocumentTextIcon,
    CheckCircleIcon,
    ExclamationCircleIcon as ExclamationIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function BorrowingsIndex({ borrowings, stats, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [type, setType] = useState(filters.type || 'all');

    const handleFilter = () => {
        router.get(route('admin.borrowings.index'), {
            search,
            status,
            type,
        }, { preserveState: true });
    };

    const formatCurrency = (amount) => {
        return `₦${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-blue-100 text-blue-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'airtime':
                return '📞';
            case 'data':
                return '📱';
            case 'electricity':
                return '⚡';
            case 'cable':
                return '📺';
            default:
                return '💳';
        }
    };

    return (
        <AdminLayout
            user={null}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Borrowings Management</h2>}
        >
            <Head title="Borrowings" />

            <div className="py-6">
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="dashboard-card p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium igg-700 text-sm">Total Borrowings</h3>
                            <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-blue-600 mt-2">{stats.total}</p>
                    </div>

                    <div className="dashboard-card p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium igg-700 text-sm">Active</h3>
                            <ArrowPathIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-purple-600 mt-2">{stats.active}</p>
                    </div>

                    <div className="dashboard-card p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium igg-700 text-sm">Overdue</h3>
                            <ExclamationIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="text-2xl font-bold text-red-600 mt-2">{stats.overdue}</p>
                    </div>

                    <div className="dashboard-card p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium igg-700 text-sm">Paid</h3>
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-600 mt-2">{stats.paid}</p>
                    </div>

                    <div className="dashboard-card p-5">
                        <h3 className="font-medium igg-700 text-sm">Total Due</h3>
                        <p className="text-2xl font-bold text-amber-600 mt-2">{formatCurrency(stats.total_due)}</p>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="dashboard-card p-6 mb-6">
                    <h3 className="text-lg font-medium igg-800 mb-4">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium igg-700 mb-2">Search</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by ref, name, email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium igg-700 mb-2">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="overdue">Overdue</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium igg-700 mb-2">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Types</option>
                                <option value="airtime">Airtime</option>
                                <option value="data">Data</option>
                                <option value="electricity">Electricity</option>
                                <option value="cable">Cable</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleFilter}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Borrowings Table */}
                <div className="dashboard-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-base-200 mm--100">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium igg-700">Reference</th>
                                    <th className="text-left py-3 px-4 font-medium igg-700">User</th>
                                    <th className="text-left py-3 px-4 font-medium igg-700">Type</th>
                                    <th className="text-right py-3 px-4 font-medium igg-700">Amount</th>
                                    <th className="text-right py-3 px-4 font-medium igg-700">Total Due</th>
                                    <th className="text-left py-3 px-4 font-medium igg-700">Due Date</th>
                                    <th className="text-left py-3 px-4 font-medium igg-700">Status</th>
                                    <th className="text-center py-3 px-4 font-medium igg-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {borrowings.data && borrowings.data.length > 0 ? (
                                    borrowings.data.map((borrowing) => (
                                        <tr key={borrowing.id} className="hover:bg-base-50 transition">
                                            <td className="py-3 px-4 font-mono text-xs text-blue-600 font-medium">{borrowing.reference}</td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium igg-800">{borrowing.user?.name ?? "N/A"}</div>
                                                <div className="text-xs igg-500">{borrowing.user?.email ?? "N/A"}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-lg mr-2">{getTypeIcon(borrowing.type)}</span>
                                                <span className="capitalize font-medium">{borrowing.type}</span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium">{formatCurrency(borrowing.amount)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-primary-600">{formatCurrency(borrowing.total_amount)}</td>
                                            <td className="py-3 px-4 text-sm">{formatDate(borrowing.due_date)}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(borrowing.status)}`}>
                                                    {borrowing.status.charAt(0).toUpperCase() + borrowing.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Link
                                                    href={route('admin.borrowings.show', borrowing.id)}
                                                    className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="py-8 text-center igg-500">
                                            No borrowings found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {borrowings.links && borrowings.links.length > 3 && (
                        <div className="border-t p-4 flex items-center justify-between">
                            <div className="text-sm igg-600">
                                Showing {borrowings.from} to {borrowings.to} of {borrowings.total} results
                            </div>
                            <div className="flex space-x-2">
                                {borrowings.links.map((link, index) => (
                                    link.url ? (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className={`px-3 py-2 rounded border ${link.active
                                                    ? 'bg-primary-600 text-white border-primary-600'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span key={index} className="px-3 py-2 text-gray-500">{link.label}</span>
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
