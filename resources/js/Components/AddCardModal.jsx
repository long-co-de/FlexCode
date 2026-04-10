import React, { useState } from 'react';
import PaystackWrapper from './PaystackWrapper';
import { usePage } from '@inertiajs/react';
import {
    ArrowPathIcon,
    CreditCardIcon,
    InformationCircleIcon,
    ShieldCheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';

const AddCardModal = ({ paystackPublicKey, onClose, onSuccess }) => {
    const { auth } = usePage().props;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const email = auth.user.email;

    const handlePaystackSuccess = async (response) => {
        setLoading(true);
        setError('');

        try {
            const cardData = {
                authorization_code: response.reference,
                card_type: response.card?.type || 'unknown',
                last4: response.card?.last4 || '',
                exp_month: response.card?.exp_month || '',
                exp_year: response.card?.exp_year || '',
                bank: response.card?.bank || 'Unknown Bank',
                email,
                signature: response.signature || '',
            };

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
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                <div className="relative transform overflow-hidden rounded-[2.5rem] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-100 animate-in zoom-in-95 duration-200">
                    <div className="absolute right-6 top-6">
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="px-8 pt-10 pb-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center shadow-inner">
                                <CreditCardIcon className="w-7 h-7 text-sky-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 leading-tight">Link New Card</h3>
                                <p className="text-sm font-medium text-slate-500">Enable smart payments securely.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 animate-in slide-in-from-top-2">
                                <InformationCircleIcon className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-bold text-rose-800">{error}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verifying Account</p>
                                <p className="text-sm font-bold text-slate-700">{email}</p>
                            </div>

                            <div className="bg-sky-50/50 rounded-[2rem] p-6 border border-sky-100/50">
                                <h4 className="text-xs font-black text-sky-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <InformationCircleIcon className="w-4 h-4" />
                                    Security Steps
                                </h4>
                                <ul className="space-y-4">
                                    {[
                                        'Open secure Paystack payment window',
                                        'Provide valid card details',
                                        'Authorize N100 card-linking fee',
                                        'First successful link unlocks N50 airtime reward',
                                    ].map((step, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-sky-600 shadow-sm border border-sky-100 flex-shrink-0 mt-0.5">
                                                {i + 1}
                                            </div>
                                            <p className="text-xs font-semibold text-sky-900/70">{step}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <ShieldCheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase tracking-wide">
                                    PCI-DSS COMPLIANT • END-TO-END ENCRYPTED
                                </p>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col gap-3">
                            <PaystackWrapper
                                publicKey={paystackPublicKey}
                                email={email}
                                amount={100 * 100}
                                onSuccess={handlePaystackSuccess}
                                onClose={handlePaystackClose}
                                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                text={
                                    loading ? (
                                        <div className="flex items-center gap-3">
                                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                            <span>Syncing Card...</span>
                                        </div>
                                    ) : (
                                        <>
                                            Begin Linking
                                            <ArrowPathIcon className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                        </>
                                    )
                                }
                                metadata={{
                                    custom_fields: [
                                        {
                                            display_name: 'Purpose',
                                            variable_name: 'purpose',
                                            value: 'card_linking',
                                        },
                                    ],
                                }}
                            />

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Cancel Process
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCardModal;
