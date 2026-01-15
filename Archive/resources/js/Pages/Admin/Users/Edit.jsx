import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
import SelectInput from '@/Components/SelectInput';

export default function EditUser({ auth, user, roles }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
        phone_number: user.phone_number || '',
        role: user.role || 'user',
        is_active: user.is_active ?? true,
        wallet_balance: user.wallet_balance || '0.00',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('admin.users.update', user.id));
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Edit User</h2>}
        >
            <Head title="Edit User" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="name" value="Name" />
                                        <TextInput
                                            id="name"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            autoFocus
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value="Email" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password" value="Password (leave blank to keep current)" />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            className="mt-1 block w-full"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                                        <TextInput
                                            id="password_confirmation"
                                            type="password"
                                            className="mt-1 block w-full"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                        />
                                        <InputError message={errors.password_confirmation} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="phone_number" value="Phone Number" />
                                        <TextInput
                                            id="phone_number"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.phone_number}
                                            onChange={(e) => setData('phone_number', e.target.value)}
                                        />
                                        <InputError message={errors.phone_number} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="role" value="Role" />
                                        <SelectInput
                                            id="role"
                                            className="mt-1 block w-full"
                                            value={data.role}
                                            onChange={(e) => setData('role', e.target.value)}
                                            required
                                        >
                                            {roles.map((role) => (
                                                <option key={role} value={role}>
                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                </option>
                                            ))}
                                        </SelectInput>
                                        <InputError message={errors.role} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="is_active" value="Active" />
                                        <div className="mt-2 flex items-center">
                                            <input
                                                id="is_active"
                                                type="checkbox"
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                            />
                                            <span className="ml-2 text-sm">Allow login and transactions</span>
                                        </div>
                                        <InputError message={errors.is_active} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="wallet_balance" value="Wallet Balance" />
                                        <TextInput
                                            id="wallet_balance"
                                            type="number"
                                            step="0.01"
                                            className="mt-1 block w-full"
                                            value={data.wallet_balance}
                                            onChange={(e) => setData('wallet_balance', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.wallet_balance} className="mt-2" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end mt-6">
                                    <Button type="submit" className="ml-4" processing={processing}>
                                        Update User
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
