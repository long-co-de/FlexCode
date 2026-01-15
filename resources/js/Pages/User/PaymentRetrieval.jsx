import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';
import { FaSearch, FaCheckCircle, FaExclamationTriangle, FaMoneyBillWave } from 'react-icons/fa';

export default function PaymentRetrieval({ auth }) {
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await fetch(route('payment-retrieval.verify'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({ reference }),
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    success: true,
                    message: data.message,
                    amount: data.data.amount,
                    newBalance: data.data.new_balance,
                    paidAt: data.data.paid_at,
                });
                setReference('');
            } else {
                setError(data.message || 'Failed to retrieve payment');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                        <FaMoneyBillWave className="text-sky-600 text-lg" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Retrieve Payment</h2>
                        <p className="text-sm text-slate-500">Recover a payment using its Paystack reference</p>
                    </div>
                </div>
            }
        >
            <Head title="Retrieve Payment" />

            <div className="py-8">
                <div className="max-w-2xl mx-auto px-4">
                    {/* Info Card */}
                    <div className="bg-sky-50 border border-sky-200 rounded-3xl p-6 mb-8">
                        <p className="text-sm text-sky-900 leading-relaxed">
                            <span className="font-bold">Lost a payment?</span> If you made a payment via Paystack but didn't receive your credit, enter the payment reference here. We'll verify it and add the funds to your wallet automatically.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-3">
                                    Paystack Reference
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        placeholder="e.g., 1234567890"
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm"
                                        disabled={loading}
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <FaSearch />
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    You can find this in your Paystack email receipt or transaction history
                                </p>
                            </div>

                            {error && (
                                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3">
                                    <FaExclamationTriangle className="text-rose-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-rose-900">{error}</p>
                                    </div>
                                </div>
                            )}

                            {result && result.success && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                                    <div className="flex gap-3">
                                        <FaCheckCircle className="text-emerald-600 text-xl flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-emerald-900">{result.message}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 ml-8">
                                        <div className="bg-white rounded-xl p-3 border border-emerald-100">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Amount Credited</p>
                                            <p className="text-lg font-black text-emerald-600">₦{result.amount.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-3 border border-emerald-100">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">New Balance</p>
                                            <p className="text-lg font-black text-slate-800">₦{result.newBalance.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!reference.trim() || loading}
                                className="w-full h-12 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <FaSearch />
                                        Retrieve Payment
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-8 bg-slate-50 rounded-3xl p-6 border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 mb-4">Frequently Asked Questions</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold text-slate-700 mb-1">Where do I find my reference?</p>
                                <p className="text-xs text-slate-600">Check your email receipt from Paystack, or look in your bank statement for the transaction ID.</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-700 mb-1">How long does verification take?</p>
                                <p className="text-xs text-slate-600">Verification is instant. Your funds will be credited immediately upon successful verification.</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-700 mb-1">What if my payment failed?</p>
                                <p className="text-xs text-slate-600">Only successful payments can be retrieved. Check your payment status before using this tool.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
