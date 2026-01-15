import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

export default function CronLogsIndex({ logs, stats }) {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'failed':
                return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
            case 'running':
                return <ClockIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
            default:
                return <ClockIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        const baseClass = 'px-3 py-1 rounded-full text-sm font-medium';
        switch (status) {
            case 'success':
                return `${baseClass} bg-green-50 text-green-700`;
            case 'failed':
                return `${baseClass} bg-red-50 text-red-700`;
            case 'running':
                return `${baseClass} bg-yellow-50 text-yellow-700`;
            default:
                return `${baseClass} bg-gray-50 text-gray-700`;
        }
    };

    return (
        <AdminLayout header="Cron Job Logs">
            <div className="space-y-6">
                {/* Statistics Cards */}
                {Object.keys(stats).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(stats).map(([command, stat]) => (
                            <Link
                                key={command}
                                href={route('admin.cron-logs.command', command)}
                                className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm">{command}</h3>
                                        <p className="text-xs text-gray-500 mt-1">Last run</p>
                                    </div>
                                    {stat.last_run && getStatusIcon(stat.last_run.status)}
                                </div>
                                
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total runs:</span>
                                        <span className="font-medium text-gray-900">{stat.total_runs}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Success rate:</span>
                                        <span className={`font-medium ${stat.success_rate === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                                            {stat.success_rate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Avg time:</span>
                                        <span className="font-medium text-gray-900">{stat.avg_execution_time}s</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Logs Table */}
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Executions</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Command</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Processed</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Succeeded</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Failed</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Time (s)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Completed</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.command_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={getStatusBadge(log.status)}>
                                                {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{log.processed}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="text-green-600 font-medium">{log.succeeded}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={log.failed > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                                {log.failed}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{log.execution_time_seconds}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {log.completed_at ? new Date(log.completed_at).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={route('admin.cron-logs.show', log.id)}
                                                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.links && logs.links.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {logs.from} to {logs.to} of {logs.total} results
                            </div>
                            <div className="flex gap-2">
                                {logs.links.map((link) => (
                                    link.url ? (
                                        <Link
                                            key={link.label}
                                            href={link.url}
                                            className={`px-3 py-2 text-sm rounded-lg ${
                                                link.active
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={link.label}
                                            className="px-3 py-2 text-sm text-gray-400"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
