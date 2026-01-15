// File: resources/js/Components/Borrowing/BorrowingCard.jsx
import React from 'react';
import { Link } from '@inertiajs/react';

const BorrowingCard = ({ borrowing, onRepay, onDisableAutoDeduction, disabled }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: { color: 'bg-blue-100 text-blue-800', text: 'Active' },
            overdue: { color: 'bg-red-100 text-red-800', text: 'Overdue' },
            paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
            failed: { color: 'bg-gray-100 text-gray-800', text: 'Failed' }
        };
        
        const badge = badges[status] || badges.active;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                {badge.text}
            </span>
        );
    };

    const getServiceIcon = (type) => {
        const icons = {
            airtime: '📞',
            data: '📱',
            electricity: '⚡',
            cable: '📺'
        };
        return icons[type] || '💳';
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="text-2xl mr-3">
                            {getServiceIcon(borrowing.type)}
                        </div>
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {borrowing.type.charAt(0).toUpperCase() + borrowing.type.slice(1)} Borrowing
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Reference: {borrowing.reference}
                            </p>
                        </div>
                    </div>
                    <div>
                        {getStatusBadge(borrowing.status)}
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Amount Borrowed</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                            ₦{borrowing.amount.toLocaleString()}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Total Due</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                            ₦{borrowing.total_amount.toLocaleString()}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                        <dd className={`mt-1 text-sm font-medium ${borrowing.status === 'overdue' ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(borrowing.due_date)}
                            {borrowing.status === 'overdue' && ' (Overdue)'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Interest Rate</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                            {borrowing.interest_rate}%
                        </dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Service Details</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                            {typeof borrowing.service_details === 'object' 
                                ? JSON.stringify(borrowing.service_details, null, 2)
                                : borrowing.service_details}
                        </dd>
                    </div>
                </dl>
            </div>
            <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                <div className="flex justify-end space-x-3">
                    {borrowing.status === 'active' && borrowing.auto_deduction_enabled && (
                        <button
                            onClick={() => onDisableAutoDeduction(borrowing.id)}
                            disabled={disabled}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Disable Auto-Deduction
                        </button>
                    )}
                    {borrowing.status === 'active' && (
                        <button
                            onClick={() => onRepay(borrowing.id)}
                            disabled={disabled}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Pay Now
                        </button>
                    )}
                    <Link
                        href={`/borrow/${borrowing.id}/details`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BorrowingCard;