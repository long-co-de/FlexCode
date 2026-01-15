import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';
import PaystackWrapper from '@/Components/PaystackWrapper';
import {
    CheckCircleIcon,
    CreditCardIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    ArrowPathIcon,
    BanknotesIcon,
    TrashIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const LinkCard = ({ paystackPublicKey, userEmail, returnUrl = null }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [cardDetails, setCardDetails] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState(false);

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

    const handleDeleteExpiredCard = async () => {
        if (!cardDetails?.id) return;

        if (!window.confirm('Are you sure you want to delete this card? You will need to link a new card to continue borrowing.')) {
            return;
        }

        setIsDeleting(true);
        setError('');

        try {
            const result = await fetch(route('cards.delete-expired', cardDetails.id), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content,
                },
            }).then(res => res.json());

            if (result.success) {
                setDeleteSuccess(true);
                setCardDetails(null);
                setTimeout(() => {
                    const url = returnUrl || route('cards.link');
                    window.location.href = url;
                }, 2000);
            } else {
                setError(result.message || 'Failed to delete card.');
                setIsDeleting(false);
            }
        } catch (err) {
            console.error('Card deletion error:', err);
            setError('An error occurred while deleting your card. Please try again.');
            setIsDeleting(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Link Payment Card — BorrowLite" />

            <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    {cardDetails ? (
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-500">
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-8 py-16 text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl mb-6 ring-8 ring-white/10">
                                    <CheckCircleIcon className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-3xl font-extrabold text-white mb-3">Card Linked Successfully!</h1>
                                <p className="text-green-50 font-medium opacity-90">Your card is now ready for borrowing and payments.</p>
                            </div>

                            <div className="px-8 py-10 space-y-8">
                                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Linked Card Details</h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Card Type', value: cardDetails.card_type, icon: CreditCardIcon },
                                            { label: 'Card Number', value: `•••• •••• •••• ${cardDetails.last_four}`, icon: CreditCardIcon },
                                            { label: 'Bank', value: cardDetails.bank, icon: BanknotesIcon },
                                            cardDetails.expires_at && { label: 'Expires', value: new Date(cardDetails.expires_at).toLocaleDateString(), icon: ClockIcon }
                                        ].filter(Boolean).map((item, i) => (
                                            <div key={i} className="flex justify-between items-center py-3 border-b border-slate-200/50 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="w-5 h-5 text-slate-400" />
                                                    <span className="text-slate-600 font-medium">{item.label}</span>
                                                </div>
                                                <span className="font-bold text-slate-900 capitalize">{item.value}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-4">
                                            <span className="text-slate-600 font-medium">Status</span>
                                            <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {cardDetails.is_expired && (
                                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-4">
                                        <div className="flex gap-3 items-start">
                                            <ExclamationTriangleIcon className="h-6 w-6 text-rose-500 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-rose-900 mb-1">Card Expired</h4>
                                                <p className="text-sm text-rose-800 mb-4">
                                                    Your card has expired and is no longer available for borrowing. Please delete this card and link a new one to continue.
                                                </p>
                                                <button
                                                    onClick={handleDeleteExpiredCard}
                                                    disabled={isDeleting}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                    {isDeleting ? 'Deleting...' : 'Delete Card'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {cardDetails.is_expiring_soon && !cardDetails.is_expired && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
                                        <div className="flex gap-3 items-start">
                                            <ClockIcon className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-amber-900 mb-1">Card Expiring Soon</h4>
                                                <p className="text-sm text-amber-800 mb-2">
                                                    Your card will expire in <span className="font-bold">{cardDetails.days_remaining} days</span>.
                                                </p>
                                                <p className="text-xs text-amber-700">
                                                    We recommend linking a new card now to ensure uninterrupted borrowing access.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-center">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <ArrowPathIcon className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-emerald-800">
                                        ₦100 verification charge has been refunded to your card.
                                    </p>
                                </div>

                                <div className="text-center space-y-4">
                                    {deleteSuccess ? (
                                        <>
                                            <div className="flex items-center justify-center gap-3 text-emerald-600">
                                                <CheckCircleIcon className="w-6 h-6" />
                                                <p className="text-sm font-medium">Card deleted successfully!</p>
                                            </div>
                                            <p className="text-sm text-slate-600">Redirecting...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-center gap-3 text-slate-400">
                                                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                                                <p className="text-sm font-medium italic">Redirecting you back safely...</p>
                                            </div>
                                            <div className="flex justify-center">
                                                <div className="w-12 h-12 border-4 border-slate-100 border-t-sky-600 rounded-full animate-spin" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 overflow-hidden border border-slate-100">
                            <div className="bg-gradient-to-br from-sky-600 to-blue-700 px-8 py-16 text-center relative overflow-hidden">
                                <CreditCardIcon className="absolute -top-10 -right-10 w-48 h-48 text-white/10 -rotate-12" />
                                <div className="relative z-10">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl mb-6 ring-8 ring-white/10">
                                        <CreditCardIcon className="w-10 h-10 text-white" />
                                    </div>
                                    <h1 className="text-4xl font-extrabold text-white mb-3">Link Your Card</h1>
                                    <p className="text-sky-50 font-medium opacity-90">Unlock smart borrowing and seamless payments</p>
                                </div>
                            </div>

                            <div className="px-8 py-10 space-y-8">
                                <div className="space-y-6">
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Why Link a Card?</h2>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {[
                                            { title: 'Instant Access', desc: 'Borrow airtime & data instantly.', icon: CheckCircleIcon },
                                            { title: 'Auto-Pay', desc: 'Stress-free repayments.', icon: ArrowPathIcon },
                                            { title: 'Bank-Grade', desc: 'Secure PCI-compliant storage.', icon: ShieldCheckIcon },
                                            { title: 'Refundable', desc: '₦100 fee is returned instantly.', icon: BanknotesIcon },
                                        ].map((item, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-sky-200 hover:shadow-md transition-all">
                                                <item.icon className="h-6 w-6 text-sky-600 mb-3 group-hover:scale-110 transition-transform" />
                                                <p className="text-sm font-bold text-slate-900 mb-1">{item.title}</p>
                                                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 items-start animate-in slide-in-from-top-2">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm font-semibold text-rose-800">{error}</p>
                                    </div>
                                )}

                                <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <ShieldCheckIcon className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-sky-400">
                                        Secure Process
                                    </h3>
                                    <ul className="space-y-3">
                                        {['Enter card details via Paystack', 'Verify with ₦100 charge', 'Instant refund to your balance'].map((step, i) => (
                                            <li key={i} className="flex items-center gap-3 text-xs font-medium text-slate-300">
                                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">
                                                    {i + 1}
                                                </div>
                                                {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-6 pt-2">
                                    <PaystackWrapper
                                        publicKey={paystackPublicKey}
                                        email={userEmail}
                                        amount={100 * 100}
                                        onSuccess={handlePaystackSuccess}
                                        onClose={handlePaystackClose}
                                        className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-100 transition-all flex items-center justify-center gap-2 group"
                                        text={
                                            <>
                                                Link Card Now
                                                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        }
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

                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                Verified for {userEmail}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                                            By linking your card, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and authorize <br /> secure automatic repayments for borrowed credits.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default LinkCard;
