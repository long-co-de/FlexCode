import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    FaArrowLeft, FaCalendarAlt, FaHashtag, FaInfoCircle, 
    FaCheckCircle, FaClock, FaExclamationTriangle, FaWallet,
    FaPhone, FaWifi, FaBolt, FaHistory, FaRegCreditCard,
    FaShieldAlt, FaUndo
} from 'react-icons/fa';
import { GiReceiveMoney, GiPayMoney } from 'react-icons/gi';

const BorrowingDetails = ({ borrowing }) => {
    const { auth } = usePage().props;

    const getStatusStyles = (status) => {
        switch (status) {
            case 'paid':
                return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <FaCheckCircle /> };
            case 'overdue':
                return { bg: 'bg-rose-50', text: 'text-rose-600', icon: <FaExclamationTriangle /> };
            default:
                return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <FaClock /> };
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'data': return <FaWifi />;
            case 'airtime': return <FaPhone />;
            case 'electricity': return <FaBolt />;
            default: return <FaInfoCircle />;
        }
    };

    const statusStyle = getStatusStyles(borrowing.status);

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link 
                        href={route('borrow.my-borrowings')}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Borrowing Details</h2>
                        <p className="text-sm text-slate-500">Ref: {borrowing.reference}</p>
                    </div>
                </div>
            }
        >
            <Head title={`Borrowing Details - ${borrowing.reference}`} />

            <div className="py-8 max-w-4xl mx-auto px-4">
                <div className="grid gap-8">
                    {/* Status Header Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden relative">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-[1.5rem] ${statusStyle.bg} flex items-center justify-center text-3xl ${statusStyle.text} shadow-inner`}>
                                    {getTypeIcon(borrowing.type)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-2xl font-black text-slate-800 capitalize">{borrowing.type} Loan</h3>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${statusStyle.bg} ${statusStyle.text}`}>
                                            {statusStyle.icon}
                                            {borrowing.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 font-medium">Borrowed on {new Date(borrowing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount Due</p>
                                <p className="text-4xl font-black text-slate-900">₦{parseFloat(borrowing.total_amount).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Transaction Information */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <FaInfoCircle className="text-sky-500" />
                                Transaction Info
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-sm text-slate-400 font-bold">Principal Amount</span>
                                    <span className="text-sm text-slate-700 font-black">₦{parseFloat(borrowing.amount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-sm text-slate-400 font-bold">Interest Rate</span>
                                    <span className="text-sm text-emerald-500 font-black">{borrowing.interest_rate}%</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-sm text-slate-400 font-bold">Due Date</span>
                                    <span className="text-sm text-slate-700 font-black flex items-center gap-2">
                                        <FaCalendarAlt className="text-slate-300" />
                                        {new Date(borrowing.due_date).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                                {borrowing.repaid_at && (
                                    <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                        <span className="text-sm text-slate-400 font-bold">Paid On</span>
                                        <span className="text-sm text-emerald-600 font-black flex items-center gap-2">
                                            <FaCheckCircle className="text-emerald-400" />
                                            {new Date(borrowing.repaid_at).toLocaleDateString('en-GB')}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-sm text-slate-400 font-bold">Auto-Deduction</span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${borrowing.auto_deduction_enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                        {borrowing.auto_deduction_enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Service Details */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <FaShieldAlt className="text-sky-500" />
                                Service Details
                            </h4>
                            <div className="space-y-4">
                                {borrowing.transaction_details && Object.entries(borrowing.transaction_details).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center py-3 border-b border-slate-50">
                                        <span className="text-sm text-slate-400 font-bold capitalize">{key.replace('_', ' ')}</span>
                                        <span className="text-sm text-slate-700 font-black uppercase">{value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-sm text-slate-400 font-bold">Reference</span>
                                    <span className="text-[10px] text-slate-700 font-black flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                        <FaHashtag className="text-slate-300" />
                                        {borrowing.reference}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Repayment History */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <FaHistory className="text-sky-500" />
                                Repayment History
                            </h4>
                            <span className="px-3 py-1 rounded-full bg-white border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {borrowing.repayments?.length || 0} Records
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {borrowing.repayments && borrowing.repayments.length > 0 ? (
                                        borrowing.repayments.map((repayment) => (
                                            <tr key={repayment.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black text-slate-700 mb-0.5">{repayment.reference}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Gateway: {repayment.status}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 text-xs shadow-inner">
                                                            <FaRegCreditCard />
                                                        </div>
                                                        <span className="text-xs font-black text-slate-700 capitalize">{repayment.payment_method}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-sm font-black text-slate-800">₦{parseFloat(repayment.amount).toLocaleString()}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-bold text-slate-500">{new Date(repayment.created_at).toLocaleDateString('en-GB')}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                        repayment.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                    }`}>
                                                        {repayment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-20 text-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                    <FaUndo className="text-2xl text-slate-200" />
                                                </div>
                                                <p className="text-slate-400 text-sm font-bold">No repayment records found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="bg-sky-50 rounded-3xl p-6 border border-sky-100 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                            <FaInfoCircle />
                        </div>
                        <div>
                            <h5 className="text-sm font-black text-sky-900 mb-1">Payment Security Note</h5>
                            <p className="text-xs text-sky-700 leading-relaxed">
                                All repayments are processed through our secure payment partners. For card payments, your data is encrypted and never stored on our servers. Auto-deductions occur on the due date if enabled and you have a linked card.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default BorrowingDetails;
