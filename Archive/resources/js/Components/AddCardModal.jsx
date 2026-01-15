// File: resources/js/Components/Cards/AddCardModal.jsx
import React, { useState } from 'react';
import PaystackWrapper from './PaystackWrapper';
import { usePage } from '@inertiajs/react';

const AddCardModal = ({ paystackPublicKey, onClose, onSuccess }) => {
    const { auth } = usePage().props;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const email = auth.user.email;

    const handlePaystackSuccess = async (response) => {
        setLoading(true);
        setError('');

        try {
            // Extract card details from response
            const cardData = {
                authorization_code: response.reference,
                card_type: response.card?.type || 'unknown',
                last4: response.card?.last4 || '',
                exp_month: response.card?.exp_month || '',
                exp_year: response.card?.exp_year || '',
                bank: response.card?.bank || 'Unknown Bank',
                email: email,
                signature: response.signature || ''
            };

            // Verify and save the card
            const saveResponse = await axios.post(route('cards.store'), cardData);

            if (saveResponse.data.success) {
                onSuccess();
            } else {
                throw new Error(saveResponse.data.message || 'Failed to save card');
            }
            
        } catch (error) {
            console.error('Card processing error:', error);
            setError(error.message || 'Failed to process card. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePaystackClose = () => {
        onClose();
    };

    return (
        <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Link Payment Card</h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    Securely link your card for automatic repayments.
                                </p>
                                
                                {error && (
                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                        <p className="text-sm text-red-800">{error}</p>
                                    </div>
                                )}
                                
                                <div className="mt-4 space-y-3">
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <p className="text-sm font-medium text-gray-900">Email:</p>
                                        <p className="text-sm text-gray-600">{email || 'Loading...'}</p>
                                    </div>
                                    
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-blue-800 mb-2">How it works:</h4>
                                        <ol className="text-sm text-blue-700 space-y-1 list-decimal pl-5">
                                            <li>Click "Link Card Now" to open secure payment form</li>
                                            <li>Enter your card details in the Paystack popup</li>
                                            <li>Pay ₦100 verification charge (refunded immediately)</li>
                                            <li>Card will be linked for borrowing</li>
                                        </ol>
                                    </div>
                                    
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <p className="text-sm text-green-800">
                                            ✅ Your card details are secure and PCI compliant.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <PaystackWrapper
                            publicKey={paystackPublicKey}
                            email={email}
                            amount={100 * 100} // 100 NGN in kobo
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
                        
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                    
                    {loading && (
                        <div className="mt-4 text-center">
                            <div className="inline-flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm text-gray-600">Processing your card...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddCardModal;