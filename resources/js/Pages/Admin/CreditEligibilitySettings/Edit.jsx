import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const Edit = ({ setting }) => {
    const { data, setData, put, processing, errors } = useForm({
        min_credit_score: setting.min_credit_score,
        credit_limit_90_plus: setting.credit_limit_90_plus,
        credit_limit_80_89: setting.credit_limit_80_89,
        credit_limit_70_79: setting.credit_limit_70_79,
        credit_limit_60_69: setting.credit_limit_60_69,
        credit_limit_50_59: setting.credit_limit_50_59,
        credit_limit_40_49: setting.credit_limit_40_49,
        min_account_age_days: setting.min_account_age_days,
        min_transaction_count: setting.min_transaction_count,
        is_active: setting.is_active,
    });

    const serviceTypeLabel = {
        airtime: '📞 Airtime',
        data: '📱 Data',
        electricity: '⚡ Electricity',
        cable: '📺 Cable TV'
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.credit-eligibility-settings.update', setting.id));
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this setting? This action cannot be undone.')) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = route('admin.credit-eligibility-settings.destroy', setting.id);
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
            <Head title={`Edit ${serviceTypeLabel[setting.service_type]}`} />
            
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Edit {serviceTypeLabel[setting.service_type]}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Update credit score thresholds and limits
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Service Type Display */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Type
                            </label>
                            <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                                {serviceTypeLabel[setting.service_type]}
                            </div>
                        </div>

                        {/* Min Credit Score */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Credit Score *
                            </label>
                            <input
                                type="number"
                                value={data.min_credit_score}
                                onChange={(e) => setData('min_credit_score', parseInt(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.min_credit_score && (
                                <p className="text-red-600 text-sm mt-1">{errors.min_credit_score}</p>
                            )}
                        </div>

                        {/* Credit Limits Section */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Limits by Score Tier</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Score 90+ Limit (₦) *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.credit_limit_90_plus}
                                        onChange={(e) => setData('credit_limit_90_plus', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.credit_limit_90_plus && (
                                        <p className="text-red-600 text-sm mt-1">{errors.credit_limit_90_plus}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Score 80-89 Limit (₦) *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.credit_limit_80_89}
                                        onChange={(e) => setData('credit_limit_80_89', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.credit_limit_80_89 && (
                                        <p className="text-red-600 text-sm mt-1">{errors.credit_limit_80_89}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Score 70-79 Limit (₦) *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.credit_limit_70_79}
                                        onChange={(e) => setData('credit_limit_70_79', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.credit_limit_70_79 && (
                                        <p className="text-red-600 text-sm mt-1">{errors.credit_limit_70_79}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Score 60-69 Limit (₦) *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.credit_limit_60_69}
                                        onChange={(e) => setData('credit_limit_60_69', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.credit_limit_60_69 && (
                                        <p className="text-red-600 text-sm mt-1">{errors.credit_limit_60_69}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Score 50-59 Limit (₦) *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.credit_limit_50_59}
                                        onChange={(e) => setData('credit_limit_50_59', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.credit_limit_50_59 && (
                                        <p className="text-red-600 text-sm mt-1">{errors.credit_limit_50_59}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Score 40-49 Limit (₦) *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.credit_limit_40_49}
                                        onChange={(e) => setData('credit_limit_40_49', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.credit_limit_40_49 && (
                                        <p className="text-red-600 text-sm mt-1">{errors.credit_limit_40_49}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Account & Transaction Requirements */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Eligibility Requirements</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Account Age (days) *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.min_account_age_days}
                                        onChange={(e) => setData('min_account_age_days', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.min_account_age_days && (
                                        <p className="text-red-600 text-sm mt-1">{errors.min_account_age_days}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Transaction Count *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.min_transaction_count}
                                        onChange={(e) => setData('min_transaction_count', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.min_transaction_count && (
                                        <p className="text-red-600 text-sm mt-1">{errors.min_transaction_count}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Active Status */}
                        <div className="border-t pt-6 flex items-center">
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
                                href={route('admin.credit-eligibility-settings.index')}
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
