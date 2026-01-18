import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import axios from 'axios';

export default function PaymentRetrieval() {
    const { csrf_token } = usePage().props;
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setResult(null);
        setLoading(true);

        try {
            const response = await axios.post(
                route('admin.wallet-fundings.verify-payment'),
                { reference: reference.trim() },
                {
                    headers: {
                        'X-CSRF-TOKEN': csrf_token,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.success) {
                setSuccess(response.data.message);
                setResult(response.data.data);
                setReference('');
            } else {
                setError(response.data.message || 'Payment verification failed');
            }
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'An error occurred';
            setError(message);
            console.error('Payment retrieval error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Payment Retrieval" />
            
            <div className="py-6">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Payment Retrieval</h1>
                            <p className="text-gray-600 mb-6">Verify and retrieve payments using Paystack payment reference</p>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="reference" value="Paystack Reference" />
                                    <TextInput
                                        id="reference"
                                        type="text"
                                        name="reference"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="e.g., fund123456789"
                                        required
                                        disabled={loading}
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        Enter the payment reference code from Paystack
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                                        <p className="font-medium">Error</p>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                                        <p className="font-medium">Success</p>
                                        <p className="text-sm">{success}</p>
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-start gap-4">
                                    <PrimaryButton disabled={loading || !reference.trim()}>
                                        {loading ? 'Verifying...' : 'Verify & Retrieve Payment'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>

                        {result && (
                            <div className="p-6 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Reference</label>
                                        <p className="text-gray-900 font-mono">{result.reference}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600">User</label>
                                        <p className="text-gray-900">{result.user_name}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Amount</label>
                                        <p className="text-gray-900 font-semibold">₦{Number(result.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Fee</label>
                                        <p className="text-gray-900">₦{Number(result.fee).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Net Amount</label>
                                        <p className="text-gray-900 font-semibold">₦{Number(result.net_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Debt Settled</label>
                                        <p className="text-gray-900">₦{Number(result.settled_debt).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Credited to Wallet</label>
                                        <p className="text-gray-900 font-semibold text-green-600">₦{Number(result.credited_to_wallet).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
