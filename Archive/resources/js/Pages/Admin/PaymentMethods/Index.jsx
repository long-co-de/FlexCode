import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '@/Components/Button';
import TextInput from '@/Components/TextInput';

export default function PaymentMethodsIndex({ auth, paymentMethods, filter }) {
    const [searchTerm, setSearchTerm] = useState(filter?.search || '');

    const { get } = useForm();

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('admin.payment-methods', { search: searchTerm }));
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Manage Payment Methods</h2>}
        >
            <Head title="Manage Payment Methods" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                                <div className="flex items-center mb-4 md:mb-0">
                                    <h3 className="text-lg font-medium mr-4">Payment Methods</h3>
                                    <Link href={route('admin.payment-methods.create')} className="btn-primary">
                                        <PlusIcon className="h-4 w-4 mr-1" />
                                        Add Payment Method
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
                                                placeholder="Search payment methods..."
                                                className="pl-10"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Button type="submit">Search</Button>
                                    </form>
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
                                                Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                Code
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                Logo
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                Type
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
                                        {paymentMethods?.data?.length > 0 ? (
                                            paymentMethods?.data?.map((method) => (
                                                <tr key={method.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium igg-900">
                                                        {method.id}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                        {method.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                        {method.code}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                        {method.logo ? (
                                                            <img src={method.logo} alt={method.name} className="h-8 w-8" />
                                                        ) : (
                                                            'No Logo'
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                        {method.type}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${method.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {method.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <Link 
                                                            href={route('admin.payment-methods.edit', method.id)} 
                                                            className="text-primary-600 hover:text-primary-900 mr-3"
                                                        >
                                                            <PencilIcon className="h-5 w-5 inline" />
                                                        </Link>
                                                        <Link 
                                                            href={route('admin.payment-methods.destroy', method.id)} 
                                                            method="delete" 
                                                            as="button"
                                                            className="text-red-600 hover:text-red-900"
                                                            onClick={(e) => {
                                                                if (!confirm('Are you sure you want to delete this payment method?')) {
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
                                                <td colSpan="7" className="px-6 py-4 text-center text-sm igg-500">
                                                    No payment methods found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                
                                {/* Pagination */}
                                {paymentMethods?.links && (
                                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm igg-700">
                                                    Showing <span className="font-medium">{paymentMethods?.from}</span> to{' '}
                                                    <span className="font-medium">{paymentMethods?.to}</span> of{' '}
                                                    <span className="font-medium">{paymentMethods?.total}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                    {paymentMethods?.links?.map((link, i) => (
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