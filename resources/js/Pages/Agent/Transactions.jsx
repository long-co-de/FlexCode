import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
import Button from '@/Components/Button';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import SelectInput from '@/Components/SelectInput';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    MagnifyingGlassIcon, 
    FunnelIcon,
    ChevronRightIcon,
    CalendarIcon,
    ArrowPathIcon,
    UserIcon,
    ClockIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';

export default function Transactions({ auth, transactions, filters }) {
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        transaction_id: '',
        status: '',
        notes: '',
    });

    const { data: filterData, setData: setFilterData, get, processing: filterProcessing } = useForm({
        search: filters.search || '',
        status: filters.status || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        user_id: filters.user_id || '',
    });

    const openVerifyModal = (transaction) => {
        setCurrentTransaction(transaction);
        setData({
            transaction_id: transaction.id,
            status: '',
            notes: '',
        });
        setShowVerifyModal(true);
    };

    const closeVerifyModal = () => {
        setShowVerifyModal(false);
        setCurrentTransaction(null);
        reset();
    };

    const handleVerifySubmit = (e) => {
        e.preventDefault();
        post(route('agent.transactions.update', data.transaction_id), {
            onSuccess: () => {
                closeVerifyModal();
            },
        });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        get(route('agent.transactions'), {
            data: filterData,
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setFilterData({
            search: '',
            status: '',
            date_from: '',
            date_to: '',
            user_id: '',
        });
        get(route('agent.transactions'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'successful':
            case 'success':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'failed':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <AgentLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-2xl text-gray-900 leading-tight">Transactions</h2>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'}`}
                    >
                        <FunnelIcon className="h-5 w-5" />
                    </button>
                </div>
            }
        >
            <Head title="Transactions" />

            <div className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Search and Filters */}
                <div className={`mb-6 transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 mb-0'}`}>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <FunnelIcon className="h-5 w-5 mr-2 text-blue-600" />
                            Filter Transactions
                        </h3>

                        <form onSubmit={handleFilterSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <InputLabel htmlFor="search" value="Search" className="text-gray-700 font-medium mb-1" />
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <TextInput
                                            id="search"
                                            type="text"
                                            className="block w-full pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                            placeholder="Ref, user, email..."
                                            value={filterData.search}
                                            onChange={(e) => setFilterData('search', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="status" value="Status" className="text-gray-700 font-medium mb-1" />
                                    <SelectInput
                                        id="status"
                                        className="block w-full bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                        value={filterData.status}
                                        onChange={(e) => setFilterData('status', e.target.value)}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="successful">Success</option>
                                        <option value="failed">Failed</option>
                                    </SelectInput>
                                </div>

                                <div>
                                    <InputLabel htmlFor="date_from" value="From Date" className="text-gray-700 font-medium mb-1" />
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <TextInput
                                            id="date_from"
                                            type="date"
                                            className="block w-full pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                            value={filterData.date_from}
                                            onChange={(e) => setFilterData('date_from', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="date_to" value="To Date" className="text-gray-700 font-medium mb-1" />
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <TextInput
                                            id="date_to"
                                            type="date"
                                            className="block w-full pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                            value={filterData.date_to}
                                            onChange={(e) => setFilterData('date_to', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    Clear all filters
                                </button>
                                <Button
                                    type="submit"
                                    disabled={filterProcessing}
                                    className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                                >
                                    {filterProcessing ? (
                                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                                    )}
                                    Apply Filters
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Mobile View: Cards */}
                <div className="block lg:hidden space-y-4">
                    {transactions.data.length > 0 ? (
                        transactions.data.map((transaction) => (
                            <div key={transaction.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden active:scale-[0.98] transition-all">
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                                                <BanknotesIcon className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 leading-none mb-1">{transaction.reference}</p>
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{transaction.type.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(transaction.status)}`}>
                                            {transaction.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">User</p>
                                            <p className="text-sm font-semibold text-gray-800 truncate">{transaction.user?.name || 'Guest'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Amount</p>
                                            <p className="text-sm font-bold text-blue-600">₦{parseFloat(transaction.amount).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3">
                                        <div className="flex items-center text-gray-400">
                                            <ClockIcon className="h-3.5 w-3.5 mr-1" />
                                            <span className="text-[11px] font-medium">{new Date(transaction.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {transaction.status === 'pending' ? (
                                                <button
                                                    onClick={() => openVerifyModal(transaction)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                                >
                                                    Verify Now
                                                </button>
                                            ) : (
                                                <Link
                                                    href={route('agent.transactions.show', transaction.id)}
                                                    className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors border border-gray-100 flex items-center"
                                                >
                                                    View Details
                                                    <ChevronRightIcon className="h-3 w-3 ml-1 text-gray-400" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center">
                            <BanknotesIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No transactions found</p>
                        </div>
                    )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transaction Info</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {transactions.data.length > 0 ? (
                                    transactions.data.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                                        <BanknotesIcon className="h-4.5 w-4.5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{transaction.reference}</div>
                                                        <div className="text-xs text-gray-500 font-medium capitalize">{transaction.type.replace('_', ' ')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                                                        <UserIcon className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-700">{transaction.user?.name || 'Guest'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-blue-600">₦{parseFloat(transaction.amount).toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(transaction.status)}`}>
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-gray-500">
                                                    <ClockIcon className="h-3.5 w-3.5 mr-1" />
                                                    <span className="text-xs font-medium">{new Date(transaction.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {transaction.status === 'pending' ? (
                                                    <button
                                                        onClick={() => openVerifyModal(transaction)}
                                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        Verify
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href={route('agent.transactions.show', transaction.id)}
                                                        className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all border border-gray-100"
                                                    >
                                                        View
                                                        <ChevronRightIcon className="h-3 w-3 ml-1 text-gray-400" />
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <BanknotesIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">No transactions found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="mt-8 flex justify-center">
                    <Pagination links={transactions.links} />
                </div>

                {/* Verify Transaction Modal */}
                <Modal show={showVerifyModal} onClose={closeVerifyModal} maxWidth="md">
                    <div className="p-0 overflow-hidden rounded-2xl">
                        <div className="bg-blue-600 p-6 text-white relative">
                            <h2 className="text-xl font-bold">Verify Transaction</h2>
                            <p className="text-blue-100 text-sm mt-1">Review and update transaction status</p>
                            <button onClick={closeVerifyModal} className="absolute top-6 right-6 text-blue-200 hover:text-white transition-colors">
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {currentTransaction && (
                                <div className="mb-6 bg-gray-50 rounded-2xl border border-gray-100 p-4">
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Reference</p>
                                            <p className="text-sm font-bold text-gray-900 truncate">{currentTransaction.reference}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">User</p>
                                            <p className="text-sm font-bold text-gray-900 truncate">{currentTransaction.user?.name || 'Guest'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Type</p>
                                            <p className="text-sm font-bold text-gray-900 capitalize">{currentTransaction.type.replace('_', ' ')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Amount</p>
                                            <p className="text-sm font-black text-blue-600">₦{parseFloat(currentTransaction.amount).toLocaleString()}</p>
                                        </div>
                                        <div className="col-span-2 pt-2 border-t border-gray-100">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Description</p>
                                            <p className="text-xs font-medium text-gray-600 leading-relaxed">{currentTransaction.description || 'No additional details provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleVerifySubmit} className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="modal_status" value="Update Status" className="text-gray-700 font-bold text-xs uppercase tracking-wider mb-1.5" />
                                    <SelectInput
                                        id="modal_status"
                                        className="block w-full bg-gray-50 border-gray-200 focus:bg-white focus:ring-blue-500 transition-all rounded-xl"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        required
                                    >
                                        <option value="">Choose action...</option>
                                        <option value="success">Approve Transaction</option>
                                        <option value="failed">Reject Transaction</option>
                                    </SelectInput>
                                    <InputError message={errors.status} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="notes" value="Verification Notes" className="text-gray-700 font-bold text-xs uppercase tracking-wider mb-1.5" />
                                    <TextInput
                                        id="notes"
                                        type="text"
                                        className="block w-full bg-gray-50 border-gray-200 focus:bg-white focus:ring-blue-500 transition-all rounded-xl"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Add any internal remarks..."
                                    />
                                    <InputError message={errors.notes} className="mt-2" />
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={closeVerifyModal}
                                        className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 justify-center py-3 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 rounded-xl font-black text-xs tracking-widest"
                                    >
                                        {processing ? (
                                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                        ) : (
                                            'CONFIRM VERIFICATION'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Modal>
            </div>
        </AgentLayout>
    );
}
