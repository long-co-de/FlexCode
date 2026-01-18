import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    FaArrowLeft, FaCalendarAlt, FaHashtag, FaInfoCircle, 
    FaCheckCircle, FaClock, FaExclamationTriangle, FaWallet,
    FaPhone, FaWifi, FaBolt, FaHistory, FaRegCreditCard,
    FaShieldAlt, FaUndo
} from 'react-icons/fa';

const BorrowingDetails = ({ borrowing }) => {
    const { auth } = usePage().props;

    const getStatusStyles = (status) => {
        switch (status) {
            case 'paid':
                return { 
                    color: 'badge-success', 
                    icon: <FaCheckCircle />,
                    bg: 'bg-success/10'
                };
            case 'overdue':
                return { 
                    color: 'badge-error', 
                    icon: <FaExclamationTriangle />,
                    bg: 'bg-error/10'
                };
            default:
                return { 
                    color: 'badge-warning', 
                    icon: <FaClock />,
                    bg: 'bg-warning/10'
                };
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

    const getTypeColor = (type) => {
        switch (type) {
            case 'data': return 'bg-primary';
            case 'airtime': return 'bg-warning';
            case 'electricity': return 'bg-secondary';
            default: return 'bg-neutral';
        }
    };

    const statusStyle = getStatusStyles(borrowing.status);
    const typeColor = getTypeColor(borrowing.type);

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-2 sm:gap-4">
                    <Link 
                        href={route('borrow.my-borrowings')}
                        className="btn btn-circle btn-sm btn-ghost"
                    >
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-base-content">Borrowing Details</h2>
                        <p className="text-xs sm:text-sm text-base-content/60">Ref: {borrowing.reference}</p>
                    </div>
                </div>
            }
        >
            <Head title={`Borrowing Details - ${borrowing.reference}`} />

            <div className="py-4 sm:py-8 max-w-4xl mx-auto px-2 sm:px-4">
                <div className="grid gap-4 sm:gap-8">
                    {/* Status Header Card */}
                    <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
                        <div className="card-body p-4 sm:p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-box ${typeColor} flex items-center justify-center text-white text-xl sm:text-3xl shadow-lg`}>
                                        {getTypeIcon(borrowing.type)}
                                    </div>
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                            <h3 className="text-lg sm:text-2xl font-bold text-base-content capitalize">
                                                {borrowing.type} Loan
                                            </h3>
                                            <div className={`badge ${statusStyle.color} gap-1.5 text-xs font-bold uppercase tracking-wider`}>
                                                {statusStyle.icon}
                                                {borrowing.status}
                                            </div>
                                        </div>
                                        <p className="text-sm text-base-content/60 font-medium">
                                            Borrowed on {new Date(borrowing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">
                                        Total Amount Due
                                    </p>
                                    <p className="text-2xl sm:text-4xl font-bold text-base-content">
                                        ₦{parseFloat(borrowing.total_amount).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
                        {/* Transaction Information */}
                        <div className="card bg-base-100 border border-base-300 shadow-sm">
                            <div className="card-body p-4 sm:p-8">
                                <h4 className="text-sm font-bold text-base-content uppercase tracking-wide mb-4 sm:mb-6 flex items-center gap-2">
                                    <FaInfoCircle className="text-primary" />
                                    Transaction Info
                                </h4>
                                <div className="space-y-2 sm:space-y-4">
                                    <div className="flex justify-between items-center py-2 sm:py-3 border-b border-base-200">
                                        <span className="text-sm text-base-content/60 font-medium">Principal Amount</span>
                                        <span className="text-sm text-base-content font-bold">₦{parseFloat(borrowing.amount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 sm:py-3 border-b border-base-200">
                                        <span className="text-sm text-base-content/60 font-medium">Interest Rate</span>
                                        <span className="text-sm text-success font-bold">{borrowing.interest_rate}%</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 sm:py-3 border-b border-base-200">
                                        <span className="text-sm text-base-content/60 font-medium">Due Date</span>
                                        <span className="text-sm text-base-content font-bold flex items-center gap-2">
                                            <FaCalendarAlt className="text-base-content/20" />
                                            {new Date(borrowing.due_date).toLocaleDateString('en-GB')}
                                        </span>
                                    </div>
                                    {borrowing.repaid_at && (
                                        <div className="flex justify-between items-center py-2 sm:py-3 border-b border-base-200">
                                            <span className="text-sm text-base-content/60 font-medium">Paid On</span>
                                            <span className="text-sm text-success font-bold flex items-center gap-2">
                                                <FaCheckCircle className="text-success" />
                                                {new Date(borrowing.repaid_at).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-2 sm:py-3">
                                        <span className="text-sm text-base-content/60 font-medium">Auto-Deduction</span>
                                        <div className={`badge ${borrowing.auto_deduction_enabled ? 'badge-success' : 'badge-neutral'}`}>
                                            {borrowing.auto_deduction_enabled ? 'Enabled' : 'Disabled'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Service Details */}
                        <div className="card bg-base-100 border border-base-300 shadow-sm">
                            <div className="card-body p-4 sm:p-8">
                                <h4 className="text-sm font-bold text-base-content uppercase tracking-wide mb-4 sm:mb-6 flex items-center gap-2">
                                    <FaShieldAlt className="text-primary" />
                                    Service Details
                                </h4>
                                <div className="space-y-2 sm:space-y-4">
                                    {borrowing.transaction_details && Object.entries(borrowing.transaction_details).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center py-2 sm:py-3 border-b border-base-200">
                                            <span className="text-sm text-base-content/60 font-medium capitalize">
                                                {key.replace('_', ' ')}
                                            </span>
                                            <span className="text-sm text-base-content font-bold uppercase">
                                                {value}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center py-2 sm:py-3">
                                        <span className="text-sm text-base-content/60 font-medium">Reference</span>
                                        <div className="badge badge-outline gap-1.5 px-2 sm:px-3 py-1.5">
                                            <FaHashtag className="text-base-content/40" />
                                            <span className="text-xs font-bold">{borrowing.reference}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Repayment History */}
                    <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
                        <div className="card-body p-0">
                            <div className="px-4 sm:px-8 py-4 border-b border-base-300 bg-base-200 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-base-content uppercase tracking-wide flex items-center gap-2">
                                    <FaHistory className="text-primary" />
                                    Repayment History
                                </h4>
                                <div className="badge badge-neutral">
                                    {borrowing.repayments?.length || 0} Records
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th className="text-xs font-bold text-base-content/60 uppercase tracking-wide">Reference</th>
                                            <th className="text-xs font-bold text-base-content/60 uppercase tracking-wide">Method</th>
                                            <th className="text-xs font-bold text-base-content/60 uppercase tracking-wide">Amount</th>
                                            <th className="text-xs font-bold text-base-content/60 uppercase tracking-wide">Date</th>
                                            <th className="text-xs font-bold text-base-content/60 uppercase tracking-wide text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {borrowing.repayments && borrowing.repayments.length > 0 ? (
                                            borrowing.repayments.map((repayment) => (
                                                <tr key={repayment.id}>
                                                    <td>
                                                        <div className="font-medium text-sm text-base-content">
                                                            {repayment.reference}
                                                        </div>
                                                        <div className="text-xs text-base-content/60">
                                                            Gateway: {repayment.status}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-box bg-primary/10 flex items-center justify-center text-primary">
                                                                <FaRegCreditCard />
                                                            </div>
                                                            <span className="text-sm font-medium text-base-content capitalize">
                                                                {repayment.payment_method}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="font-bold text-base-content">
                                                        ₦{parseFloat(repayment.amount).toLocaleString()}
                                                    </td>
                                                    <td className="text-sm text-base-content/60">
                                                        {new Date(repayment.created_at).toLocaleDateString('en-GB')}
                                                    </td>
                                                    <td className="text-right">
                                                        <div className={`badge ${repayment.status === 'success' ? 'badge-success' : 'badge-error'} gap-1`}>
                                                            {repayment.status}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5">
                                                    <div className="text-center py-8 sm:py-16">
                                                        <div className="w-16 h-16 bg-base-200 rounded-box flex items-center justify-center mx-auto mb-4">
                                                            <FaUndo className="text-2xl text-base-content/20" />
                                                        </div>
                                                        <p className="text-base-content/60 text-sm font-medium">
                                                            No repayment records found
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="alert bg-primary/90 border-primary/20 text-primary-content">
                        <FaInfoCircle className="text-primary" />
                        <div>
                            <h5 className="font-bold">Payment Security Note</h5>
                            <div className="text-xs sm:text-sm opacity-80">
                                All repayments are processed through our secure payment partners. For card payments, your data is encrypted and never stored on our servers. Auto-deductions occur on the due date if enabled and you have a linked card.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default BorrowingDetails;