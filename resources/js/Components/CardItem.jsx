// File: resources/js/Components/Cards/CardItem.jsx
import React from 'react';
import { 
    TrashIcon, 
    CheckCircleIcon, 
    StarIcon as StarSolid,
    CreditCardIcon
} from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

const CardItem = ({ card, onSetDefault, onDelete, disabled }) => {
    const getCardBrand = (type) => {
        const t = type.toLowerCase();
        if (t.includes('visa')) return { name: 'Visa', color: 'bg-blue-600' };
        if (t.includes('mastercard')) return { name: 'Mastercard', color: 'bg-orange-600' };
        if (t.includes('verve')) return { name: 'Verve', color: 'bg-teal-600' };
        return { name: 'Card', color: 'bg-slate-700' };
    };

    const brand = getCardBrand(card.card_type);

    return (
        <div className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-sky-100 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    {/* Virtual Card Icon */}
                    <div className={`w-16 h-11 ${brand.color} rounded-xl shadow-lg flex flex-col justify-between p-2 relative overflow-hidden group-hover:scale-105 transition-transform`}>
                        <div className="w-4 h-3 bg-yellow-400/80 rounded-sm" /> {/* Chip */}
                        <div className="flex justify-between items-end">
                            <div className="text-[8px] text-white font-bold tracking-widest opacity-80 uppercase">
                                {brand.name}
                            </div>
                            <div className="flex gap-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-slate-900 leading-none">
                                •••• {card.last_four}
                            </h4>
                            {card.is_default && (
                                <div className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded-md text-[10px] font-black uppercase tracking-wider">
                                    Primary
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                            <span className="text-xs font-bold uppercase tracking-tighter">{card.bank}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-xs font-medium">Exp {card.exp_month}/{card.exp_year}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:ml-auto">
                    {!card.is_default ? (
                        <button
                            onClick={() => onSetDefault(card.id)}
                            disabled={disabled}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-600 font-bold text-xs rounded-xl transition-all border border-transparent hover:border-sky-100"
                        >
                            <StarOutline className="w-4 h-4" />
                            Set Primary
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 text-sky-600 font-bold text-xs rounded-xl">
                            <CheckCircleIcon className="w-4 h-4" />
                            Primary Card
                        </div>
                    )}
                    
                    <button
                        onClick={() => onDelete(card.id)}
                        disabled={disabled || card.is_default}
                        className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed group/del"
                        title="Remove Card"
                    >
                        <TrashIcon className="w-5 h-5 group-hover/del:scale-110 transition-transform" />
                    </button>
                </div>
            </div>
            
            {/* Hover Indicator */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-12 bg-sky-500 rounded-r-full transition-all duration-300" />
        </div>
    );
};

export default CardItem;