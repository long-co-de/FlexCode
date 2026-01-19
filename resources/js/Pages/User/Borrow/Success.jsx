import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    FaCheckCircle, FaPhone, FaWifi, FaLightbulb, FaTv, 
    FaArrowRight, FaClock, FaHistory, FaInfoCircle, FaShieldAlt,
    FaMoneyBillWave, FaCalendarAlt
} from 'react-icons/fa';
import { GiReceiveMoney } from 'react-icons/gi';

const Success = ({ borrowing }) => {
    const { auth } = usePage().props;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const serviceIcons = {
        airtime: <FaPhone />,
        data: <FaWifi />,
        electricity: <FaLightbulb />,
        cable: <FaTv />    };

    const serviceColors = {
        airtime: 'text-info bg-info/10',
        data: 'text-success bg-success/10',
        electricity: 'text-error bg-error/10',
        cable: 'text-warning bg-warning/10'
    };

    const interestFee = Math.round(borrowing.amount * borrowing.interest_rate / 100);

    return (
        <AppLayout user={auth.user}>
            <Head title="Borrowing Successful" />
            
            <div className="py-12 max-w-3xl mx-auto px-4">
                {/* Success Card */}
                <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden rounded-3xl">
                    {/* Header Section */}
                    <div className="bg-gradient-to-br from-base-300 to-base-200 p-8 md:p-12 text-center relative overflow-hidden">
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-success/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-success/30 animate-bounce">
                                <FaCheckCircle className="text-3xl md:text-4xl text-success" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-base-content mb-2">Borrowing Successful!</h1>
                            <p className="text-base-content/60 text-sm">Your request has been processed and your account credited.</p>
                        </div>
                        
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-success/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-info/10 blur-3xl -ml-24 -mb-24 rounded-full"></div>
                    </div>

                    <div className="p-6 md:p-8 lg:p-12 space-y-8">
                        {/* Service Summary */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-base-200 rounded-3xl border border-base-300">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl ${serviceColors[borrowing.type] || 'text-primary bg-primary/10'}`}>
                                    {serviceIcons[borrowing.type] || <FaMoneyBillWave />}
                                </div>
                                <div className="text-center sm:text-left">
                                    <h3 className="font-bold text-base-content capitalize text-lg">{borrowing.type} Borrowed</h3>
                                    <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider break-all">Ref: {borrowing.reference}</p>
                                </div>
                            </div>
                            <div className="text-center sm:text-right">
                                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider leading-none mb-1">Amount</p>
                                <p className="text-xl md:text-2xl font-bold text-base-content break-words min-w-0 px-2">
                                    ₦{borrowing.amount.toLocaleString()}
                                </p>                            </div>
                        </div>

                        {/* Financial Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="bg-base-100 p-4 rounded-2xl border border-base-300">
                                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider leading-none mb-1">Interest</p>
                                <p className="text-lg font-bold text-error break-words">{borrowing.interest_rate}%</p>
                            </div>
                            <div className="bg-base-100 p-4 rounded-2xl border border-base-300">
                                <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider leading-none mb-1">Interest Fee</p>
                                <p className="text-lg font-bold text-error break-words">₦{interestFee.toLocaleString()}</p>
                            </div>
                            <div className="bg-info/10 p-4 rounded-2xl border border-info/20 col-span-2 md:col-span-1">
                                <p className="text-xs font-bold text-info uppercase tracking-wider leading-none mb-1">Total Repayment</p>
                                <p className="text-lg font-bold text-info break-words">₦{borrowing.total_amount.toLocaleString()}</p>                            </div>
                        </div>

                        {/* Repayment Banner */}
                        <div className="bg-warning/10 rounded-2xl p-6 border border-warning/20 relative overflow-hidden group">
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-warning flex items-center justify-center text-warning-content text-lg flex-shrink-0">
                                        <FaCalendarAlt />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-warning uppercase tracking-tight text-sm">Repayment Due Date</h4>
                                        <p className="text-xl md:text-2xl font-bold text-warning break-words">
                                            {formatDate(borrowing.due_date)}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-base-100/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-warning/30">
                                    <p className="text-xs font-bold text-warning leading-tight">
                                        Ensure funds are available for automatic settlement.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Details */}
                        <div className="space-y-3">
                            <h4 className="px-2 text-xs font-bold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
                                <FaInfoCircle /> Service Details
                            </h4>
                            <div className="bg-base-200 rounded-2xl p-5 border border-base-300 space-y-3">
                                {borrowing.type === 'airtime' && (
                                    <>
                                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1">
                                            <span className="font-bold text-base-content/60 uppercase tracking-wider text-xs">Network</span>
                                            <span className="font-bold text-base-content uppercase break-all text-sm text-right">
                                                {borrowing.transaction_details?.network || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1">
                                            <span className="font-bold text-base-content/60 uppercase tracking-wider text-xs">Phone Number</span>
                                            <span className="font-bold text-base-content break-all text-sm text-right">
                                                {borrowing.transaction_details?.phone || 'N/A'}
                                            </span>                                        </div>
                                    </>
                                )}
                                {borrowing.type === 'data' && (
                                    <>
                                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1">
                                            <span className="font-bold text-base-content/60 uppercase tracking-wider text-xs">Plan</span>
                                            <span className="font-bold text-base-content uppercase break-all text-sm text-right">
                                                {borrowing.transaction_details?.network || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1">
                                            <span className="font-bold text-base-content/60 uppercase tracking-wider text-xs">Recipient</span>
                                            <span className="font-bold text-base-content break-all text-sm text-right">
                                                {borrowing.transaction_details?.phone || 'N/A'}
                                            </span>                                        </div>
                                    </>
                                )}
                                {borrowing.type === 'electricity' && (
                                    <>
                                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1">
                                            <span className="font-bold text-base-content/60 uppercase tracking-wider text-xs">Provider</span>
                                            <span className="font-bold text-base-content uppercase break-all text-sm text-right">
                                                {borrowing.transaction_details?.provider || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1">
                                            <span className="font-bold text-base-content/60 uppercase tracking-wider text-xs">Meter Number</span>
                                            <span className="font-bold text-base-content break-all text-sm text-right">
                                                {borrowing.transaction_details?.meter || 'N/A'}
                                            </span>                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                            <Link
                                href={route('borrow.my-borrowings')}
                                className="btn btn-primary h-12 rounded-2xl gap-2"
                            >
                                <FaHistory />
                                <span className="text-sm font-bold">My Borrowings</span>
                            </Link>
                            <Link
                                href={route('dashboard')}
                                className="btn btn-outline h-12 rounded-2xl gap-2"
                            >
                                <FaArrowRight />
                                <span className="text-sm font-bold">Home Dashboard</span>                            </Link>
                        </div>
                    </div>
                </div>

                {/* Support Box */}
                <div className="mt-6 bg-info/10 rounded-2xl p-5 border border-info/20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center text-info">
                        <FaShieldAlt />
                    </div>
                    <p className="text-xs font-bold text-info leading-relaxed">
                        Need assistance? For any questions about this borrowing or repayment, 
                        contact our <Link href={route('contact')} className="text-info underline">support team</Link>.                    </p>
                </div>
            </div>
        </AppLayout>
    );
};

export default Success;