import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const Success = ({ borrowing }) => {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const serviceTypeIcon = {
        airtime: '📞',
        data: '📱',
        electricity: '⚡',
        cable: '📺'
    };

    return (
        <AppLayout>
            <Head title="Borrowing Successful" />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Success Card */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        {/* Success Header */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Borrowing Successful!
                            </h1>
                            <p className="text-green-100">
                                Your {borrowing.type} has been successfully borrowed
                            </p>
                        </div>

                        {/* Borrowing Details */}
                        <div className="px-6 py-8 space-y-6">
                            {/* Service Summary */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className="text-4xl">
                                            {serviceTypeIcon[borrowing.type] || '💳'}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                                {borrowing.type} Borrowed
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Reference: <span className="font-mono font-medium">{borrowing.reference}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Amount Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Amount Borrowed</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        ₦{borrowing.amount.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Interest Rate</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {borrowing.interest_rate}%
                                    </p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Interest Amount</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">
                                        ₦{Math.round(borrowing.amount * borrowing.interest_rate / 100).toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-500">
                                    <p className="text-sm text-gray-600">Total Due</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">
                                        ₦{borrowing.total_amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
                                <p className="text-sm font-medium text-gray-900 mb-1">Repayment Due Date</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {formatDate(borrowing.due_date)}
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                    ⚠️ Please ensure you have funds available on or before the due date for automatic repayment
                                </p>
                            </div>

                            {/* Auto-Deduction Notice */}
                            {borrowing.auto_deduction_enabled && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-green-900">Auto-Deduction Enabled</p>
                                            <p className="text-sm text-green-700 mt-1">
                                                Your linked card will be automatically charged on the due date
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Service Details */}
                            <div className="border-t pt-6">
                                <h4 className="font-semibold text-gray-900 mb-3">Service Details</h4>
                                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                                    {borrowing.type === 'airtime' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Network:</span>
                                                <span className="font-medium">{borrowing.transaction_details?.network || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Phone Number:</span>
                                                <span className="font-mono font-medium">{borrowing.transaction_details?.phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    )}
                                    {borrowing.type === 'data' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Network:</span>
                                                <span className="font-medium">{borrowing.transaction_details?.network || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Phone Number:</span>
                                                <span className="font-mono font-medium">{borrowing.transaction_details?.phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    )}
                                    {borrowing.type === 'electricity' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Meter Number:</span>
                                                <span className="font-mono font-medium">{borrowing.transaction_details?.meter || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Provider:</span>
                                                <span className="font-medium">{borrowing.transaction_details?.provider || 'N/A'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <Link
                                    href={route('borrow.my-borrowings')}
                                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg text-center transition"
                                >
                                    View My Borrowings
                                </Link>
                                <Link
                                    href={route('dashboard')}
                                    className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg text-center transition"
                                >
                                    Back to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">Need help?</p>
                        <p className="text-gray-700">
                            For questions about your borrowing or repayment, please visit the
                            <Link href={route('contact')} className="text-blue-600 hover:text-blue-800 font-medium mx-1">
                                contact page
                            </Link>
                            or chat with our support team.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Success;
