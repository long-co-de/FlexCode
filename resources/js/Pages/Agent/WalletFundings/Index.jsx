import { Head, Link } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
import { 
    CheckCircleIcon, 
    ExclamationCircleIcon, 
    XMarkIcon,
    WalletIcon,
    ChevronRightIcon,
    UserIcon,
    CalendarIcon,
    BanknotesIcon,
    MagnifyingGlassIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function WalletFundings({ auth, walletFundings }) {
    const [searchTerm, setSearchTerm] = useState('');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const getStatusConfig = (status) => {
        const configs = {
            pending: { 
                bg: 'bg-yellow-50', 
                text: 'text-yellow-700', 
                border: 'border-yellow-100',
                icon: ExclamationCircleIcon,
                label: 'Pending'
            },
            approved: { 
                bg: 'bg-green-50', 
                text: 'text-green-700', 
                border: 'border-green-100',
                icon: CheckCircleIcon,
                label: 'Approved'
            },
            rejected: { 
                bg: 'bg-red-50', 
                text: 'text-red-700', 
                border: 'border-red-100',
                icon: XMarkIcon,
                label: 'Rejected'
            },
        };
        return configs[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', icon: CheckCircleIcon, label: status };
    };

    const filteredFundings = walletFundings?.filter(funding => 
        funding.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        funding.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <AgentLayout 
            user={auth.user} 
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-2xl text-gray-900 leading-tight">Wallet Fundings</h2>
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <WalletIcon className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            }
        >
            <Head title="Wallet Fundings" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative group">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by ID or customer name..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-700 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Mobile View: Cards */}
                <div className="block lg:hidden space-y-4">
                    {filteredFundings.length > 0 ? (
                        filteredFundings.map((funding) => {
                            const status = getStatusConfig(funding.status);
                            const Icon = status.icon;
                            return (
                                <Link 
                                    key={funding.id} 
                                    href={route('agent.wallet-fundings.show', funding.id)}
                                    className="block bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden active:scale-[0.98] transition-all"
                                >
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center mr-3 border border-gray-100">
                                                    <BanknotesIcon className="h-5 w-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">{funding.transaction_id}</p>
                                                    <p className="text-sm font-bold text-gray-900">{funding.user?.name}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.bg} ${status.text} ${status.border}`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Amount</p>
                                                <p className="text-lg font-black text-blue-600 leading-none">{formatCurrency(funding.amount)}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center text-gray-400 text-[11px] font-bold mb-1">
                                                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                                                    {new Date(funding.created_at).toLocaleDateString()}
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{funding.payment_method}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-3xl border border-gray-200 border-dashed p-12 text-center">
                            <WalletIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">No funding requests found</p>
                        </div>
                    )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden lg:block bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Funding Requests</h3>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                            {filteredFundings.length} Total
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Info</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {filteredFundings.length > 0 ? (
                                    filteredFundings.map((funding) => {
                                        const status = getStatusConfig(funding.status);
                                        return (
                                            <tr key={funding.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-xs font-mono font-bold text-gray-500 group-hover:text-blue-600 transition-colors">{funding.transaction_id}</span>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{new Date(funding.created_at).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                                            <UserIcon className="h-4 w-4 text-gray-500" />
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-800">{funding.user?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-blue-600">
                                                    {formatCurrency(funding.amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{funding.payment_method}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.bg} ${status.text} ${status.border}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <Link
                                                        href={route('agent.wallet-fundings.show', funding.id)}
                                                        className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-md border border-gray-100"
                                                    >
                                                        Details
                                                        <ChevronRightIcon className="h-3 w-3 ml-1" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic font-medium">
                                            No funding requests found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AgentLayout>
    );
}
