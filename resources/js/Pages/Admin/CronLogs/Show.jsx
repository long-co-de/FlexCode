import React from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function CronLogShow({ log }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'failed':
                return 'bg-red-50 border-red-200';
            case 'running':
                return 'bg-yellow-50 border-yellow-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    const getStatusTextColor = (status) => {
        switch (status) {
            case 'success':
                return 'text-green-700';
            case 'failed':
                return 'text-red-700';
            case 'running':
                return 'text-yellow-700';
            default:
                return 'text-gray-700';
        }
    };

    return (
        <AdminLayout header="Cron Job Log Details">
            <div className="space-y-6">
                {/* Back Button */}
                <Link
                    href={route('admin.cron-logs.index')}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-900 font-medium"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Logs
                </Link>

                {/* Main Details Card */}
                <div className={`border rounded-lg p-6 ${getStatusColor(log.status)}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{log.command_name}</h2>
                            <p className={`text-sm font-medium mt-1 ${getStatusTextColor(log.status)}`}>
                                {log.status.toUpperCase()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">ID: {log.id}</p>
                            <p className="text-sm text-gray-600">
                                {new Date(log.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600 font-medium">Total Processed</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{log.processed}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600 font-medium">Succeeded</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{log.succeeded}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600 font-medium">Failed</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{log.failed}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600 font-medium">Execution Time</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{log.execution_time_seconds}s</p>
                    </div>
                </div>

                {/* Timing Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Timing Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Started At</p>
                            <p className="text-base text-gray-900 mt-1">
                                {log.started_at ? new Date(log.started_at).toLocaleString() : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Completed At</p>
                            <p className="text-base text-gray-900 mt-1">
                                {log.completed_at ? new Date(log.completed_at).toLocaleString() : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Output */}
                {log.output && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Output</h3>
                        <pre className="bg-gray-50 border border-gray-200 rounded p-4 text-sm text-gray-700 overflow-x-auto max-h-96">
                            {log.output}
                        </pre>
                    </div>
                )}

                {/* Error Message */}
                {log.error_message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-red-900 mb-4">Error Message</h3>
                        <pre className="text-sm text-red-700 overflow-x-auto max-h-96">
                            {log.error_message}
                        </pre>
                    </div>
                )}

                {/* View Command Button */}
                <div>
                    <Link
                        href={route('admin.cron-logs.command', log.command_name)}
                        className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                    >
                        View All Executions for this Command
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
}
