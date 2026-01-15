import React, { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import { 
    BellIcon, 
    CheckCircleIcon, 
    ExclamationCircleIcon, 
    InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(route('notifications.latest-unread'));
            setNotifications(response.data.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get(route('notifications.unread-count'));
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.post(route('notifications.read', id));
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.post(route('notifications.read-all'));
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        
        // Set up polling for notifications
        const interval = setInterval(() => {
            if (!isOpen) {
                fetchUnreadCount();
            }
        }, 30000); // Poll every 30 seconds
        
        return () => clearInterval(interval);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'error':
                return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
            case 'warning':
                return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
            case 'info':
            default:
                return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-1 rounded-full igg-600 hover:igg-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white text-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-base-100 -ws ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium igg-900">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-indigo-600 hover:text-indigo-500"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div key={notification.id} className="px-4 py-3 hover:bg-base-200 mm--50">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 mr-3">
                                                {getNotificationIcon(notification.data.type || notification.data.notification_type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium igg-900 truncate">
                                                    {notification.data.title || 'Transaction Notification'}
                                                </p>
                                                <p className="text-sm igg-500 truncate">
                                                    {notification.data.message}
                                                </p>
                                                <p className="text-xs igg-400 mt-1">
                                                    {notification.created_at}
                                                </p>
                                                <div className="mt-1 flex space-x-2">
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-xs text-indigo-600 hover:text-indigo-500"
                                                    >
                                                        Mark as read
                                                    </button>
                                                    {(notification.data.action && notification.data.action_url) && (
                                                        <Link
                                                            href={notification.data.action_url}
                                                            className="text-xs text-indigo-600 hover:text-indigo-500"
                                                            onClick={() => markAsRead(notification.id)}
                                                        >
                                                            {notification.data.action}
                                                        </Link>
                                                    )}
                                                    {notification.data.transaction_id && (
                                                        <Link
                                                            href={route('transactions.show', notification.data.transaction_id)}
                                                            className="text-xs text-indigo-600 hover:text-indigo-500"
                                                            onClick={() => markAsRead(notification.id)}
                                                        >
                                                            View Transaction
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-6 text-center">
                                    <p className="text-sm igg-500">No new notifications</p>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 px-4 py-2">
                            <Link
                                href={route('notifications.index')}
                                className="block text-center text-sm text-indigo-600 hover:text-indigo-500"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}