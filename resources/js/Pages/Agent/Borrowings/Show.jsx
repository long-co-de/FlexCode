import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
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

    const handleApprove = () => {
        if (confirm('Are you sure you want to approve this borrowing?')) {
            post(route('agent.borrowings.approve', borrowing.id));
        }
    };

    const handleReject = () => {
        if (confirm('Are you sure you want to reject this borrowing?')) {
            post(route('agent.borrowings.reject', borrowing.id));
        }
    };

    const handleMarkPaid = () => {
        if (confirm('Are you sure you want to mark this borrowing as paid?')) {
            post(route('agent.borrowings.mark-paid', borrowing.id));
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

    return (
        <AgentLayout 
            user={auth.user} 
            header={
                <div className="flex items-center space-x-4">
                    <Link 
                        href={route("agent.borrowings.index")} 
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

                            {borrowing.description && (
                                <div className="mt-8 pt-6 border-t border-gray-50">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Internal Description</p>
                                    <div className="bg-gray-50 rounded-2xl p-4 text-xs font-medium text-gray-600 italic leading-relaxed border border-gray-100">
                                        "{borrowing.description}"
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Agent Actions */}
                    {borrowing.status === 'active' && (
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="flex-1 py-4 bg-white border-2 border-red-100 text-red-600 rounded-[1.5rem] font-black text-xs tracking-[0.2em] hover:bg-red-50 transition-all active:scale-[0.98] flex items-center justify-center shadow-sm disabled:opacity-50"
                            >
                                <XMarkIcon className="h-5 w-5 mr-2" />
                                REJECT LOAN
                            </button>
                            <button
                                onClick={handleMarkPaid}
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
                                <span className="text-[10px] text-green-500 opacity-70">Completed on {new Date(borrowing.updated_at).toLocaleDateString()}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AgentLayout>
    );
}
