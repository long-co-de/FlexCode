import { Head, Link } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
import TransactionTable from '@/Components/TransactionTable';
import {
    ArrowLeftIcon,
    EnvelopeIcon,
    PhoneIcon,
    CurrencyDollarIcon,
    UserCircleIcon,
    CalendarIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    UserIcon,
    ClockIcon,
    BanknotesIcon,
    ChevronRightIcon,
    NoSymbolIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function ShowUser({ auth, user, transactions }) {
    const getStatusConfig = (isActive) => {
        return isActive 
            ? { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100', label: 'Active Account' }
            : { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: 'Account Disabled' };
    };

    const status = getStatusConfig(user.is_active);

    return (
        <AgentLayout
            user={auth.user}
            header={
                <div className="flex items-center space-x-4">
                    <Link 
                        href={route("agent.users")} 
                        className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-600 hover:text-blue-600 transition-all active:scale-95"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="font-bold text-xl text-gray-900 leading-tight">Customer Profile</h2>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">ID: {user.id}</p>
                    </div>
                </div>
            }
        >
            <Head title={`${user.name} - User Details`} />
            
            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
                {/* Hero Section */}
                <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                        <UserIcon className="h-48 w-48 text-blue-600 -rotate-12" />
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <div className="h-24 w-24 rounded-[2rem] bg-blue-50 flex items-center justify-center border border-blue-100 shadow-inner">
                                    <UserCircleIcon className="h-16 w-16 text-blue-600" />
                                </div>
                                <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-white ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 leading-tight mb-1">{user.name}</h1>
                                <p className="text-sm font-medium text-gray-500 mb-3">{user.email}</p>
                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.bg} ${status.text} ${status.border}`}>
                                    {status.label}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                href={route('agent.users.toggle-active', user.id)}
                                method="patch"
                                as="button"
                                className={`flex-1 md:flex-none inline-flex items-center justify-center px-8 py-4 rounded-2xl font-black text-xs tracking-widest transition-all active:scale-95 shadow-lg ${
                                    user.is_active 
                                        ? 'bg-white border-2 border-red-100 text-red-600 shadow-red-50 hover:bg-red-50' 
                                        : 'bg-green-600 text-white shadow-green-100 hover:bg-green-700'
                                }`}
                            >
                                {user.is_active ? (
                                    <><NoSymbolIcon className="h-4 w-4 mr-2" /> DISABLE USER</>
                                ) : (
                                    <><CheckCircleIcon className="h-4 w-4 mr-2" /> ENABLE USER</>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Financial & Info Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Balance Card */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-4">Current Balance</p>
                            <div className="flex items-end space-x-2">
                                <span className="text-4xl font-black text-blue-600 leading-none">₦{parseFloat(user.wallet_balance).toLocaleString()}</span>
                            </div>
                            <div className="mt-8 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Status</p>
                                    <p className="text-xs font-black text-gray-900 uppercase">{user.is_active ? 'Verified' : 'Flagged'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Role</p>
                                    <p className="text-xs font-black text-gray-900 uppercase">{user.role}</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                                <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Contact Information</h4>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone</p>
                                        <p className="text-sm font-bold text-gray-900">{user.phone_number || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Joined Date</p>
                                        <p className="text-sm font-bold text-gray-900">{new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none mb-1">Recent Activity</h3>
                                    <p className="text-[10px] text-gray-400 font-medium">Last 10 transactions by this user</p>
                                </div>
                                <Link 
                                    href={route('agent.transactions', { user_id: user.id })}
                                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                                >
                                    View All
                                </Link>
                            </div>
                            
                            <div className="p-0">
                                <TransactionTable 
                                    transactions={transactions} 
                                    viewRoute="agent.transactions.show" 
                                />
                            </div>

                            {transactions.data.length === 0 && (
                                <div className="p-16 text-center">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                        <ExclamationTriangleIcon className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No activity found</p>
                                    <p className="text-xs text-gray-300 mt-1">This user hasn't made any transactions yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-3xl border border-gray-200 p-6 flex flex-col items-center text-center">
                                <div className="h-10 w-10 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
                                    <BanknotesIcon className="h-5 w-5 text-purple-600" />
                                </div>
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Spent</p>
                                <p className="text-lg font-black text-gray-900 leading-none">₦{transactions.total_amount_sum || '0'}</p>
                            </div>
                            <div className="bg-white rounded-3xl border border-gray-200 p-6 flex flex-col items-center text-center">
                                <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center mb-3">
                                    <ClockIcon className="h-5 w-5 text-orange-600" />
                                </div>
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Orders</p>
                                <p className="text-lg font-black text-gray-900 leading-none">{transactions.total}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AgentLayout>
    );
}
