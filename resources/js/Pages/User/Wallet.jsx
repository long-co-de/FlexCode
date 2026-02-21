import { useState, useEffect } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
import SelectInput from '@/Components/SelectInput';
import Modal from '@/Components/Modal';
import {
    FaWallet, FaExchangeAlt, FaMoneyBillWave, FaTicketAlt,
    FaArrowRight, FaArrowDown, FaArrowUp, FaCopy, FaTimes,
    FaUniversity, FaHistory, FaPlus, FaCreditCard, FaShieldAlt,
    FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaSearch,
    FaBolt, FaChevronRight, FaLink
} from 'react-icons/fa';

export default function Wallet({ auth, paymentMethods, recentTransactions, walletStats, virtualAccounts, paymentCharges, has_card }) {
    const [showFundModal, setShowFundModal] = useState(false);
    let d = usePage().props.errors;

    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [copySuccess, setCopySuccess] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeDrawer, setActiveDrawer] = useState(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

    // Treasure hunt lockout state
    const [couponAttempts, setCouponAttempts] = useState(0);
    const [isCouponLocked, setIsCouponLocked] = useState(false);
    const [couponLockoutEndTime, setCouponLockoutEndTime] = useState(null);
    const [couponTimeRemaining, setCouponTimeRemaining] = useState(null);

    const [calculatedCharges, setCalculatedCharges] = useState({
        amount: 0,
        charge: 0,
        chargePercentage: 0,
        finalAmount: 0
    });

    const { data: fundData, setData: setFundData, post: postFund, processing: fundProcessing, errors: fundErrors, reset: resetFund } = useForm({
        amount: '',
        payment_method_id: '',
    });

    const { data: withdrawData, setData: setWithdrawData, post: postWithdraw, processing: withdrawProcessing, errors: withdrawErrors, reset: resetWithdraw } = useForm({
        amount: '',
        bank_name: '',
        account_number: '',
        account_name: '',
    });

    const { data: couponData, setData: setCouponData, post: postCoupon, processing: couponProcessing, errors: couponErrors, reset: resetCoupon } = useForm({
        code: '',
    });

    // Effect to handle modal state
    useEffect(() => {
        if (!showFundModal && !showWithdrawModal && !showCouponModal) {
            setIsDrawerOpen(false);
        }
    }, [showFundModal, showWithdrawModal, showCouponModal]);

    // Check if there's a saved coupon lockout in localStorage
    useEffect(() => {
        const savedLockoutEnd = localStorage.getItem('couponLockoutEndTime');
        if (savedLockoutEnd) {
            const endTime = parseInt(savedLockoutEnd);
            if (endTime > Date.now()) {
                setIsCouponLocked(true);
                setCouponLockoutEndTime(endTime);
            } else {
                localStorage.removeItem('couponLockoutEndTime');
                localStorage.removeItem('couponAttempts');
            }
        }

        const savedAttempts = localStorage.getItem('couponAttempts');
        if (savedAttempts) {
            setCouponAttempts(parseInt(savedAttempts));
        }
    }, []);

    // Update countdown timer when locked
    useEffect(() => {
        if (!isCouponLocked || !couponLockoutEndTime) return;

        const timer = setInterval(() => {
            const remaining = Math.max(0, couponLockoutEndTime - Date.now());

            if (remaining <= 0) {
                setIsCouponLocked(false);
                setCouponLockoutEndTime(null);
                localStorage.removeItem('couponLockoutEndTime');
                localStorage.removeItem('couponAttempts');
                clearInterval(timer);
            } else {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                setCouponTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isCouponLocked, couponLockoutEndTime]);

    const openDrawer = (drawerType) => {
        setShowFundModal(false);
        setShowWithdrawModal(false);
        setShowCouponModal(false);
        resetFund();
        resetWithdraw();
        resetCoupon();
        setActiveDrawer(drawerType);
        setIsDrawerOpen(true);
        setTimeout(() => {
            if (drawerType === 'fund') setShowFundModal(true);
            if (drawerType === 'withdraw') setShowWithdrawModal(true);
            if (drawerType === 'coupon') setShowCouponModal(true);
        }, 50);
    };

    const closeDrawer = () => {
        setShowFundModal(false);
        setShowWithdrawModal(false);
        setShowCouponModal(false);
        setIsDrawerOpen(false);
        setTimeout(() => setActiveDrawer(null), 300);
    };

    const calculateCharges = (amount, paymentMethodId) => {
        if (!amount || amount <= 0 || !paymentMethodId) {
            setCalculatedCharges({ amount: 0, charge: 0, chargePercentage: 0, finalAmount: 0 });
            return;
        }

        const method = paymentMethods.find(m => m.id == paymentMethodId);
        if (!method) return;

        let chargePercentage = 0;
        if (method.code === 'bank_transfer' || method.code === 'virtual_account') {
            chargePercentage = paymentCharges.virtual_bank_deposit_charge;
        } else if (method.code === 'card') {
            chargePercentage = paymentCharges.card_payment_charge;
        } else {
            chargePercentage = paymentCharges.online_payment_charge;
        }

        const amountValue = parseFloat(amount);
        let charge = 0;

        if (method.code === 'bank_transfer' || method.code === 'virtual_account') {
            chargePercentage = 1.5;
            charge = (amountValue * chargePercentage) / 100;
        } else {
            chargePercentage = 1.5;
            charge = (amountValue * chargePercentage) / 100;
            if (amountValue >= 2000) {
                charge += 100;
            }
        }

        const finalAmount = amountValue - charge;

        setCalculatedCharges({ amount: amountValue, charge, chargePercentage, finalAmount });
    };

    useEffect(() => {
        calculateCharges(fundData.amount, fundData.payment_method_id);
    }, [fundData.amount, fundData.payment_method_id]);

    const handleFundSubmit = (e) => {
        e.preventDefault();
        postFund(route('wallet.fund'), {
            onError: (error) => {
                if(error?.url) location.href = error?.url;
            }
        });
    };

    const handleWithdrawSubmit = (e) => {
        e.preventDefault();
        postWithdraw(route('wallet.withdraw'), {
            onSuccess: () => {
                resetWithdraw();
                closeDrawer();
            },
        });
    };

    const handleCouponSubmit = (e) => {
        e.preventDefault();
        if (isCouponLocked) return;

        postCoupon(route('coupons.redeem'), {
            onSuccess: () => {
                setCouponAttempts(0);
                localStorage.removeItem('couponAttempts');
                resetCoupon();
                closeDrawer();
            },
            onError: () => {
                const newAttempts = couponAttempts + 1;
                setCouponAttempts(newAttempts);
                localStorage.setItem('couponAttempts', newAttempts.toString());
                if (newAttempts >= 5) {
                    const lockoutEnd = Date.now() + (30 * 60 * 1000);
                    setIsCouponLocked(true);
                    setCouponLockoutEndTime(lockoutEnd);
                    localStorage.setItem('couponLockoutEndTime', lockoutEnd.toString());
                }
            }
        });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    const createVirtualAccount = (provider) => {
        if (!auth.user.phone_number) {
            alert('Please update your phone number in your profile before generating a bank account.');
            location.href = route('profile.edit');
            return;
        }
        window.location.href = route('wallet.virtual-account', { provider });
    };

    useEffect(()=>{
        if(d?.url) location.href = d?.url;
    },[]);

    const stats = [
        {
            label: 'Total Funded',
            value: `₦${walletStats.total_funded.toLocaleString()}`,
            icon: <FaPlus />,
            color: 'bg-emerald-500',
            bg: 'bg-emerald-50'
        },
        {
            label: 'Total Spent',
            value: `₦${walletStats.total_spent.toLocaleString()}`,
            icon: <FaMoneyBillWave />,
            color: 'bg-rose-500',
            bg: 'bg-rose-50'
        },
    ];

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">My Wallet</h2>
                        <p className="text-sm font-medium text-slate-500">Manage your funds and transactions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {has_card && (
                            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-2 mr-2">
                                <FaCheckCircle className="text-emerald-500 text-xs" />
                                <span className="text-[10px] font-bold text-emerald-700 uppercase">Card Linked</span>
                            </div>
                        )}
                        <Link href={route('transactions')} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-all">
                            <FaHistory className="text-sm" />
                            <span className="text-xs font-bold whitespace-nowrap">History</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Wallet" />

            <div className="py-6 sm:py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
                        {/* Left Column - Balance & Stats */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Main Balance Card */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-slate-400 text-xs sm:text-sm font-medium mb-1">Available Balance</p>
                                            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
                                                ₦{auth.user.wallet_balance}
                                            </h3>
                                        </div>
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <FaWallet className="text-xl sm:text-2xl text-sky-400" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-10">
                                        {/* <button
                                            onClick={() => openDrawer('fund')}
                                            className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 group"
                                        >
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <FaPlus className="text-[10px] sm:text-sm text-white" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Fund</span>
                                        </button> */}

                                        {/* <Link
                                            href={route('wallet.transfer.show')}
                                            className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 group"
                                        >
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <FaExchangeAlt className="text-[10px] sm:text-sm text-white" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Transfer</span>
                                        </Link> */}

                                        {/* <button
                                            className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 group opacity-50 cursor-not-allowed"
                                        >
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-500 flex items-center justify-center">
                                                <FaMoneyBillWave className="text-[10px] sm:text-sm text-white" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Withdraw</span>
                                        </button> */}

                                        <button
                                            onClick={() => openDrawer('coupon')}
                                            className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 group"
                                        >
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <FaTicketAlt className="text-[10px] sm:text-sm text-white" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Coupon</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 blur-[80px] -ml-24 -mb-24 rounded-full"></div>
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
                                        <FaLink className="text-xs" />
                                        Link Card Now
                                    </Link>
                                </div>
                            )}

                            {/* Stats Bento Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stats.map((stat, i) => (
                                    <div key={i} className="bg-white rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${stat.bg} flex items-center justify-center text-lg sm:text-xl`}>
                                            <span className={stat.color.replace('bg-', 'text-')}>{stat.icon}</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                            <p className="text-lg sm:text-xl font-black text-slate-800">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Account Details / Virtual Accounts */}
                            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                                            <FaUniversity className="text-sky-500 text-xs" />
                                        </div>
                                        Dedicated Accounts
                                    </h4>
                                </div>

                                <div className="grid gap-4">
                                    {virtualAccounts && virtualAccounts.length > 0 ? (
                                        virtualAccounts.map((account, i) => (
                                            <div key={i} className="relative group overflow-hidden bg-slate-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100 hover:border-sky-100 transition-all">
                                                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center text-xl text-sky-600 border border-slate-100">
                                                            <FaUniversity />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{account.bank_name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-lg sm:text-xl font-black text-slate-900">{account.account_number}</p>
                                                                <button
                                                                    onClick={() => copyToClipboard(account.account_number)}
                                                                    className="p-1.5 text-slate-300 hover:text-sky-500 transition-colors"
                                                                >
                                                                    <FaCopy className="text-xs" />
                                                                </button>
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-500 mt-0.5 truncate uppercase">{account.account_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full self-start sm:self-center">
                                                        <FaCheckCircle />
                                                        Active
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                                                <FaUniversity className="text-2xl" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-400">No virtual accounts available.</p>
                                            <button
                                                onClick={() => createVirtualAccount('paystack')}
                                                className="mt-4 px-6 py-2 bg-slate-900 text-white text-xs font-black rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all"
                                            >
                                                Generate Account
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Recent Activity */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                            <FaHistory className="text-amber-500 text-xs" />
                                        </div>
                                        Recent Activity
                                    </h4>
                                    <Link href={route('transactions')} className="text-[10px] font-black text-sky-600 uppercase tracking-widest hover:text-sky-700">View All</Link>
                                </div>

                                <div className="space-y-4">
                                    {recentTransactions && recentTransactions.length > 0 ? (
                                        recentTransactions.slice(0, 5).map((tx, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'deposit' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                        {tx.type === 'deposit' ? <FaArrowDown className="text-xs" /> : <FaArrowUp className="text-xs" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-black text-slate-800 truncate uppercase tracking-tighter ">{tx.description.slice(0,10)}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <p className={`text-xs font-black flex-shrink-0 ml-2 ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                    {tx.type === 'deposit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 opacity-50">
                                            <FaSearch className="mx-auto mb-3 text-slate-300" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">No transactions yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Secure Info */}
                            <div className="p-6 sm:p-8 bg-slate-900 rounded-3xl sm:rounded-[2.5rem] text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <FaShieldAlt className="text-2xl sm:text-3xl text-sky-400 mb-4" />
                                    <h4 className="text-base sm:text-lg font-black mb-2 tracking-tight">Financial Security</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed font-medium opacity-80">
                                        Your funds are protected by multi-layer encryption and real-time fraud monitoring.
                                    </p>
                                </div>
                                <FaLink className="absolute -bottom-6 -right-6 text-white/5 text-[100px] rotate-12" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Funding Modal (Drawer style) */}
            <Modal show={showFundModal} onClose={closeDrawer} maxWidth="md">
                <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center">
                                <FaPlus className="text-sky-600 text-lg" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Fund Wallet</h3>
                                <p className="text-xs font-medium text-slate-500">Choose your preferred funding method</p>
                            </div>
                        </div>
                        <button onClick={closeDrawer} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-all">
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleFundSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <InputLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" value="Select Payment Method" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setFundData('payment_method_id', method.id)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                                            fundData.payment_method_id == method.id
                                            ? 'border-sky-500 bg-sky-50 shadow-sm'
                                            : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                                            fundData.payment_method_id == method.id ? 'bg-sky-500 text-white' : 'bg-white text-slate-400 shadow-sm'
                                        }`}>
                                            {method.code === 'card' ? <FaCreditCard /> : <FaUniversity />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{method.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Instant</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <InputLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" value="Amount to Fund" />
                            <div className="relative">
                                <TextInput
                                    type="number"
                                    value={fundData.amount}
                                    onChange={(e) => setFundData('amount', e.target.value)}
                                    className="w-full pl-12 py-4 rounded-2xl border-slate-100 focus:border-sky-500 focus:ring-sky-100 text-xl font-black"
                                    placeholder="0.00"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">₦</div>
                            </div>
                        </div>

                        {calculatedCharges.amount > 0 && (
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-500 uppercase tracking-wider">Processing Fee ({calculatedCharges.chargePercentage}%)</span>
                                    <span className="text-rose-500">₦{calculatedCharges.charge.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-base font-black border-t border-slate-200 pt-3">
                                    <span className="text-slate-900 uppercase tracking-widest">You'll Receive</span>
                                    <span className="text-sky-600">₦{calculatedCharges.finalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={fundProcessing || !fundData.amount || !fundData.payment_method_id}
                            className="w-full py-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
                        >
                            {fundProcessing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Proceed to Payment <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </Modal>

            {/* Coupon Modal */}
            <Modal show={showCouponModal} onClose={closeDrawer} maxWidth="sm">
                <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                                <FaTicketAlt className="text-amber-600 text-xl" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Redeem Coupon</h3>
                                <p className="text-xs font-medium text-slate-500">Unlock special wallet rewards</p>
                            </div>
                        </div>
                        <button onClick={closeDrawer} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-all">
                            <FaTimes />
                        </button>
                    </div>

                    {isCouponLocked ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 animate-pulse">
                                <FaShieldAlt className="text-2xl" />
                            </div>
                            <h4 className="text-lg font-black text-slate-800">Security Lockout</h4>
                            <p className="text-sm text-slate-500 px-4">Too many failed attempts. Please try again in <span className="text-rose-600 font-black">{couponTimeRemaining}</span></p>
                            <button onClick={closeDrawer} className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Close</button>
                        </div>
                    ) : (
                        <form onSubmit={handleCouponSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <InputLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" value="Enter Code" />
                                <TextInput
                                    value={couponData.code}
                                    onChange={(e) => setCouponData('code', e.target.value.toUpperCase())}
                                    className="w-full py-4 px-6 rounded-2xl border-slate-100 focus:border-amber-500 focus:ring-amber-100 text-xl font-black text-center tracking-[0.3em] placeholder:tracking-normal"
                                    placeholder="XXXX-XXXX"
                                />
                                <InputError message={couponErrors.code} />
                            </div>

                            <button
                                type="submit"
                                disabled={couponProcessing || !couponData.code}
                                className="w-full py-5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black rounded-2xl shadow-xl shadow-amber-100 transition-all flex items-center justify-center gap-3"
                            >
                                {couponProcessing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Redeem Now <FaCheckCircle /></>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </Modal>
        </AppLayout>
    );
}
