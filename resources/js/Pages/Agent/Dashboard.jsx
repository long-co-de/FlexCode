import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
import TransactionTable from '@/Components/TransactionTable';
import {
    UserGroupIcon,
    CreditCardIcon,
    CheckCircleIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    BellIcon
} from '@heroicons/react/24/outline';

export default function AgentDashboard({ auth, stats, pendingTransactions, recentMessages }) {
    // Format large numbers with commas
    const formatNumber = (num) => {
        return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
    };

    return (
        <AgentLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Agent Dashboard</h2>}
        >
            <Head title="Agent Dashboard" />

            <div className="py-6">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-primary to-purple-600 rounded-xl shadow-lg mb-6 overflow-hidden">
                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center">
                        <div className="text-white mb-4 sm:mb-0">
                            <h2 className="text-2xl font-bold">Welcome back, {auth.user.name}!</h2>
                            <p className="opacity-90 mt-1">Here's what needs your attention today.</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link href={route('agent.messages')} className="btn bg-base-100 -ws/20 hover:bg-base-100 -ws/30  border-0">
                                <BellIcon className="h-5 w-5 mr-2" />
                                New Messages
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="stat-card">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="stat-card-title">Pending Transactions</h3>
                                <p className="stat-card-value">{stats?.pendingTransactions || 0}</p>
                            </div>
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <ClockIcon className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                        <p className="stat-card-desc">Awaiting verification</p>
                    </div>

                    <div className="stat-card">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="stat-card-title">Verified Today</h3>
                                <p className="stat-card-value">{stats?.verifiedToday || 0}</p>
                            </div>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <p className="stat-card-desc">Transactions verified today</p>
                    </div>

                    <div className="stat-card">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="stat-card-title">Unread Messages</h3>
                                <p className="stat-card-value">{stats?.unreadMessages || 0}</p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <p className="stat-card-desc">Messages requiring response</p>
                    </div>
                </div>

                {/* Quick Action Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Link href={route('agent.transactions')} className="dashboard-card p-5 flex flex-col items-center text-center hover:scale-105 transition-transform">
                        <div className="rounded-full bg-primary-100 p-3 mb-3">
                            <CreditCardIcon className="h-6 w-6 text-primary-600" />
                        </div>
                        <h3 className="font-medium igg-800">Verify Transactions</h3>
                        <p className="text-xs igg-500 mt-1">{formatNumber(stats?.pendingTransactions || 0)} transactions pending</p>
                    </Link>

                    <Link href={route('agent.messages')} className="dashboard-card p-5 flex flex-col items-center text-center hover:scale-105 transition-transform">
                        <div className="rounded-full bg-green-100 p-3 mb-3">
                            <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-medium igg-800">Customer Messages</h3>
                        <p className="text-xs igg-500 mt-1">{formatNumber(stats?.unreadMessages || 0)} unread messages</p>
                    </Link>
                </div>

                {/* Pending Transactions */}
                <div className="dashboard-card mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium igg-800">Pending Transactions</h3>
                        <Link
                            href={route('agent.transactions')}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                        >
                            View All
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </Link>
                    </div>

                    {pendingTransactions && pendingTransactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table-modern">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>User</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingTransactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td className="font-medium igg-700">{transaction.reference}</td>
                                            <td>{transaction.user?.name || 'Unknown'}</td>
                                            <td>{transaction.type}</td>
                                            <td>₦{transaction.amount}</td>
                                            <td>{transaction.created_at}</td>
                                            <td>
                                                {/* <Link
                                                    href={route('agent.transactions.verify', transaction.id)}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    Verify
                                                </Link> */}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="igg-500">No pending transactions found</p>
                        </div>
                    )}
                </div>

                {/* Recent Messages */}
                <div className="dashboard-card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium igg-800">Recent Messages</h3>
                        <Link
                            href={route('agent.messages')}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                        >
                            View All
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </Link>
                    </div>

                    {recentMessages && recentMessages.length > 0 ? (
                        <div className="space-y-4">
                            {recentMessages.map((message) => (
                                <div key={message.id} className="border border-base-200 rounded-lg p-4 hover:bg-base-50">
                                    <div className="flex justify-between">
                                        <div className="font-medium">{message.user?.name || 'Unknown'}</div>
                                        <div className="text-sm igg-500">{message.created_at}</div>
                                    </div>
                                    <div className="mt-2 text-sm igg-600 line-clamp-2">{message.message}</div>
                                    <div className="mt-3">
                                        <Link
                                            href={route('agent.messages.conversation', message.id)}
                                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                        >
                                            Reply
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="igg-500">No recent messages found</p>
                        </div>
                    )}
                </div>
            </div>
        </AgentLayout>
    );
}

