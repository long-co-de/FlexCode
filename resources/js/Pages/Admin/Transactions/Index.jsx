import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '@/Components/Button';
import TextInput from '@/Components/TextInput';
import SelectInput from '@/Components/SelectInput';
import { format } from 'date-fns';
import { exportRowsToCsv, exportRowsToExcel } from '@/Utils/tableExport';

export default function TransactionsIndex({ auth, transactions, filter, transactionTypes, statuses }) {
    const [searchTerm, setSearchTerm] = useState(filter.search || '');
    const [selectedType, setSelectedType] = useState(filter.type || '');
    const [selectedStatus, setSelectedStatus] = useState(filter.status || '');

    const { get } = useForm();

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('admin.transactions', { 
            search: searchTerm, 
            type: selectedType,
            status: selectedStatus
        }));
    };

    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
        get(route('admin.transactions', { 
            search: searchTerm, 
            type: e.target.value,
            status: selectedStatus
        }));
    };

    const handleStatusChange = (e) => {
        setSelectedStatus(e.target.value);
        get(route('admin.transactions', { 
            search: searchTerm, 
            type: selectedType,
            status: e.target.value
        }));
    };

    const transactionExportRows = transactions.data.map((transaction) => ({
        Reference: transaction.reference,
        User: transaction.user?.name || 'N/A',
        Type: transaction.type?.replace(/_/g, ' ') || 'N/A',
        Recipient: transaction.recipient || 'N/A',
        Amount: transaction.amount || 0,
        Status: transaction.status,
        Date: format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm'),
    }));

    const handleExportTransactionsCsv = () => {
        exportRowsToCsv('admin-transactions.csv', transactionExportRows);
    };

    const handleExportTransactionsExcel = () => {
        exportRowsToExcel('admin-transactions.xls', 'Transactions', transactionExportRows);
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Transactions</h2>}
        >
            <Head title="Transactions" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                                <h3 className="text-lg font-medium mb-4 md:mb-0">All Transactions</h3>
                                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
                                    <form onSubmit={handleSearch} className="flex space-x-2">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MagnifyingGlassIcon className="h-5 w-5 iggyy-updatey-400" />
                                            </div>
                                            <TextInput
                                                type="text"
                                                placeholder="Search reference or recipient..."
                                                className="pl-10"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Button type="submit">Search</Button>
                                    </form>
                                    <SelectInput
                                        value={selectedType}
                                        onChange={handleTypeChange}
                                    >
                                        <option value="">All Types</option>
                                        {transactionTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                                            </option>
                                        ))}
                                    </SelectInput>
                                    <SelectInput
                                        value={selectedStatus}
                                        onChange={handleStatusChange}
                                    >
                                        <option value="">All Statuses</option>
                                        {statuses.map((status) => (
                                            <option key={status} value={status}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </option>
                                        ))}
                                    </SelectInput>
                                    <Button type="button" onClick={handleExportTransactionsCsv}>
                                        Export CSV
                                    </Button>
                                    <Button type="button" onClick={handleExportTransactionsExcel}>
                                        Export Excel
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-base-200 mm--50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Reference
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Recipient
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-base-100 divide-y divide-gray-200">
                                        {transactions.data.length > 0 ? (
                                            transactions.data.map((transaction) => (
                                                <tr key={transaction.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium iggyy-updatey-900">
                                                        {transaction.reference}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm iggyy-updatey-500">
                                                        <Link href={route('admin.users.show', transaction.user.id)} className="text-primary-600 hover:text-primary-900">
                                                            {transaction.user.name}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm iggyy-updatey-500">
                                                        <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm iggyy-updatey-500">
                                                        {transaction.recipient || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm iggyy-updatey-500">
                                                        ₦{transaction.amount}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${transaction.status === 'successful' ? 'bg-green-100 text-green-800' : 
                                                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                            'bg-red-100 text-red-800'}`}>
                                                            {transaction.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm iggyy-updatey-500">
                                                        {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <Link 
                                                            href={route('admin.transactions.show', transaction.id)} 
                                                            className="text-primary-600 hover:text-primary-900"
                                                        >
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-4 text-center text-sm iggyy-updatey-500">
                                                    No transactions found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                
                                {/* Pagination */}
                                {transactions.links && (
                                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm iggyy-updatey-700">
                                                    Showing <span className="font-medium">{transactions.from}</span> to{' '}
                                                    <span className="font-medium">{transactions.to}</span> of{' '}
                                                    <span className="font-medium">{transactions.total}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                    {transactions.links.map((link, i) => (
                                                        <Link
                                                            key={i}
                                                            href={link.url}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                link.active
                                                                    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                                                    : 'bg-base-100 border-gray-300 iggyy-updatey-500 hover:bg-base-200 mm--50'
                                                            } ${!link.url ? 'cursor-not-allowed' : ''}`}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ))}
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
