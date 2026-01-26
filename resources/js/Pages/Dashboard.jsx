import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PinVerification from '@/Pages/User/PinVerification';
import FeedbackModal from '@/Components/FeedbackModal';
import {
    FaWallet, FaCheckCircle, FaExclamationTriangle, FaClock,
    FaHistory, FaChartLine, FaShieldAlt, FaArrowRight,
    FaInfoCircle, FaRegCreditCard, FaCoins, FaPhone, FaWifi,
    FaLightbulb, FaTv, FaMoneyBillWave, FaPlus, FaCreditCard, FaLock,
    FaComment, FaSearch,
    FaUniversity,FaCopy
} from 'react-icons/fa';
import { GiReceiveMoney, GiPayMoney } from 'react-icons/gi';

export default function Dashboard({ auth, transactionStats, recentTransactions, serviceUsage, eligibility, borrowingSummary, referralStats, has_card, referralUrl }) {
    const { flash, errors } = usePage().props;
    const [showPinVerification, setShowPinVerification] = useState(false);
    const [isRepaying, setIsRepaying] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    const handleRepayAll = () => {
        if (confirm('Are you sure you want to repay your outstanding debt? Your linked card will be charged, or wallet balance used if card is not available.')) {            setIsRepaying(true);
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

    const copyReferralCode = () => {
        if (referralStats?.referral_code) {
            navigator.clipboard.writeText(referralStats.referral_code);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const copyReferralUrl = () => {
        if (referralUrl) {
            navigator.clipboard.writeText(referralUrl);
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        }
    };

    const generateAccount = () => {
        if (!auth.user.phone_number) {
            alert('Please update your phone number in your profile before generating a bank account.');
            router.get(route('profile.edit'));
            return;
        }
        router.get(route('wallet.virtual-account', { provider: 'paystack' }));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Account number copied!');
        });
    };

    if (showPinVerification && !auth.user.isAdmin) {
        return (
            <div className="min-h-screen bg-base-100">                <PinVerification
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
            icon: <FaCoins className="text-primary" />,
            color: 'bg-primary/10',
            darkColor: 'dark:bg-primary/20'        },
        {
            label: 'Total Repaid',
            value: `₦${Number(borrowingSummary?.total_repaid || 0).toLocaleString()}`,
            icon: <FaCheckCircle className="text-success" />,
            color: 'bg-success/10',
            darkColor: 'dark:bg-success/20'        },
        {
            label: 'Active Loans',
            value: borrowingSummary?.active_borrowings || 0,
            icon: <FaClock className="text-warning" />,
            color: 'bg-warning/10',
            darkColor: 'dark:bg-warning/20'        },
        {
            label: 'Overdue',
            value: borrowingSummary?.overdue_borrowings || 0,
            icon: <FaExclamationTriangle className="text-error" />,
            color: 'bg-error/10',
            darkColor: 'dark:bg-error/20'        }
    ];

    const services = [
        { label: 'Airtime', icon: <FaPhone />, route: 'airtime', color: 'text-primary', bg: 'bg-primary/10', desc: 'Instant Top-up' },
        { label: 'Data', icon: <FaWifi />, route: 'data', color: 'text-success', bg: 'bg-success/10', desc: 'Internet Bundles' },
        { label: 'Cable TV', icon: <FaTv />, route: 'cable', color: 'text-warning', bg: 'bg-warning/10', desc: 'Subscriptions' },
        { label: 'Electricity', icon: <FaLightbulb />, route: 'electricity', color: 'text-error', bg: 'bg-error/10', desc: 'Utility Bills' },    ];

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-base-content">Dashboard</h2>
                        <p className="text-sm text-base-content/60">Welcome back, {auth.user.name}</p>
                    </div>
                    {has_card && (
                        <div className="bg-success/10 px-3 py-1.5 rounded-xl border border-success/20 flex items-center gap-2">
                            <FaCheckCircle className="text-success text-xs" />
                            <span className="text-[10px] font-bold text-success uppercase">Card Linked</span>
                        </div>
                    )}
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6 max-w-7xl mx-auto px-4 space-y-6">
                {/* Main Balance Card */}
                <div className="bg-gradient-to-br from-base-300 to-base-200 rounded-[2.5rem] p-8 text-base-content shadow-xl relative overflow-hidden border border-base-300">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-base-content/60 text-xs font-black uppercase tracking-widest mb-1">Total Balance</p>
                                <h3 className={`text-4xl font-black ${netBalance < 0 ? 'text-error' : 'text-base-content'}`}>
                                    {netBalance < 0 ? '-' : ''}₦{Math.abs(netBalance).toLocaleString()}
                                </h3>
                                {borrowingSummary?.total_due > 0 && (
                                    <div className="mt-2 flex flex-col gap-1">
                                        <p className="text-error/60 text-[10px] font-bold">
                                            Wallet: ₦{Number(auth.user.wallet_balance).toLocaleString()} | Due: ₦{Number(borrowingSummary.total_due).toLocaleString()}
                                        </p>
                                        {netBalance < 0 && borrowingSummary?.next_due_date && (
                                            <p className="text-warning text-[10px] font-black uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                <FaClock className="text-[8px]" />
                                                Next Due: {new Date(borrowingSummary.next_due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        )}
                                        {netBalance < 0 && (
                                            <button
                                                onClick={handleRepayAll}
                                                disabled={isRepaying}
                                                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-error text-error-content hover:bg-error/90 disabled:bg-error/50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all w-fit shadow-lg active:scale-95"
                                            >
                                                <GiPayMoney className="text-sm" />
                                                {isRepaying ? 'Processing...' : 'Repay Now'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="bg-base-100/20 p-3 rounded-2xl backdrop-blur-md border border-base-100/20">
                                <FaWallet className="text-2xl text-primary" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                href={route('wallet')}
                                className="flex-1 h-12 bg-primary text-primary-content rounded-2xl flex items-center justify-center gap-2 font-black text-sm hover:bg-primary-focus transition-all shadow-lg"
                            >
                                <FaPlus className="text-xs" />
                                Add Money
                            </Link>
                            <Link
                                href={route('borrow.index')}
                                className="flex-1 h-12 bg-base-100/20 text-base-content rounded-2xl flex items-center justify-center gap-2 font-black text-sm hover:bg-base-100/30 transition-all border border-base-content/10 backdrop-blur-md"
                            >
                                <GiReceiveMoney className="text-lg" />
                                Borrow
                            </Link>
                        </div>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 blur-3xl -ml-24 -mb-24 rounded-full"></div>
                </div>

                {/* Referral Card */}
                <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-6 border border-secondary/30 shadow-lg overflow-hidden">
                    <div className="flex flex-col gap-5 sm:gap-6">
                        {/* Top: Icon + Text */}
                        <div className="flex items-center gap-4 sm:gap-5">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                                <FaCoins className="text-xl sm:text-2xl text-secondary" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-bold text-base-content leading-tight">Earn with Referrals</h3>
                                <p className="text-[10px] sm:text-sm text-base-content/70 mt-1 leading-tight">Share your code and earn 4% on every friend's first deposit.</p>
                            </div>
                        </div>

                        {/* Middle: Inputs (Full Width) */}
                        <div className="flex flex-col gap-2.5 w-full">
                            <div className="flex flex-wrap xs:flex-nowrap items-center gap-2">
                                <div className="flex-1 bg-base-100/60 px-3 py-2 rounded-xl border border-base-300/50 flex items-center justify-between gap-2 min-w-0">
                                    <code className="text-[10px] sm:text-xs font-black text-primary truncate">{referralStats?.referral_code || '...'}</code>
                                    <button
                                        onClick={copyReferralCode}
                                        className={`px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all flex-shrink-0 ${
                                            copiedCode 
                                                ? 'bg-success/20 text-success' 
                                                : 'bg-primary/20 text-primary hover:bg-primary/30'
                                        }`}
                                    >
                                        {copiedCode ? '✓' : 'Copy'}
                                    </button>
                                </div>
                                <Link
                                    href={route('referral.index')}
                                    className="w-full xs:w-auto px-5 py-2 bg-secondary text-secondary-content rounded-xl text-[10px] sm:text-xs font-bold hover:bg-secondary-focus transition-all text-center whitespace-nowrap"
                                >
                                    Manage
                                </Link>
                            </div>
                            
                            {referralUrl && (
                                <div className="bg-base-100/60 px-3 py-2 rounded-xl border border-base-300/50 flex items-center justify-between gap-3 w-full overflow-hidden">
                                    <span className="text-[9px] sm:text-[10px] font-medium text-base-content/60 truncate flex-1 min-w-0">{referralUrl}</span>
                                    <button
                                        onClick={copyReferralUrl}
                                        className={`px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all flex-shrink-0 ${
                                            copiedUrl 
                                                ? 'bg-success/20 text-success' 
                                                : 'bg-base-300 text-base-content hover:bg-base-400'
                                        }`}
                                    >
                                        {copiedUrl ? '✓' : 'Link'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Bottom: Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                            <div className="bg-base-100/50 p-2.5 sm:p-4 rounded-xl border border-base-300/30 text-center flex flex-col justify-center min-w-0">
                                <p className="text-[8px] sm:text-xs text-base-content/60 font-bold mb-1 uppercase tracking-tighter truncate">Referred</p>
                                <p className="text-base sm:text-2xl font-black text-secondary leading-none">{referralStats?.total_referred_users || 0}</p>
                            </div>
                            <div className="bg-base-100/50 p-2.5 sm:p-4 rounded-xl border border-base-300/30 text-center flex flex-col justify-center min-w-0">
                                <p className="text-[8px] sm:text-xs text-base-content/60 font-bold mb-1 uppercase tracking-tighter truncate">Active</p>
                                <p className="text-base sm:text-2xl font-black text-success leading-none">{referralStats?.active_referred_users || 0}</p>
                            </div>
                            <div className="bg-base-100/50 p-2.5 sm:p-4 rounded-xl border border-base-300/30 text-center flex flex-col justify-center min-w-0">
                                <p className="text-[8px] sm:text-xs text-base-content/60 font-bold mb-1 uppercase tracking-tighter truncate">Earnings</p>
                                <p className="text-sm sm:text-xl font-black text-primary leading-none truncate">₦{Number(referralStats?.total_earnings || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dedicated Bank Accounts */}
                <div className="bg-base-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-base-300">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xs sm:text-sm font-black text-base-content uppercase tracking-widest flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FaUniversity className="text-primary text-xs" />
                            </div>
                            Dedicated Accounts
                        </h4>
                    </div>

                    <div className="grid gap-4">
                        {auth.user.virtual_account_details && Object.keys(auth.user.virtual_account_details).length > 0 ? (
                            Object.entries(auth.user.virtual_account_details).map(([provider, account], i) => (
                                <div key={i} className="relative group overflow-hidden bg-base-200/50 rounded-3xl p-5 border border-base-300 hover:border-primary/30 transition-all">
                                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-base-100 shadow-sm flex items-center justify-center text-xl text-primary border border-base-300">
                                                <FaUniversity />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase text-base-content/50 tracking-widest mb-0.5">{account.bank_name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xl font-black text-base-content">{account.account_number}</p>
                                                    <button 
                                                        onClick={() => copyToClipboard(account.account_number)}
                                                        className="p-1.5 text-base-content/30 hover:text-primary transition-colors"
                                                    >
                                                        <FaCopy className="text-xs" />
                                                    </button>
                                                </div>
                                                <p className="text-xs font-bold text-base-content/60 mt-0.5 truncate uppercase">{account.account_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-success bg-success/10 px-3 py-1.5 rounded-full self-start sm:self-center">
                                            <FaCheckCircle />
                                            Active
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-base-200/50 rounded-[2rem] border-2 border-dashed border-base-300">
                                <div className="w-16 h-16 bg-base-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-base-content/20">
                                    <FaUniversity className="text-2xl" />
                                </div>
                                <p className="text-sm font-bold text-base-content/40">No virtual accounts generated yet.</p>
                                <button 
                                    onClick={generateAccount}
                                    className="mt-4 px-8 py-3 bg-primary text-primary-content text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg"
                                >
                                    Generate Dedicated Account
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Link Card CTA if not linked */}
                {!has_card && (
                    <div className="bg-base-100 p-6 rounded-[2rem] border-2 border-dashed border-base-300 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:border-primary group shadow-sm">
                        <div className="flex items-center gap-5 text-center md:text-left">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <FaCreditCard className="text-2xl" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-base-content">Unlock Quick Borrowing</h4>
                                <p className="text-sm text-base-content/60">Link your ATM card to enjoy instant credit for airtime and data.</p>
                            </div>
                        </div>
                        <Link
                            href={route('cards.index')}
                            className="w-full md:w-auto px-8 h-12 bg-primary text-primary-content rounded-2xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-primary-focus transition-all shadow-lg"
                        >
                            <FaLock className="text-xs" />
                            Link Card Now
                        </Link>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-base-100 p-5 rounded-3xl border border-base-300 shadow-sm transition-transform hover:scale-[1.02]">
                            <div className={`w-10 h-10 rounded-2xl ${stat.color} ${stat.darkColor} flex items-center justify-center mb-3`}>
                                {stat.icon}
                            </div>
                            <p className="text-[10px] font-black text-base-content/60 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-lg font-black text-base-content">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Services Section */}
                <div>
                    <h3 className="text-lg font-bold text-base-content mb-4 px-2">Quick Services</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {services.map((service, i) => (
                            <Link
                                key={i}
                                href={route(service.route)}
                                className="bg-base-100 p-6 rounded-[2.5rem] border border-base-300 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className={`w-12 h-12 rounded-2xl ${service.bg} ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <span className="text-xl">{service.icon}</span>
                                </div>
                                <h4 className="font-bold text-base-content">{service.label}</h4>
                                <p className="text-xs text-base-content/60">{service.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Borrow Banner */}
                {has_card && (
                    <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-focus rounded-[2.5rem] p-8 text-primary-content shadow-xl">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-primary-content/10 backdrop-blur-md flex items-center justify-center border border-primary-content/20">
                                    <GiReceiveMoney className="text-4xl text-primary-content" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary-content">Need an Instant Loan?</h3>
                                    <p className="text-primary-content/80 text-sm">Get airtime, data or electricity now and pay later.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href={route('borrow.index')}
                                    className="h-12 px-8 rounded-2xl bg-primary-content text-primary font-bold text-sm shadow-lg transition-all flex items-center gap-2 hover:bg-primary-content/90"
                                >
                                    Get Credit
                                    <FaArrowRight className="text-[10px]" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Transactions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Feedback Widget */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-3xl p-6 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                                    <FaComment className="text-purple-600 text-lg" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base-content">Send Feedback</h3>
                                    <p className="text-xs text-base-content/60">Help us improve</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-base-content/70 mb-4">Tell us what you think! Share bug reports, feature requests, or general feedback to help us build a better platform.</p>
                        <button
                            onClick={() => setShowFeedbackModal(true)}
                            className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <FaComment className="text-sm" />
                            Give Feedback
                        </button>
                    </div>

                    {/* Payment Retrieval Widget */}
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-3xl p-6 border border-cyan-200 dark:border-cyan-800 hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center">
                                    <FaSearch className="text-cyan-600 text-lg" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base-content">Retrieve Payment</h3>
                                    <p className="text-xs text-base-content/60">Verify with Paystack</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-base-content/70 mb-4">Didn't receive credit for a payment? Enter your Paystack reference here and we'll verify and credit it immediately.</p>
                        <Link
                            href={route('payment-retrieval.show')}
                            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-center"
                        >
                            <FaSearch className="text-sm" />
                            Retrieve Payment
                        </Link>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-base-100 rounded-[2.5rem] shadow-sm border border-base-300 overflow-hidden">
                    <div className="px-8 py-6 border-b border-base-300 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-base-content">Recent Activity</h3>
                        <Link href={route('transactions')} className="text-primary text-sm font-bold hover:underline">See All</Link>
                    </div>
                    <div className="p-8">
                        {recentTransactions && recentTransactions.length > 0 ? (
                            <div className="space-y-4">
                                {recentTransactions.map((transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-base-200 transition-colors border border-transparent hover:border-base-300">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                transaction.status === 'success' ? 'bg-success/10 text-success' :
                                                transaction.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
                                            }`}>
                                                {transaction.type === 'airtime' ? <FaPhone /> :
                                                    transaction.type === 'data' ? <FaWifi /> :
                                                        transaction.type === 'electricity' ? <FaLightbulb /> : <FaMoneyBillWave />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-base-content capitalize">{transaction.type}</p>
                                                <p className="text-xs text-base-content/60">{transaction.created_at}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-base-content">₦{Number(transaction.amount).toLocaleString()}</p>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${
                                                transaction.status === 'success' ? 'text-success' :
                                                transaction.status === 'pending' ? 'text-warning' : 'text-error'
                                            }`}>{transaction.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 bg-base-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FaHistory className="text-base-content/20 text-xl" />
                                </div>
                                <p className="text-base-content/60 text-sm">No recent activity found</p>
                            </div>
                        )}
                    </div>
                </div>

                <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />            </div>
        </AppLayout>
    );
}
