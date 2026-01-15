// File: resources/js/Pages/User/Borrow/MyBorrowings.jsx
import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import BorrowingCard from '@/Components/BorrowingCard';
const Layout = AppLayout;
const MyBorrowings = ({ borrowings, eligibility }) => {
    const [activeTab, setActiveTab] = useState('active');
    const [processing, setProcessing] = useState(false);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const response = await axios.get(route('borrowing.summary'));
            setSummary(response.data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const handleRepay = async (borrowingId) => {
        if (processing) return;
        
        if (!confirm('Are you sure you want to repay this borrowing now?')) return;
        
        setProcessing(true);
        try {
            const response = await axios.post(route('borrow.repay', borrowingId));
            if (response.data.success) {
                alert('Repayment successful!');
                window.location.reload();
            }
        } catch (error) {
            console.error('Error repaying:', error);
            alert(error.response?.data?.message || 'Failed to process repayment');
        } finally {
            setProcessing(false);
        }
    };

    const handleDisableAutoDeduction = async (borrowingId) => {
        if (processing) return;
        
        if (!confirm('Are you sure you want to disable auto-deduction? You will need to make manual payments.')) return;
        
        setProcessing(true);
        try {
            const response = await axios.post(route('borrow.disable-auto-deduction', borrowingId));
            if (response.data.success) {
                alert('Auto-deduction disabled');
                window.location.reload();
            }
        } catch (error) {
            console.error('Error disabling auto-deduction:', error);
            alert(error.response?.data?.message || 'Failed to disable auto-deduction');
        } finally {
            setProcessing(false);
        }
    };

    const filteredBorrowings = borrowings.data.filter(borrowing => {
        if (activeTab === 'active') return borrowing.status === 'active';
        if (activeTab === 'overdue') return borrowing.status === 'overdue';
        if (activeTab === 'paid') return borrowing.status === 'paid';
        return true;
    });

    return (
        <Layout>
            <Head title="My Borrowings" />
            
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Borrowings</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        View and manage your borrowed airtime, data, and bills
                    </p>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Available Credit</dt>
                                            <dd className="text-lg font-semibold text-gray-900">
                                                ₦{eligibility?.available_credit?.toLocaleString() || '0'}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Repaid</dt>
                                            <dd className="text-lg font-semibold text-gray-900">
                                                ₦{summary.total_repaid.toLocaleString()}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Active Borrowings</dt>
                                            <dd className="text-lg font-semibold text-gray-900">
                                                {summary.active_borrowings}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                                            <dd className="text-lg font-semibold text-gray-900">
                                                {summary.overdue_borrowings}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Eligibility Banner */}
                {eligibility && (
                    <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-blue-800">Borrowing Status</h3>
                                <div className="mt-1 text-sm text-gray-600">
                                    <p>Credit Limit: ₦{eligibility.credit_limit.toLocaleString()}</p>
                                    <p>Available Credit: ₦{eligibility.available_credit.toLocaleString()}</p>
                                    <p>Credit Score: {eligibility.credit_score}/100</p>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <Link
                                    href={route('borrow.data')}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    Borrow Data
                                </Link>
                                <Link
                                    href={route('borrow.airtime')}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    Borrow Airtime
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'active'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Active ({borrowings.data.filter(b => b.status === 'active').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('overdue')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overdue'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Overdue ({borrowings.data.filter(b => b.status === 'overdue').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('paid')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'paid'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Paid ({borrowings.data.filter(b => b.status === 'paid').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                                    ? 'border-gray-500 text-gray-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            All ({borrowings.data.length})
                        </button>
                    </nav>
                </div>

                {/* Borrowings List */}
                {filteredBorrowings.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No borrowings</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {activeTab === 'active' && "You don't have any active borrowings."}
                            {activeTab === 'overdue' && "You don't have any overdue borrowings."}
                            {activeTab === 'paid' && "You haven't repaid any borrowings yet."}
                            {activeTab === 'all' && "You haven't borrowed anything yet."}
                        </p>
                        <div className="mt-6">
                            <Link
                                href={route('borrow.data')}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                Start Borrowing
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBorrowings.map((borrowing) => (
                            <BorrowingCard
                                key={borrowing.id}
                                borrowing={borrowing}
                                onRepay={handleRepay}
                                onDisableAutoDeduction={handleDisableAutoDeduction}
                                disabled={processing}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {borrowings.links && borrowings.links.length > 3 && (
                    <div className="mt-8">
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            {borrowings.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${link.active
                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                        } ${index === 0 ? 'rounded-l-md' : ''} ${index === borrowings.links.length - 1 ? 'rounded-r-md' : ''
                                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default MyBorrowings;