import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaComments, FaSearch, FaFilter, FaStar, FaUser, FaCalendar, FaComment, FaLightbulb } from 'react-icons/fa';

export default function FeedbackIndex({ feedback, filters, stats }) {
    const [showFilters, setShowFilters] = useState(false);

    const categoryLabels = {
        bug: { label: 'Bug Report', color: 'error' },
        feature_request: { label: 'Feature Request', color: 'info' },
        improvement: { label: 'Improvement', color: 'warning' },
        general: { label: 'General', color: 'primary' },
    };

    const statusLabels = {
        open: { label: 'Open', color: 'primary' },
        in_progress: { label: 'In Progress', color: 'warning' },
        resolved: { label: 'Resolved', color: 'success' },
        closed: { label: 'Closed', color: 'slate' },
    };

    const handleFilterChange = (filterName, value) => {
        router.get(route('admin.feedback.index'), {
            ...filters,
            [filterName]: value,
            page: 1,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        router.get(route('admin.feedback.index'), {
            ...filters,
            search: value,
            page: 1,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Feedback Management" />

            <div className="py-8 px-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <FaComments className="text-primary text-lg" />
                                </div>
                                <h1 className="text-3xl font-bold text-base-content">Feedback Management</h1>
                            </div>
                            <p className="text-base-content/60">Review and manage user feedback, feature requests, and bug reports</p>
                        </div>
                        <Link href={route('admin.feedback.statistics')} className="btn btn-primary gap-2">
                            <FaComments />
                            Statistics
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                            <p className="text-xs text-base-content/60 font-bold uppercase mb-1">Total</p>
                            <p className="text-2xl font-black text-base-content">{stats.total}</p>
                        </div>
                        <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                            <p className="text-xs text-primary/60 font-bold uppercase mb-1">Open</p>
                            <p className="text-2xl font-black text-primary">{stats.open}</p>
                        </div>
                        <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                            <p className="text-xs text-warning/60 font-bold uppercase mb-1">In Progress</p>
                            <p className="text-2xl font-black text-warning">{stats.in_progress}</p>
                        </div>
                        <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                            <p className="text-xs text-success/60 font-bold uppercase mb-1">Resolved</p>
                            <p className="text-2xl font-black text-success">{stats.resolved}</p>
                        </div>
                        <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                            <p className="text-xs text-info/60 font-bold uppercase mb-1">Feature Requests</p>
                            <p className="text-2xl font-black text-info">{stats.feature_requests}</p>
                        </div>
                        <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                            <p className="text-xs text-yellow-600/60 font-bold uppercase mb-1">Avg Rating</p>
                            <div className="flex items-center gap-1">
                                <FaStar className="text-yellow-400" />
                                <p className="text-2xl font-black text-base-content">{stats.avg_rating}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-base-100 rounded-xl p-6 border border-base-300 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 md:items-end">
                        {/* Search */}
                        <div className="flex-1">
                            <label className="text-sm font-bold text-base-content mb-2 block">Search</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search feedback by title, message, or user..."
                                    defaultValue={filters.search}
                                    onChange={handleSearch}
                                    className="input input-bordered w-full pl-10"
                                />
                                <FaSearch className="absolute left-3 top-3.5 text-base-content/40" />
                            </div>
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="btn btn-outline gap-2"
                        >
                            <FaFilter /> Filters
                        </button>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-base-300 grid grid-cols-2 md:grid-cols-5 gap-4">
                            {/* Category Filter */}
                            <div>
                                <label className="text-sm font-bold text-base-content mb-2 block">Category</label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="select select-bordered w-full text-sm"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="bug">Bug Report</option>
                                    <option value="feature_request">Feature Request</option>
                                    <option value="improvement">Improvement</option>
                                    <option value="general">General</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="text-sm font-bold text-base-content mb-2 block">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="select select-bordered w-full text-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            {/* Rating Filter */}
                            <div>
                                <label className="text-sm font-bold text-base-content mb-2 block">Min Rating</label>
                                <select
                                    value={filters.rating}
                                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                                    className="select select-bordered w-full text-sm"
                                >
                                    <option value="all">All Ratings</option>
                                    <option value="1">1 Star</option>
                                    <option value="2">2 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="5">5 Stars</option>
                                </select>
                            </div>

                            {/* Feature Request Filter */}
                            <div>
                                <label className="text-sm font-bold text-base-content mb-2 block">Type</label>
                                <select
                                    value={filters.feature_request}
                                    onChange={(e) => handleFilterChange('feature_request', e.target.value)}
                                    className="select select-bordered w-full text-sm"
                                >
                                    <option value="all">All Types</option>
                                    <option value="true">Feature Requests Only</option>
                                    <option value="false">Regular Feedback</option>
                                </select>
                            </div>

                            {/* Sort */}
                            <div>
                                <label className="text-sm font-bold text-base-content mb-2 block">Sort By</label>
                                <select
                                    value={filters.sort}
                                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    className="select select-bordered w-full text-sm"
                                >
                                    <option value="created_at">Latest</option>
                                    <option value="rating">Rating</option>
                                    <option value="status">Status</option>
                                    <option value="category">Category</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Feedback List */}
                <div className="bg-base-100 rounded-xl border border-base-300 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-base-200 border-b border-base-300">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-base-content">Title</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-base-content">User</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-base-content">Category</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-base-content">Status</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-base-content">Rating</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-base-content">Date</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-base-content">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-base-200">
                                {feedback.data.length > 0 ? (
                                    feedback.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-base-200/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-base-content text-sm line-clamp-2">{item.title}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        {item.feature_request && (
                                                            <span className="inline-flex items-center gap-1 text-xs bg-info/10 text-info px-2 py-0.5 rounded-lg">
                                                                <FaLightbulb /> Feature
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <FaUser className="text-primary text-xs" />
                                                    </div>
                                                    <div className="text-sm">
                                                        <p className="font-bold text-base-content">{item.user.name}</p>
                                                        <p className="text-base-content/60 text-xs">{item.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`badge badge-${categoryLabels[item.category].color}`}>
                                                    {categoryLabels[item.category].label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`badge badge-${statusLabels[item.status].color}`}>
                                                    {statusLabels[item.status].label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.rating ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <FaStar className="text-yellow-400 text-sm" />
                                                        <span className="font-bold text-base-content">{item.rating}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-base-content/40 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-base-content/60">
                                                <div className="flex items-center gap-1">
                                                    <FaCalendar className="text-xs" />
                                                    {new Date(item.created_at).toLocaleDateString('en-GB')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link
                                                    href={route('admin.feedback.show', item.id)}
                                                    className="btn btn-sm btn-ghost gap-1"
                                                >
                                                    <FaComment className="text-xs" />
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-base-200 rounded-2xl flex items-center justify-center mb-4">
                                                    <FaComments className="text-base-content/20 text-2xl" />
                                                </div>
                                                <p className="text-base-content/60 font-medium">No feedback found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {feedback.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-base-300 flex items-center justify-between">
                            <p className="text-sm text-base-content/60">
                                Showing {feedback.from} to {feedback.to} of {feedback.total} feedback
                            </p>
                            <div className="flex gap-2">
                                {feedback.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        className={`btn btn-sm ${link.active ? 'btn-primary' : 'btn-ghost'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
