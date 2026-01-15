import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '@/Components/Button';
import TextInput from '@/Components/TextInput';

export default function CablePlansIndex({ auth, cablePlans, providers, filter }) {
    const [searchTerm, setSearchTerm] = useState(filter?.search || '');
    const [selectedProvider, setSelectedProvider] = useState(filter?.provider || '');

    const { get } = useForm();

    // Normalize lists to support both paginated and plain arrays
    const rows = Array.isArray(cablePlans?.data)
        ? cablePlans.data
        : (Array.isArray(cablePlans) ? cablePlans : []);

    const providerOptions = Array.isArray(providers) ? providers : [];

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('admin.cable-plans', { search: searchTerm, provider: selectedProvider }));
    };

    const handleProviderChange = (e) => {
        setSelectedProvider(e.target.value);
        get(route('admin.cable-plans', { search: searchTerm, provider: e.target.value }));
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Manage Cable Plans</h2>}
        >
            <Head title="Manage Cable Plans" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                                <div className="flex items-center mb-4 md:mb-0">
                                    <h3 className="text-lg font-medium mr-4">Cable Plans</h3>
                                    <Link href={route('admin.cable-plans.create')} className="btn-primary">
                                        <PlusIcon className="h-4 w-4 mr-1" />
                                        Add Cable Plan
                                    </Link>
                                </div>
                                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
                                    <form onSubmit={handleSearch} className="flex space-x-2">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MagnifyingGlassIcon className="h-5 w-5 igg-400" />
                                            </div>
                                            <TextInput
                                                type="text"
                                                placeholder="Search plans..."
                                                className="pl-10"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Button type="submit">Search</Button>
                                    </form>
                                    <select
                                        value={selectedProvider}
                                        onChange={handleProviderChange}
                                        className="form-input"
                                    >
                                        <option value="">All Providers</option>
                                        {providerOptions.map((provider) => (
                                            <option key={provider.id} value={provider.id}>
                                                {provider.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-base-200 mm--50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                ID
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                Provider
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                Code
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                Duration
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-base-100 divide-y divide-gray-200">
                                        {rows.length > 0 ? (
                                            rows.map((plan) => (
                                                <tr key={plan.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium igg-900">
                                                        {plan.id}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                        {plan?.provider?.name ?? plan?.provider_name ?? '—'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                        {plan.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                        {plan.code}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                        ₦{plan.amount}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                        {plan.duration}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                            ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {plan.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <Link
                                                            href={route('admin.cable-plans.edit', plan.id)}
                                                            className="text-primary-600 hover:text-primary-900 mr-3"
                                                        >
                                                            <PencilIcon className="h-5 w-5 inline" />
                                                        </Link>
                                                        <Link
                                                            href={route('admin.cable-plans.destroy', plan.id)}
                                                            method="delete"
                                                            as="button"
                                                            className="text-red-600 hover:text-red-900"
                                                            onClick={(e) => {
                                                                if (!confirm('Are you sure you want to delete this cable plan?')) {
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
                                                <td colSpan="8" className="px-6 py-4 text-center text-sm igg-500">
                                                    No cable plans found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                {Array.isArray(cablePlans?.links) && (
                                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm igg-700">
                                                    Showing <span className="font-medium">{cablePlans.from}</span> to{' '}
                                                    <span className="font-medium">{cablePlans.to}</span> of{' '}
                                                    <span className="font-medium">{cablePlans.total}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                    {cablePlans.links.map((link, i) => (
                                                        <Link
                                                            key={i}
                                                            href={link.url}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                link.active
                                                                    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                                                    : 'bg-base-100 border-gray-300 igg-500 hover:bg-base-200 mm--50'
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
