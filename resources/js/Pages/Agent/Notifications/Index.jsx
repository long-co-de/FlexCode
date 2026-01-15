import { Head, Link } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
import { BellIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Notifications({ auth, notifications }) {
    const handleDelete = (notificationId) => {
        // Implement delete logic
    };

    return (
        <AgentLayout user={auth.user} header="Notifications">
            <Head title="Notifications" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                        <p className="text-gray-600 mt-2">View and manage your notifications</p>
                    </div>

                    {/* Notifications List */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {notifications && notifications.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="p-6 hover:bg-gray-50 transition-colors flex items-start justify-between"
                                    >
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="rounded-full bg-blue-100 p-3 mt-1">
                                                <BellIcon className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                                                <p className="text-gray-600 mt-1">{notification.message}</p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {new Date(notification.created_at).toLocaleDateString()} at{' '}
                                                    {new Date(notification.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(notification.id)}
                                            className="text-red-600 hover:text-red-700 ml-4"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No notifications yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AgentLayout>
    );
}
