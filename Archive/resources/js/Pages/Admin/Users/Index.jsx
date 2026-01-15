import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '@/Components/Button';
import TextInput from '@/Components/TextInput';

export default function UsersIndex({ auth, users, roles, filter }) {
    const [searchTerm, setSearchTerm] = useState(filter.search || '');
    const [selectedRole, setSelectedRole] = useState(filter.role || '');

    const { get } = useForm();

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('admin.users', { search: searchTerm, role: selectedRole }));
    };

    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
        get(route('admin.users', { search: searchTerm, role: e.target.value }));
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Manage Users</h2>}
        >
            <Head title="Manage Users" />

            <div className="">
                <div className=" mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                                <div className="flex items-center mb-4 md:mb-0">
                                    <h3 className="text-lg font-medium mr-4">Users</h3>
                                    <Link href={route('admin.users.create')} className="btn-primary">
                                        <PlusIcon className="h-4 w-4 mr-1" />
                                        Add User
                                    </Link>
                                </div>
                                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
                                    <form onSubmit={handleSearch} className="flex space-x-2">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MagnifyingGlassIcon className="h-5 w-5 iggyy-updatey-400" />
                                            </div>
                                            <TextInput
                                                type="text"
                                                placeholder="Search users..."
                                                className="pl-10"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Button type="submit">Search</Button>
                                    </form>
                                    <select
                                        value={selectedRole}
                                        onChange={handleRoleChange}
                                        className="form-input"
                                    >
                                        <option value="">All Roles</option>
                                        {roles.map((role) => (
                                            <option key={role} value={role}>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                ID
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Phone
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Wallet Balance
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium iggyy-updatey-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-base-100 divide-y divide-gray-200">
                                        {users.data.length > 0 ? (
                                            users.data.map((user) => (
                                                <tr key={user.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium iggyy-updatey-900">
                                                        {user.id}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm iggyy-updatey-500">
                                                        {user.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm iggyy-updatey-500">
                                                        {user.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm iggyy-updatey-500">
                                                        {user.phone_number || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm iggyy-updatey-500">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                            user.role === 'agent' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-green-100 text-green-800'}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm iggyy-updatey-500">
                                                        ₦{user.wallet_balance}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm iggyy-updatey-500">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                            ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                                            {user.is_active ? 'Active' : 'Disabled'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <Link
                                                            href={route('admin.users.edit', user.id)}
                                                            className="text-primary-600 hover:text-primary-900 mr-3"
                                                        >
                                                            <PencilIcon className="h-5 w-5 inline" />
                                                        </Link>
                                                        <Link
                                                            href={route('admin.users.show', user.id)}
                                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                                        >
                                                            View
                                                        </Link>
                                                        <Link
                                                            href={route('admin.users.toggle-active', user.id)}
                                                            method="patch"
                                                            as="button"
                                                            className={`mr-3 ${user.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                                                        >
                                                            {user.is_active ? 'Disable' : 'Enable'}
                                                        </Link>
                                                        <Link
                                                            href={route('admin.users.destroy', user.id)}
                                                            method="delete"
                                                            as="button"
                                                            className="text-red-600 hover:text-red-900"
                                                            onClick={(e) => {
                                                                if (!confirm('Are you sure you want to delete this user?')) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        >
                                                            <TrashIcon className="h-5 w-5 inline" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-4 text-center text-sm iggyy-updatey-500">
                                                    No users found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                {users.links && (
                                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm iggyy-updatey-700">
                                                    Showing <span className="font-medium">{users.from}</span> to{' '}
                                                    <span className="font-medium">{users.to}</span> of{' '}
                                                    <span className="font-medium">{users.total}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                    {users.links.map((link, i) => (
                                                        <Link
                                                            key={i}
                                                            href={link.url}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                link.active
                                                                    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                                                    : 'bg-base-100 border-gray-300 iggyy-updatey-500 hover:bg-base-200 mm--50'
                                                            } ${!link.url ? 'cursor-not-allowed' : ''}`}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ))}
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
