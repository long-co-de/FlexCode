import { useState } from 'react';
import { FaTimes, FaStar, FaCheckCircle } from 'react-icons/fa';

export default function FeedbackModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        category: 'general',
        title: '',
        message: '',
        rating: 0,
        feature_request: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleRating = (rating) => {
        setFormData((prev) => ({
            ...prev,
            rating,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await router.post(route('feedback.store'), formData, {
                onSuccess: () => {
                    setSuccess(true);
                    setTimeout(() => {
                        resetForm();
                        onClose();
                    }, 2000);
                },
                onError: (errors) => {
                    // Inertia automatically passes validation errors
                    if (errors.message) {
                        setError(errors.message);
                    } else if (typeof errors === 'string') {
                        setError(errors);
                    } else {
                        setError('Failed to submit feedback');
                    }
                },
                onFinish: () => {
                    setLoading(false);
                }
            });
        } catch (err) {
            setError(err.message || 'An error occurred');
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            category: 'general',
            title: '',
            message: '',
            rating: 0,
            feature_request: false,
        });
        setError('');
        setSuccess(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div
                    className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-base-100 border-b border-base-300 px-6 py-4 flex justify-between items-center rounded-t-3xl">
                        <h2 className="text-lg font-bold text-base-content">Send Feedback</h2>
                        <button
                            onClick={handleClose}
                            className="btn btn-ghost btn-sm btn-circle"
                        >
                            <FaTimes size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {success && (
                            <div className="alert alert-success rounded-2xl">
                                <FaCheckCircle className="text-xl" />
                                <div>
                                    <span className="font-bold">Thank you for your feedback!</span>
                                    <span className="text-sm">We'll review it shortly.</span>
                                </div>
                            </div>
                        )}

                        {!success && (
                            <>
                                {/* Category */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-bold">Category</span>
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="select select-bordered focus:select-primary"
                                    >
                                        <option value="bug">Bug Report</option>
                                        <option value="feature_request">Feature Request</option>
                                        <option value="improvement">Improvement Suggestion</option>
                                        <option value="general">General Feedback</option>
                                    </select>
                                </div>

                                {/* Title */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-bold">Subject</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Brief subject..."
                                        maxLength={255}
                                        required
                                        className="input input-bordered focus:input-primary"
                                    />
                                    <label className="label">
                                        <span className="label-text-alt text-base-content/60">
                                            {formData.title.length}/255
                                        </span>
                                    </label>
                                </div>

                                {/* Message */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-bold">Message</span>
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Tell us more about your feedback..."
                                        maxLength={5000}
                                        rows={4}
                                        required
                                        className="textarea textarea-bordered focus:textarea-primary resize-none"
                                    />
                                    <label className="label">
                                        <span className="label-text-alt text-base-content/60">
                                            {formData.message.length}/5000
                                        </span>
                                    </label>
                                </div>

                                {/* Rating */}
                                <div>
                                    <label className="label">
                                        <span className="label-text font-bold">How would you rate us?</span>
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => handleRating(star)}
                                                className={`text-2xl transition-all ${formData.rating >= star
                                                        ? 'text-warning'
                                                        : 'text-base-content/20 hover:text-warning/50'
                                                    }`}
                                            >
                                                <FaStar />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Feature Request Checkbox */}
                                <div className="flex items-center gap-3 bg-primary bg-opacity-10 rounded-xl p-3">
                                    <input
                                        type="checkbox"
                                        id="feature_request"
                                        name="feature_request"
                                        checked={formData.feature_request}
                                        onChange={handleChange}
                                        className="checkbox checkbox-primary"
                                    />
                                    <label htmlFor="feature_request" className="text-sm font-medium text-base-content">
                                        This is a feature request
                                    </label>
                                </div>

                                {error && (
                                    <div className="alert alert-error rounded-xl">
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading || !formData.title.trim() || !formData.message.trim()}
                                    className="btn btn-primary w-full rounded-xl h-11"
                                >
                                    {loading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Feedback'
                                    )}
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}