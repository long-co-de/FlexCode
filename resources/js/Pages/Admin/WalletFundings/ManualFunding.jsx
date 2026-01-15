import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SelectInput from '@/Components/SelectInput';

export default function ManualFunding({ users }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        amount: '',
        description: '',
    });

    const [selectedUser, setSelectedUser] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.wallet-fundings.manual-funding.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleUserChange = (e) => {
        const userId = e.target.value;
        setData('user_id', userId);
        setSelectedUser(users.find(user => user.id == userId) || null);
    };

    return (
        <AdminLayout>
            <Head title="Manual Wallet Funding" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 -ws border-b border-gray-200">
                            <h1 className="text-2xl font-semibold igg-900 mb-6">Manual Wallet Funding</h1>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="user_id" value="Select User" />
                                    <SelectInput
                                        id="user_id"
                                        name="user_id"
                                        value={data.user_id}
                                        onChange={handleUserChange}
                                        className="mt-1 block w-full"
                                        required
                                    >
                                        <option value="">Select a user</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </SelectInput>
                                    <InputError message={errors.user_id} className="mt-2" />
                                </div>
                                
                                {selectedUser && (
                                    <div className="bg-base-200 mm--50 p-4 rounded-md">
                                        <h3 className="text-md font-medium igg-700">Selected User Details</h3>
                                        <p className="text-sm igg-600">Name: {selectedUser.name}</p>
                                        <p className="text-sm igg-600">Email: {selectedUser.email}</p>
                                        <p className="text-sm igg-600">Phone: {selectedUser.phone_number || 'N/A'}</p>
                                    </div>
                                )}
                                
                                <div>
                                    <InputLabel htmlFor="amount" value="Amount (₦)" />
                                    <TextInput
                                        id="amount"
                                        type="number"
                                        name="amount"
                                        value={data.amount}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('amount', e.target.value)}
                                        required
                                        min="100"
                                        step="0.01"
                                    />
                                    <InputError message={errors.amount} className="mt-2" />
                                </div>
                                
                                <div>
                                    <InputLabel htmlFor="description" value="Description (Optional)" />
                                    <TextInput
                                        id="description"
                                        type="text"
                                        name="description"
                                        value={data.description}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Reason for funding"
                                    />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>
                                
                                <div className="flex items-center justify-end">
                                    <PrimaryButton className="ml-4" disabled={processing}>
                                        Fund User Wallet
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}