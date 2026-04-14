import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const Edit = ({ borrowSetting }) => {
    const { data, setData, put, processing, errors } = useForm({
        min_amount: borrowSetting.min_amount,
        max_amount: borrowSetting.max_amount,
        first_time_min_amount: borrowSetting.first_time_min_amount ?? 100,
        first_time_credit_limit: borrowSetting.first_time_credit_limit ?? 100,
        base_interest_rate: borrowSetting.base_interest_rate,
        good_credit_interest_rate: borrowSetting.good_credit_interest_rate,
        due_days: borrowSetting.due_days,
        is_active: borrowSetting.is_active,
    });

    const serviceTypeLabel = {
        airtime: '📞 Airtime',
        data: '📱 Data',
        electricity: '⚡ Electricity',
        cable: '📺 Cable TV'
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.borrow-settings.update', borrowSetting.id));
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this setting? This action cannot be undone.')) {
            // Need to create a delete form handler
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = route('admin.borrow-settings.destroy', borrowSetting.id);
            form.innerHTML = `
                <input type="hidden" name="_method" value="DELETE">
                <input type="hidden" name="_token" value="${document.querySelector('meta[name="csrf-token"]')?.content}">
            `;
            document.body.appendChild(form);
            form.submit();
        }
    };

    return (
        <AdminLayout>
            <Head title={`Edit ${serviceTypeLabel[borrowSetting.service_type]}`} />
            
            <div className="max-w-2xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Edit {serviceTypeLabel[borrowSetting.service_type]}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Update borrow limits and interest rates
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Service Type Display */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Type
                            </label>
                            <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                                {serviceTypeLabel[borrowSetting.service_type]}
                            </div>
                        </div>

                        {/* Min Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Amount (₦) *
                            </label>
                            <input
                                type="number"
                                value={data.min_amount}
                                onChange={(e) => setData('min_amount', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.min_amount && (
                                <p className="text-red-600 text-sm mt-1">{errors.min_amount}</p>
                            )}
                        </div>

                        {/* Max Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maximum Amount (₦) *
                            </label>
                            <input
                                type="number"
                                value={data.max_amount}
                                onChange={(e) => setData('max_amount', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.max_amount && (
                                <p className="text-red-600 text-sm mt-1">{errors.max_amount}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First-time Minimum (â‚¦) *
                                </label>
                                <input
                                    type="number"
                                    value={data.first_time_min_amount}
                                    onChange={(e) => setData('first_time_min_amount', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {errors.first_time_min_amount && (
                                    <p className="text-red-600 text-sm mt-1">{errors.first_time_min_amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First-time Credit Limit (â‚¦) *
                                </label>
                                <input
                                    type="number"
                                    value={data.first_time_credit_limit}
                                    onChange={(e) => setData('first_time_credit_limit', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {errors.first_time_credit_limit && (
                                    <p className="text-red-600 text-sm mt-1">{errors.first_time_credit_limit}</p>
                                )}
                            </div>
                        </div>

                        {/* Interest Rates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Base Interest Rate (%) *
                                </label>
                                <input
                                    type="number"
                                    value={data.base_interest_rate}
                                    onChange={(e) => setData('base_interest_rate', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {errors.base_interest_rate && (
                                    <p className="text-red-600 text-sm mt-1">{errors.base_interest_rate}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Good Credit Rate (%) *
                                </label>
                                <input
                                    type="number"
                                    value={data.good_credit_interest_rate}
                                    onChange={(e) => setData('good_credit_interest_rate', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {errors.good_credit_interest_rate && (
                                    <p className="text-red-600 text-sm mt-1">{errors.good_credit_interest_rate}</p>
                                )}
                            </div>
                        </div>

                        {/* Due Days */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Repayment Period (days) *
                            </label>
                            <input
                                type="number"
                                value={data.due_days}
                                onChange={(e) => setData('due_days', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.due_days && (
                                <p className="text-red-600 text-sm mt-1">{errors.due_days}</p>
                            )}
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <label className="ml-2 block text-sm text-gray-700">
                                Active (users can borrow this service)
                            </label>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 pt-4 border-t">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                            <a
                                href={route('admin.borrow-settings.index')}
                                className="flex-1 border border-gray-300 text-gray-700 hover:text-gray-900 font-medium py-2 px-4 rounded-lg text-center transition"
                            >
                                Cancel
                            </a>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
                            >
                                Delete
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Edit;
