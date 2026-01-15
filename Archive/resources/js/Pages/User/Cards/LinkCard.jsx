import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState, useEffect } from 'react';
import PaystackWrapper from '@/Components/PaystackWrapper';

const LinkCard = ({ paystackPublicKey, userEmail, returnUrl = null }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [cardDetails, setCardDetails] = useState(null);

    const handlePaystackSuccess = async (response) => {
        setIsProcessing(true);
        setError('');

        try {
            const result = await fetch(route('cards.link-from-payment'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({
                    reference: response.reference,
                    status: response.status,
                }),
            }).then(res => res.json());

            if (result.success) {
                setCardDetails(result.data.card);
                setTimeout(() => {
                    const url = returnUrl || route('dashboard');
                    window.location.href = url;
                }, 2500);
            } else {
                setError(result.message || 'Failed to link card. Please try again.');
                setIsProcessing(false);
            }
        } catch (err) {
            console.error('Card linking error:', err);
            setError('An error occurred while linking your card. Please try again.');
            setIsProcessing(false);
        }
    };

    const handlePaystackClose = () => {
        setIsProcessing(false);
        setError('Card linking cancelled. Please try again.');
    };

    return (
        <AppLayout>
            <Head title="Link Payment Card" />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    {cardDetails ? (
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-12 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-2">Card Linked Successfully!</h1>
                                <p className="text-green-100">Your card is now ready for borrowing and payments.</p>
                            </div>

                            <div className="px-6 py-8 space-y-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Card Type:</span>
                                            <span className="font-medium text-gray-900 capitalize">{cardDetails.card_type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Card Number:</span>
                                            <span className="font-medium text-gray-900">•••• •••• •••• {cardDetails.last_four}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Bank:</span>
                                            <span className="font-medium text-gray-900">{cardDetails.bank}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm text-green-800">
                                        ✅ Your ₦100 verification charge has been refunded to your card.
                                    </p>
                                </div>

                                <div className="text-center">
                                    <p className="text-gray-600 text-sm">Redirecting you to continue...</p>
                                    <div className="mt-4 flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-12 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-2">Link Your Payment Card</h1>
                                <p className="text-blue-100">Required for buy now, pay later functionality</p>
                            </div>

                            <div className="px-6 py-8 space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Why Link a Card?</h2>
                                    <div className="space-y-3">
                                        {[
                                            { title: 'Instant Borrowing Access', desc: 'Get approved for airtime, data, and bills instantly' },
                                            { title: 'Automatic Repayments', desc: 'Payments are deducted automatically on due dates' },
                                            { title: 'Secure & Encrypted', desc: 'Your card details are PCI compliant and encrypted' },
                                            { title: 'Instant Refund', desc: '₦100 verification charge is refunded immediately' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-start space-x-3">
                                                <div className="flex-shrink-0">
                                                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-blue-100">
                                                        <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                                    <p className="text-sm text-gray-600">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <svg className="h-5 w-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-2h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div className="ml-3">
                                                <p className="text-sm text-red-700">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">How It Works:</h3>
                                    <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
                                        <li>Click "Link Card Now" button below</li>
                                        <li>Enter your card details in the secure Paystack form</li>
                                        <li>Pay ₦100 verification charge</li>
                                        <li>Card is verified and linked instantly</li>
                                        <li>You'll be redirected to continue your purchase</li>
                                    </ol>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <svg className="h-5 w-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 111.414 1.414L7.414 9l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        <div className="ml-3">
                                            <p className="text-sm text-green-800">
                                                <strong>PCI DSS Compliant:</strong> Your card details are never stored on our servers. Paystack handles all card processing securely.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <PaystackWrapper
                                        publicKey={paystackPublicKey}
                                        email={userEmail}
                                        amount={100 * 100}
                                        onSuccess={handlePaystackSuccess}
                                        onClose={handlePaystackClose}
                                        metadata={{
                                            custom_fields: [
                                                {
                                                    display_name: "Purpose",
                                                    variable_name: "purpose",
                                                    value: "card_linking"
                                                }
                                            ]
                                        }}
                                    />
                                </div>

                                <p className="text-center text-xs text-gray-600">
                                    Email: <span className="font-medium">{userEmail}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default LinkCard;
