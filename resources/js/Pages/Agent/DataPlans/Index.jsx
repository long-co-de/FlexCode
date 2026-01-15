import { Head, Link } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
import { PhoneIcon, TvIcon, LightBulbIcon } from '@heroicons/react/24/outline';

export default function DataPlans({ auth, dataPlans }) {
    const formatNumber = (num) => {
        if (!num && num !== 0) return "0";
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const formatCurrency = (amount) => {
        return `₦${formatNumber(amount)}`;
    };

    const handleToggle = (planId) => {
        // Implement toggle logic
    };

    return (
        <AgentLayout user={auth.user} header="Data Plans Management">
            <Head title="Data Plans" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Data Plans</h1>
                        <p className="text-gray-600 mt-2">Manage available data plans for your agents and users</p>
                    </div>

                    {/* Data Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {dataPlans && dataPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`rounded-lg shadow-sm border p-6 transition-all ${plan.is_active
                                        ? 'bg-white border-gray-200 hover:shadow-md'
                                        : 'bg-gray-50 border-gray-300 opacity-75'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">Valid for {plan.validity}</p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${plan.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {plan.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(plan.price)}</p>
                                    <p className="text-xs text-gray-500 mt-1">Selling Price</p>
                                </div>

                                <button
                                    onClick={() => handleToggle(plan.id)}
                                    className={`w-full py-2 rounded-lg font-medium transition-colors ${plan.is_active
                                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                                        }`}
                                >
                                    {plan.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AgentLayout>
    );
}
