import { Head, Link } from "@inertiajs/react";
import AgentLayout from "@/Layouts/AgentLayout";
import { 
    ArrowLeftIcon, 
    BanknotesIcon, 
    UserIcon, 
    CalendarIcon, 
    TagIcon,
    InformationCircleIcon,
    ArrowPathIcon,
    CheckBadgeIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    ClipboardIcon,
    DevicePhoneMobileIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function TransactionDetails({ auth, transaction }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'successful':
            case 'success':
                return {
                    icon: CheckBadgeIcon,
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                    border: 'border-green-100',
                    label: 'Successful'
                };
            case 'pending':
                return {
                    icon: ClockIcon,
                    color: 'text-yellow-600',
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-100',
                    label: 'Pending'
                };
            case 'failed':
                return {
                    icon: ExclamationTriangleIcon,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    border: 'border-red-100',
                    label: 'Failed'
                };
            default:
                return {
                    icon: InformationCircleIcon,
                    color: 'text-gray-600',
                    bg: 'bg-gray-50',
                    border: 'border-gray-100',
                    label: status
                };
        }
    };

    const statusStyles = getStatusStyles(transaction.status);
    const StatusIcon = statusStyles.icon;

    return (
        <AgentLayout
            user={auth.user}
            header={
                <div className="flex items-center space-x-4">
                    <Link 
                        href={route("agent.transactions")} 
                        className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-600 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="font-bold text-xl text-gray-900 leading-tight">Transaction Details</h2>
                        <p className="text-xs text-gray-500 font-medium">Viewing details for {transaction.reference}</p>
                    </div>
                </div>
            }
        >
            <Head title={`Transaction ${transaction.reference}`} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
                {/* Status Banner */}
                <div className={`mb-8 rounded-3xl border ${statusStyles.border} ${statusStyles.bg} p-6 text-center shadow-sm`}>
                    <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full ${statusStyles.bg} border-4 border-white shadow-sm mb-4`}>
                        <StatusIcon className={`h-8 w-8 ${statusStyles.color}`} />
                    </div>
                    <h3 className={`text-2xl font-black ${statusStyles.color} uppercase tracking-wider`}>
                        {statusStyles.label}
                    </h3>
                    <p className="text-gray-500 text-sm font-medium mt-1">Transaction Ref: {transaction.reference}</p>
                </div>

                <div className="space-y-6">
                    {/* Primary Details Card */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Core Information</h4>
                            <button 
                                onClick={() => copyToClipboard(transaction.reference)}
                                className="flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                {copied ? 'COPIED!' : (
                                    <>
                                        <ClipboardIcon className="h-3.5 w-3.5 mr-1" />
                                        COPY REF
                                    </>
                                )}
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                                <div className="flex items-start space-x-3">
                                    <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                                        <BanknotesIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Amount Paid</p>
                                        <p className="text-lg font-black text-gray-900">₦{Number(transaction.amount).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="h-10 w-10 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                                        <TagIcon className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Service Type</p>
                                        <p className="text-base font-bold text-gray-900 capitalize">{String(transaction.type || "").replace("_", " ")}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="h-10 w-10 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                                        <UserIcon className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Customer Name</p>
                                        <p className="text-base font-bold text-gray-900">{transaction.user?.name || "Guest Customer"}</p>
                                        <p className="text-xs text-gray-500 font-medium truncate max-w-[150px]">{transaction.user?.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                                        <CalendarIcon className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Execution Date</p>
                                        <p className="text-base font-bold text-gray-900">{new Date(transaction.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                        <p className="text-xs text-gray-500 font-medium">{new Date(transaction.created_at).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Details Card */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Service Details</h4>
                        </div>
                        <div className="p-6 space-y-4">
                            {transaction.recipient && (
                                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                    <div className="flex items-center space-x-3">
                                        <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                                        <span className="text-sm font-semibold text-gray-500">Recipient</span>
                                    </div>
                                    <span className="text-sm font-black text-gray-900">{transaction.recipient}</span>
                                </div>
                            )}

                            {transaction.description && (
                                <div className="pt-2">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <InformationCircleIcon className="h-5 w-5 text-gray-400" />
                                        <span className="text-sm font-semibold text-gray-500">Product Description</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-4 text-sm font-medium text-gray-700 leading-relaxed italic border border-gray-100">
                                        "{transaction.description}"
                                    </div>
                                </div>
                            )}

                            {!transaction.recipient && !transaction.description && (
                                <div className="text-center py-4">
                                    <p className="text-sm text-gray-400 font-medium italic">No additional service details available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Verification Action (If Pending) */}
                    {transaction.status === 'pending' && (
                        <div className="bg-blue-600 rounded-3xl p-6 shadow-xl shadow-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                                    <ArrowPathIcon className="h-6 w-6 text-white animate-spin-slow" />
                                </div>
                                <div className="text-center sm:text-left">
                                    <h4 className="text-white font-bold text-lg">Verification Required</h4>
                                    <p className="text-blue-100 text-xs font-medium">This transaction is awaiting manual approval.</p>
                                </div>
                            </div>
                            <Link
                                href={route("agent.transactions")}
                                className="w-full sm:w-auto px-8 py-3 bg-white text-blue-600 rounded-2xl font-black text-xs tracking-widest hover:bg-blue-50 transition-all active:scale-95 text-center shadow-lg"
                            >
                                GO TO VERIFY
                            </Link>
                        </div>
                    )}
                </div>

                {/* Footer Message */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">End of Transaction Record</p>
                    <div className="h-1 w-8 bg-gray-100 rounded-full mx-auto mt-2"></div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
            `}} />
        </AgentLayout>
    );
}
