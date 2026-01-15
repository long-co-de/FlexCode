import React from 'react';
import { Link } from '@inertiajs/react';
import { 
    FaPhone, FaWifi, FaBolt, FaTv, FaCreditCard, 
    FaCalendarAlt, FaPercentage, FaCheckCircle, 
    FaExclamationTriangle, FaClock, FaArrowRight,
    FaInfoCircle, FaRobot
} from 'react-icons/fa';

const BorrowingCard = ({ borrowing, onRepay, onDisableAutoDeduction, disabled }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusConfig = (status) => {
        const configs = {
            active: { 
                color: 'text-sky-600 bg-sky-50 border-sky-100', 
                text: 'Active', 
                icon: <FaClock className="text-[10px]" /> 
            },
            overdue: { 
                color: 'text-rose-600 bg-rose-50 border-rose-100', 
                text: 'Overdue', 
                icon: <FaExclamationTriangle className="text-[10px]" /> 
            },
            paid: { 
                color: 'text-emerald-600 bg-emerald-50 border-emerald-100', 
                text: 'Paid', 
                icon: <FaCheckCircle className="text-[10px]" /> 
            },
            failed: { 
                color: 'text-slate-500 bg-slate-50 border-slate-100', 
                text: 'Failed', 
                icon: <FaExclamationTriangle className="text-[10px]" /> 
            }
        };
        return configs[status] || configs.active;
    };

    const getServiceConfig = (type) => {
        const configs = {
            airtime: { icon: <FaPhone />, color: 'bg-amber-500', label: 'Airtime' },
            data: { icon: <FaWifi />, color: 'bg-sky-500', label: 'Data' },
            electricity: { icon: <FaBolt />, color: 'bg-yellow-500', label: 'Electricity' },
            cable: { icon: <FaTv />, color: 'bg-purple-500', label: 'Cable TV' }
        };
        return configs[type] || { icon: <FaCreditCard />, color: 'bg-slate-500', label: type };
    };

    const service = getServiceConfig(borrowing.type);
    const status = getStatusConfig(borrowing.status);

    return (
        <div className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${service.color} flex items-center justify-center text-white shadow-lg shadow-${service.color.split('-')[1]}-100 transition-transform group-hover:scale-110`}>
                            {service.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                {service.label} Borrowing
                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${status.color}`}>
                                    {status.icon}
                                    {status.text}
                                </span>
                            </h3>
                            <p className="text-xs font-medium text-slate-400">Ref: {borrowing.reference}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount Due</p>
                            <p className="text-xl font-black text-slate-800">₦{borrowing.total_amount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-50">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <FaCreditCard className="text-[8px]" />
                            Borrowed
                        </p>
                        <p className="text-sm font-bold text-slate-700">₦{borrowing.amount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <FaPercentage className="text-[8px]" />
                            Interest
                        </p>
                        <p className="text-sm font-bold text-slate-700">{borrowing.interest_rate}%</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <FaCalendarAlt className="text-[8px]" />
                            Due Date
                        </p>
                        <p className={`text-sm font-bold ${borrowing.status === 'overdue' ? 'text-rose-600' : 'text-slate-700'}`}>
                            {formatDate(borrowing.due_date)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <FaRobot className="text-[8px]" />
                            Auto-Pay
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                            {borrowing.auto_deduction_enabled ? (
                                <span className="text-emerald-600">Enabled</span>
                            ) : (
                                <span className="text-slate-400">Disabled</span>
                            )}
                        </p>
                    </div>
                </div>

                {borrowing.status === 'active' && (
                    <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-slate-50">
                        {borrowing.auto_deduction_enabled && (
                            <button
                                onClick={() => onDisableAutoDeduction(borrowing.id)}
                                disabled={disabled}
                                className="h-10 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all flex items-center gap-2"
                            >
                                <FaClock className="opacity-50" />
                                Disable Auto-Pay
                            </button>
                        )}
                        <button
                            onClick={() => onRepay(borrowing.id)}
                            disabled={disabled}
                            className="h-10 px-6 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-lg shadow-sky-100 transition-all active:scale-[0.98] flex items-center gap-2"
                        >
                            {disabled ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <>
                                    Pay Now
                                    <FaArrowRight className="text-[10px]" />
                                </>
                            )}
                        </button>
                        <Link
                            href={route('borrow.show', borrowing.id)}
                            className="h-10 px-4 rounded-xl border border-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <FaInfoCircle className="opacity-50" />
                            Details
                        </Link>
                    </div>
                )}
                
                {borrowing.status !== 'active' && (
                    <div className="mt-6 flex justify-end">
                        <Link
                            href={route('borrow.show', borrowing.id)}
                            className="h-10 px-6 rounded-xl border border-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            View Transaction Log
                            <FaArrowRight className="text-[10px] opacity-50" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BorrowingCard;
