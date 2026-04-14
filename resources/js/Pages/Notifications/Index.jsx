import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { format, formatDistanceToNow } from 'date-fns';
import { 
    CheckCircleIcon, 
    ExclamationCircleIcon, 
    InformationCircleIcon, 
    BellIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon,
    EyeIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Notifications({ auth, notifications }) {
    const { post, delete: destroy, processing } = useForm();
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const markAsRead = (id) => {
        post(route('notifications.read', id));
    };

    const markAllAsRead = () => {
        post(route('notifications.read-all'));
    };

    const deleteNotification = (id) => {
        if (confirm('Are you sure you want to delete this notification?')) {
            destroy(route('notifications.destroy', id));
        }
    };

    const deleteAllNotifications = () => {
        if (confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
            destroy(route('notifications.destroy-all'));
        }
    };

    const sendTestNotification = () => {
        post(route('notifications.test'));
    };

    const openModal = (notification) => {
        setSelectedNotification(notification);
        setIsModalOpen(true);
        if (!notification.read_at) {
            markAsRead(notification.id);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedNotification(null);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="h-6 w-6 text-success" />;
            case 'error':
                return <ExclamationCircleIcon className="h-6 w-6 text-error" />;
            case 'warning':
                return <ExclamationCircleIcon className="h-6 w-6 text-warning" />;
            case 'info':
            default:
                return <InformationCircleIcon className="h-6 w-6 text-info" />;
        }
    };

    const getNotificationBadgeColor = (readAt) => {
        return readAt ? 'badge-ghost' : 'badge-primary';
    };

    const getNotificationCardClass = (readAt) => {
        return readAt 
            ? 'bg-base-100 border border-base-300' 
            : 'bg-primary/5 border-l-4 border-l-primary border border-base-300';
    };

    const formatDate = (date) => {
        const now = new Date();
        const notificationDate = new Date(date);
        const diffInHours = (now - notificationDate) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return formatDistanceToNow(notificationDate, { addSuffix: true });
        } else {
            return format(notificationDate, 'MMM d, yyyy h:mm a');
        }
    };

    // Modal Component
    const NotificationModal = () => {
        if (!selectedNotification) return null;

        return (
            <div className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-2xl bg-base-100 relative">
                    <button 
                        onClick={closeModal}
                        className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                    
                    <div className="flex items-start gap-4 mb-6">
                        <div className="flex-shrink-0">
                            {getNotificationIcon(selectedNotification.data.type || selectedNotification.data.notification_type)}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-base-content">
                                {selectedNotification.data.title || 'Transaction Notification'}
                            </h3>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="badge badge-sm gap-2">
                                    <ClockIcon className="h-3 w-3" />
                                    {formatDate(selectedNotification.created_at)}
                                </div>
                                {!selectedNotification.read_at && (
                                    <div className="badge badge-primary badge-sm gap-2">
                                        <CheckIcon className="h-3 w-3" />
                                        Unread
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="prose prose-sm max-w-none">
                        <p className="text-base-content/80 whitespace-pre-wrap">
                            {selectedNotification.data.message || selectedNotification.data.message}
                        </p>
                    </div>

                    {(selectedNotification.data.transaction_id || selectedNotification.data.action_url) && (
                        <>
                            <div className="divider"></div>
                            <div className="flex flex-wrap gap-3">
                                {selectedNotification.data.transaction_id && (
                                    <Link
                                        href={route('transactions.show', selectedNotification.data.transaction_id)}
                                        className="btn btn-primary btn-sm"
                                    >
                                        View Transaction Details
                                    </Link>
                                )}
                                {selectedNotification.data.action && selectedNotification.data.action_url && (
                                    <Link
                                        href={selectedNotification.data.action_url}
                                        className="btn btn-outline btn-sm"
                                    >
                                        {selectedNotification.data.action}
                                    </Link>
                                )}
                            </div>
                        </>
                    )}

                    <div className="modal-action">
                        <button onClick={closeModal} className="btn">
                            Close
                        </button>
                    </div>
                </div>
                <div className="modal-backdrop" onClick={closeModal}>
                    <button>close</button>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="font-bold text-2xl text-base-content leading-tight">Notifications</h2>
                        <p className="text-sm text-base-content/60 mt-1">
                            Stay updated with your latest activities and alerts
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {notifications.data.length > 0 && (
                            <>
                                <button
                                    onClick={markAllAsRead}
                                    disabled={processing}
                                    className="btn btn-outline btn-sm"
                                >
                                    {processing ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                        <CheckIcon className="h-4 w-4" />
                                    )}
                                    Mark All Read
                                </button>
                                <button
                                    onClick={deleteAllNotifications}
                                    disabled={processing}
                                    className="btn btn-outline btn-error btn-sm"
                                >
                                    {processing ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                        <TrashIcon className="h-4 w-4" />
                                    )}
                                    Delete All
                                </button>
                            </>
                        )}
                        <button
                            onClick={sendTestNotification}
                            disabled={processing}
                            className="btn btn-primary btn-sm"
                        >
                            {processing ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <BellIcon className="h-4 w-4" />
                            )}
                            Send Test
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Notifications" />

            <div className="py-6 lg:py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Stats Cards */}
                    {notifications.data.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                            <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-300">
                                <div className="stat-figure text-primary">
                                    <BellIcon className="h-6 w-6" />
                                </div>
                                <div className="stat-title text-base-content/60 text-xs">Total</div>
                                <div className="stat-value text-2xl text-base-content">{notifications.total}</div>
                            </div>
                            <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-300">
                                <div className="stat-figure text-info">
                                    <InformationCircleIcon className="h-6 w-6" />
                                </div>
                                <div className="stat-title text-base-content/60 text-xs">Unread</div>
                                <div className="stat-value text-2xl text-base-content">
                                    {notifications.data.filter(n => !n.read_at).length}
                                </div>
                            </div>
                            <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-300 hidden sm:flex">
                                <div className="stat-figure text-success">
                                    <CheckCircleIcon className="h-6 w-6" />
                                </div>
                                <div className="stat-title text-base-content/60 text-xs">Read</div>
                                <div className="stat-value text-2xl text-base-content">
                                    {notifications.data.filter(n => n.read_at).length}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications List */}
                    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
                        {notifications.data.length > 0 ? (
                            <div className="divide-y divide-base-300">
                                {notifications.data.map((notification) => (
                                    <div 
                                        key={notification.id} 
                                        className={`${getNotificationCardClass(notification.read_at)} p-4 sm:p-6 transition-all duration-200 hover:shadow-md cursor-pointer`}
                                        onClick={() => openModal(notification)}
                                    >
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            <div className="flex-shrink-0">
                                                {getNotificationIcon(notification.data.type || notification.data.notification_type)}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                                    <h3 className="text-base sm:text-lg font-semibold text-base-content">
                                                        {notification.data.title || 'Transaction Notification'}
                                                        {!notification.read_at && (
                                                            <span className="badge badge-primary badge-sm ml-2 sm:hidden">New</span>
                                                        )}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-base-content/50">
                                                        <span className="whitespace-nowrap">
                                                            {formatDate(notification.created_at)}
                                                        </span>
                                                        {!notification.read_at && (
                                                            <span className="badge badge-primary badge-sm hidden sm:inline-flex">Unread</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <p className="text-sm text-base-content/70 line-clamp-2 mb-3">
                                                    {notification.data.message || notification.data.message}
                                                </p>
                                                
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <button 
                                                        className="btn btn-xs btn-ghost gap-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openModal(notification);
                                                        }}
                                                    >
                                                        <EyeIcon className="h-3 w-3" />
                                                        View Details
                                                    </button>
                                                    
                                                    {!notification.read_at && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsRead(notification.id);
                                                            }}
                                                            className="btn btn-xs btn-ghost gap-1"
                                                        >
                                                            <CheckIcon className="h-3 w-3" />
                                                            Mark as Read
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotification(notification.id);
                                                        }}
                                                        className="btn btn-xs btn-ghost text-error gap-1"
                                                    >
                                                        <TrashIcon className="h-3 w-3" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-4">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-base-200 mb-6">
                                    <BellIcon className="h-10 w-10 text-base-content/40" />
                                </div>
                                <h3 className="text-lg font-semibold text-base-content mb-2">No notifications yet</h3>
                                <p className="text-sm text-base-content/60 mb-6 max-w-sm mx-auto">
                                    When you receive notifications, they'll appear here. Stay tuned for updates about your transactions and account activity.
                                </p>
                                <button
                                    onClick={sendTestNotification}
                                    className="btn btn-primary btn-sm gap-2"
                                >
                                    <ArrowPathIcon className="h-4 w-4" />
                                    Send Test Notification
                                </button>
                            </div>
                        )}
                        
                        {/* Pagination */}
                        {notifications.data.length > 0 && notifications.last_page > 1 && (
                            <div className="px-4 sm:px-6 py-4 border-t border-base-300 bg-base-200/50">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-base-content/60">
                                        Showing {notifications.from} to {notifications.to} of {notifications.total}
                                    </div>
                                    <div className="join">
                                        {notifications.links.prev && (
                                            <Link
                                                href={notifications.links.prev}
                                                className="join-item btn btn-sm btn-outline"
                                            >
                                                « Previous
                                            </Link>
                                        )}
                                        {notifications.links.next && (
                                            <Link
                                                href={notifications.links.next}
                                                className="join-item btn btn-sm btn-outline"
                                            >
                                                Next »
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <NotificationModal />
        </AuthenticatedLayout>
    );
}

// Helper component for ClockIcon (if not already imported)
const ClockIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);