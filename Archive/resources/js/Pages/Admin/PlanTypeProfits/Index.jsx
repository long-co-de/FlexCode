import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PencilIcon, TrashIcon, PlusIcon, ArrowPathIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import Button from '@/Components/Button';
import Modal from '@/Components/Modal';

export default function PlanTypeProfitsIndex({ auth, planTypeProfits }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [planTypeToDelete, setPlanTypeToDelete] = useState(null);

    const { post, delete:deleplan, processing } = useForm();

    const confirmDelete = (planType) => {
        setPlanTypeToDelete(planType);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        deleplan(route('admin.plan-type-profits.destroy', planTypeToDelete.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setPlanTypeToDelete(null);
            },
        });
    };

    const updateAllSellingPrices = () => {
        post(route('admin.plan-type-profits.update-all-selling-prices'));
    };

    const fetchFromApi = () => {
        post(route('admin.plan-type-profits.fetch-from-api'));
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Manage Plan Type Profit Percentages</h2>}
        >
            <Head title="Manage Plan Type Profit Percentages" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                                <div className="flex items-center mb-4 md:mb-0">
                                    <h3 className="text-lg font-medium mr-4">Plan Type Profit Percentages</h3>
                                    <Link href={route('admin.plan-type-profits.create')} className="btn btn-primary btn-sm">
                                        <PlusIcon className="h-4 w-4 mr-1" />
                                        Add New
                                    </Link>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={updateAllSellingPrices}
                                        className="btn btn-secondary btn-sm"
                                        disabled={processing}
                                    >
                                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                        Update All Prices
                                    </Button>
                                    <Button
                                        onClick={fetchFromApi}
                                        className="btn btn-accent btn-sm"
                                        disabled={processing}
                                    >
                                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                                        Fetch from API
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>Plan Type</th>
                                            <th>Profit Percentage</th>
                                            <th>Data Plans Count</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {planTypeProfits.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4">
                                                    No plan type profit percentages found.
                                                </td>
                                            </tr>
                                        ) : (
                                            planTypeProfits.map((planType) => (
                                                <tr key={planType.id}>
                                                    <td>{planType.plan_type}</td>
                                                    <td>{planType.profit_percentage}%</td>
                                                    <td>{planType.data_plans_count}</td>
                                                    <td>
                                                        <span className={`badge ${planType.is_active ? 'badge-success' : 'badge-error'}`}>
                                                            {planType.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="flex space-x-2">
                                                            <Link
                                                                href={route('admin.plan-type-profits.edit', planType.id)}
                                                                className="btn btn-sm btn-outline"
                                                            >
                                                                <PencilIcon className="h-4 w-4" />
                                                            </Link>
                                                            <button
                                                                onClick={() => confirmDelete(planType)}
                                                                className="btn btn-sm btn-outline btn-error"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium igg-900">
                        Delete Plan Type Profit Percentage
                    </h2>
                    <p className="mt-1 text-sm igg-600">
                        Are you sure you want to delete the profit percentage for plan type "{planTypeToDelete?.plan_type}"?
                        {planTypeToDelete?.data_plans_count > 0 && (
                            <span className="text-red-500 font-semibold">
                                This will affect {planTypeToDelete.data_plans_count} data plans.
                            </span>
                        )}
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button
                            onClick={() => setShowDeleteModal(false)}
                            className="btn btn-outline"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="btn btn-error"
                            disabled={processing}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
