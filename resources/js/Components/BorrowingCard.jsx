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
                color: 'badge-warning', 
                text: 'Active', 
                icon: <FaClock className="text-xs" /> 
            },
            overdue: { 
                color: 'badge-error', 
                text: 'Overdue', 
                icon: <FaExclamationTriangle className="text-xs" /> 
            },
            paid: { 
                color: 'badge-success', 
                text: 'Paid', 
                icon: <FaCheckCircle className="text-xs" /> 
            },
            failed: { 
                color: 'badge-neutral', 
                text: 'Failed', 
                icon: <FaExclamationTriangle className="text-xs" /> 
            }
        };
        return configs[status] || configs.active;
    };

    const getServiceConfig = (type) => {
        const configs = {
            airtime: { icon: <FaPhone />, color: 'bg-warning', label: 'Airtime' },
            data: { icon: <FaWifi />, color: 'bg-primary', label: 'Data' },
            electricity: { icon: <FaBolt />, color: 'bg-secondary', label: 'Electricity' },
            cable: { icon: <FaTv />, color: 'bg-accent', label: 'Cable TV' }
        };
        return configs[type] || { icon: <FaCreditCard />, color: 'bg-neutral', label: type };
    };

    const service = getServiceConfig(borrowing.type);
    const status = getStatusConfig(borrowing.status);

    return (
        <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="card-body p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-box ${service.color} flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105`}>
                            {service.icon}
                        </div>
                        <div className="flex-1 sm:flex-none">
                            <h3 className="font-bold text-base-content flex items-center gap-2 text-sm sm:text-base">
                                {service.label} Borrowing
                                <span className={`badge ${status.color} gap-1 text-[10px] font-bold uppercase tracking-wider`}>
                                    {status.icon}
                                    <span className="hidden sm:inline">{status.text}</span>
                                    <span className="sm:hidden">{status.text.charAt(0)}</span>
                                </span>
                            </h3>
                            <p className="text-xs text-base-content/60 font-medium mt-1">Ref: {borrowing.reference}</p>
                        </div>
                    </div>

                    <div className="text-right w-full sm:w-auto">
                        <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">Amount Due</p>
                        <p className="text-lg sm:text-xl font-bold text-base-content">₦{borrowing.total_amount.toLocaleString()}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 rounded-box bg-base-200 border border-base-300">
                    <div>
                        <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <FaCreditCard className="text-[10px]" />
                            Borrowed
                        </p>
                        <p className="text-sm font-bold text-base-content">₦{borrowing.amount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <FaPercentage className="text-[10px]" />
                            Interest
                        </p>
                        <p className="text-sm font-bold text-base-content">{borrowing.interest_rate}%</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <FaCalendarAlt className="text-[10px]" />
                            Due Date
                        </p>
                        <p className={`text-sm font-bold ${borrowing.status === 'overdue' ? 'text-error' : 'text-base-content'}`}>
                            {formatDate(borrowing.due_date)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <FaRobot className="text-[10px]" />
                            Auto-Pay
                        </p>
                        <p className="text-sm font-bold">
                            {borrowing.auto_deduction_enabled ? (
                                <span className="text-success">Enabled</span>
                            ) : (
                                <span className="text-base-content/60">Disabled</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                {borrowing.status === 'active' ? (
                    <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-6 border-t border-base-300">
                        {borrowing.auto_deduction_enabled && (
                            <button
                                onClick={() => onDisableAutoDeduction(borrowing.id)}
                                disabled={disabled}
                                className="btn btn-sm btn-outline btn-neutral flex-1 sm:flex-none"
                            >
                                <FaClock className="text-xs" />
                                <span className="ml-2">Disable Auto-Pay</span>
                            </button>
                        )}
                        <button
                            onClick={() => onRepay(borrowing.id)}
                            disabled={disabled}
                            className="btn btn-sm btn-primary flex-1 sm:flex-none shadow-lg"
                        >
                            {disabled ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <>
                                    Pay Now
                                    <FaArrowRight className="ml-2 text-xs" />
                                </>
                            )}
                        </button>
                        <Link
                            href={route('borrow.show', borrowing.id)}
                            className="btn btn-sm btn-outline flex-1 sm:flex-none"
                        >
                            <FaInfoCircle className="text-xs" />
                            <span className="ml-2">Details</span>
                        </Link>
                    </div>
                ) : (
                    <div className="mt-6 flex justify-end">
                        <Link
                            href={route('borrow.show', borrowing.id)}
                            className="btn btn-sm btn-outline w-full sm:w-auto"
                        >
                            View Transaction Log
                            <FaArrowRight className="ml-2 text-xs" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BorrowingCard;