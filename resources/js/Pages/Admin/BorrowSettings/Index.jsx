import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const Index = ({ borrowSettings }) => {
    const serviceTypeLabel = {
        airtime: '📞 Airtime',
        data: '📱 Data',
        electricity: '⚡ Electricity',
        cable: '📺 Cable TV'
    };

    return (
        <AdminLayout>
            <Head title="Borrow Settings" />
            
            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Borrow Settings</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Manage minimum and maximum borrow amounts, interest rates, and repayment periods
                        </p>
                    </div>
                    <Link
                        href={route('admin.borrow-settings.create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                        + Add New Setting
                    </Link>
                </div>

                {/* Settings Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Service Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Min - Max Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    First-time Rules
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Interest Rate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Good Credit Rate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Due Days
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {borrowSettings.length > 0 ? (
                                borrowSettings.map((setting) => (
                                    <tr key={setting.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {serviceTypeLabel[setting.service_type] || setting.service_type}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                NGN {Number(setting.min_amount ?? 0).toLocaleString()} - NGN {Number(setting.max_amount ?? 0).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                Min: NGN {Number(setting.first_time_min_amount ?? 0).toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Credit: NGN {Number(setting.first_time_credit_limit ?? 0).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                {setting.base_interest_rate}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                {setting.good_credit_interest_rate}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                {setting.due_days} days
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                setting.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {setting.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <Link
                                                href={route('admin.borrow-settings.edit', setting.id)}
                                                className="text-blue-600 hover:text-blue-900 font-medium"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this setting?')) {
                                                        // Will need to handle deletion via form
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-900 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                        No borrow settings found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Info Card */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-3">About Borrow Settings</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>• <strong>Min/Max Amount:</strong> The range users can borrow for each service type</li>
                        <li>• <strong>First-time Rules:</strong> Minimum request amount and first-time credit limit per service</li>
                        <li>• <strong>Interest Rate:</strong> The percentage charged on borrowed amount (base rate)</li>
                        <li>• <strong>Good Credit Rate:</strong> Lower interest rate for users with credit score ≥ 80</li>
                        <li>• <strong>Due Days:</strong> Number of days users have to repay the borrowed amount</li>
                        <li>• <strong>Status:</strong> When inactive, users cannot borrow that service type</li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Index;



