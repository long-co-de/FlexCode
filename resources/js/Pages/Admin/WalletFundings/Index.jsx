import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
// import { formatCurrency } from '@/utils';

export default function Index({ walletFundings, stats, filters, paymentMethods }) {
    return (
        <AdminLayout>
            <Head title="Wallet Fundings" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold igg-900">Wallet Fundings</h1>
                        <Link
                            href={route('admin.wallet-fundings.manual-funding')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Manual Fund User
                        </Link>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm igg-500">Total Fundings</div>
                            <div className="text-2xl font-semibold">{stats.total}</div>
                        </div>
                        <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm igg-500">Successful Fundings</div>
                            <div className="text-2xl font-semibold text-green-600">{stats.successful}</div>
                        </div>
                        <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm igg-500">Total Amount</div>
                            <div className="text-2xl font-semibold">{(stats.total_amount)}</div>
                        </div>
                    </div>
                    
                    {/* Wallet Fundings Table */}
                    <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 -ws border-b border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-base-200 mm--50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                            Reference
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                            Payment Method
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-base-100 -ws divide-y divide-gray-200">
                                    {walletFundings.data.map((funding) => (
                                        <tr key={funding.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                {funding.reference}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium igg-900">{funding.user.name}</div>
                                                <div className="text-sm igg-500">{funding.user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                {(funding.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                {funding.payment_method}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${funding.status === 'successful' ? 'bg-green-100 text-green-800' : 
                                                    funding.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                    'bg-red-100 text-red-800'}`}>
                                                    {funding.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                {new Date(funding.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {/* <Link href={route('admin.wallet-fundings.show', funding.id)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                                    View
                                                </Link> */}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}