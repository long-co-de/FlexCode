import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Pagination from '@/Components/Pagination';
import { 
    FaWallet, FaExchangeAlt, FaMoneyBillWave, FaArrowDown, 
    FaArrowUp, FaSearch, FaFilter, FaTimes, FaChevronRight,
    FaHistory, FaCalendarAlt, FaCheckCircle, FaExclamationCircle,
    FaTimesCircle, FaPlus, FaMinus
} from 'react-icons/fa';

export default function Transactions({ auth, transactions, transactionTypes, statuses, filter }) {
    const [searchTerm, setSearchTerm] = useState(filter.search || '');
    const [selectedType, setSelectedType] = useState(filter.type || '');
    const [selectedStatus, setSelectedStatus] = useState(filter.status || '');
    const [showFilters, setShowFilters] = useState(false);
    
    const handleSearch = (e) => {
        e.preventDefault();
        window.location.href = route('transactions', {
            search: searchTerm,
            type: selectedType,
            status: selectedStatus
        });
    };
    
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedType('');
        setSelectedStatus('');
        window.location.href = route('transactions');
    };
    
    const getTransactionIcon = (type) => {
        switch(type) {
            case 'wallet_funding':
                return <FaPlus className="text-emerald-500" />;
            case 'wallet_transfer':
                return <FaExchangeAlt className="text-blue-500" />;
            case 'airtime':
                return <FaWallet className="text-amber-500" />;
            case 'data':
                return <FaWallet className="text-purple-500" />;
            case 'cable':
                return <FaWallet className="text-rose-500" />;
            case 'electricity':
                return <FaWallet className="text-orange-500" />;
            case 'withdrawal':
                return <FaMinus className="text-rose-500" />;
            default:
                return <FaHistory className="text-slate-400" />;
        }
    };
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Transaction History</h2>
                        <p className="text-sm text-slate-500">Track all your account activities</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                                <FaWallet className="text-sky-600 text-sm" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none">Balance</p>
                                <p className="text-sm font-bold text-slate-700">₦{auth.user.wallet_balance.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Transactions" />

            <div className="py-8">
                <div className="max-w-5xl mx-auto px-4">
                    {/* Search & Filter Header */}
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 mb-8">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-grow group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaSearch className="text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by reference or description..."
                                    className="pl-12 pr-4 py-4 w-full bg-slate-50 border-transparent focus:bg-white focus:border-sky-500 focus:ring-sky-200 rounded-2xl text-sm font-medium transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`inline-flex items-center px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${
                                        showFilters 
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                                        : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                                    }`}
                                >
                                    <FaFilter className="mr-2" /> Filters
                                </button>
                                
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-8 py-4 bg-sky-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-sky-100 hover:bg-sky-400 transition-all"
                                >
                                    Search
                                </button>
                                
                                {(filter.search || filter.type || filter.status) && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all border border-rose-100"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </form>
                        
                        {/* Filter Options */}
                        {showFilters && (
                            <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                        Transaction Type
                                    </label>
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="w-full py-3 px-4 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-sky-500 focus:ring-sky-200 text-sm font-bold"
                                    >
                                        <option value="">All Types</option>
                                        {transactionTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type.replace('_', ' ').toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                        Status
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full py-3 px-4 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-sky-500 focus:ring-sky-200 text-sm font-bold"
                                    >
                                        <option value="">All Statuses</option>
                                        {statuses.map((status) => (
                                            <option key={status} value={status}>
                                                {status.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transactions List */}
                    <div className="space-y-4">
                        {transactions.data.length > 0 ? (
                            <>
                                {transactions.data.map((tx) => (
                                    <Link 
                                        key={tx.id} 
                                        href={route('transactions.show', tx.id)}
                                        className="group block bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-50 transition-all animate-in fade-in slide-in-from-bottom-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110 ${
                                                    tx.type === 'wallet_funding' ? 'bg-emerald-50' :
                                                    tx.type === 'wallet_transfer' ? 'bg-blue-50' :
                                                    tx.type === 'airtime' ? 'bg-amber-50' :
                                                    tx.type === 'data' ? 'bg-purple-50' :
                                                    tx.type === 'cable' ? 'bg-rose-50' :
                                                    tx.type === 'electricity' ? 'bg-orange-50' :
                                                    'bg-slate-50'
                                                }`}>
                                                    {getTransactionIcon(tx.type)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight capitalize">
                                                            {tx.type.replace('_', ' ')}
                                                        </p>
                                                        <span className="text-slate-300">•</span>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                            <FaCalendarAlt className="text-[8px]" />
                                                            {formatDate(tx.created_at)}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-[200px] sm:max-w-md">
                                                        {tx.description}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right flex items-center gap-6">
                                                <div className="hidden sm:block">
                                                    <p className={`text-sm font-black mb-1 ${
                                                        tx.type === 'wallet_funding' ? 'text-emerald-600' : 
                                                        tx.type === 'withdrawal' ? 'text-rose-600' : 
                                                        'text-slate-700'
                                                    }`}>
                                                        {tx.type === 'wallet_funding' ? '+' : tx.type === 'withdrawal' ? '-' : ''}
                                                        ₦{tx.amount.toLocaleString()}
                                                    </p>
                                                    <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${
                                                        tx.status === 'successful' ? 'bg-emerald-100 text-emerald-700' :
                                                        tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {tx.status}
                                                    </span>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-sky-50 group-hover:text-sky-500 transition-colors">
                                                    <FaChevronRight className="text-xs" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                
                                <div className="mt-10">
                                    <Pagination links={transactions.links} />
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] p-16 shadow-sm border border-slate-100 text-center">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                                    <FaHistory className="text-slate-300 text-4xl" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-2">No Transactions Found</h3>
                                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                                    {filter.search || filter.type || filter.status 
                                        ? 'We couldn\'t find any transactions matching your filters.' 
                                        : 'Your transaction history is empty. Start using Paylow to see your activity here!'}
                                </p>
                                {(filter.search || filter.type || filter.status) && (
                                    <button 
                                        onClick={clearFilters}
                                        className="mt-6 text-sky-600 font-black text-xs uppercase tracking-widest hover:text-sky-700"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
