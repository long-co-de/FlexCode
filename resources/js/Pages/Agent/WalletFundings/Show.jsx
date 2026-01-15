import { Head, Link, useForm } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
import { 
    CheckCircleIcon, 
    XMarkIcon,
    ArrowLeftIcon,
    UserIcon,
    PhoneIcon,
    BanknotesIcon,
    CreditCardIcon,
    CalendarIcon,
    InformationCircleIcon,
    ClockIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function Show({ auth, funding }) {
    const { post, processing } = useForm();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const handleApprove = () => {
        if (confirm('Are you sure you want to approve this funding request?')) {
            post(route('agent.wallet-fundings.approve', funding.id));
        }
    };

    const handleReject = () => {
        if (confirm('Are you sure you want to reject this funding request?')) {
            post(route('agent.wallet-fundings.reject', funding.id));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-50 border-green-100';
            case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
            case 'rejected': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    return (
        <AgentLayout 
            user={auth.user} 
            header={
                <div className="flex items-center space-x-4">
                    <Link 
                        href={route("agent.wallet-fundings")} 
                        className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-600 hover:text-blue-600 transition-all active:scale-95"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="font-bold text-xl text-gray-900 leading-tight">Funding Details</h2>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{funding.transaction_id}</p>
                    </div>
                </div>
            }
        >
            <Head title="Funding Details" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
                {/* Amount Highlight */}
                <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 text-center mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                        <BanknotesIcon className="h-32 w-32 text-blue-600 -rotate-12" />
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Requesting Amount</p>
                    <h3 className="text-4xl font-black text-blue-600 leading-none mb-4">
                        {formatCurrency(funding.amount)}
                    </h3>
                    <div className={`inline-flex px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusColor(funding.status)}`}>
                        {funding.status}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                            <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Customer Information</h4>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                                        <UserIcon className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Full Name</p>
                                        <p className="text-sm font-black text-gray-900">{funding.user?.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                                        <PhoneIcon className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</p>
                                        <p className="text-sm font-black text-gray-900">{funding.user?.phone_number || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Info */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                            <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Payment Information</h4>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                                        <CreditCardIcon className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Method</p>
                                        <p className="text-sm font-black text-gray-900 capitalize">{funding.payment_method}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                                        <CalendarIcon className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Requested On</p>
                                        <p className="text-sm font-black text-gray-900">{new Date(funding.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                </div>
                            </div>

                            {funding.proof && (
                                <div className="mt-8 pt-6 border-t border-gray-50">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Proof</span>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50 p-2">
                                        <img src={funding.proof} alt="Proof of payment" className="w-full h-auto rounded-xl" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Admin Actions */}
                    {funding.status === 'pending' && (
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="flex-1 py-4 bg-white border-2 border-red-100 text-red-600 rounded-[1.5rem] font-black text-xs tracking-[0.2em] hover:bg-red-50 transition-all active:scale-[0.98] flex items-center justify-center shadow-sm disabled:opacity-50"
                            >
                                <XMarkIcon className="h-5 w-5 mr-2" />
                                REJECT REQUEST
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={processing}
                                className="flex-1 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs tracking-[0.2em] hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center shadow-xl shadow-blue-100 disabled:opacity-50"
                            >
                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                                APPROVE FUNDING
                            </button>
                        </div>
                    )}

                    {funding.status !== 'pending' && (
                        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 text-center">
                            <ShieldCheckIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                This request was {funding.status} on {new Date(funding.updated_at).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AgentLayout>
    );
}
