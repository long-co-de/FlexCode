import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const Index = ({ settings }) => {
    const serviceTypeLabel = {
        airtime: '📞 Airtime',
        data: '📱 Data',
        electricity: '⚡ Electricity',
        cable: '📺 Cable TV'
    };

    return (
        <AdminLayout>
            <Head title="Credit Eligibility Settings" />
            
            <div className="max-w-6xl mx-auto py-8 px-4">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Credit Eligibility Settings</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Manage credit score thresholds and limits for each service type
                        </p>
                    </div>
                    <Link
                        href={route('admin.credit-eligibility-settings.create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                        + Add New Setting
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Service Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Min Credit Score
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Credit Limit (90+)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Credit Limit (80-89)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Min Account Age
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
                            {settings.length > 0 ? (
                                settings.map((setting) => (
                                    <tr key={setting.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {serviceTypeLabel[setting.service_type] || setting.service_type}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                {setting.min_credit_score}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                ₦{parseFloat(setting.credit_limit_90_plus).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                ₦{parseFloat(setting.credit_limit_80_89).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                {setting.min_account_age_days} days
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
                                                href={route('admin.credit-eligibility-settings.edit', { credit_eligibility_setting: setting.id })}
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
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        No credit eligibility settings found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-3">About Credit Eligibility Settings</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>• <strong>Min Credit Score:</strong> Minimum score required to be eligible for borrowing</li>
                        <li>• <strong>Credit Limits:</strong> Maximum borrowing amount based on credit score tier (90+, 80-89, 70-79, etc.)</li>
                        <li>• <strong>Min Account Age:</strong> Minimum days account must exist before user can borrow</li>
                        <li>• <strong>Min Transaction Count:</strong> Minimum successful transactions required</li>
                        <li>• <strong>Status:</strong> When inactive, users cannot borrow that service type</li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Index;
