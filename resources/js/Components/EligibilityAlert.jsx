import React from 'react';

const EligibilityAlert = ({ eligibility, onAction }) => {
    if (!eligibility || eligibility.is_eligible) {
        return null;
    }

    const getIcon = () => {
        switch (eligibility.rejection_reason_type) {
            case 'no_card':
                return (
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                );
            case 'account_age':
                return (
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'credit_score':
                return (
                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    return (
        <div className="mb-6 p-4 rounded-lg border bg-amber-50 border-amber-200">
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-2">
                        {eligibility.rejection_reason || 'Not Eligible'}
                    </h3>
                    {eligibility.action && (
                        <p className="text-sm text-amber-800 mb-4">
                            {eligibility.action}
                        </p>
                    )}
                    {eligibility.action_button && onAction && (
                        <button
                            onClick={() => onAction(eligibility.action_type)}
                            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 transition"
                        >
                            {eligibility.action_button}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EligibilityAlert;
