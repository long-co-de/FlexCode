import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const Create = () => {
    const { data, setData, post, processing, errors } = useForm({
        service_type: '',
        min_credit_score: 50,
        credit_limit_90_plus: 50000,
        credit_limit_80_89: 25000,
        credit_limit_70_79: 15000,
        credit_limit_60_69: 10000,
        credit_limit_50_59: 5000,
        credit_limit_40_49: 2000,
        min_account_age_days: 7,
        min_transaction_count: 0,
        is_active: true,
    });

    const serviceTypes = [
        { value: 'airtime', label: '📞 Airtime' },
        { value: 'data', label: '📱 Data' },
        { value: 'electricity', label: '⚡ Electricity' },
        { value: 'cable', label: '📺 Cable TV' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.credit-eligibility-settings.store'));
    };

    return (
        <AdminLayout>
            <Head title="Create Credit Eligibility Setting" />
            
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Create Credit Eligibility Setting</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Set credit score thresholds and limits for a service type
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Service Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Type *
                            </label>
                            <select
                                value={data.service_type}
                                onChange={(e) => setData('service_type', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select a service type</option>
                                {serviceTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            {errors.service_type && (
                                <p className="text-red-600 text-sm mt-1">{errors.service_type}</p>
                            )}
                        </div>

                        {/* Min Credit Score */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Credit Score (0-100) *
                            </label>
                            <input
                                type="number"
                                value={data.min_credit_score}
                                onChange={(e) => setData('min_credit_score', parseInt(e.target.value))}
                                min="0"
                                max="100"
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
                                        step="1000"
                                        min="0"
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
                                        step="1000"
                                        min="0"
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
                                        step="1000"
                                        min="0"
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
                                        step="1000"
                                        min="0"
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
                                        step="1000"
                                        min="0"
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
                                        step="1000"
                                        min="0"
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
                                        min="0"
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
                                        min="0"
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

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-4 border-t">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
                            >
                                {processing ? 'Creating...' : 'Create Setting'}
                            </button>
                            <a
                                href={route('admin.credit-eligibility-settings.index')}
                                className="flex-1 border border-gray-300 text-gray-700 hover:text-gray-900 font-medium py-2 px-4 rounded-lg text-center transition"
                            >
                                Cancel
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Create;
