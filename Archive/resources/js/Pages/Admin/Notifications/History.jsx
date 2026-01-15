import { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Pagination from "@/Components/Pagination";
import { format } from "date-fns";
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    BellIcon,
} from "@heroicons/react/24/outline";

export default function NotificationHistory({ auth, notifications }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredNotifications = notifications.data.filter((notification) => {
        // notification.data = JSON.parse(notification.data) ?? notification.data;
        console.log(notification.data);
        notification.data?.title
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ||
            notification.data?.message
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase());

    });

    const getNotificationIcon = (type) => {
        switch (type) {
            case "success":
                return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
            case "error":
                return (
                    <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
                );
            case "warning":
                return (
                    <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" />
                );
            case "info":
            default:
                return (
                    <InformationCircleIcon className="h-6 w-6 text-blue-500" />
                );
        }
    };

    return (
        <AdminLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl igg-800 leading-tight">
                    Notification History
                </h2>
            }
        >
            <Head title="Notification History" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 -ws border-b border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        placeholder="Search notifications..."
                                        className="border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md shadow-sm"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>
                                <Link
                                    href={route("admin.notifications.index")}
                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                                >
                                    Send New Notification
                                </Link>
                            </div>

                            {filteredNotifications.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredNotifications.map(
                                        (notification) => (
                                            <div
                                                key={notification.id}
                                                className="p-4 rounded-lg shadow border border-gray-200 flex items-start"
                                            >
                                                <div className="flex-shrink-0 mr-4">
                                                    {getNotificationIcon(
                                                        notification.data.type
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <h3 className="text-lg font-medium igg-900">
                                                            {
                                                                notification
                                                                    .data.title
                                                            }
                                                        </h3>
                                                        <span className="text-sm igg-500">
                                                            {format(
                                                                new Date(
                                                                    notification.created_at
                                                                ),
                                                                "MMM dd, yyyy HH:mm"
                                                            )}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm igg-600">
                                                        {
                                                            notification.data
                                                                .message
                                                        }
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            Type:{" "}
                                                            {
                                                                notification
                                                                    .data.type
                                                            }
                                                        </span>
                                                        {notification.data
                                                            .target && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                Target:{" "}
                                                                {
                                                                    notification
                                                                        .data
                                                                        .target
                                                                }
                                                            </span>
                                                        )}
                                                        {notification.data
                                                            .action && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Action:{" "}
                                                                {
                                                                    notification
                                                                        .data
                                                                        .action
                                                                }
                                                            </span>
                                                        )}
                                                        {notification.data
                                                            .sent_count && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                Sent to:{" "}
                                                                {
                                                                    notification
                                                                        .data
                                                                        .sent_count
                                                                }{" "}
                                                                users
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <BellIcon className="mx-auto h-12 w-12 igg-400" />
                                    <h3 className="mt-2 text-lg font-medium igg-900">
                                        No notifications found
                                    </h3>
                                    <p className="mt-1 text-sm igg-500">
                                        No notifications match your search
                                        criteria.
                                    </p>
                                </div>
                            )}

                            <div className="mt-6">
                                <Pagination links={notifications.links} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
