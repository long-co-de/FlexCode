import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import CardItem from '@/Components/CardItem';
import AppLayout from '@/Layouts/AppLayout';
import {
    ArrowPathIcon,
    CreditCardIcon,
    InformationCircleIcon,
    PlusIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';

const CardsIndex = () => {
    const { props } = usePage();
    const { cards } = props;

    const [processing, setProcessing] = useState(false);

    const handleSetDefault = async (cardId) => {
        if (processing) return;

        setProcessing(true);
        try {
            const response = await axios.post(route('cards.set-default', cardId));
            if (response.data.success) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error setting default card:', error);
            alert(error.response?.data?.message || 'Failed to set default card');
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteCard = async (cardId) => {
        if (!confirm('Are you sure you want to remove this card?')) return;

        setProcessing(true);
        try {
            const response = await axios.delete(route('cards.destroy', cardId));
            if (response.data.success) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error deleting card:', error);
            alert(error.response?.data?.message || 'Failed to remove card');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Payment Methods - BorrowLite" />

            <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Payment Methods</h1>
                        <p className="mt-2 text-slate-500 max-w-md">
                            Manage your saved cards for seamless transactions and automatic repayments.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            router.visit(route('cards.link'), { preserveScroll: true });
                        }}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-100 transition-all active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add New Card
                    </button>
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        {cards.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <CreditCardIcon className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No Saved Cards</h3>
                                <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                                    Link your first card to unlock borrowing access and a one-time N50 airtime reward.
                                </p>
                                <button
                                    onClick={() => {
                                        router.visit(route('cards.link'), { preserveScroll: true });
                                    }}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    Link Payment Card
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {cards.map((card) => (
                                    <CardItem
                                        key={card.id}
                                        card={card}
                                        onSetDefault={handleSetDefault}
                                        onDelete={handleDeleteCard}
                                        disabled={processing}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">PCI DSS Compliant</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Your payment information is tokenized and encrypted. We never store your full card details.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white relative overflow-hidden">
                            <CreditCardIcon className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <InformationCircleIcon className="w-5 h-5 text-sky-400" />
                                    Card Storage
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        { title: 'Secure Vault', desc: 'Managed by Paystack.' },
                                        { title: 'Auto-repay', desc: 'Used for due loans.' },
                                        { title: 'Easy Removal', desc: 'Unlink anytime.' },
                                    ].map((item, i) => (
                                        <li key={i} className="flex gap-3">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-sm">{item.title}</p>
                                                <p className="text-xs text-slate-400">{item.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-sky-50 rounded-[2rem] p-8 border border-sky-100">
                            <h3 className="text-lg font-bold text-sky-900 mb-4 flex items-center gap-2">
                                <ArrowPathIcon className="w-5 h-5 text-sky-600" />
                                Card-Link Fee
                            </h3>
                            <p className="text-sm text-sky-700 leading-relaxed">
                                Linking a card costs <span className="font-bold underline">N100</span>. Your first successful link also qualifies for a one-time <span className="font-bold underline">N50 airtime reward</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default CardsIndex;
