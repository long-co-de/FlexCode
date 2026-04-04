import { Link } from '@inertiajs/react';
import { format } from 'date-fns';

export default function TransactionTable({ transactions, viewRoute = 'transactions.show' }) {
    const displayAmount = (transaction) => {
        const shouldMaskForUser = viewRoute === 'transactions.show' && transaction.type === 'card_linking';
        const amount = shouldMaskForUser ? 0 : Number(transaction.amount || 0);
        return amount.toFixed(2);
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-base-200">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                            Reference
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                            Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                            Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                            Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                            Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-base-100 divide-y divide-gray-200">
                    {transactions?.data?.length > 0 ? (
                        transactions.data.map((transaction) => (
                            <tr key={transaction.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium -900">
                                    {transaction.reference}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm -500">
                                    <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm -500">
                                    NGN {displayAmount(transaction)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${transaction.status === 'successful' ? 'bg-green-100 text-green-800' : 
                                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800'}`}>
                                        {transaction.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm -500">
                                    {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Link
                                        href={route(viewRoute, transaction.id)}
                                        className="text-primary-600 hover:text-primary-900 mr-3"
                                    >
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="px-6 py-4 text-center text-sm -500">
                                No transactions found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {transactions?.links && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm -700">
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
                                                : 'bg-base-100 border-gray-300 -500 hover:bg-base-200 mm--50'
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
    );
}
