import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PinVerification from '@/Pages/User/PinVerification';
import {
    FaWallet, FaCheckCircle, FaExclamationTriangle, FaClock,
    FaHistory, FaChartLine, FaShieldAlt, FaArrowRight,
    FaInfoCircle, FaRegCreditCard, FaCoins, FaPhone, FaWifi,
    FaLightbulb, FaTv, FaMoneyBillWave, FaPlus, FaCreditCard, FaLock
} from 'react-icons/fa';
import { GiReceiveMoney, GiPayMoney } from 'react-icons/gi';

export default function Dashboard({ auth, transactionStats, recentTransactions, serviceUsage, eligibility, borrowingSummary, has_card }) {
    const { flash, errors } = usePage().props;
    const [showPinVerification, setShowPinVerification] = useState(false);
    const [isRepaying, setIsRepaying] = useState(false);

    const handleRepayAll = () => {
        if (confirm('Are you sure you want to repay your outstanding debt using your wallet balance?')) {
            setIsRepaying(true);
            router.post(route('borrow.repay-all'), {}, {
                onFinish: () => setIsRepaying(false),
            });
        }
    };

    useEffect(() => {
        if (errors?.pin_verification_required) {
            setShowPinVerification(true);
        }
    }, [errors]);

    if (showPinVerification && !auth.user.isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50">
                <PinVerification
                    onVerified={() => setShowPinVerification(false)}
                />
            </div>
        );
    }

    const netBalance = Number(auth.user.wallet_balance || 0) - Number(borrowingSummary?.total_due || 0);

    const stats = [
        {
            label: 'Available Credit',
            value: `₦${Number(eligibility?.available_credit || 0).toLocaleString()}`,
            icon: <FaCoins className="text-sky-500" />,
            color: 'bg-sky-50'
        },
        {
            label: 'Total Repaid',
            value: `₦${Number(borrowingSummary?.total_repaid || 0).toLocaleString()}`,
            icon: <FaCheckCircle className="text-emerald-500" />,
            color: 'bg-emerald-50'
        },
        {
            label: 'Active Loans',
            value: borrowingSummary?.active_borrowings || 0,
            icon: <FaClock className="text-amber-500" />,
            color: 'bg-amber-50'
        },
        {
            label: 'Overdue',
            value: borrowingSummary?.overdue_borrowings || 0,
            icon: <FaExclamationTriangle className="text-rose-500" />,
            color: 'bg-rose-50'
        }
    ];

    const services = [
        { label: 'Airtime', icon: <FaPhone />, route: 'airtime', color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Instant Top-up' },
        { label: 'Data', icon: <FaWifi />, route: 'data', color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Internet Bundles' },
        { label: 'Cable TV', icon: <FaTv />, route: 'cable', color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Subscriptions' },
        { label: 'Electricity', icon: <FaLightbulb />, route: 'electricity', color: 'text-rose-500', bg: 'bg-rose-50', desc: 'Utility Bills' },
    ];

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
                        <p className="text-sm text-slate-500">Welcome back, {auth.user.name}</p>
                    </div>
                    {has_card && (
                        <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-2">
                            <FaCheckCircle className="text-emerald-500 text-xs" />
                            <span className="text-[10px] font-bold text-emerald-700 uppercase">Card Linked</span>
                        </div>
                    )}
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6 max-w-7xl mx-auto px-4 space-y-6">
                {/* Main Balance Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Balance</p>
                                <h3 className={`text-4xl font-black ${netBalance < 0 ? 'text-rose-400' : 'text-white'}`}>
                                    {netBalance < 0 ? '-' : ''}₦{Math.abs(netBalance).toLocaleString()}
                                </h3>
                                {borrowingSummary?.total_due > 0 && (
                                    <div className="mt-2 flex flex-col gap-1">
                                        <p className="text-rose-300/60 text-[10px] font-bold">
                                            Wallet: ₦{Number(auth.user.wallet_balance).toLocaleString()} | Due: ₦{Number(borrowingSummary.total_due).toLocaleString()}
                                        </p>
                                        {netBalance < 0 && borrowingSummary?.next_due_date && (
                                            <p className="text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                <FaClock className="text-[8px]" />
                                                Next Due: {new Date(borrowingSummary.next_due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        )}
                                        {netBalance < 0 && (
                                            <button
                                                onClick={handleRepayAll}
                                                disabled={isRepaying}
                                                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all w-fit shadow-lg shadow-rose-500/30 active:scale-95"
                                            >
                                                <GiPayMoney className="text-sm" />
                                                {isRepaying ? 'Processing...' : 'Repay Now'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                                <FaWallet className="text-2xl text-sky-400" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                href={route('wallet')}
                                className="flex-1 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center gap-2 font-black text-sm hover:bg-slate-100 transition-all shadow-lg shadow-white/5"
                            >
                                <FaPlus className="text-xs" />
                                Add Money
                            </Link>
                            <Link
                                href={route('borrow.index')}
                                className="flex-1 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-sm hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md"
                            >
                                <GiReceiveMoney className="text-lg" />
                                Borrow
                            </Link>
                        </div>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-3xl -ml-24 -mb-24 rounded-full"></div>
                </div>

                {/* Link Card CTA if not linked */}
                {!has_card && (
                    <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:border-sky-300 group">
                        <div className="flex items-center gap-5 text-center md:text-left">
                            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <FaCreditCard className="text-2xl" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-800">Unlock Quick Borrowing</h4>
                                <p className="text-sm text-slate-500">Link your ATM card to enjoy instant credit for airtime and data.</p>
                            </div>
                        </div>
                        <Link
                            href={route('cards.index')}
                            className="w-full md:w-auto px-8 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            <FaLock className="text-xs" />
                            Link Card Now
                        </Link>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                            <div className={`w-10 h-10 rounded-2xl ${stat.color} flex items-center justify-center mb-3`}>
                                {stat.icon}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-lg font-black text-slate-800">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Services Section */}
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Quick Services</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {services.map((service, i) => (
                            <Link
                                key={i}
                                href={route(service.route)}
                                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className={`w-12 h-12 rounded-2xl ${service.bg} ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <span className="text-xl">{service.icon}</span>
                                </div>
                                <h4 className="font-bold text-slate-800">{service.label}</h4>
                                <p className="text-xs text-slate-400">{service.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Borrow Banner (Always show if linked, otherwise it might be redundant with CTA but good for UX) */}
                {has_card && (
                    <div className="relative overflow-hidden bg-gradient-to-br from-sky-600 to-sky-700 rounded-[2.5rem] p-8 text-white shadow-xl">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <GiReceiveMoney className="text-4xl text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Need an Instant Loan?</h3>
                                    <p className="text-sky-100 text-sm opacity-80">Get airtime, data or electricity now and pay later.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href={route('borrow.index')}
                                    className="h-12 px-8 rounded-2xl bg-white text-sky-600 font-bold text-sm shadow-lg transition-all flex items-center gap-2"
                                >
                                    Get Credit
                                    <FaArrowRight className="text-[10px]" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Transactions */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
                        <Link href={route('transactions')} className="text-sky-500 text-sm font-bold hover:underline">See All</Link>
                    </div>
                    <div className="p-8">
                        {recentTransactions && recentTransactions.length > 0 ? (
                            <div className="space-y-4">
                                {recentTransactions.map((transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${transaction.status === 'success' ? 'bg-emerald-50 text-emerald-500' :
                                                transaction.status === 'pending' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'
                                                }`}>
                                                {transaction.type === 'airtime' ? <FaPhone /> :
                                                    transaction.type === 'data' ? <FaWifi /> :
                                                        transaction.type === 'electricity' ? <FaLightbulb /> : <FaMoneyBillWave />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 capitalize">{transaction.type}</p>
                                                <p className="text-xs text-slate-400">{transaction.created_at}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-800">₦{Number(transaction.amount).toLocaleString()}</p>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${transaction.status === 'success' ? 'text-emerald-500' :
                                                transaction.status === 'pending' ? 'text-amber-500' : 'text-rose-500'
                                                }`}>{transaction.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FaHistory className="text-slate-200 text-xl" />
                                </div>
                                <p className="text-slate-400 text-sm">No recent activity found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
