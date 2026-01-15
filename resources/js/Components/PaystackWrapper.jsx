// File: resources/js/Components/PaystackWrapper.jsx
import React, { useState, useEffect } from 'react';

const PaystackWrapper = ({ 
    publicKey, 
    email, 
    amount, 
    onSuccess, 
    onClose,
    metadata = {}
}) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkPaystackLoaded = () => {
            if (window.PaystackPop) {
                setIsInitialized(true);
                setError(null);
            } else {
                setTimeout(checkPaystackLoaded, 100);
            }
        };

        checkPaystackLoaded();
    }, []);

    const initializePayment = () => {
        if (!window.PaystackPop) {
            alert('Payment system is still loading. Please try again.');
            return;
        }

        if (!publicKey || !email) {
            alert('Payment configuration is incomplete.');
            return;
        }

        try {
            const handler = window.PaystackPop.setup({
                key: publicKey,
                email: email,
                amount: amount,
                ref: `CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                metadata: metadata,
                callback: (response) => {
                    if (onSuccess) {
                        onSuccess(response);
                    }
                },
                onClose: () => {
                    if (onClose) {
                        onClose();
                    }
                }
            });

            handler.openIframe();
        } catch (error) {
            console.error('Paystack initialization error:', error);
            alert('Failed to initialize payment. Please try again.');
        }
    };

    return (
        <>
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}
            <button
                onClick={initializePayment}
                disabled={!isInitialized}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {isInitialized ? 'Link Card Now' : 'Loading Payment System...'}
            </button>
        </>
    );
};

export default PaystackWrapper;