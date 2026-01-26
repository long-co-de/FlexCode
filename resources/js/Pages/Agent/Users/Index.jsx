import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
import { 
  MagnifyingGlassIcon, 
  EllipsisVerticalIcon,
  UserCircleIcon,
  EyeIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  UserIcon,
  PhoneIcon,
  WalletIcon,
  ChevronRightIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import Button from '@/Components/Button';
import TextInput from '@/Components/TextInput';
import Dropdown from '@/Components/Dropdown';

export default function UsersIndex({ auth, users, filter }) {
    const [searchTerm, setSearchTerm] = useState(filter.search || '');
    const { get } = useForm();

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('agent.users', { search: searchTerm }));
    };

    const clearFilters = () => {
        setSearchTerm('');
        get(route('agent.users'));
    };

    const getStatusConfig = (isActive) => {
        return isActive 
            ? { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100', label: 'Active' }
            : { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: 'Disabled' };
    };

    return (
        <AgentLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-black text-2xl text-gray-900 leading-tight">Customers</h2>
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <UserGroupIcon className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            }
        >
            <Head title="User Management" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative group">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <form onSubmit={handleSearch}>
                            <input
                                type="text"
                                placeholder="Search by name, email or phone..."
                                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-700 font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                        {searchTerm && (
                            <button
                                onClick={clearFilters}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-red-500 uppercase tracking-widest hover:text-red-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile View: Cards */}
                <div className="block lg:hidden space-y-4">
                    {users.data.length > 0 ? (
                        users.data.map((user) => {
                            const status = getStatusConfig(user.is_active);
                            return (
                                <div key={user.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden active:scale-[0.98] transition-all">
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center">
                                                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mr-4 border border-blue-100/50">
                                                    <UserCircleIcon className="h-7 w-7 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-black text-gray-900 leading-tight">{user.name}</h3>
                                                    <p className="text-xs text-gray-400 font-medium">{user.email}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.bg} ${status.text} ${status.border}`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50 mb-4">
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Balance</p>
                                                <p className="text-sm font-black text-blue-600">₦{parseFloat(user.wallet_balance).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Phone</p>
                                                <p className="text-sm font-bold text-gray-900">{user.phone_number || 'N/A'}</p>
                                            </div>
                                            <div className="mt-2">
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Referred By</p>
                                                <p className="text-xs font-bold text-gray-700">{user.referrer ? user.referrer.name : 'None'}</p>
                                            </div>
                                            <div className="text-right mt-2">
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Referrals</p>
                                                <p className="text-xs font-bold text-gray-700">{user.referrals_count || 0}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                href={route('agent.users.show', user.id)}
                                                className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                                            >
                                                VIEW PROFILE
                                            </Link>
                                            <Link
                                                href={route('agent.users.toggle-active', user.id)}
                                                method="patch"
                                                as="button"
                                                className={`px-4 py-3 rounded-2xl border transition-all ${
                                                    user.is_active 
                                                        ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                                                        : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                                                }`}
                                            >
                                                {user.is_active ? <NoSymbolIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-3xl border border-gray-200 border-dashed p-12 text-center">
                            <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">No customers found</p>
                        </div>
                    )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden lg:block bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Customer Directory</h3>
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                            {users.total} Total Users
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Wallet Balance</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Referral Info</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Status</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {users.data.length > 0 ? (
                                    users.data.map((user) => {
                                        const status = getStatusConfig(user.is_active);
                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                                            <UserCircleIcon className="h-6 w-6 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-gray-900">{user.name}</div>
                                                            <div className="text-xs text-gray-400 font-medium">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-700">{user.email}</div>
                                                    <div className="text-xs text-gray-400 font-medium">{user.phone_number || 'No phone number'}</div>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm font-black text-blue-600">
                                                    ₦{parseFloat(user.wallet_balance).toLocaleString()}
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <div className="text-xs font-black text-gray-900">By: {user.referrer ? user.referrer.name : 'None'}</div>
                                                    <div className="text-[10px] text-gray-400 font-medium">Referred: {user.referrals_count || 0}</div>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.bg} ${status.text} ${status.border}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Link
                                                            href={route('agent.users.show', user.id)}
                                                            className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all border border-gray-100"
                                                        >
                                                            Profile
                                                            <ChevronRightIcon className="h-3 w-3 ml-1" />
                                                        </Link>
                                                        <Link
                                                            href={route('agent.users.toggle-active', user.id)}
                                                            method="patch"
                                                            as="button"
                                                            className={`p-2 rounded-xl transition-all border ${
                                                                user.is_active 
                                                                    ? 'text-red-600 border-red-100 hover:bg-red-50' 
                                                                    : 'text-green-600 border-green-100 hover:bg-green-50'
                                                            }`}
                                                            title={user.is_active ? 'Disable' : 'Enable'}
                                                        >
                                                            {user.is_active ? <NoSymbolIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-12 text-center text-gray-500 italic font-medium">
                                            No customers matching your search criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {users.links && users.links.length > 3 && (
                    <div className="mt-10 flex justify-center gap-2">
                        {users.links.map((link, index) => (
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                        link.active 
                                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span 
                                    key={index} 
                                    className="px-4 py-2 text-gray-300 text-xs font-black uppercase tracking-widest"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </AgentLayout>
    );
}

import { UserGroupIcon } from '@heroicons/react/24/outline';
