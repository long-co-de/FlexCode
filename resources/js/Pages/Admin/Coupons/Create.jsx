import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
// import TextArea from '@/Components/TextArea';

export default function Create({ auth }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        expires_at: '',
        description: '',
        quantity: '1',
        prefix: 'PI',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.coupons.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Create Treasure Hunt Code</h2>}
        >
            <Head title="Create Treasure Hunt Code" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 -ws border-b border-gray-200">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <InputLabel htmlFor="prefix" value="Prefix (Default: PI)" />
                                    <TextInput
                                        id="prefix"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.prefix}
                                        onChange={(e) => setData('prefix', e.target.value)}
                                        maxLength={10}
                                    />
                                    <p className="text-sm igg-500 mt-1">
                                        This prefix will be added to all generated codes (e.g., PI-1234567890)
                                    </p>
                                    <InputError message={errors.prefix} className="mt-2" />
                                </div>
                                
                                <div className="mb-4">
                                    <InputLabel htmlFor="amount" value="Amount (₦)" />
                                    <TextInput
                                        id="amount"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.amount} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="quantity" value="Quantity (How many coupons to generate)" />
                                    <TextInput
                                        id="quantity"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.quantity}
                                        onChange={(e) => setData('quantity', e.target.value)}
                                        required
                                        min="1"
                                        max="100"
                                    />
                                    <InputError message={errors.quantity} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="expires_at" value="Expiry Date (Optional)" />
                                    <TextInput
                                        id="expires_at"
                                        type="datetime-local"
                                        className="mt-1 block w-full"
                                        value={data.expires_at}
                                        onChange={(e) => setData('expires_at', e.target.value)}
                                    />
                                    <InputError message={errors.expires_at} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="description" value="Description (Optional)" />
                                    <textarea id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="textarea textarea-bordered mt-1 block w-full"
                                        placeholder=""
                                    ></textarea>
                                    <InputError message={errors.description} className="mt-2" />
                                </div>

                                <div className="flex items-center justify-end mt-4">
                                    <Button
                                        href={route('admin.coupons.index')}
                                        className="mr-2"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="ml-4"
                                        processing={processing}
                                    >
                                        Create Treasure Hunt Code
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}