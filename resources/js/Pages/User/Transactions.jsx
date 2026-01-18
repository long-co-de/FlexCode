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
                return <FaPlus className="text-success" />;
            case 'wallet_transfer':
                return <FaExchangeAlt className="text-info" />;
            case 'airtime':
                return <FaWallet className="text-warning" />;
            case 'data':
                return <FaWallet className="text-secondary" />;
            case 'cable':
                return <FaWallet className="text-error" />;
            case 'electricity':
                return <FaWallet className="text-warning" />;
            case 'withdrawal':
                return <FaMinus className="text-error" />;
            default:
                return <FaHistory className="text-base-content/40" />;
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

    const getTransactionIconBg = (type) => {
        return type === 'wallet_funding' ? 'bg-success/10' :
               type === 'wallet_transfer' ? 'bg-info/10' :
               type === 'airtime' ? 'bg-warning/10' :
               type === 'data' ? 'bg-secondary/10' :
               type === 'cable' ? 'bg-error/10' :
               type === 'electricity' ? 'bg-warning/10' :
               type === 'withdrawal' ? 'bg-error/10' :
               'bg-base-200';
    };

    const getStatusBadgeClasses = (status) => {
        return status === 'successful' 
            ? 'badge-success text-success-content' 
            : status === 'pending' 
            ? 'badge-warning text-warning-content' 
            : 'badge-error text-error-content';
    };

    const getAmountColor = (type) => {
        return type === 'wallet_funding' ? 'text-success' : 
               type === 'withdrawal' ? 'text-error' : 
               'text-base-content';
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-base-content">Transaction History</h2>
                        <p className="text-sm text-base-content/60">Track all your account activities</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-base-100 px-4 py-2 rounded-xl shadow border border-base-300 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                                <FaWallet className="text-info text-sm" />
                            </div>
                            <div>
                                <p className="text-[10px] text-base-content/40 font-medium uppercase tracking-wider leading-none">Balance</p>
                                <p className="text-sm font-bold text-base-content">₦{auth.user.wallet_balance.toLocaleString()}</p>
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
                    <div className="bg-base-100 rounded-[2.5rem] p-6 shadow border border-base-300 mb-8">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-grow group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaSearch className="text-base-content/40 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by reference or description..."
                                    className="input input-bordered pl-12 pr-4 py-4 w-full rounded-2xl text-sm font-medium bg-base-200 border-base-300 focus:border-primary focus:ring-primary/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`btn rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] ${
                                        showFilters 
                                        ? 'btn-primary' 
                                        : 'btn-outline btn-secondary'
                                    }`}
                                >
                                    <FaFilter className="mr-2" /> Filters
                                </button>
                                
                                <button
                                    type="submit"
                                    className="btn btn-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] px-8 py-4"
                                >
                                    Search
                                </button>
                                
                                {(filter.search || filter.type || filter.status) && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="btn btn-ghost btn-circle text-error hover:bg-error/10"
                                        title="Clear filters"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </form>
                        
                        {/* Filter Options */}
                        {showFilters && (
                            <div className="mt-6 pt-6 border-t border-base-300 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                                <div>
                                    <label className="block text-[10px] font-black text-base-content/40 uppercase tracking-widest mb-3">
                                        Transaction Type
                                    </label>
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="select select-bordered w-full rounded-xl text-sm font-bold bg-base-200 border-base-300 focus:border-primary focus:ring-primary/20"
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
                                    <label className="block text-[10px] font-black text-base-content/40 uppercase tracking-widest mb-3">
                                        Status
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="select select-bordered w-full rounded-xl text-sm font-bold bg-base-200 border-base-300 focus:border-primary focus:ring-primary/20"
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
                                        className="group card bg-base-100 p-6 rounded-[2rem] shadow border border-base-300 hover:border-primary hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110 ${getTransactionIconBg(tx.type)}`}>
                                                    {getTransactionIcon(tx.type)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-black text-base-content uppercase tracking-tight capitalize">
                                                            {tx.type.replace('_', ' ')}
                                                        </p>
                                                        <span className="text-base-content/30">•</span>
                                                        <div className="flex items-center gap-1 text-[10px] text-base-content/40 font-bold uppercase tracking-widest">
                                                            <FaCalendarAlt className="text-[8px]" />
                                                            {formatDate(tx.created_at)}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-base-content/60 font-medium line-clamp-1 max-w-[200px] sm:max-w-md">
                                                        {tx.description}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right flex items-center gap-6">
                                                <div className="hidden sm:block">
                                                    <p className={`text-sm font-black mb-1 ${getAmountColor(tx.type)}`}>
                                                        {tx.type === 'wallet_funding' ? '+' : tx.type === 'withdrawal' ? '-' : ''}
                                                        ₦{tx.amount.toLocaleString()}
                                                    </p>
                                                    <div className={`badge badge-sm ${getStatusBadgeClasses(tx.status)} font-black uppercase tracking-[0.15em]`}>
                                                        {tx.status}
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center text-base-content/30 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
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
                            <div className="card bg-base-100 rounded-[2.5rem] p-16 shadow border border-base-300 text-center">
                                <div className="w-24 h-24 bg-base-200 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                                    <FaHistory className="text-base-content/30 text-4xl" />
                                </div>
                                <h3 className="text-lg font-black text-base-content mb-2">No Transactions Found</h3>
                                <p className="text-sm text-base-content/60 max-w-xs mx-auto">
                                    {filter.search || filter.type || filter.status 
                                        ? 'We couldn\'t find any transactions matching your filters.' 
                                        : 'Your transaction history is empty. Start using BorrowLite to see your activity here!'}
                                </p>
                                {(filter.search || filter.type || filter.status) && (
                                    <button 
                                        onClick={clearFilters}
                                        className="mt-6 text-primary font-black text-xs uppercase tracking-widest hover:text-primary-focus transition-colors"
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