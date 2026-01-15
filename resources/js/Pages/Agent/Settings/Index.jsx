import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
import { BellIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

export default function Settings({ auth, settings }) {
    const [settingsData, setSettingsData] = useState(settings);

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
        setSettingsData({
            ...settingsData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Submit settings update
    };

    return (
        <AgentLayout user={auth.user} header="Settings">
            <Head title="Settings" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-600 mt-2">Manage your account preferences and notifications</p>
                    </div>

                    {/* Settings Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Notification Settings */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center mb-4">
                                <BellIcon className="h-6 w-6 text-blue-600 mr-3" />
                                <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="notifications_enabled"
                                        checked={settingsData.notifications_enabled}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600"
                                    />
                                    <span className="ml-3 text-gray-700">Enable all notifications</span>
                                </label>

                                <label className="flex items-center">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                                    <input
                                        type="checkbox"
                                        name="email_notifications"
                                        checked={settingsData.email_notifications}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600"
                                    />
                                    <span className="ml-3 text-gray-700">Email notifications</span>
                                </label>

                                <label className="flex items-center">
                                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                                    <input
                                        type="checkbox"
                                        name="sms_notifications"
                                        checked={settingsData.sms_notifications}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600"
                                    />
                                    <span className="ml-3 text-gray-700">SMS notifications</span>
                                </label>
                            </div>
                        </div>

                        {/* Commission Settings */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Commission Rate</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Commission Rate (%)
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        name="commission_rate"
                                        value={settingsData.commission_rate}
                                        onChange={handleChange}
                                        disabled
                                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                    />
                                    <span className="ml-2 text-gray-700">% on all transactions</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Contact admin to change commission rate</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Save Changes
                            </button>
                            <button
                                type="reset"
                                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AgentLayout>
    );
}
