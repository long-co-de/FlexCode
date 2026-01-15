import { useState, useEffect } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
import SelectInput from '@/Components/SelectInput';
import Modal from '@/Components/Modal';
import { FaWallet, FaExchangeAlt, FaMoneyBillWave, FaTicketAlt, FaArrowRight, FaArrowDown, FaArrowUp, FaCopy, FaTimes } from 'react-icons/fa';

export default function Wallet({ auth, paymentMethods, recentTransactions, walletStats, virtualAccounts, paymentCharges }) {
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
        // Reset state when modals are closed
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
                // Lockout period has expired
                localStorage.removeItem('couponLockoutEndTime');
                localStorage.removeItem('couponAttempts');
            }
        }

        // Get saved attempts
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
        // First close all modals
        setShowFundModal(false);
        setShowWithdrawModal(false);
        setShowCouponModal(false);

        // Reset all forms
        resetFund();
        resetWithdraw();
        resetCoupon();

        // Set active drawer
        setActiveDrawer(drawerType);
        setIsDrawerOpen(true);

        // Open the requested modal with a slight delay to ensure clean state
        setTimeout(() => {
            if (drawerType === 'fund') setShowFundModal(true);
            if (drawerType === 'withdraw') setShowWithdrawModal(true);
            if (drawerType === 'coupon') setShowCouponModal(true);
        }, 50);
    };

    const closeDrawer = () => {
        // Close all modals
        setShowFundModal(false);
        setShowWithdrawModal(false);
        setShowCouponModal(false);

        // Set drawer state
        setIsDrawerOpen(false);

        // Reset active drawer after animation completes
        setTimeout(() => setActiveDrawer(null), 300);
    };

    // Calculate charges based on payment method and amount
    const calculateCharges = (amount, paymentMethodId) => {
        if (!amount || amount <= 0 || !paymentMethodId) {
            setCalculatedCharges({
                amount: 0,
                charge: 0,
                chargePercentage: 0,
                finalAmount: 0
            });
            return;
        }

        const method = paymentMethods.find(m => m.id == paymentMethodId);
        if (!method) return;

        let chargePercentage = 0;

        // Determine charge percentage based on payment method type
        if (method.code === 'bank_transfer' || method.code === 'virtual_account') {
            chargePercentage = paymentCharges.virtual_bank_deposit_charge;
        } else if (method.code === 'card') {
            chargePercentage = paymentCharges.card_payment_charge;
        } else {
            chargePercentage = paymentCharges.online_payment_charge;
        }

        const amountValue = parseFloat(amount);
        const charge = (amountValue * chargePercentage) / 100;
        const finalAmount = amountValue - charge;

        setCalculatedCharges({
            amount: amountValue,
            charge,
            chargePercentage,
            finalAmount
        });
    };

    // Update calculated charges when amount or payment method changes
    useEffect(() => {
        calculateCharges(fundData.amount, fundData.payment_method_id);
    }, [fundData.amount, fundData.payment_method_id]);

    const handleFundSubmit = (e) => {
        e.preventDefault();
        postFund(route('wallet.fund'), {
            onError: (error) => {
                console.log(error);
                if(error?.url){
                    location.href = error?.url;
                }
            },
            onFinish:(es)=>{
                console.log(es);
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

        // Check if treasure hunt is locked
        if (isCouponLocked) {
            return;
        }

        postCoupon(route('coupons.redeem'), {
            onSuccess: () => {
                // Reset attempts on successful redemption
                setCouponAttempts(0);
                localStorage.removeItem('couponAttempts');
                resetCoupon();
                closeDrawer();
            },
            onError: () => {
                // Increment attempts counter
                const newAttempts = couponAttempts + 1;
                setCouponAttempts(newAttempts);

                // Save attempts to localStorage
                localStorage.setItem('couponAttempts', newAttempts.toString());

                // Check if we need to lock the treasure hunt (5 or more attempts)
                if (newAttempts >= 5) {
                    // Lock for 30 minutes
                    const lockoutEnd = Date.now() + (30 * 60 * 1000); // 30 minutes in milliseconds
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
        window.location.href = route('wallet.virtual-account', { provider });
    };
    useEffect(()=>{
        console.log(d);
        if(d?.url){
            location.href = d?.url;
        }
    },[])
    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Wallet</h2>}
        >
            <Head title="Wallet" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base- overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-00 border-b border-gray-200">
                            {/* Wallet Card */}
                            <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl p-6 shadow-lg mb-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <div>
                                        <h3 className="text-lg font-medium text-white/80">Available Balance</h3>
                                        <p className="text-4xl font-bold mt-1">₦{auth.user.wallet_balance}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <button
                                    onClick={() => openDrawer('fund')}
                                    className="flex flex-col items-center justify-center bg-base-100 -ws p-4 rounded-lg shadow hover:shadow-md transition-all"
                                >
                                    <div className="bg-blue-100 p-3 rounded-full mb-2">
                                        <FaWallet className="text-blue-600 text-xl" />
                                    </div>
                                    <span className="text-sm font-medium">Fund Wallet</span>
                                </button>

                                <Link
                                    href={route('wallet.transfer.show')}
                                    className="flex flex-col items-center justify-center bg-base-100 -ws p-4 rounded-lg shadow hover:shadow-md transition-all"
                                >
                                    <div className="bg-green-100 p-3 rounded-full mb-2">
                                        <FaExchangeAlt className="text-green-600 text-xl" />
                                    </div>
                                    <span className="text-sm font-medium">Transfer</span>
                                </Link>

                                <button
                                    // onClick={() => openDrawer('withdraw')}
                                    className="flex flex-col items-center justify-center bg-base-100 -ws p-4 rounded-lg shadow hover:shadow-md transition-all"
                                >
                                    <div className="bg-purple-100 p-3 rounded-full mb-2">
                                        <FaMoneyBillWave className="text-purple-600 text-xl" />
                                    </div>
                                    <span className="text-sm font-medium">Withdraw</span>
                                </button>

                                <button
                                    onClick={() => openDrawer('coupon')}
                                    className="flex flex-col items-center justify-center bg-base-100 -ws p-4 rounded-lg shadow hover:shadow-md transition-all"
                                >
                                    <div className="bg-yellow-100 p-3 rounded-full mb-2">
                                        <FaTicketAlt className="text-yellow-600 text-xl" />
                                    </div>
                                    <span className="text-sm font-medium">Treasure Hunt</span>
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="border-b border-gray-200 mb-6">
                                <nav className="flex space-x-8" aria-label="Tabs">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent igg-500 hover:igg-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Overview
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('virtual-accounts')}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'virtual-accounts'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent igg-500 hover:igg-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Virtual Accounts
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('transactions')}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'transactions'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent igg-500 hover:igg-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Recent Transactions
                                    </button>
                                </nav>
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'overview' && (
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        <div className="bg-base-100 -ws p-4 rounded-lg shadow">
                                            <h4 className="text-sm font-medium igg-500">Total Funded</h4>
                                             <p className="text-2xl font-semibold mt-1">₦{walletStats.total_funded}</p>
                                        </div>
                                        <div className="bg-base-100 -ws p-4 rounded-lg shadow">
                                            <h4 className="text-sm font-medium igg-500">Total Spent</h4>
                                            <p className="text-2xl font-semibold mt-1">₦{walletStats.total_spent}</p>
                                        </div>
                                        <div className="bg-base-100 -ws p-4 rounded-lg shadow">
                                            <h4 className="text-sm font-medium igg-500">Total Commission</h4>
                                            <p className="text-2xl font-semibold mt-1">₦{walletStats.total_commission}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-lg font-medium">Recent Transactions</h4>
                                        <Link href={route('wallet.history')} className="text-primary hover:underline flex items-center">
                                            View All <FaArrowRight className="ml-1" />
                                        </Link>
                                    </div>

                                    {recentTransactions.length > 0 ? (
                                        <div className="space-y-4">
                                            {recentTransactions.map((transaction) => (
                                                <Link
                                                    key={transaction.id}
                                                    href={route('transactions.show', transaction.id)}
                                                    className="block bg-base-100 -ws p-4 rounded-lg shadow hover:shadow-md transition-all"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className={`p-3 rounded-full mr-4 ${transaction.type === 'wallet_funding' ? 'bg-green-100' :
                                                                    transaction.type === 'wallet_transfer' ? 'bg-blue-100' :
                                                                        transaction.type === 'airtime' ? 'bg-yellow-100' :
                                                                            transaction.type === 'data' ? 'bg-purple-100' :
                                                                                transaction.type === 'cable' ? 'bg-red-100' :
                                                                                    transaction.type === 'electricity' ? 'bg-orange-100' :
                                                                                        'bg-base-200 mm--100'
                                                                }`}>
                                                                {transaction.type === 'wallet_funding' && <FaArrowDown className="text-green-600 text-xl" />}
                                                                {transaction.type === 'wallet_transfer' && <FaExchangeAlt className="text-blue-600 text-xl" />}
                                                                {transaction.type === 'airtime' && <FaWallet className="text-yellow-600 text-xl" />}
                                                                {transaction.type === 'data' && <FaWallet className="text-purple-600 text-xl" />}
                                                                {transaction.type === 'cable' && <FaWallet className="text-red-600 text-xl" />}
                                                                {transaction.type === 'electricity' && <FaWallet className="text-orange-600 text-xl" />}
                                                                {transaction.type === 'withdrawal' && <FaArrowUp className="igg-600 text-xl" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium capitalize">{transaction.type.replace('_', ' ')}</p>
                                                                <p className="text-sm igg-500">{transaction.description.substring(0, 40)}{transaction.description.length > 40 ? '...' : ''}</p>
                                                                <p className="text-xs igg-400">{new Date(transaction.created_at).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`font-bold ${transaction.type === 'wallet_funding' ? 'text-green-600' :
                                                                    transaction.type === 'withdrawal' ? 'text-red-600' :
                                                                        'igg-700'
                                                                }`}>
                                                                {transaction.type === 'wallet_funding' ? '+' :
                                                                    transaction.type === 'withdrawal' ? '-' : ''}
                                                                ₦{transaction.amount}
                                                            </p>
                                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.status === 'successful' ? 'bg-green-100 text-green-800' :
                                                                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                }`}>
                                                                {transaction.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-base-100 -ws p-8 rounded-lg shadow text-center">
                                            <p className="igg-500">No recent transactions found.</p>
                                            <p className="text-sm igg-400 mt-2">Your transaction history will appear here.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'virtual-accounts' && (
                                <div>
                                    <h4 className="text-lg font-medium mb-4">Your Dedicated Virtual Accounts</h4>
                                    <p className="igg-500 mb-6">
                                        Use these accounts to fund your wallet directly from your bank app. The money will be credited to your wallet automatically.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* XixatPay Virtual Account */}
                                        <div className="border rounded-lg p-6 text-white bg-gradient-to-r from-primary to-secondary via-indigo-800">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h5 className="text-lg font-medium">Paylow VAccount</h5>
                                                    <p className="text-sm igg-500">Instant funding via bank transfer</p>
                                                </div>
                                                <div className="bg-base-100 -ws p-2 rounded-lg shadow-sm">
                                                    <span className="font-bold text-indigo-600">Paylow</span>
                                                </div>
                                            </div>

                                            {virtualAccounts && virtualAccounts.xixatpay ? (
                                                <div>
                                                    <div className="mb-4">
                                                        <p className="text-sm igg-500">Bank Name</p>
                                                        <p className="font-medium">{virtualAccounts.xixatpay.bank_name}</p>
                                                    </div>
                                                    <div className="mb-4">
                                                        <p className="text-sm igg-500">Account Number</p>
                                                        <div className="flex items-center">
                                                            <p className="font-medium">{virtualAccounts.xixatpay.account_number}</p>
                                                            <button
                                                                onClick={() => copyToClipboard(virtualAccounts.xixatpay.account_number)}
                                                                className="ml-2 text-primary text-sm hover:underline flex items-center"
                                                            >
                                                                <FaCopy className="mr-1" /> {copySuccess === 'Copied!' ? copySuccess : 'Copy'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mb-4">
                                                        <p className="text-sm igg-500">Account Name</p>
                                                        <p className="font-medium">{virtualAccounts.xixatpay.account_name.replace('Xixat Pay - ','')}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="igg-500 mb-4">You don't have a Paylow virtual account yet.</p>
                                                    <Button onClick={() => createVirtualAccount('xixatpay')} className="bg-white">
                                                        Create Virtual Account
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Monnify Virtual Account */}
                                        {/* <div className="border rounded-lg p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h5 className="text-lg font-medium">Monnify Account</h5>
                                                    <p className="text-sm igg-500">Instant funding via bank transfer</p>
                                                </div>
                                                <img src="/images/monnify-logo.png" alt="Monnify" className="h-8 w-auto" />
                                            </div>

                                            {virtualAccounts && virtualAccounts.monnify ? (
                                                <div>
                                                    <div className="mb-4">
                                                        <p className="text-sm igg-500">Bank Name</p>
                                                        <p className="font-medium">{virtualAccounts.monnify.bank_name}</p>
                                                    </div>
                                                    <div className="mb-4">
                                                        <p className="text-sm igg-500">Account Number</p>
                                                        <div className="flex items-center">
                                                            <p className="font-medium">{virtualAccounts.monnify.account_number}</p>
                                                            <button
                                                                onClick={() => copyToClipboard(virtualAccounts.monnify.account_number)}
                                                                className="ml-2 text-primary text-sm hover:underline"
                                                            >
                                                                {copySuccess === 'Copied!' ? copySuccess : 'Copy'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mb-4">
                                                        <p className="text-sm igg-500">Account Name</p>
                                                        <p className="font-medium">{virtualAccounts.monnify.account_name}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="igg-500 mb-4">You don't have a Monnify virtual account yet.</p>
                                                    <Button onClick={() => createVirtualAccount('monnify')}>
                                                        Create Monnify Account
                                                    </Button>
                                                </div>
                                            )}
                                        </div> */}

                                        {/* Paystack Virtual Account */}
                                        {/* <div className="border rounded-lg p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h5 className="text-lg font-medium">Paystack Account</h5>
                                                    <p className="text-sm igg-500">Instant funding via bank transfer</p>
                                                </div>
                                                <img src="/images/paystack-logo.png" alt="Paystack" className="h-8 w-auto" />
                                            </div>

                                            {virtualAccounts && virtualAccounts.paystack ? (
                                                <div>
                                                    <div className="mb-4">
                                                        <p className="text-sm igg-500">Bank Name</p>
                                                        <p className="font-medium">{virtualAccounts.paystack.bank_name}</p>
                                                    </div>
                                                    <div className="mb-4">
                                                        <p className="text-sm igg-500">Account Number</p>
                                                        <div className="flex items-center">
                                                            <p className="font-medium">{virtualAccounts.paystack.account_number}</p>
                                                            <button
                                                                onClick={() => copyToClipboard(virtualAccounts.paystack.account_number)}
                                                                className="ml-2 text-primary text-sm hover:underline"
                                                            >
                                                                {copySuccess === 'Copied!' ? copySuccess : 'Copy'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mb-4">
                                                        <p className="text-sm igg-500">Account Name</p>
                                                        <p className="font-medium">{virtualAccounts.paystack.account_name}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="igg-500 mb-4">You don't have a Paystack virtual account yet.</p>
                                                    <Button onClick={() => createVirtualAccount('paystack')}>
                                                        Create Paystack Account
                                                    </Button>
                                                </div>
                                            )}
                                        </div> */}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'transactions' && (
                                <div>
                                    <h4 className="text-lg font-medium mb-4">Recent Transactions</h4>
                                    {recentTransactions.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-base-200 mm--50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                            Reference
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                            Type
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                            Amount
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
                                                            Description
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-base-100 -ws divide-y divide-gray-200">
                                                    {recentTransactions.map((transaction) => (
                                                        <tr key={transaction.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium igg-900">
                                                                {transaction.reference}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm igg-500 capitalize">
                                                                {transaction.type.replace('_', ' ')}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                                ₦{transaction.amount}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.status === 'successful' ? 'bg-green-100 text-green-800' :
                                                                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {transaction.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
                                                                {new Date(transaction.created_at).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm igg-500">
                                                                {transaction.description}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="igg-500">No recent transactions found.</p>
                                    )}

                                    <div className="mt-4 text-right">
                                        <Link href={route('transactions')} className="text-primary hover:underline flex items-center justify-end">
                                            View All Transactions <FaArrowRight className="ml-1" />
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Fund Wallet Modal */}
            <Modal show={showFundModal} onClose={() => closeDrawer()}>
                <div className="modal-content">
                    <h2 className="text-lg font-medium mb-4">Fund Wallet</h2>
                    <form onSubmit={handleFundSubmit}>
                        <div className="mb-4">
                            <InputLabel htmlFor="amount" value="Amount (₦)" />
                            <TextInput
                                id="amount"
                                type="number"
                                className="mt-1 block w-full"
                                value={fundData.amount}
                                onChange={(e) => setFundData('amount', e.target.value)}
                                required
                                min="100"
                                placeholder="Enter amount"
                            />
                            <InputError message={fundErrors.amount} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="payment_method_id" value="Payment Method" />
                            <SelectInput
                                id="payment_method_id"
                                className="mt-1 block w-full"
                                value={fundData.payment_method_id}
                                onChange={(e) => setFundData('payment_method_id', e.target.value)}
                                required
                            >
                                <option value="">Select payment method</option>
                                {paymentMethods.map((method) => (
                                    <option key={method.id} value={method.id}>
                                        {method.name}
                                    </option>
                                ))}
                            </SelectInput>
                            <InputError message={fundErrors.payment_method_id} className="mt-2" />
                        </div>

                        {/* Show charge calculation if both amount and payment method are selected */}
                        {fundData.amount > 0 && fundData.payment_method_id && (
                            <div className="mt-4 mb-4 p-4 bg-base-200 mm--50 rounded-lg">
                                <h3 className="text-md font-medium mb-2">Transaction Summary</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="igg-600">Amount:</span>
                                        <span className="font-medium">₦{parseFloat(fundData.amount).toFixed(2)}</span>
                                    </div>

                                    {/* For virtual bank accounts, show the percentage that will be charged */}
                                    {paymentMethods.find(m => m.id == fundData.payment_method_id)?.code === 'virtual_account' ? (
                                        <div className="flex justify-between text-amber-600">
                                            <span>Service Charge ({calculatedCharges.chargePercentage}%):</span>
                                            <span>Will be deducted after deposit</span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between text-amber-600">
                                            <span>Service Charge ({calculatedCharges.chargePercentage}%):</span>
                                            <span>-₦{calculatedCharges.charge.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {/* Only show final amount for non-virtual account methods */}
                                    {paymentMethods.find(m => m.id == fundData.payment_method_id)?.code !== 'virtual_account' && (
                                        <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
                                            <span>Final Amount:</span>
                                            <span>₦{calculatedCharges.finalAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Show note about virtual account charges */}
                                {paymentMethods.find(m => m.id == fundData.payment_method_id)?.code === 'virtual_account' && (
                                    <div className="mt-2 text-xs igg-500">
                                        <p>Note: For virtual bank account deposits, a {calculatedCharges.chargePercentage}% service charge will be deducted from your deposit amount after the transaction is completed.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end mt-6">
                            <Button
                                onClick={() => closeDrawer()}
                                className="mr-2"
                                type="button"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                processing={fundProcessing}
                            >
                                Fund Wallet
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>



            {/* Withdraw Modal */}
            <Modal show={showWithdrawModal} onClose={() => closeDrawer()}>
                <div className="modal-content">
                    <h2 className="text-lg font-medium mb-4">Withdraw to Bank Account</h2>
                    <form onSubmit={handleWithdrawSubmit}>
                        <div className="mb-4">
                            <InputLabel htmlFor="withdraw_amount" value="Amount (₦)" />
                            <TextInput
                                id="withdraw_amount"
                                type="number"
                                className="mt-1 block w-full"
                                value={withdrawData.amount}
                                onChange={(e) => setWithdrawData('amount', e.target.value)}
                                required
                                min="1000"
                                placeholder="Enter amount"
                            />
                            <InputError message={withdrawErrors.amount} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="bank_name" value="Bank Name" />
                            <TextInput
                                id="bank_name"
                                type="text"
                                className="mt-1 block w-full"
                                value={withdrawData.bank_name}
                                onChange={(e) => setWithdrawData('bank_name', e.target.value)}
                                required
                                placeholder="Enter bank name"
                            />
                            <InputError message={withdrawErrors.bank_name} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="account_number" value="Account Number" />
                            <TextInput
                                id="account_number"
                                type="text"
                                className="mt-1 block w-full"
                                value={withdrawData.account_number}
                                onChange={(e) => setWithdrawData('account_number', e.target.value)}
                                required
                                placeholder="Enter account number"
                            />
                            <InputError message={withdrawErrors.account_number} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="account_name" value="Account Name" />
                            <TextInput
                                id="account_name"
                                type="text"
                                className="mt-1 block w-full"
                                value={withdrawData.account_name}
                                onChange={(e) => setWithdrawData('account_name', e.target.value)}
                                required
                                placeholder="Enter account name"
                            />
                            <InputError message={withdrawErrors.account_name} className="mt-2" />
                        </div>

                        <div className="flex justify-end mt-6">
                            <Button
                                onClick={() => closeDrawer()}
                                className="mr-2"
                                type="button"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                processing={withdrawProcessing}
                            >
                                Withdraw
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Treasure Hunt Modal */}
            <Modal show={showCouponModal} onClose={() => closeDrawer()}>
                <div className="modal-content">
                    <h2 className="text-lg font-medium mb-4">Redeem Treasure Hunt Code</h2>

                    {isCouponLocked ? (
                        <div className="alert alert-error mb-6 flex flex-col items-center p-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-10 w-10 mb-3" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h3 className="text-lg font-bold mb-2">Treasure Hunt Locked</h3>
                            <p className="text-center">Too many incorrect attempts. Treasure hunt has been locked for 30 minutes.</p>
                            {couponTimeRemaining && (
                                <div className="mt-4 text-center">
                                    <p className="text-sm">Time remaining:</p>
                                    <p className="text-2xl font-mono mt-1">{couponTimeRemaining}</p>
                                </div>
                            )}
                            <button
                                type="button"
                                className="btn btn-outline mt-4"
                                onClick={closeDrawer}
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleCouponSubmit}>
                            {couponAttempts > 0 && (
                                <div className="alert alert-warning mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>
                                        Incorrect code. After 5 unsuccessful attempts, treasure hunt will be locked for 30 minutes.
                                        ({couponAttempts} failed {couponAttempts === 1 ? 'attempt' : 'attempts'})
                                    </span>
                                </div>
                            )}

                            <div className="mb-4">
                                <InputLabel htmlFor="coupon_code" value="Treasure Hunt Code" />
                                <TextInput
                                    id="coupon_code"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={couponData.code}
                                    onChange={(e) => setCouponData('code', e.target.value)}
                                    required
                                    placeholder="Enter code (e.g., PI-1234567890)"
                                />
                                <p className="text-xs igg-500 mt-1">
                                    Enter your 10-digit treasure hunt code with or without the prefix (e.g., PI-1234567890 or 1234567890)
                                </p>
                                <InputError message={couponErrors.code} className="mt-2" />
                            </div>

                            <div className="flex justify-end mt-6">
                                <Button
                                    onClick={() => closeDrawer()}
                                    className="mr-2"
                                    type="button"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    processing={couponProcessing}
                                >
                                    Redeem Code
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </Modal>
        </AppLayout>
    );
}
