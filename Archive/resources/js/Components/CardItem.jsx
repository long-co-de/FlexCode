// File: resources/js/Components/Cards/CardItem.jsx
import React from 'react';

const CardItem = ({ card, onSetDefault, onDelete, disabled }) => {
    const getCardIcon = (type) => {
        switch (type.toLowerCase()) {
            case 'visa':
                return '🟦';
            case 'mastercard':
                return '🟥';
            case 'verve':
                return '🟪';
            default:
                return '💳';
        }
    };

    return (
        <li className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="text-2xl mr-4">
                        {getCardIcon(card.card_type)}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            {card.card_type} •••• {card.last_four}
                        </p>
                        <p className="text-sm text-gray-500">
                            Expires: {card.exp_month}/{card.exp_year}
                        </p>
                        <p className="text-sm text-gray-500">
                            {card.bank}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {card.is_default ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Default
                        </span>
                    ) : (
                        <button
                            onClick={() => onSetDefault(card.id)}
                            disabled={disabled}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Set Default
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(card.id)}
                        disabled={disabled || card.is_default}
                        className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </li>
    );
};

export default CardItem;