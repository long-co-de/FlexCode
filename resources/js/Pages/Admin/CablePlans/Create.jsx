import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';

export default function CreateCablePlan({ auth, providers }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        provider_id: '',
        name: '',
        code: '',
        amount: '',
        duration: '',
        description: '',
        is_active: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.cable-plans.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Create Cable Plan</h2>}
        >
            <Head title="Create Cable Plan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <InputLabel htmlFor="provider_id" value="Cable Provider" />
                                    <select
                                        id="provider_id"
                                        name="provider_id"
                                        value={data.provider_id}
                                        className="mt-1 block w-full border-gray-300 focus:border-primary-500 focus:ring-primary-500 rounded-md shadow-sm"
                                        onChange={(e) => setData('provider_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Provider</option>
                                        {providers.map((provider) => (
                                            <option key={provider.id} value={provider.id}>
                                                {provider.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.provider_id} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="name" value="Plan Name" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="code" value="Plan Code" />
                                    <TextInput
                                        id="code"
                                        type="text"
                                        name="code"
                                        value={data.code}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('code', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.code} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="amount" value="Amount (₦)" />
                                    <TextInput
                                        id="amount"
                                        type="number"
                                        name="amount"
                                        value={data.amount}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('amount', e.target.value)}
                                        required
                                        step="0.01"
                                    />
                                    <InputError message={errors.amount} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="duration" value="Duration (e.g., 30 Days)" />
                                    <TextInput
                                        id="duration"
                                        type="text"
                                        name="duration"
                                        value={data.duration}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('duration', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.duration} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="description" value="Description" />
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={data.description}
                                        className="mt-1 block w-full border-gray-300 focus:border-primary-500 focus:ring-primary-500 rounded-md shadow-sm"
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows="3"
                                    ></textarea>
                                    <InputError message={errors.description} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center">
                                        <input
                                            id="is_active"
                                            type="checkbox"
                                            name="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <InputLabel htmlFor="is_active" value="Active" className="ml-2" />
                                    </div>
                                    <InputError message={errors.is_active} className="mt-2" />
                                </div>

                                <div className="flex items-center justify-end mt-4">
                                    <Button
                                        type="button"
                                        className="mr-4 bg-base-200 mm--300 igg-800"
                                        onClick={() => window.history.back()}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="ml-4" processing={processing}>
                                        Create Cable Plan
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