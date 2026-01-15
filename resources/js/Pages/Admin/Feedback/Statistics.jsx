import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaArrowLeft, FaChartBar, FaStar, FaComments, FaCheckCircle } from 'react-icons/fa';

export default function FeedbackStatistics({ stats }) {
    return (
        <AdminLayout>
            <Head title="Feedback Statistics" />

            <div className="py-8 px-6">
                {/* Header */}
                <div className="mb-8">
                    <Link href={route('admin.feedback.index')} className="btn btn-ghost btn-sm gap-2 mb-4">
                        <FaArrowLeft /> Back to Feedback
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <FaChartBar className="text-primary text-lg" />
                                </div>
                                <h1 className="text-3xl font-bold text-base-content">Feedback Statistics</h1>
                            </div>
                            <p className="text-base-content/60">Analytics and insights from user feedback</p>
                        </div>
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-base-content/60 text-sm font-bold">Total Feedback</p>
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FaComments className="text-primary" />
                            </div>
                        </div>
                        <p className="text-4xl font-black text-base-content">{stats.total}</p>
                    </div>

                    <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-base-content/60 text-sm font-bold">Average Rating</p>
                            <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                                <FaStar className="text-yellow-400" />
                            </div>
                        </div>
                        <p className="text-4xl font-black text-base-content">{stats.avg_rating} / 5</p>
                    </div>

                    <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-base-content/60 text-sm font-bold">Response Rate</p>
                            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                                <FaCheckCircle className="text-success" />
                            </div>
                        </div>
                        <p className="text-4xl font-black text-base-content">{stats.response_rate}%</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* By Status */}
                    <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                        <h2 className="text-lg font-bold text-base-content mb-6">Feedback by Status</h2>
                        <div className="space-y-4">
                            {Object.entries(stats.by_status).map(([status, count]) => {
                                const total = stats.total;
                                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                                const colors = {
                                    open: 'bg-primary',
                                    in_progress: 'bg-warning',
                                    resolved: 'bg-success',
                                    closed: 'bg-slate-500',
                                };

                                return (
                                    <div key={status}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-bold text-base-content capitalize">{status.replace('_', ' ')}</p>
                                            <p className="text-sm font-bold text-base-content/60">{count} ({percentage}%)</p>
                                        </div>
                                        <div className="h-2 bg-base-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors[status]}`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* By Category */}
                    <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                        <h2 className="text-lg font-bold text-base-content mb-6">Feedback by Category</h2>
                        <div className="space-y-4">
                            {Object.entries(stats.by_category).map(([category, count]) => {
                                const total = stats.total;
                                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                                const colors = {
                                    bug: 'bg-error',
                                    feature_request: 'bg-info',
                                    improvement: 'bg-warning',
                                    general: 'bg-primary',
                                };
                                const labels = {
                                    bug: 'Bug Report',
                                    feature_request: 'Feature Request',
                                    improvement: 'Improvement',
                                    general: 'General',
                                };

                                return (
                                    <div key={category}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-bold text-base-content">{labels[category]}</p>
                                            <p className="text-sm font-bold text-base-content/60">{count} ({percentage}%)</p>
                                        </div>
                                        <div className="h-2 bg-base-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors[category]}`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* By Rating */}
                    <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                        <h2 className="text-lg font-bold text-base-content mb-6">Feedback by Rating</h2>
                        <div className="space-y-4">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = stats.by_rating[rating] || 0;
                                const total = Object.values(stats.by_rating).reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

                                return (
                                    <div key={rating}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-base-content">{rating} Star{rating !== 1 ? 's' : ''}</span>
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span
                                                            key={i}
                                                            className={`text-xs ${i < rating ? 'text-yellow-400' : 'text-base-300'}`}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold text-base-content/60">{count} ({percentage}%)</p>
                                        </div>
                                        <div className="h-2 bg-base-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                        <h2 className="text-lg font-bold text-base-content mb-6">Key Metrics</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-base-200/50 rounded-lg">
                                <span className="font-bold text-base-content">Feature Requests</span>
                                <span className="text-lg font-black text-info">{stats.feature_requests}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-base-200/50 rounded-lg">
                                <span className="font-bold text-base-content">Resolved Feedback</span>
                                <span className="text-lg font-black text-success">{stats.by_status.resolved || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-base-200/50 rounded-lg">
                                <span className="font-bold text-base-content">Open Issues</span>
                                <span className="text-lg font-black text-primary">{stats.by_status.open || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-base-200/50 rounded-lg">
                                <span className="font-bold text-base-content">In Progress</span>
                                <span className="text-lg font-black text-warning">{stats.by_status.in_progress || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insights */}
                <div className="mt-8 bg-gradient-to-r from-info/10 to-primary/10 rounded-xl p-6 border border-info/20">
                    <h2 className="text-lg font-bold text-base-content mb-4">Insights & Recommendations</h2>
                    <ul className="space-y-3 text-base-content/80 text-sm">
                        <li className="flex items-start gap-3">
                            <span className="text-info font-bold mt-1">•</span>
                            <span>You have received {stats.total} feedback submissions from users.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-info font-bold mt-1">•</span>
                            <span>Average user rating is {stats.avg_rating} out of 5 stars.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-info font-bold mt-1">•</span>
                            <span>You have responded to {stats.response_rate}% of feedback submissions.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-info font-bold mt-1">•</span>
                            <span>{stats.feature_requests} feature requests have been submitted by users.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-info font-bold mt-1">•</span>
                            <span>Focus on responding to open feedback items to improve user engagement.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
}
