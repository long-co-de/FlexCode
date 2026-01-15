import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
import { 
    ArrowPathIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    DocumentTextIcon,
    ChevronRightIcon,
    CalendarIcon,
    UserIcon,
    BanknotesIcon,
    MagnifyingGlassIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function Borrowings({ auth, borrowings }) {
    const [searchTerm, setSearchTerm] = useState('');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const getStatusConfig = (status) => {
        const statusConfig = {
            active: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: ClockIcon, label: 'Active' },
            overdue: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', icon: ExclamationTriangleIcon, label: 'Overdue' },
            paid: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100', icon: CheckCircleIcon, label: 'Paid' },
        };
        return statusConfig[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', icon: DocumentTextIcon, label: status };
    };

    const filteredBorrowings = borrowings.data?.filter(b => 
        b.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <AgentLayout 
            user={auth.user} 
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-2xl text-gray-900 leading-tight">Borrowings</h2>
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            }
        >
            <Head title="Borrowings Management" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative group">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by reference or customer name..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-700 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Mobile View: Cards */}
                <div className="block lg:hidden space-y-4">
                    {filteredBorrowings.length > 0 ? (
                        filteredBorrowings.map((borrowing) => {
                            const status = getStatusConfig(borrowing.status);
                            return (
                                <Link 
                                    key={borrowing.id} 
                                    href={route('agent.borrowings.show', borrowing.id)}
                                    className="block bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden active:scale-[0.98] transition-all"
                                >
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center mr-3 border border-gray-100">
                                                    <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">{borrowing.reference}</p>
                                                    <p className="text-sm font-bold text-gray-900">{borrowing.user?.name}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.bg} ${status.text} ${status.border}`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50 mb-4">
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Borrowed</p>
                                                <p className="text-sm font-bold text-gray-900">{formatCurrency(borrowing.amount)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Due</p>
                                                <p className="text-sm font-black text-red-600">{formatCurrency(borrowing.total_amount)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-gray-400 text-[11px] font-bold">
                                                <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                                                Due: {new Date(borrowing.due_date).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center text-blue-600 text-xs font-bold uppercase tracking-widest">
                                                Details
                                                <ChevronRightIcon className="h-3 w-3 ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-3xl border border-gray-200 border-dashed p-12 text-center">
                            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">No borrowings found</p>
                        </div>
                    )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden lg:block bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Customer Borrowings</h3>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                            {filteredBorrowings.length} Total
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Borrowing Info</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Due</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {filteredBorrowings.length > 0 ? (
                                    filteredBorrowings.map((borrowing) => {
                                        const status = getStatusConfig(borrowing.status);
                                        return (
                                            <tr key={borrowing.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-xs font-mono font-bold text-gray-500 group-hover:text-blue-600 transition-colors">{borrowing.reference}</span>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Due: {new Date(borrowing.due_date).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                                            <UserIcon className="h-4 w-4 text-gray-500" />
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-800">{borrowing.user?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider capitalize">{borrowing.type}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                                    {formatCurrency(borrowing.amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-red-600">
                                                    {formatCurrency(borrowing.total_amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.bg} ${status.text} ${status.border}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <Link
                                                        href={route('agent.borrowings.show', borrowing.id)}
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
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500 italic font-medium">
                                            No borrowings found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {borrowings.links && borrowings.links.length > 3 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {borrowings.links.map((link, index) => (
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                        link.active 
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span 
                                    key={index} 
                                    className="px-4 py-2 text-gray-300 text-xs font-bold uppercase tracking-widest"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </AgentLayout>
    );
}
