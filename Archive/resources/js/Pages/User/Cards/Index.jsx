// File: resources/js/Pages/User/Cards/Index.jsx
import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AddCardModal from '@/Components/AddCardModal';
import CardItem from '@/Components/CardItem';
import AppLayout from '@/Layouts/AppLayout';

const CardsIndex = () => {
    const { props } = usePage();
    const { cards, paystackPublicKey } = props;
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleCardAdded = () => {
        setShowAddModal(false);
        // Refresh page or update cards list
        window.location.reload();
    };

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
            <Head title="My Cards" />
            
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Cards</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage your saved cards for automatic deductions
                    </p>
                </div>

                {/* Card list */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">
                            Saved Cards ({cards.length})
                        </h2>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            + Add New Card
                        </button>
                    </div>
                    
                    {cards.length === 0 ? (
                        <div className="px-4 py-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No cards</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Get started by adding a payment card.
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150"
                                >
                                    + Add New Card
                                </button>
                            </div>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {cards.map((card) => (
                                <CardItem
                                    key={card.id}
                                    card={card}
                                    onSetDefault={handleSetDefault}
                                    onDelete={handleDeleteCard}
                                    disabled={processing}
                                />
                            ))}
                        </ul>
                    )}
                </div>

                {/* Info section */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">How card storage works</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Cards are securely stored by Paystack (PCI DSS compliant)</li>
                                    <li>We only store tokenized references, not your actual card details</li>
                                    <li>Default cards are used for automatic repayments</li>
                                    <li>You can remove cards at any time</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Card Modal */}
            {showAddModal && (
                <AddCardModal
                    paystackPublicKey={paystackPublicKey}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={handleCardAdded}
                />
            )}
        </AppLayout>
    );
};

export default CardsIndex;