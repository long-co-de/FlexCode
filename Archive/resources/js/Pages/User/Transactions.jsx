import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Pagination from '@/Components/Pagination';

import { 
    FaWallet, 
    FaExchangeAlt, 
    FaMoneyBillWave, 
    FaArrowDown, 
    FaArrowUp,
    FaSearch,
    FaFilter,
    FaTimes,
    FaChevronRight,
    FaChevronLeft
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
                return <FaArrowDown className="text-green-600 text-xl" />;
            case 'wallet_transfer':
                return <FaExchangeAlt className="text-blue-600 text-xl" />;
            case 'airtime':
                return <FaWallet className="text-yellow-600 text-xl" />;
            case 'data':
                return <FaWallet className="text-purple-600 text-xl" />;
            case 'cable':
                return <FaWallet className="text-red-600 text-xl" />;
            case 'electricity':
                return <FaWallet className="text-orange-600 text-xl" />;
            case 'withdrawal':
                return <FaArrowUp className="igg-600 text-xl" />;
            default:
                return <FaWallet className="igg-600 text-xl" />;
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
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Transactions</h2>}
        >
            <Head title="Transactions" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 -ws border-b border-gray-200">
                            {/* Search and Filter Bar */}
                            <div className="mb-6">
                                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-grow">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaSearch className="igg-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search transactions..."
                                            className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md shadow-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowFilters(!showFilters)}
                                            className="inline-flex items-center px-4 py-2 bg-base-100 -ws border border-gray-300 rounded-md font-semibold text-xs igg-700 uppercase tracking-widest shadow-sm hover:bg-base-200 mm--50"
                                        >
                                            <FaFilter className="mr-2" /> Filters
                                        </button>
                                        
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-4 py-2 bg-primary border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-dark"
                                        >
                                            Search
                                        </button>
                                        
                                        {(filter.search || filter.type || filter.status) && (
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                className="inline-flex items-center px-4 py-2 bg-red-100 border border-transparent rounded-md font-semibold text-xs text-red-600 uppercase tracking-widest hover:bg-red-200"
                                            >
                                                <FaTimes className="mr-2" /> Clear
                                            </button>
                                        )}
                                    </div>
                                </form>
                                
                                {/* Filter Options */}
                                {showFilters && (
                                    <div className="mt-4 p-4 bg-base-200 mm--50 rounded-md">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium igg-700 mb-1">
                                                    Transaction Type
                                                </label>
                                                <select
                                                    value={selectedType}
                                                    onChange={(e) => setSelectedType(e.target.value)}
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                >
                                                    <option value="">All Types</option>
                                                    {transactionTypes.map((type) => (
                                                        <option key={type} value={type}>
                                                            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium igg-700 mb-1">
                                                    Status
                                                </label>
                                                <select
                                                    value={selectedStatus}
                                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                >
                                                    <option value="">All Statuses</option>
                                                    {statuses.map((status) => (
                                                        <option key={status} value={status}>
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Transactions List */}
                            {transactions.data.length > 0 ? (
                                <div className="space-y-4">
                                    {transactions.data.map((transaction) => (
                                        <Link 
                                            key={transaction.id} 
                                            href={route('transactions.show', transaction.id)}
                                            className="block bg-base-100 -ws p-4 rounded-lg shadow hover:shadow-md transition-all border border-gray-100"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className={`p-3 rounded-full mr-4 ${
                                                        transaction.type === 'wallet_funding' ? 'bg-green-100' :
                                                        transaction.type === 'wallet_transfer' ? 'bg-blue-100' :
                                                        transaction.type === 'airtime' ? 'bg-yellow-100' :
                                                        transaction.type === 'data' ? 'bg-purple-100' :
                                                        transaction.type === 'cable' ? 'bg-red-100' :
                                                        transaction.type === 'electricity' ? 'bg-orange-100' :
                                                        'bg-base-200 mm--100'
                                                    }`}>
                                                        {getTransactionIcon(transaction.type)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium capitalize">{transaction.type.replace('_', ' ')}</p>
                                                        <p className="text-sm igg-500">{transaction.description.substring(0, 40)}{transaction.description.length > 40 ? '...' : ''}</p>
                                                        <p className="text-xs igg-400">{formatDate(transaction.created_at)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${
                                                        transaction.type === 'wallet_funding' ? 'text-green-600' : 
                                                        transaction.type === 'withdrawal' ? 'text-red-600' : 
                                                        'igg-700'
                                                    }`}>
                                                        {transaction.type === 'wallet_funding' ? '+' : 
                                                         transaction.type === 'withdrawal' ? '-' : ''}
                                                        ₦{transaction.amount.toLocaleString()}
                                                    </p>
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        transaction.status === 'successful' ? 'bg-green-100 text-green-800' :
                                                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {transaction.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-base-100 -ws p-8 rounded-lg shadow text-center">
                                    <div className="flex justify-center mb-4">
                                        <FaWallet className="igg-300 text-5xl" />
                                    </div>
                                    <p className="igg-500">No transactions found.</p>
                                    <p className="text-sm igg-400 mt-2">
                                        {filter.search || filter.type || filter.status 
                                            ? 'Try adjusting your filters or search term.' 
                                            : 'Your transaction history will appear here.'}
                                    </p>
                                </div>
                            )}

                            {/* Pagination */}
                            <div className="mt-6">
                                <Pagination links={transactions.links} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}