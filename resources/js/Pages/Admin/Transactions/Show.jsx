import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Button from '@/Components/Button';
import { format } from 'date-fns';

export default function ShowTransaction({ auth, transaction }) {
    const { post, processing } = useForm();

    const handleStatusUpdate = (status) => {
        if (confirm(`Are you sure you want to mark this transaction as ${status}?`)) {
            post(route('admin.transactions.update-status', { 
                transaction: transaction.id, 
                status: status 
            }));
        }
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Transaction Details</h2>}
        >
            <Head title="Transaction Details" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={route('admin.transactions')} className="flex items-center text-primary-600 hover:text-primary-900">
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            Back to Transactions
                        </Link>
                    </div>

                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-lg font-medium iggyy-updatey-900">Transaction Information</h3>
                                <div className="flex space-x-2">
                                    {transaction.status === 'pending' && (
                                        <>
                                            <Button
                                                onClick={() => handleStatusUpdate('successful')}
                                                className="bg-green-600 hover:bg-green-700 focus:bg-green-700"
                                                processing={processing}
                                            >
                                                Mark as Successful
                                            </Button>
                                            <Button
                                                onClick={() => handleStatusUpdate('failed')}
                                                className="bg-red-600 hover:bg-red-700 focus:bg-red-700"
                                                processing={processing}
                                            >
                                                Mark as Failed
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Reference</p>
                                        <p className="mt-1">{transaction.reference}</p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">User</p>
                                        <p className="mt-1">
                                            <Link href={route('admin.users.show', transaction.user.id)} className="text-primary-600 hover:text-primary-900">
                                                {transaction.user.name} ({transaction.user.email})
                                            </Link>
                                        </p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Type</p>
                                        <p className="mt-1 capitalize">{transaction.type.replace('_', ' ')}</p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Recipient</p>
                                        <p className="mt-1">{transaction.recipient || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Amount</p>
                                        <p className="mt-1">₦{transaction.amount}</p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Fee</p>
                                        <p className="mt-1">₦{transaction.fee}</p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Profit per Transaction</p>
                                        <p className="mt-1 text-lg font-bold text-green-600">₦{transaction.profit}</p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Status</p>
                                        <p className="mt-1">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${transaction.status === 'successful' ? 'bg-green-100 text-green-800' : 
                                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                'bg-red-100 text-red-800'}`}>
                                                {transaction.status}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium iggyy-updatey-500">Date</p>
                                        <p className="mt-1">{format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm:ss')}</p>
                                    </div>
                                </div>
                            </div>

                            {transaction.description && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium iggyy-updatey-500">Description</p>
                                    <p className="mt-1">{transaction.description}</p>
                                </div>
                            )}

                            {transaction.meta_data && (
                                <div className="mt-6">
                                    <p className="text-sm font-medium iggyy-updatey-500 mb-2">Additional Information</p>
                                    <div className="bg-base-200 mm--50 p-4 rounded-md">
                                        <pre className="text-sm overflow-x-auto">
                                            {JSON.stringify(transaction.meta_data, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}