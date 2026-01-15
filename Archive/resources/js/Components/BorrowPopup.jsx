import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';

const BorrowPopup = ({ eligibility, show = true }) => {
    const [isOpen, setIsOpen] = useState(show && eligibility?.is_eligible);
    const [hasSeenThisMonth, setHasSeenThisMonth] = useState(false);

    useEffect(() => {
        // Check if user has already seen the popup this month
        const lastSeen = localStorage.getItem('borrow_popup_last_seen');
        if (lastSeen) {
            const lastSeenDate = new Date(lastSeen);
            const now = new Date();
            
            // Show again only if it's a new month
            if (lastSeenDate.getMonth() === now.getMonth() && lastSeenDate.getFullYear() === now.getFullYear()) {
                setHasSeenThisMonth(true);
                setIsOpen(false);
            }
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Store the date when user saw/dismissed the popup
        localStorage.setItem('borrow_popup_last_seen', new Date().toISOString());
    };

    if (!isOpen || hasSeenThisMonth || !eligibility?.is_eligible) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-full mb-4">
                        <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Buy Now, Pay Later
                    </h2>
                    <p className="text-blue-100 text-sm">
                        Exclusive offer for you this month
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {/* Offer Description */}
                    <div className="mb-6">
                        <p className="text-gray-700 text-sm leading-relaxed mb-4">
                            You're now eligible to borrow airtime, data, and bills with <strong>zero interest for the first month</strong>!
                        </p>
                        
                        {/* Benefits */}
                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-700">
                                    Get airtime, data, or pay bills instantly
                                </span>
                            </div>
                            
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-700">
                                    Repay within 30 days at your convenience
                                </span>
                            </div>
                            
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-700">
                                    Automatic deduction from your linked card
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Credit Info */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Available Credit</span>
                            <span className="text-xl font-bold text-blue-600">
                                ₦{eligibility?.available_credit?.toLocaleString() || '0'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600">
                            Credit Score: {eligibility?.credit_score || '0'}/100
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Link
                            href={route('borrow.airtime')}
                            onClick={handleClose}
                            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg text-center transition"
                        >
                            Start Borrowing Now
                        </Link>
                        
                        <button
                            onClick={handleClose}
                            className="block w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium py-3 rounded-lg transition"
                        >
                            Maybe Later
                        </button>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-xs text-gray-500 text-center mt-4">
                        This offer is personalized based on your account activity. Terms & conditions apply.
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default BorrowPopup;
