import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    CheckIcon, 
    XMarkIcon, 
    DocumentTextIcon,
    ArrowLeftIcon,
    UserIcon,
    TagIcon,
    BanknotesIcon,
    CalendarIcon,
    ClockIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function Show({ auth, borrowing }) {
    const { post, processing } = useForm();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const handleProcessPayment = () => {
        if (confirm('Are you sure you want to process payment from the user\'s card for ₦' + formatCurrency(borrowing.total_amount).replace('₦', '') + '?')) {
            post(route('admin.borrowings.process-payment', borrowing.id));
        }
    };

    const handleTriggerRepayment = () => {
        if (confirm('Are you sure you want to trigger repayment for this borrowing?')) {
            post(route('admin.borrowings.trigger-repayment', borrowing.id));
        }
    };

    const handleMarkAsPaid = () => {
        if (confirm('Are you sure you want to mark this borrowing as paid?')) {
            post(route('admin.borrowings.mark-paid', borrowing.id));
        }
    };

    const handleApproveRepayment = () => {
        if (confirm('Are you sure you want to approve this repayment?')) {
            post(route('admin.borrowings.approve-repayment', borrowing.id));
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'active': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: ClockIcon, label: 'Active' };
            case 'overdue': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: ExclamationTriangleIcon, label: 'Overdue' };
            case 'paid': return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: CheckCircleIcon, label: 'Paid' };
            default: return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', icon: DocumentTextIcon, label: status };
        }
    };

    const statusConfig = getStatusConfig(borrowing.status);
    const StatusIcon = statusConfig.icon;

    // Parse transaction details
    const transactionDetails = typeof borrowing.service_details === 'string' 
        ? JSON.parse(borrowing.service_details) 
        : borrowing.service_details;

    // Parse transaction details if needed
    const txDetails = borrowing.transaction_details || transactionDetails || {};

    return (
        <AdminLayout 
            user={auth.user} 
            header={
                <div className="flex items-center space-x-4">
                    <Link 
                        href={route("admin.borrowings.index")} 
                        className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-600 hover:text-blue-600 transition-all active:scale-95"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="font-bold text-xl text-gray-900 leading-tight">Borrowing Details</h2>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{borrowing.reference}</p>
                    </div>
                </div>
            }
        >
            <Head title={`Borrowing ${borrowing.reference}`} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
                {/* Status Summary */}
                <div className={`mb-8 rounded-[2.5rem] border ${statusConfig.border} ${statusConfig.bg} p-8 text-center shadow-sm relative overflow-hidden`}>
                    <div className="absolute -top-6 -right-6 opacity-[0.05]">
                        <StatusIcon className="h-40 w-40" />
                    </div>
                    <div className={`inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-white shadow-sm border border-gray-50 mb-4`}>
                        <StatusIcon className={`h-8 w-8 ${statusConfig.color}`} />
                    </div>
                    <h3 className={`text-2xl font-black ${statusConfig.color} uppercase tracking-widest`}>
                        {statusConfig.label}
                    </h3>
                    <p className="text-gray-500 text-xs font-bold mt-1 uppercase tracking-widest">Reference: {borrowing.reference}</p>
                </div>

                <div className="space-y-6">
                    {/* Financial Summary Card */}
                    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-2">
                            <div className="p-8 text-center sm:text-left border-b sm:border-b-0 sm:border-r border-gray-50">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Original Amount</p>
                                <h4 className="text-3xl font-black text-gray-900">{formatCurrency(borrowing.amount)}</h4>
                            </div>
                            <div className="p-8 text-center sm:text-left bg-gray-50/30">
                                <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-2">Total Debt Due</p>
                                <h4 className="text-3xl font-black text-red-600">{formatCurrency(borrowing.total_amount)}</h4>
                            </div>
                        </div>
                    </div>

                    {/* Interest Rate Card */}
                    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-gray-100 pb-6 sm:pb-0 sm:pr-6">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Interest Rate</p>
                                <h4 className="text-2xl font-black text-gray-900">{borrowing.interest_rate}%</h4>
                            </div>
                            <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-gray-100 pb-6 sm:pb-0 sm:px-6">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Interest Amount</p>
                                <h4 className="text-2xl font-black text-orange-600">
                                    {formatCurrency(borrowing.total_amount - borrowing.amount)}
                                </h4>
                            </div>
                            <div className="text-center sm:text-left sm:pl-6">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Auto Deduction</p>
                                <h4 className={`text-sm font-bold ${borrowing.auto_deduction_enabled ? 'text-green-600' : 'text-gray-600'}`}>
                                    {borrowing.auto_deduction_enabled ? '✓ Enabled' : '✗ Disabled'}
                                </h4>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Service Info */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                            <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Account Details</h4>
                            <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                                <div className="flex items-start space-x-3">
                                    <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                                        <UserIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Borrower</p>
                                        <p className="text-sm font-black text-gray-900">{borrowing.user?.name}</p>
                                        <p className="text-xs text-gray-500 font-medium truncate">{borrowing.user?.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="h-10 w-10 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                                        <TagIcon className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Loan Type</p>
                                        <p className="text-sm font-black text-gray-900 capitalize">{borrowing.type}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                                        <CalendarIcon className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Due Date</p>
                                        <p className="text-sm font-black text-gray-900">{new Date(borrowing.due_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="h-10 w-10 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                                        <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Requested On</p>
                                        <p className="text-sm font-black text-gray-900">{new Date(borrowing.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    {Object.keys(txDetails).length > 0 && (
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                                <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Transaction Details</h4>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {txDetails.phone && (
                                        <div className="flex items-start space-x-3">
                                            <div className="h-10 w-10 rounded-2xl bg-cyan-50 flex items-center justify-center shrink-0">
                                                <DocumentTextIcon className="h-5 w-5 text-cyan-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Phone Number</p>
                                                <p className="text-sm font-black text-gray-900">{txDetails.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {txDetails.network && (
                                        <div className="flex items-start space-x-3">
                                            <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                                                <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Network</p>
                                                <p className="text-sm font-black text-gray-900 uppercase">{txDetails.network}</p>
                                            </div>
                                        </div>
                                    )}
                                    {txDetails.amount && (
                                        <div className="flex items-start space-x-3">
                                            <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                                                <BanknotesIcon className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Transaction Amount</p>
                                                <p className="text-sm font-black text-gray-900">{formatCurrency(txDetails.amount)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Repayments */}
                    {borrowing.repayments && borrowing.repayments.length > 0 && (
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                                <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Repayment History ({borrowing.repayments.length})</h4>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {borrowing.repayments.map((repayment) => (
                                    <div key={repayment.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-gray-900">{formatCurrency(repayment.amount)}</p>
                                                <p className="text-xs text-gray-500 font-medium mt-1">
                                                    {new Date(repayment.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                repayment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                repayment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {repayment.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin Actions */}
                    {borrowing.status === 'active' && (
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={handleProcessPayment}
                                disabled={processing}
                                className="flex-1 py-4 bg-red-600 text-white rounded-[1.5rem] font-black text-xs tracking-[0.2em] hover:bg-red-700 transition-all active:scale-[0.98] flex items-center justify-center shadow-xl shadow-red-100 disabled:opacity-50"
                            >
                                <BanknotesIcon className="h-5 w-5 mr-2" />
                                PAY NOW FROM CARD
                            </button>
                            <button
                                onClick={handleTriggerRepayment}
                                disabled={processing}
                                className="flex-1 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs tracking-[0.2em] hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center shadow-xl shadow-blue-100 disabled:opacity-50"
                            >
                                <ArrowPathIcon className="h-5 w-5 mr-2" />
                                TRIGGER REPAYMENT
                            </button>
                            <button
                                onClick={handleMarkAsPaid}
                                disabled={processing}
                                className="flex-1 py-4 bg-green-600 text-white rounded-[1.5rem] font-black text-xs tracking-[0.2em] hover:bg-green-700 transition-all active:scale-[0.98] flex items-center justify-center shadow-xl shadow-green-100 disabled:opacity-50"
                            >
                                <CheckIcon className="h-5 w-5 mr-2" />
                                MARK AS PAID
                            </button>
                        </div>
                    )}

                    {borrowing.status === 'paid' && (
                        <div className="bg-green-50 rounded-3xl p-6 border border-green-100 text-center">
                            <CheckCircleIcon className="h-10 w-10 text-green-600 mx-auto mb-2" />
                            <p className="text-xs font-bold text-green-700 uppercase tracking-widest leading-relaxed">
                                This borrowing has been fully cleared.<br/>
                                <span className="text-[10px] text-green-500 opacity-70">
                                    {borrowing.repaid_at ? `Cleared on ${new Date(borrowing.repaid_at).toLocaleDateString()}` : 'Status: Paid'}
                                </span>
                            </p>
                        </div>
                    )}

                    {borrowing.status === 'overdue' && (
                        <div className="bg-red-50 rounded-3xl p-6 border border-red-100 text-center">
                            <ExclamationTriangleIcon className="h-10 w-10 text-red-600 mx-auto mb-2" />
                            <p className="text-xs font-bold text-red-700 uppercase tracking-widest leading-relaxed">
                                This borrowing is overdue.<br/>
                                <span className="text-[10px] text-red-500 opacity-70">Due since {new Date(borrowing.due_date).toLocaleDateString()}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
