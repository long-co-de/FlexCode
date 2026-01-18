import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import BorrowingCard from '@/Components/BorrowingCard';
import { 
    FaWallet, FaCheckCircle, FaExclamationTriangle, FaClock, 
    FaHistory, FaChartLine, FaShieldAlt, FaArrowRight,
    FaInfoCircle, FaRegCreditCard, FaCoins,FaPhone, FaWifi
} from 'react-icons/fa';
import { GiReceiveMoney, GiPayMoney } from 'react-icons/gi';
import axios from 'axios';

const MyBorrowings = ({ borrowings, eligibility }) => {
    const [activeTab, setActiveTab] = useState('active');
    const [processing, setProcessing] = useState(false);
    const [summary, setSummary] = useState(null);
    const {auth} = usePage().props;
    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const response = await axios.get(route('borrowing.summary'));
            setSummary(response.data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const handleRepay = async (borrowingId) => {
        if (processing) return;
        if (!confirm('Are you sure you want to repay this borrowing now?')) return;
        
        setProcessing(true);
        try {
            const response = await axios.post(route('borrow.repay', borrowingId));
            if (response.data.success) {
                window.location.reload();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to process repayment');
        } finally {
            setProcessing(false);
        }
    };

    const handleDisableAutoDeduction = async (borrowingId) => {
        if (processing) return;
        if (!confirm('Are you sure you want to disable auto-deduction? You will need to make manual payments.')) return;
        
        setProcessing(true);
        try {
            const response = await axios.post(route('borrow.disable-auto-deduction', borrowingId));
            if (response.data.success) {
                window.location.reload();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to disable auto-deduction');
        } finally {
            setProcessing(false);
        }
    };

    const filteredBorrowings = borrowings.data.filter(borrowing => {
        if (activeTab === 'active') return borrowing.status === 'active';
        if (activeTab === 'overdue') return borrowing.status === 'overdue';
        if (activeTab === 'paid') return borrowing.status === 'paid';
        return true;
    });

    const stats = summary ? [
        { label: 'Available Credit', value: `₦${eligibility?.available_credit?.toLocaleString() || '0'}`, icon: <FaWallet className="text-sky-500" />, color: 'bg-sky-50' },
        { label: 'Total Repaid', value: `₦${summary.total_repaid.toLocaleString()}`, icon: <FaCheckCircle className="text-emerald-500" />, color: 'bg-emerald-50' },
        { label: 'Active Loans', value: summary.active_borrowings, icon: <FaClock className="text-amber-500" />, color: 'bg-amber-50' },
        { label: 'Overdue', value: summary.overdue_borrowings, icon: <FaExclamationTriangle className="text-rose-500" />, color: 'bg-rose-50' }
    ] : [];

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">My Borrowings</h2>
                        <p className="text-sm text-slate-500">Track and manage your credit history</p>
                    </div>
                    <div className="bg-base-100 px-4 py-2 rounded-xl shadow-sm border border-base-300 100 flex items-center gap-2">
                        <FaChartLine className="text-sky-500 text-sm" />
                        <span className="text-sm font-bold text-slate-700">Credit Score: {eligibility?.credit_score || 0}</span>
                    </div>
                </div>
            }
        >
            <Head title="My Borrowings" />
            
            <div className="py-8 max-w-7xl mx-auto px-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-base-100 p-5 rounded-3xl border border-base-300 100 shadow-sm transition-transform hover:scale-[1.02]">
                            <div className={`w-10 h-10 rounded-2xl ${stat.color} flex items-center justify-center mb-3`}>
                                {stat.icon}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-lg font-black base">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Eligibility Banner */}
                {eligibility && (
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 mb-8 text-white shadow-xl">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-base-100/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <GiReceiveMoney className="text-4xl text-sky-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Quick Borrowing</h3>
                                    <p className="text-slate-400 text-sm">Need data or airtime? Get it instantly on credit.</p>
                                    <div className="mt-3 flex gap-4 text-[10px] font-black uppercase tracking-widest text-sky-400">
                                        <span className="flex items-center gap-1"><FaShieldAlt /> Secure</span>
                                        <span className="flex items-center gap-1"><FaClock /> No Paperwork</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href={route('borrow.airtime')}
                                    className="h-12 px-6 rounded-2xl bg-base-100/10 hover:bg-base-100/20 text-white font-bold text-sm transition-all flex items-center gap-2 border border-white/10"
                                >
                                    <FaPhone className="text-xs" />
                                    Airtime
                                </Link>
                                <Link
                                    href={route('borrow.data')}
                                    className="h-12 px-6 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-lg shadow-sky-900/50 transition-all flex items-center gap-2"
                                >
                                    <FaWifi className="text-xs" />
                                    Data Plan
                                    <FaArrowRight className="text-[10px]" />
                                </Link>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                    </div>
                )}

                {/* Main Content */}
                <div className="bg-base-100 rounded-[2.5rem] shadow-sm border border-base-300 100 overflow-hidden">
                    {/* Filter Tabs */}
                    <div className="px-8 pt-8 pb-4 border-b border-base-300 50">
                        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'active', label: 'Active', icon: <FaClock />, count: borrowings.data.filter(b => b.status === 'active').length },
                                { id: 'overdue', label: 'Overdue', icon: <FaExclamationTriangle />, count: borrowings.data.filter(b => b.status === 'overdue').length },
                                { id: 'paid', label: 'History', icon: <FaHistory />, count: borrowings.data.filter(b => b.status === 'paid').length },
                                { id: 'all', label: 'All', icon: <FaInfoCircle />, count: borrowings.data.length }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative pb-4 flex items-center gap-2 text-sm font-bold transition-all whitespace-nowrap ${
                                        activeTab === tab.id ? 'text-sky-500' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    <span className="text-xs">{tab.icon}</span>
                                    {tab.label}
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        activeTab === tab.id ? 'bg-sky-50 text-sky-600' : 'bg-base-300 text-slate-400'
                                    }`}>
                                        {tab.count}
                                    </span>
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 rounded-t-full shadow-lg shadow-sky-200"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8">
                        {filteredBorrowings.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="w-24 h-24 bg-base-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <FaRegCreditCard className="text-4xl text-slate-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">No Transactions Found</h3>
                                <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8">
                                    {activeTab === 'active' ? "You don't have any pending repayments at the moment." : "There are no transactions in this category."}
                                </p>
                                <Link
                                    href={route('borrow.airtime')}
                                    className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                >
                                    Explore Borrowing Options
                                    <FaArrowRight className="text-xs" />
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {filteredBorrowings.map((borrowing) => (
                                    <BorrowingCard
                                        key={borrowing.id}
                                        borrowing={borrowing}
                                        onRepay={handleRepay}
                                        onDisableAutoDeduction={handleDisableAutoDeduction}
                                        disabled={processing}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {borrowings.links && borrowings.links.length > 3 && (
                            <div className="mt-12 flex justify-center">
                                <div className="flex gap-2 p-2 bg-base-300 rounded-2xl border border-base-300 100">
                                    {borrowings.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`h-10 px-4 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                                                link.active 
                                                ? 'bg-base-100 text-sky-500 shadow-sm border border-base-300 100' 
                                                : 'text-slate-400 hover:text-slate-600'
                                            } ${!link.url ? 'opacity-30 pointer-events-none' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default MyBorrowings;
