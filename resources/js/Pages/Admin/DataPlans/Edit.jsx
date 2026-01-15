import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';

export default function EditDataPlan({ auth, dataPlan, networks, planTypes }) {
    const { data, setData, patch, processing, errors } = useForm({
        network_id: dataPlan.network_id || '',
        name: dataPlan.name || '',
        code: dataPlan.code || '',
        amount: dataPlan.price || '', // model uses 'price'; controller expects 'amount'
        plan_type: dataPlan.plan_type || '',
        dataplan_id: dataPlan.dataplan_id || '',
        data_amount: dataPlan.data_amount || '',
        validity: dataPlan.validity || '',
        is_active: dataPlan.is_active,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('admin.data-plans.update', dataPlan.id));
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Edit Data Plan</h2>}
        >
            <Head title="Edit Data Plan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <InputLabel htmlFor="network_id" value="Network" />
                                    <select
                                        id="network_id"
                                        name="network_id"
                                        value={data.network_id}
                                        className="mt-1 block w-full border-gray-300 focus:border-primary-500 focus:ring-primary-500 rounded-md shadow-sm"
                                        onChange={(e) => setData('network_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Network</option>
                                        {networks.map((network) => (
                                            <option key={network.id} value={network.id}>
                                                {network.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.network_id} className="mt-2" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        <InputLabel htmlFor="validity" value="Validity (e.g., 30 Days)" />
                                        <TextInput
                                            id="validity"
                                            type="text"
                                            name="validity"
                                            value={data.validity}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('validity', e.target.value)}
                                        />
                                        <InputError message={errors.validity} className="mt-2" />
                                    </div>

                                    <div className="mb-4">
                                        <InputLabel htmlFor="plan_type" value="Plan Type" />
                                        <select
                                            id="plan_type"
                                            name="plan_type"
                                            value={data.plan_type}
                                            className="mt-1 block w-full border-gray-300 focus:border-primary-500 focus:ring-primary-500 rounded-md shadow-sm"
                                            onChange={(e) => setData('plan_type', e.target.value)}
                                        >
                                            <option value="">Select Plan Type</option>
                                            {planTypes?.map((pt) => (
                                                <option key={pt.id} value={pt.plan_type}>
                                                    {pt.plan_type}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.plan_type} className="mt-2" />
                                    </div>

                                    <div className="mb-4">
                                        <InputLabel htmlFor="dataplan_id" value="External Plan ID (optional)" />
                                        <TextInput
                                            id="dataplan_id"
                                            type="text"
                                            name="dataplan_id"
                                            value={data.dataplan_id}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('dataplan_id', e.target.value)}
                                        />
                                        <InputError message={errors.dataplan_id} className="mt-2" />
                                    </div>

                                    <div className="mb-4">
                                        <InputLabel htmlFor="data_amount" value="Data Amount (e.g., 1GB)" />
                                        <TextInput
                                            id="data_amount"
                                            type="text"
                                            name="data_amount"
                                            value={data.data_amount}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('data_amount', e.target.value)}
                                        />
                                        <InputError message={errors.data_amount} className="mt-2" />
                                    </div>
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
                                        Update Data Plan
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
