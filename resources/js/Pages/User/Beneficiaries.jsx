import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
import SelectInput from '@/Components/SelectInput';
import Modal from '@/Components/Modal';

export default function Beneficiaries({ auth, beneficiaries = [], serviceType, networks = [] }) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingBeneficiary, setEditingBeneficiary] = useState(null);
    const [activeTab, setActiveTab] = useState(serviceType || 'all');

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        phone_number: '',
        service_type: 'airtime',
        network_id: '',
        is_favorite: false,
        meta_data: {},
    });

    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        name: '',
        phone_number: '',
        service_type: '',
        network_id: '',
        is_favorite: false,
        meta_data: {},
    });

    const handleAddSubmit = (e) => {
        e.preventDefault();
        post(route('beneficiaries.store'), {
            onSuccess: () => {
                reset();
                setShowAddModal(false);
            },
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        put(route('beneficiaries.update', editingBeneficiary.id), {
            onSuccess: () => {
                resetEdit();
                setShowEditModal(false);
                setEditingBeneficiary(null);
            },
        });
    };

    const openEditModal = (beneficiary) => {
        setEditingBeneficiary(beneficiary);
        setEditData({
            name: beneficiary.name,
            phone_number: beneficiary.phone_number,
            service_type: beneficiary.service_type,
            network_id: beneficiary.network_id,
            is_favorite: beneficiary.is_favorite,
            meta_data: beneficiary.meta_data || {},
        });
        setShowEditModal(true);
    };

    const toggleFavorite = (beneficiary) => {
        axios.post(route('beneficiaries.toggle-favorite', beneficiary.id))
            .then(() => {
                // Refresh the page to show updated data
                window.location.reload();
            })
            .catch(error => {
                console.error('Error toggling favorite status:', error);
            });
    };

    const deleteBeneficiary = (beneficiary) => {
        if (confirm('Are you sure you want to delete this beneficiary?')) {
            axios.delete(route('beneficiaries.destroy', beneficiary.id))
                .then(() => {
                    // Refresh the page to show updated data
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error deleting beneficiary:', error);
                });
        }
    };

    const filteredBeneficiaries = activeTab === 'all'
        ? beneficiaries
        : beneficiaries.filter(b => b.service_type === activeTab);

    const serviceTypes = [
        { id: 'all', name: 'All' },
        { id: 'airtime', name: 'Airtime' },
        { id: 'data', name: 'Data' },
        { id: 'cable', name: 'Cable TV' },
        { id: 'electricity', name: 'Electricity' },
        { id: 'bank_transfer', name: 'Bank Transfer' },
    ];

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Manage Beneficiaries</h2>}
        >
            <Head title="Manage Beneficiaries" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium">Your Beneficiaries</h3>
                                <Button onClick={() => setShowAddModal(true)}>
                                    Add New Beneficiary
                                </Button>
                            </div>

                            {/* Service Type Tabs */}
                            <div className="flex overflow-x-auto space-x-2 mb-6 pb-2">
                                {serviceTypes.map((type) => (
                                    <Link
                                        key={type.id}
                                        type="button" href={route('beneficiaries.index', { type: type.id })}
                                        className={`px-4 py-2 whitespace-nowrap rounded-full text-sm font-medium ${
                                            activeTab === type.id
                                                ? 'bg-primary text-white'
                                                : 'bg-base-200 mm--100 igg-700 hover:bg-base-200 mm--200'
                                        }`}
                                        onClick={() => setActiveTab(type.id)}
                                    >
                                        {type.name}
                                    </Link>
                                ))}
                            </div>

                            {filteredBeneficiaries.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredBeneficiaries.map((beneficiary) => (
                                        <div
                                            key={beneficiary.id}
                                            className="border rounded-lg p-4 relative"
                                        >
                                            <div className="absolute top-2 right-2 flex space-x-2">
                                                <button
                                                    onClick={() => toggleFavorite(beneficiary)}
                                                    className="text-yellow-500 hover:text-yellow-600"
                                                >
                                                    {beneficiary.is_favorite ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(beneficiary)}
                                                    className="text-blue-500 hover:text-blue-600"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => deleteBeneficiary(beneficiary)}
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="mb-2">
                                                <h4 className="font-semibold text-lg">{beneficiary.name}</h4>
                                                <p className="text-sm igg-500">{beneficiary.phone_number}</p>
                                            </div>
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className="px-2 py-1 bg-base-200 mm--100 text-xs rounded-full capitalize">
                                                    {beneficiary.service_type.replace('_', ' ')}
                                                </span>
                                                {beneficiary.network && (
                                                    <span className="px-2 py-1 bg-blue-100 text-xs rounded-full">
                                                        {beneficiary.network.name}
                                                    </span>
                                                )}
                                            </div>
                                            {beneficiary.meta_data && (
                                                <div className="text-xs igg-500">
                                                    {beneficiary.meta_data.last_amount && (
                                                        <p>Last Amount: ₦{beneficiary.meta_data.last_amount}</p>
                                                    )}
                                                    {beneficiary.meta_data.last_data_amount && (
                                                        <p>Last Plan: {beneficiary.meta_data.last_data_amount}</p>
                                                    )}
                                                    {beneficiary.meta_data.airtime_type && (
                                                        <p>Airtime Type: {beneficiary.meta_data.airtime_type}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 igg-500">
                                    No beneficiaries found. Click "Add New Beneficiary" to add one.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Beneficiary Modal */}
            <Modal show={showAddModal} onClose={() => setShowAddModal(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium mb-4">Add New Beneficiary</h2>
                    <form onSubmit={handleAddSubmit}>
                        <div className="mb-4">
                            <InputLabel htmlFor="name" value="Name" />
                            <TextInput
                                id="name"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="phone_number" value="Phone Number" />
                            <TextInput
                                id="phone_number"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.phone_number}
                                onChange={(e) => setData('phone_number', e.target.value)}
                                required
                            />
                            <InputError message={errors.phone_number} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="service_type" value="Service Type" />
                            <SelectInput
                                id="service_type"
                                className="mt-1 block w-full"
                                value={data.service_type}
                                onChange={(e) => setData('service_type', e.target.value)}
                                required
                            >
                                <option value="airtime">Airtime</option>
                                <option value="data">Data</option>
                                <option value="cable">Cable TV</option>
                                <option value="electricity">Electricity</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </SelectInput>
                            <InputError message={errors.service_type} className="mt-2" />
                        </div>

                        {(data.service_type === 'airtime' || data.service_type === 'data') && (
                            <div className="mb-4">
                                <InputLabel htmlFor="network_id" value="Network" />
                                <SelectInput
                                    id="network_id"
                                    className="mt-1 block w-full"
                                    value={data.network_id}
                                    onChange={(e) => setData('network_id', e.target.value)}
                                    required
                                >
                                    <option value="">Select a network</option>
                                    {networks.map((network) => (
                                        <option key={network.id} value={network.id}>
                                            {network.name}
                                        </option>
                                    ))}
                                </SelectInput>
                                <InputError message={errors.network_id} className="mt-2" />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={data.is_favorite}
                                    onChange={(e) => setData('is_favorite', e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-sm igg-600">Mark as favorite</span>
                            </label>
                        </div>

                        <div className="flex justify-end mt-6">
                            <Button
                                onClick={() => setShowAddModal(false)}
                                className="mr-2"
                                type="button"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                processing={processing}
                            >
                                Add Beneficiary
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Beneficiary Modal */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium mb-4">Edit Beneficiary</h2>
                    <form onSubmit={handleEditSubmit}>
                        <div className="mb-4">
                            <InputLabel htmlFor="edit_name" value="Name" />
                            <TextInput
                                id="edit_name"
                                type="text"
                                className="mt-1 block w-full"
                                value={editData.name}
                                onChange={(e) => setEditData('name', e.target.value)}
                                required
                            />
                            <InputError message={editErrors.name} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="edit_phone_number" value="Phone Number" />
                            <TextInput
                                id="edit_phone_number"
                                type="text"
                                className="mt-1 block w-full"
                                value={editData.phone_number}
                                onChange={(e) => setEditData('phone_number', e.target.value)}
                                required
                            />
                            <InputError message={editErrors.phone_number} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="edit_service_type" value="Service Type" />
                            <SelectInput
                                id="edit_service_type"
                                className="mt-1 block w-full"
                                value={editData.service_type}
                                onChange={(e) => setEditData('service_type', e.target.value)}
                                required
                            >
                                <option value="airtime">Airtime</option>
                                <option value="data">Data</option>
                                <option value="cable">Cable TV</option>
                                <option value="electricity">Electricity</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </SelectInput>
                            <InputError message={editErrors.service_type} className="mt-2" />
                        </div>

                        {(editData.service_type === 'airtime' || editData.service_type === 'data') && (
                            <div className="mb-4">
                                <InputLabel htmlFor="edit_network_id" value="Network" />
                                <SelectInput
                                    id="edit_network_id"
                                    className="mt-1 block w-full"
                                    value={editData.network_id}
                                    onChange={(e) => setEditData('network_id', e.target.value)}
                                    required
                                >
                                    <option value="">Select a network</option>
                                    {networks.map((network) => (
                                        <option key={network.id} value={network.id}>
                                            {network.name}
                                        </option>
                                    ))}
                                </SelectInput>
                                <InputError message={editErrors.network_id} className="mt-2" />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={editData.is_favorite}
                                    onChange={(e) => setEditData('is_favorite', e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-sm igg-600">Mark as favorite</span>
                            </label>
                        </div>

                        <div className="flex justify-end mt-6">
                            <Button
                                onClick={() => setShowEditModal(false)}
                                className="mr-2"
                                type="button"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                processing={editProcessing}
                            >
                                Update Beneficiary
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AppLayout>
    );
}
