import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaArrowLeft, FaUser, FaCalendar, FaStar, FaCheckCircle, FaClock, FaComment, FaLightbulb, FaComments } from 'react-icons/fa';

export default function FeedbackShow({ feedback }) {
    const { flash } = usePage().props;
    const [status, setStatus] = useState(feedback.status);
    const [adminResponse, setAdminResponse] = useState(feedback.admin_response || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResponse, setShowResponse] = useState(!!feedback.responded_at);

    const categoryLabels = {
        bug: { label: 'Bug Report', color: 'error', icon: '🐛' },
        feature_request: { label: 'Feature Request', color: 'info', icon: '✨' },
        improvement: { label: 'Improvement', color: 'warning', icon: '⚡' },
        general: { label: 'General', color: 'primary', icon: '💬' },
    };

    const statusLabels = {
        open: { label: 'Open', color: 'primary' },
        in_progress: { label: 'In Progress', color: 'warning' },
        resolved: { label: 'Resolved', color: 'success' },
        closed: { label: 'Closed', color: 'slate' },
    };

    const handleStatusUpdate = () => {
        router.patch(route('admin.feedback.update-status', feedback.id), { status }, {
            onFinish: () => setStatus(feedback.status),
        });
    };

    const handleSubmitResponse = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(route('admin.feedback.respond', feedback.id), {
            admin_response: adminResponse,
            status: status,
        }, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AdminLayout>
            <Head title={`Feedback - ${feedback.title}`} />

            <div className="py-8 px-6">
                {/* Header */}
                <div className="mb-8">
                    <Link href={route('admin.feedback.index')} className="btn btn-ghost btn-sm gap-2 mb-4">
                        <FaArrowLeft /> Back to Feedback
                    </Link>

                    <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-2xl">{categoryLabels[feedback.category].icon}</span>
                                    <h1 className="text-3xl font-bold text-base-content">{feedback.title}</h1>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <span className={`badge badge-${categoryLabels[feedback.category].color}`}>
                                        {categoryLabels[feedback.category].label}
                                    </span>
                                    <span className={`badge badge-${statusLabels[status].color}`}>
                                        {statusLabels[status].label}
                                    </span>
                                    {feedback.feature_request && (
                                        <span className="badge badge-info gap-1">
                                            <FaLightbulb /> Feature Request
                                        </span>
                                    )}
                                    {feedback.rating && (
                                        <span className="badge badge-warning gap-1">
                                            <FaStar /> {feedback.rating} Star{feedback.rating !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="mt-6 pt-6 border-t border-base-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <FaUser className="text-primary text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-base-content/60 font-bold uppercase">User</p>
                                        <p className="font-bold text-base-content">{feedback.user.name}</p>
                                        <p className="text-xs text-base-content/60">{feedback.user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
                                        <FaCalendar className="text-info text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-base-content/60 font-bold uppercase">Submitted</p>
                                        <p className="font-bold text-base-content">
                                            {new Date(feedback.created_at).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                        <p className="text-xs text-base-content/60">
                                            {new Date(feedback.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>

                                {feedback.responded_at && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                                            <FaCheckCircle className="text-success text-lg" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-base-content/60 font-bold uppercase">Responded</p>
                                            <p className="font-bold text-base-content">
                                                {new Date(feedback.responded_at).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                            <p className="text-xs text-base-content/60">
                                                {new Date(feedback.responded_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Message */}
                        <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                            <h2 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                                <FaComment className="text-primary" />
                                Feedback Message
                            </h2>
                            <div className="bg-base-200/50 rounded-lg p-4 text-base-content leading-relaxed whitespace-pre-wrap">
                                {feedback.message}
                            </div>
                        </div>

                        {/* Admin Response */}
                        <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                            <h2 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                                <FaComments className="text-info" />
                                Admin Response
                            </h2>

                            {feedback.admin_response ? (
                                <div className="space-y-4">
                                    <div className="bg-info/10 rounded-lg p-4 border border-info/20">
                                        <p className="text-sm text-base-content leading-relaxed whitespace-pre-wrap">
                                            {feedback.admin_response}
                                        </p>
                                        <p className="text-xs text-base-content/60 mt-3">
                                            Responded on {new Date(feedback.responded_at).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setShowResponse(!showResponse)}
                                        className="btn btn-sm btn-outline"
                                    >
                                        {showResponse ? 'Hide Edit Form' : 'Update Response'}
                                    </button>
                                </div>
                            ) : (
                                <p className="text-base-content/60 italic">No response yet</p>
                            )}

                            {showResponse && (
                                <form onSubmit={handleSubmitResponse} className="mt-4 space-y-4 pt-4 border-t border-base-300">
                                    <div>
                                        <label className="text-sm font-bold text-base-content mb-2 block">Response</label>
                                        <textarea
                                            value={adminResponse}
                                            onChange={(e) => setAdminResponse(e.target.value)}
                                            placeholder="Write your response to this feedback..."
                                            maxLength={5000}
                                            rows={5}
                                            className="textarea textarea-bordered w-full text-sm"
                                            required
                                        />
                                        <p className="text-xs text-base-content/60 mt-1">
                                            {adminResponse.length}/5000 characters
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold text-base-content mb-2 block">Update Status</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="select select-bordered w-full text-sm"
                                        >
                                            <option value="open">Open</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !adminResponse.trim()}
                                        className="btn btn-primary w-full gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle />
                                                Save Response
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Management */}
                        <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                            <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                                <FaClock className="text-warning" />
                                Status
                            </h3>

                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="select select-bordered w-full mb-3"
                            >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>

                            {status !== feedback.status && (
                                <button
                                    onClick={handleStatusUpdate}
                                    className="btn btn-primary btn-sm w-full gap-2"
                                >
                                    <FaCheckCircle /> Update Status
                                </button>
                            )}
                        </div>

                        {/* Details */}
                        <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                            <h3 className="text-lg font-bold text-base-content mb-4">Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-base-content/60 font-bold uppercase mb-1">Category</p>
                                    <p className="text-base-content font-bold">{categoryLabels[feedback.category].label}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-base-content/60 font-bold uppercase mb-1">Status</p>
                                    <span className={`badge badge-${statusLabels[status].color}`}>
                                        {statusLabels[status].label}
                                    </span>
                                </div>

                                {feedback.rating && (
                                    <div>
                                        <p className="text-xs text-base-content/60 font-bold uppercase mb-1">Rating</p>
                                        <div className="flex items-center gap-2">
                                            {[...Array(5)].map((_, i) => (
                                                <FaStar
                                                    key={i}
                                                    className={i < feedback.rating ? 'text-yellow-400' : 'text-base-300'}
                                                />
                                            ))}
                                            <span className="ml-2 font-bold text-base-content">{feedback.rating}/5</span>
                                        </div>
                                    </div>
                                )}

                                {feedback.feature_request && (
                                    <div>
                                        <p className="text-xs text-base-content/60 font-bold uppercase mb-1">Type</p>
                                        <span className="badge badge-info gap-1">
                                            <FaLightbulb /> Feature Request
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs text-base-content/60 font-bold uppercase mb-1">Feedback ID</p>
                                    <p className="text-base-content font-mono text-sm">{feedback.id}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-base-100 rounded-xl p-6 border border-base-300">
                            <h3 className="text-lg font-bold text-base-content mb-4">Actions</h3>

                            <Link
                                href={route('admin.users.show', feedback.user.id)}
                                className="btn btn-outline w-full justify-start gap-2"
                            >
                                <FaUser /> View User
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
