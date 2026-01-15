import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  PlusIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import Button from '@/Components/Button';
import TextInput from '@/Components/TextInput';
import Dropdown from '@/Components/Dropdown';

export default function UsersIndex({ auth, users, roles, filter }) {
    const [searchTerm, setSearchTerm] = useState(filter.search || '');
    const [selectedRole, setSelectedRole] = useState(filter.role || '');
    const [showFilters, setShowFilters] = useState(false);
    const { get } = useForm();

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('admin.users', { search: searchTerm, role: selectedRole }));
    };

    const handleRoleChange = (e) => {
        const role = e.target.value;
        setSelectedRole(role);
        get(route('admin.users', { search: searchTerm, role }));
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedRole('');
        get(route('admin.users'));
    };

    return (
        <AdminLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 dark:-text-gray-200 leading-tight">
                        Manage Users
                    </h2>
                   
                </div>
            }
        >
            <Head title="Manage Users" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Search and Filter Bar */}
                    <div className="bg-white dark:-bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:-border-gray-700 p-4 mb-6">
                        <div className="flex flex-col space-y-4">
                            {/* Search Form */}
                            <form onSubmit={handleSearch} className="w-full">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <TextInput
                                        type="text"
                                        placeholder="Search users by name or email..."
                                        className="w-full pl-10 pr-24"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <Button 
                                            type="submit" 
                                            className="h-full rounded-l-none"
                                        >
                                            Search
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            {/* Filter Controls */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center text-sm text-gray-600 dark:-text-gray-400 hover:text-gray-900 dark:-hover:text-gray-300"
                                >
                                    <FunnelIcon className="h-4 w-4 mr-2" />
                                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                                </button>

                                {(searchTerm || selectedRole) && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-red-600 hover:text-red-800 dark:-text-red-400 dark:-hover:text-red-300"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>

                            {/* Collapsible Filters */}
                            {showFilters && (
                                <div className="pt-4 border-t border-gray-200 dark:-border-gray-700">
                                    <label className="block text-sm font-medium text-gray-700 dark:-text-gray-300 mb-2">
                                        Filter by Role
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                        <button
                                            onClick={() => handleRoleChange({ target: { value: '' } })}
                                            className={`px-3 py-2 text-sm rounded-lg border ${
                                                selectedRole === ''
                                                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:-bg-blue-900/20 dark:-border-blue-400 dark:-text-blue-300'
                                                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 dark:-bg-gray-700 dark:-border-gray-600 dark:-text-gray-300 dark:-hover:bg-gray-600'
                                            }`}
                                        >
                                            All Users
                                        </button>
                                        {roles.map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => handleRoleChange({ target: { value: role } })}
                                                className={`px-3 py-2 text-sm rounded-lg border ${
                                                    selectedRole === role
                                                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:-bg-blue-900/20 dark:-border-blue-400 dark:-text-blue-300'
                                                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 dark:-bg-gray-700 dark:-border-gray-600 dark:-text-gray-300 dark:-hover:bg-gray-600'
                                                }`}
                                            >
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Count and Stats */}
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:-from-blue-900/30 dark:-to-blue-800/30 p-4 rounded-xl">
                            <div className="text-sm text-blue-700 dark:-text-blue-300 mb-1">Total Users</div>
                            <div className="text-2xl font-bold text-blue-900 dark:-text-blue-100">
                                {users.total || 0}
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:-from-green-900/30 dark:-to-green-800/30 p-4 rounded-xl">
                            <div className="text-sm text-green-700 dark:-text-green-300 mb-1">Active Users</div>
                            <div className="text-2xl font-bold text-green-900 dark:-text-green-100">
                                {users.data.filter(u => u.is_active).length}
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:-from-purple-900/30 dark:-to-purple-800/30 p-4 rounded-xl">
                            <div className="text-sm text-purple-700 dark:-text-purple-300 mb-1">Total Balance</div>
                            <div className="text-2xl font-bold text-purple-900 dark:-text-purple-100">
                                ₦{users.data.reduce((sum, user) => sum + parseFloat(user.wallet_balance || 0), 0).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Users List - Mobile Cards */}
                    <div className="sm:hidden space-y-4">
                        {users.data.length > 0 ? (
                            users.data.map((user) => (
                                <div key={user.id} className="bg-white dark:-bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:-border-gray-700 p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 dark:-from-blue-800 dark:-to-blue-900 flex items-center justify-center">
                                                <UserCircleIcon className="h-6 w-6 text-blue-600 dark:-text-blue-300" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900 dark:-text-gray-100">
                                                    {user.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:-text-gray-400">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <button className="p-1 hover:bg-gray-100 dark:-hover:bg-gray-700 rounded-lg">
                                                    <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                                                </button>
                                            </Dropdown.Trigger>
                                            <Dropdown.Content>
                                                <Dropdown.Link href={route('admin.users.show', user.id)}>
                                                    View Details
                                                </Dropdown.Link>
                                                <Dropdown.Link href={route('admin.users.edit', user.id)}>
                                                    Edit User
                                                </Dropdown.Link>
                                                <Dropdown.Link 
                                                    href={route('admin.users.toggle-active', user.id)}
                                                    method="patch"
                                                    as="button"
                                                >
                                                    {user.is_active ? 'Disable User' : 'Enable User'}
                                                </Dropdown.Link>
                                                <Dropdown.Link 
                                                    href={route('admin.users.destroy', user.id)}
                                                    method="delete"
                                                    as="button"
                                                    className="text-red-600 hover:text-red-900 dark:-text-red-400 dark:-hover:text-red-300"
                                                    onClick={(e) => {
                                                        if (!confirm('Are you sure you want to delete this user?')) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                >
                                                    Delete User
                                                </Dropdown.Link>
                                            </Dropdown.Content>
                                        </Dropdown>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <div className="text-xs text-gray-500 dark:-text-gray-400">Role</div>
                                            <span className={`text-sm font-medium px-2 py-1 rounded-full
                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:-bg-purple-900 dark:-text-purple-300' :
                                                  user.role === 'agent' ? 'bg-blue-100 text-blue-800 dark:-bg-blue-900 dark:-text-blue-300' :
                                                  'bg-green-100 text-green-800 dark:-bg-green-900 dark:-text-green-300'}`}>
                                                {user.role}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 dark:-text-gray-400">Status</div>
                                            <span className={`text-sm font-medium px-2 py-1 rounded-full
                                                ${user.is_active ? 'bg-green-100 text-green-800 dark:-bg-green-900 dark:-text-green-300' : 
                                                  'bg-gray-100 text-gray-800 dark:-bg-gray-700 dark:-text-gray-300'}`}>
                                                {user.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 dark:-text-gray-400">Phone</div>
                                            <div className="text-sm text-gray-900 dark:-text-gray-100">
                                                {user.phone_number || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 dark:-text-gray-400">Balance</div>
                                            <div className="text-sm font-medium text-gray-900 dark:-text-gray-100">
                                                ₦{user.wallet_balance}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-2 pt-3 border-t border-gray-200 dark:-border-gray-700">
                                        <Link
                                            href={route('admin.users.show', user.id)}
                                            className="flex-1 text-center text-sm text-blue-600 hover:text-blue-800 dark:-text-blue-400 dark:-hover:text-blue-300"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            href={route('admin.users.edit', user.id)}
                                            className="flex-1 text-center text-sm text-gray-600 hover:text-gray-800 dark:-text-gray-400 dark:-hover:text-gray-300"
                                        >
                                            Edit
                                        </Link>
                                        <Link
                                            href={route('admin.users.toggle-active', user.id)}
                                            method="patch"
                                            as="button"
                                            className={`flex-1 text-center text-sm ${user.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                                        >
                                            {user.is_active ? 'Disable' : 'Enable'}
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white dark:-bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:-border-gray-700 p-8 text-center">
                                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                                    <UserCircleIcon className="h-full w-full" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:-text-gray-100 mb-2">
                                    No users found
                                </h3>
                                <p className="text-gray-500 dark:-text-gray-400 mb-4">
                                    {searchTerm || selectedRole 
                                        ? 'Try adjusting your search or filter to find what you\'re looking for.'
                                        : 'Get started by creating your first user.'}
                                </p>
                                <Link
                                    href={route('admin.users.create')}
                                    className="btn btn-primary"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add User
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Users Table - Desktop */}
                    <div className="hidden sm:block bg-white dark:-bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:-border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:-divide-gray-700">
                                <thead className="bg-gray-50 dark:-bg-gray-900">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:-text-gray-400 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:-text-gray-400 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:-text-gray-400 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:-text-gray-400 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:-text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:-text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:-divide-gray-700">
                                    {users.data.length > 0 ? (
                                        users.data.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 dark:-hover:bg-gray-900/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 dark:-from-blue-800 dark:-to-blue-900 flex items-center justify-center mr-3">
                                                            <UserCircleIcon className="h-6 w-6 text-blue-600 dark:-text-blue-300" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:-text-gray-100">
                                                                {user.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:-text-gray-400">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full
                                                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:-bg-purple-900 dark:-text-purple-300' :
                                                          user.role === 'agent' ? 'bg-blue-100 text-blue-800 dark:-bg-blue-900 dark:-text-blue-300' :
                                                          'bg-green-100 text-green-800 dark:-bg-green-900 dark:-text-green-300'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:-text-gray-100">
                                                    {user.phone_number || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:-text-gray-100">
                                                        ₦{user.wallet_balance}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full
                                                        ${user.is_active ? 'bg-green-100 text-green-800 dark:-bg-green-900 dark:-text-green-300' : 
                                                          'bg-gray-100 text-gray-800 dark:-bg-gray-700 dark:-text-gray-300'}`}>
                                                        {user.is_active ? 'Active' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <div className="flex items-center space-x-3">
                                                        <Link
                                                            href={route('admin.users.show', user.id)}
                                                            className="text-blue-600 hover:text-blue-900 dark:-text-blue-400 dark:-hover:text-blue-300"
                                                        >
                                                            View
                                                        </Link>
                                                        <Link
                                                            href={route('admin.users.edit', user.id)}
                                                            className="text-gray-600 hover:text-gray-900 dark:-text-gray-400 dark:-hover:text-gray-300"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Link>
                                                        <Link
                                                            href={route('admin.users.toggle-active', user.id)}
                                                            method="patch"
                                                            as="button"
                                                            className={`${user.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                                                        >
                                                            {user.is_active ? 'Disable' : 'Enable'}
                                                        </Link>
                                                        <Link
                                                            href={route('admin.users.destroy', user.id)}
                                                            method="delete"
                                                            as="button"
                                                            className="text-red-600 hover:text-red-900 dark:-text-red-400 dark:-hover:text-red-300"
                                                            onClick={(e) => {
                                                                if (!confirm('Are you sure you want to delete this user?')) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center">
                                                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                                                    <UserCircleIcon className="h-full w-full" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:-text-gray-100 mb-2">
                                                    No users found
                                                </h3>
                                                <p className="text-gray-500 dark:-text-gray-400 mb-4">
                                                    {searchTerm || selectedRole 
                                                        ? 'Try adjusting your search or filter to find what you\'re looking for.'
                                                        : 'Get started by creating your first user.'}
                                                </p>
                                                <Link
                                                    href={route('admin.users.create')}
                                                    className="btn btn-primary"
                                                >
                                                    <PlusIcon className="h-4 w-4 mr-2" />
                                                    Add User
                                                </Link>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.links && users.links.length > 1 && (
                            <div className="px-4 py-3 border-t border-gray-200 dark:-border-gray-700">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div className="mb-3 sm:mb-0">
                                        <p className="text-sm text-gray-700 dark:-text-gray-300">
                                            Showing <span className="font-medium">{users.from}</span> to{' '}
                                            <span className="font-medium">{users.to}</span> of{' '}
                                            <span className="font-medium">{users.total}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="flex space-x-2" aria-label="Pagination">
                                            {users.links.map((link, i) => (
                                                <Link
                                                    key={i}
                                                    href={link.url}
                                                    className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                                                        link.active
                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:-bg-blue-900/30 dark:-border-blue-400 dark:-text-blue-300'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:-bg-gray-800 dark:-border-gray-600 dark:-text-gray-400 dark:-hover:bg-gray-700'
                                                    } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
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
        </AdminLayout>
    );
}