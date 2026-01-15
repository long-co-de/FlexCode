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
import { CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Transactions({ auth, transactions, filters }) {
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState(null);

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
        });
        get(route('agent.transactions'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AgentLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Transactions</h2>}
        >
            <Head title="Transactions" />

            <div className="py-6">
                <div className="dashboard-card mb-6">
                    <h3 className="text-lg font-medium mb-4">Filter Transactions</h3>

                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <InputLabel htmlFor="search" value="Search" />
                            <TextInput
                                id="search"
                                type="text"
                                className="mt-1 block w-full"
                                placeholder="Reference or User"
                                value={filterData.search}
                                onChange={(e) => setFilterData('search', e.target.value)}
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="status" value="Status" />
                            <SelectInput
                                id="status"
                                className="mt-1 block w-full"
                                value={filterData.status}
                                onChange={(e) => setFilterData('status', e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                            </SelectInput>
                        </div>

                        <div>
                            <InputLabel htmlFor="date_from" value="From Date" />
                            <TextInput
                                id="date_from"
                                type="date"
                                className="mt-1 block w-full"
                                value={filterData.date_from}
                                onChange={(e) => setFilterData('date_from', e.target.value)}
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="date_to" value="To Date" />
                            <TextInput
                                id="date_to"
                                type="date"
                                className="mt-1 block w-full"
                                value={filterData.date_to}
                                onChange={(e) => setFilterData('date_to', e.target.value)}
                            />
                        </div>

                        <div className="md:col-span-4 flex justify-end space-x-3">
                            <Button
                                type="button"
                                className="bg-base-200"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </Button>
                            <Button
                                type="submit"
                                processing={filterProcessing}
                            >
                                <MagnifyingGlassIcon className="h-5 w-5 mr-1" />
                                Filter
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="dashboard-card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium igg-800">Transaction List</h3>
                        <div className="text-sm igg-500">
                            {transactions.total} transactions found
                        </div>
                    </div>

                    {transactions.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="table-modern">
                                    <thead>
                                        <tr>
                                            <th>Reference</th>
                                            <th>User</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.data.map((transaction) => (
                                            <tr key={transaction.id}>
                                                <td className="font-medium igg-700">{transaction.reference}</td>
                                                <td>{transaction.user?.name || 'Unknown'}</td>
                                                <td>{transaction.type}</td>
                                                <td>₦{transaction.amount}</td>
                                                <td>
                                                    <span className={`badge ${
                                                        transaction.status === 'success' ? 'badge-success' :
                                                        transaction.status === 'pending' ? 'badge-warning' :
                                                        'badge-danger'
                                                    }`}>
                                                        {transaction.status}
                                                    </span>
                                                </td>
                                                <td>{transaction.created_at}</td>
                                                <td>
                                                    {transaction.status === 'pending' && (
                                                        <button
                                                            onClick={() => openVerifyModal(transaction)}
                                                            className="btn btn-sm btn-primary"
                                                        >
                                                            Verify
                                                        </button>
                                                    )}
                                                    {transaction.status !== 'pending' && (
                                                        <Link
                                                            href={route('agent.transactions.show', transaction.id)}
                                                            className="btn btn-sm btn-outline"
                                                        >
                                                            View
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6">
                                <Pagination links={transactions.links} />
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="igg-500">No transactions found</p>
                        </div>
                    )}
                </div>

                {/* Verify Transaction Modal */}
                <Modal show={showVerifyModal} onClose={closeVerifyModal}>
                    <div className="p-6">
                        <h2 className="text-lg font-medium mb-4">Verify Transaction</h2>

                        {currentTransaction && (
                            <div className="mb-6 bg-base-100 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm igg-500">Reference</p>
                                        <p className="font-medium">{currentTransaction.reference}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm igg-500">User</p>
                                        <p className="font-medium">{currentTransaction.user?.name || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm igg-500">Type</p>
                                        <p className="font-medium">{currentTransaction.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm igg-500">Amount</p>
                                        <p className="font-medium">₦{currentTransaction.amount}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm igg-500">Description</p>
                                        <p className="font-medium">{currentTransaction.description || 'No description'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleVerifySubmit}>
                            <div className="mb-4">
                                <InputLabel htmlFor="status" value="Verification Status" />
                                <SelectInput
                                    id="status"
                                    className="mt-1 block w-full"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    required
                                >
                                    <option value="">Select Status</option>
                                    <option value="success">Approve (Success)</option>
                                    <option value="failed">Reject (Failed)</option>
                                </SelectInput>
                                <InputError message={errors.status} className="mt-2" />
                            </div>

                            <div className="mb-4">
                                <InputLabel htmlFor="notes" value="Notes" />
                                <TextInput
                                    id="notes"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Add verification notes (optional)"
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex justify-end mt-6">
                                <Button
                                    onClick={closeVerifyModal}
                                    className="mr-2"
                                    type="button"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    processing={processing}
                                >
                                    Submit Verification
                                </Button>
                            </div>
                        </form>
                    </div>
                </Modal>
            </div>
        </AgentLayout>
    );
}
