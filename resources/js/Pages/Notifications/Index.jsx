import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { format, formatDistanceToNow } from 'date-fns';
import { 
    CheckCircleIcon, 
    ExclamationCircleIcon, 
    InformationCircleIcon, 
    BellIcon,
    TrashIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

export default function Notifications({ auth, notifications }) {
    const { post, delete: destroy } = useForm();

    const markAsRead = (id) => {
        post(route('notifications.read', id));
    };

    const markAllAsRead = () => {
        post(route('notifications.read-all'));
    };

    const deleteNotification = (id) => {
        destroy(route('notifications.destroy', id));
    };

    const deleteAllNotifications = () => {
        destroy(route('notifications.destroy-all'));
    };

    const sendTestNotification = () => {
        post(route('notifications.test'));
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
            case 'error':
                return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />;
            case 'warning':
                return <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" />;
            case 'info':
            default:
                return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
        }
    };

    const getNotificationBgColor = (readAt) => {
        return readAt ? 'bg-base-100 -ws' : 'bg-blue-50';
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl igg-800 leading-tight">Notifications</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={markAllAsRead}
                            className="inline-flex items-center px-4 py-2 bg-base-200 mm--800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-base-200 mm--700 focus:bg-base-200 mm--700 active:bg-base-200 mm--900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Mark All as Read
                        </button>
                        <button
                            onClick={deleteAllNotifications}
                            className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-500 focus:bg-red-500 active:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete All
                        </button>
                        <button
                            onClick={sendTestNotification}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-500 focus:bg-indigo-500 active:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            <BellIcon className="h-4 w-4 mr-2" />
                            Send Test
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Notifications" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 igg-900">
                            {notifications.data.length > 0 ? (
                                <div className="space-y-4">
                                    {notifications.data.map((notification) => (
                                        <div 
                                            key={notification.id} 
                                            className={`${getNotificationBgColor(notification.read_at)} p-4 rounded-lg shadow border border-gray-200 flex items-start justify-between`}
                                        >
                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0">
                                                    {getNotificationIcon(notification.data.type || notification.data.notification_type)}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium igg-900">
                                                        {notification.data.title || 'Transaction Notification'}
                                                    </h3>
                                                    <p className="mt-1 text-sm igg-600">
                                                        {notification.data.message || notification.data.message}
                                                    </p>
                                                    {notification.data.transaction_id && (
                                                        <div className="mt-2">
                                                            <Link
                                                                href={route('transactions.show', notification.data.transaction_id)}
                                                                className="text-sm text-indigo-600 hover:text-indigo-500"
                                                            >
                                                                View Transaction
                                                            </Link>
                                                        </div>
                                                    )}
                                                    {notification.data.action && notification.data.action_url && (
                                                        <div className="mt-2">
                                                            <Link
                                                                href={notification.data.action_url}
                                                                className="text-sm text-indigo-600 hover:text-indigo-500"
                                                            >
                                                                {notification.data.action}
                                                            </Link>
                                                        </div>
                                                    )}
                                                    <p className="mt-1 text-xs igg-500">
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                {!notification.read_at && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-xs text-blue-600 hover:text-blue-500"
                                                    >
                                                        Mark as Read
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="text-xs text-red-600 hover:text-red-500"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <BellIcon className="mx-auto h-12 w-12 igg-400" />
                                    <h3 className="mt-2 text-lg font-medium igg-900">No notifications</h3>
                                    <p className="mt-1 text-sm igg-500">You don't have any notifications at the moment.</p>
                                    <div className="mt-6">
                                        <button
                                            onClick={sendTestNotification}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Send Test Notification
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {notifications.data.length > 0 && (
                                <div className="mt-6">
                                    <nav className="flex items-center justify-between">
                                        <div className="flex-1 flex justify-between">
                                            {notifications.links.prev && (
                                                <Link
                                                    href={notifications.links.prev}
                                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md igg-700 bg-base-100 -ws hover:bg-base-200 mm--50"
                                                >
                                                    Previous
                                                </Link>
                                            )}
                                            {notifications.links.next && (
                                                <Link
                                                    href={notifications.links.next}
                                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md igg-700 bg-base-100 -ws hover:bg-base-200 mm--50"
                                                >
                                                    Next
                                                </Link>
                                            )}
                                        </div>
                                    </nav>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}