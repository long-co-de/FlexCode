import { useState, useEffect, useRef } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import Modal from '@/Components/Modal';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
    FaUser, FaStar, FaRegStar, FaSearch, FaPhone, 
    FaWallet, FaTag, FaPercent, FaGift, FaShareAlt, FaExchangeAlt,
    FaMobileAlt, FaSimCard, FaShieldAlt, FaBolt,
    FaArrowRight, FaCheckCircle, FaSave, FaUserPlus, FaHistory
} from 'react-icons/fa';
import { GiPayMoney, GiReceiveMoney } from 'react-icons/gi';

export default function Airtime({ auth, networks, beneficiaries = [] }) {
    const [selectedNetwork, setSelectedNetwork] = useState(networks[0] || null);
    const [discount, setDiscount] = useState(0);
    const [amountToPay, setAmountToPay] = useState(0);
    const [airtimeType, setAirtimeType] = useState('VTU');
    const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
    const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState('');
    const [verifyingPin, setVerifyingPin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const airtimeTypes = [
        { 
            id: 'VTU', 
            name: 'VTU', 
            description: 'Direct recharge',
            icon: <FaMobileAlt />,
            color: 'bg-blue-500',
            textColor: 'text-blue-600'
        },
        { 
            id: 'AWOOF', 
            name: 'Awoof', 
            description: 'Huge bonus',
            icon: <FaGift />,
            color: 'bg-purple-500',
            textColor: 'text-purple-600'
        },
        { 
            id: 'SHARE', 
            name: 'Share', 
            description: 'Transfer airtime',
            icon: <FaShareAlt />,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-600'
        },
        { 
            id: 'SELL', 
            name: 'Sell', 
            description: 'Convert to cash',
            icon: <FaExchangeAlt />,
            color: 'bg-rose-500',
            textColor: 'text-rose-600'
        }
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        network_id: selectedNetwork ? selectedNetwork.id : '',
        phone_number: '',
        amount: '',
        airtime_type: 'VTU',
        save_as_beneficiary: false,
        beneficiary_name: '',
        beneficiary_id: '',
        pin: '',
        ported_number: false,
        use_bnpl: false,
        duration: 7,
    });

    const getInterestRate = () => {
        if (data.duration === 3) return 10;
        return 13;
    };

    const calculateTotalRepayment = (amount) => {
        const rate = getInterestRate();
        const interest = (parseFloat(amount || 0) * rate) / 100;
        return parseFloat(amount || 0) + interest;
    };

    useEffect(() => {
        if (selectedNetwork && selectedNetwork.airtimeDiscounts) {
            const activeDiscount = Array.isArray(selectedNetwork.airtimeDiscounts)
                ? selectedNetwork.airtimeDiscounts.find(d => d.is_active)
                : null;

            if (activeDiscount && typeof activeDiscount.discount_percentage !== 'undefined') {
                setDiscount(activeDiscount.discount_percentage);
                calculateAmountToPay(data.amount, activeDiscount.discount_percentage);
            } else {
                setDiscount(0);
                setAmountToPay(data.amount);
            }
        } else {
            setDiscount(0);
            setAmountToPay(data.amount);
        }
    }, [selectedNetwork, data.amount]);

    const calculateAmountToPay = (amount, discountPercentage) => {
        if (!amount) {
            setAmountToPay(0);
            return;
        }
        const parsedAmount = parseFloat(amount) || 0;
        const parsedDiscount = parseFloat(discountPercentage) || 0;
        const discountAmount = (parsedAmount * parsedDiscount) / 100;
        const finalAmount = parsedAmount - discountAmount;
        setAmountToPay(finalAmount.toFixed(2));
    };

    const handleNetworkChange = (network) => {
        setSelectedNetwork(network);
        setData('network_id', network.id);
    };

    const handleAirtimeTypeChange = (type) => {
        setAirtimeType(type);
        setData('airtime_type', type);
    };

    const handleBeneficiarySelect = (beneficiary) => {
        setSelectedBeneficiary(beneficiary);
        setData({
            ...data,
            network_id: beneficiary.network_id,
            phone_number: beneficiary.phone_number,
            airtime_type: beneficiary.meta_data?.airtime_type || 'VTU',
            beneficiary_id: beneficiary.id,
        });

        const network = networks.find(n => n.id.toString() === beneficiary.network_id.toString());
        if (network) setSelectedNetwork(network);
        if (beneficiary.meta_data?.airtime_type) setAirtimeType(beneficiary.meta_data.airtime_type);
    };

    const handlePinChange = (index, value) => {
        const newValue = value.replace(/[^0-9]/g, '').slice(0, 1);
        const newPin = [...pin];
        newPin[index] = newValue;
        setPin(newPin);
        
        setData('pin', newPin.join(''));

        if (newValue && index < 3) {
            document.getElementById(`pin-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && index > 0 && !pin[index]) {
            document.getElementById(`pin-${index - 1}`).focus();
        }
    };

    const handlePaymentMethodSelect = (method) => {
        setData('use_bnpl', method === 'borrow');
        setShowPaymentMethodModal(false);
        handleSubmit({ preventDefault: () => {} });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.network_id || !data.phone_number || !data.amount || parseFloat(data.amount) < 50) return;
        setData('save_as_beneficiary', saveAsBeneficiary);
        setShowPinModal(true);
    };

    const handlePinSubmit = () => {
        setPinError('');
        const pinString = pin.join('');
        if (pinString.length !== 4) {
            setPinError('Please enter a 4-digit PIN');
            return;
        }

        setVerifyingPin(true);
        const routeName = data.use_bnpl ? 'borrow.airtime.process' : 'airtime.purchase';
        
        router.post(route(routeName), {
            ...data,
            pin: pinString
        }, {
            onSuccess: () => {
                reset();
                setPin(['', '', '', '']);
                setShowPinModal(false);
                setSelectedBeneficiary(null);
                setSaveAsBeneficiary(false);
            },
            onError: (errors) => {
                if (errors.pin) setPinError(errors.pin);
                setVerifyingPin(false);
            },
            onFinish: () => setVerifyingPin(false)
        });
    };

    const filteredBeneficiaries = beneficiaries
        ? beneficiaries.filter(b =>
            b.service_type === 'airtime' &&
            (b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.phone_number.includes(searchTerm))
        )
        : [];

    const networkColors = {
        'MTN': 'bg-[#FFCC00]',
        'GLO': 'bg-[#2BB22A]',
        'AIRTEL': 'bg-[#FF0000]',
        '9MOBILE': 'bg-[#005733]'
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Buy Airtime</h2>
                        <p className="text-sm text-slate-500">Fast and reliable top-up</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={route('transactions')} className="btn btn-ghost btn-sm gap-2 text-slate-600">
                            <FaHistory />
                            <span className="hidden sm:inline">History</span>
                        </Link>
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                                <FaWallet className="text-sky-600 text-sm" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none">Balance</p>
                                <p className="text-sm font-bold text-slate-700">₦{auth.user.wallet_balance.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Buy Airtime" />

            <div className="py-8">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Main Form */}
                        <div className="lg:col-span-8 space-y-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Airtime Type */}
                                <div className="bg-white hidden rounded-3xl p-6 shadow-sm border border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <FaTag className="text-sky-500" />
                                        Select Airtime Type
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {airtimeTypes.map((type) => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => handleAirtimeTypeChange(type.id)}
                                                className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                                                    airtimeType === type.id 
                                                    ? 'border-sky-500 bg-sky-50' 
                                                    : 'border-slate-50 hover:border-slate-200 bg-slate-50/50'
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110 ${type.color}`}>
                                                    {type.icon}
                                                </div>
                                                <span className={`text-xs font-bold ${airtimeType === type.id ? 'text-sky-700' : 'text-slate-600'}`}>{type.name}</span>
                                                {airtimeType === type.id && (
                                                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                                        <FaCheckCircle className="text-white text-[10px]" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Network Selection */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <FaSimCard className="text-sky-500" />
                                        Select Network
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {networks.map((network) => {
                                            const name = network.name.toUpperCase();
                                            const color = networkColors[name] || 'bg-slate-400';
                                            const isActive = selectedNetwork?.id === network.id;
                                            const hasDiscount = network.airtimeDiscounts?.some(d => d.is_active);

                                            return (
                                                <button
                                                    key={network.id}
                                                    type="button"
                                                    onClick={() => handleNetworkChange(network)}
                                                    className={`relative group p-1 rounded-2xl transition-all ${
                                                        isActive ? 'ring-2 ring-sky-500 ring-offset-2' : ''
                                                    }`}
                                                >
                                                    <div className={`h-24 rounded-xl flex flex-col items-center justify-center text-white overflow-hidden shadow-sm transition-transform group-hover:scale-[1.02] ${color}`}>
                                                        <span className="text-lg font-black tracking-tighter italic opacity-80 mb-1">{name}</span>
                                                        {hasDiscount && (
                                                            <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                <FaPercent className="text-[10px]" />
                                                                <span className="text-[10px] font-bold">DISCOUNT</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isActive && (
                                                        <div className="absolute top-0 right-0 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white translate-x-1/3 -translate-y-1/3">
                                                            <FaCheckCircle className="text-white text-xs" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Recipient & Amount */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <FaPhone className="text-sky-500" />
                                            Recipient
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="relative">
                                                    <TextInput
                                                        type="tel"
                                                        value={data.phone_number}
                                                        onChange={(e) => setData('phone_number', e.target.value)}
                                                        className="w-full pl-12 rounded-2xl border-slate-100 focus:border-sky-500 focus:ring-sky-200"
                                                        placeholder="080 0000 0000"
                                                        maxLength="11"
                                                    />
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                        <FaPhone />
                                                    </div>
                                                </div>
                                                <InputError message={errors.phone_number} className="mt-2" />
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => setSaveAsBeneficiary(!saveAsBeneficiary)}
                                                    className={`w-10 h-6 rounded-full transition-all relative ${saveAsBeneficiary ? 'bg-sky-500' : 'bg-slate-200'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${saveAsBeneficiary ? 'left-5' : 'left-1'}`}></div>
                                                </button>
                                                <span className="text-xs font-medium text-slate-600">Save as beneficiary</span>
                                            </div>

                                            {saveAsBeneficiary && (
                                                <TextInput
                                                    type="text"
                                                    value={data.beneficiary_name}
                                                    onChange={(e) => setData('beneficiary_name', e.target.value)}
                                                    className="w-full rounded-2xl border-slate-100 focus:border-sky-500 focus:ring-sky-200 text-sm"
                                                    placeholder="Enter beneficiary name"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <FaTag className="text-sky-500" />
                                            Amount
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="relative">
                                                <TextInput
                                                    type="number"
                                                    value={data.amount}
                                                    onChange={(e) => setData('amount', e.target.value)}
                                                    className="w-full pl-12 rounded-2xl border-slate-100 focus:border-sky-500 focus:ring-sky-200 text-lg font-bold"
                                                    placeholder="0.00"
                                                />
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</div>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[100, 200, 500, 1000].map(amt => (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => setData('amount', amt)}
                                                        className="py-2 rounded-xl border border-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                                    >
                                                        ₦{amt}
                                                    </button>
                                                ))}
                                            </div>
                                            {data.use_bnpl && (
                                                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                        <FaBolt className="text-sky-500" />
                                                        Repayment Duration
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setData('duration', 3)}
                                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                                                data.duration === 3 
                                                                ? 'border-sky-500 bg-sky-50' 
                                                                : 'border-slate-50 hover:border-slate-200 bg-slate-50/50'
                                                            }`}
                                                        >
                                                            <span className={`text-sm font-bold ${data.duration === 3 ? 'text-sky-700' : 'text-slate-600'}`}>3 Days</span>
                                                            <span className={`text-[10px] font-bold ${data.duration === 3 ? 'text-sky-500' : 'text-slate-400'}`}>10% Interest</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setData('duration', 7)}
                                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                                                data.duration === 7 
                                                                ? 'border-sky-500 bg-sky-50' 
                                                                : 'border-slate-50 hover:border-slate-200 bg-slate-50/50'
                                                            }`}
                                                        >
                                                            <span className={`text-sm font-bold ${data.duration === 7 ? 'text-sky-700' : 'text-slate-600'}`}>7 Days</span>
                                                            <span className={`text-[10px] font-bold ${data.duration === 7 ? 'text-sky-500' : 'text-slate-400'}`}>13% Interest</span>
                                                        </button>
                                                    </div>

                                                    {data.amount && (
                                                        <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-2 mt-4">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-400">Principal</span>
                                                                <span className="font-bold">₦{parseFloat(data.amount).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-400">Interest ({getInterestRate()}%)</span>
                                                                <span className="font-bold text-sky-400">+₦{((parseFloat(data.amount) * getInterestRate()) / 100).toLocaleString()}</span>
                                                            </div>
                                                            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                                                                <span className="text-xs font-bold">Total Repayment</span>
                                                                <span className="text-lg font-black text-sky-400">₦{calculateTotalRepayment(data.amount).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Sidebar / Summary */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-8">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <FaShieldAlt className="text-sky-500" />
                                    Summary
                                </h3>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                        <span className="text-sm text-slate-500">Service</span>
                                        <span className="text-sm font-bold text-slate-700">Airtime {airtimeType}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                        <span className="text-sm text-slate-500">Network</span>
                                        <span className="text-sm font-bold text-slate-700">{selectedNetwork?.name || '---'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                        <span className="text-sm text-slate-500">Phone</span>
                                        <span className="text-sm font-bold text-slate-700">{data.phone_number || '---'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                        <span className="text-sm text-slate-500">Amount</span>
                                        <span className="text-sm font-bold text-slate-700">₦{(parseFloat(data.amount) || 0).toLocaleString()}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                            <span className="text-sm text-slate-500">Discount ({discount}%)</span>
                                            <span className="text-sm font-bold text-emerald-600">-₦{(parseFloat(data.amount) * discount / 100 || 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-900 rounded-2xl p-5 mb-6 text-white text-center">
                                    <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-widest">Total to Pay</p>
                                    <p className="text-3xl font-black">₦{parseFloat(amountToPay).toLocaleString()}</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowPaymentMethodModal(true)}
                                    disabled={!data.amount || !data.phone_number || processing}
                                    className="w-full btn bg-sky-500 hover:bg-sky-600 border-none text-white rounded-2xl h-14 font-bold text-lg shadow-lg shadow-sky-200 transition-all active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                                >
                                    {processing ? (
                                        <span className="loading loading-spinner"></span>
                                    ) : (
                                        <>
                                            Continue to Checkout
                                            <FaArrowRight className="ml-2 text-sm" />
                                        </>
                                    )}
                                </button>
                                
                                <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    <div className="flex items-center gap-1">
                                        <FaShieldAlt className="text-sky-500" />
                                        Secure
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FaBolt className="text-amber-500" />
                                        Instant
                                    </div>
                                </div>
                            </div>

                            {/* Beneficiaries List */}
                            {beneficiaries.length > 0 && (
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-slate-800">Recent</h4>
                                        <Link href={route('beneficiaries.index')} className="text-[10px] font-black text-sky-500 uppercase">View All</Link>
                                    </div>
                                    <div className="space-y-3">
                                        {beneficiaries.slice(0, 4).map((b) => (
                                            <button
                                                key={b.id}
                                                type="button"
                                                onClick={() => handleBeneficiarySelect(b)}
                                                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                                    {b.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-slate-800 leading-none mb-1">{b.name}</p>
                                                    <p className="text-[10px] text-slate-400">{b.phone_number}</p>
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-sky-50 flex items-center justify-center">
                                                    <FaArrowRight className="text-[10px] text-sky-500" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PIN Modal */}
            <Modal show={showPinModal} onClose={() => setShowPinModal(false)} maxWidth="md">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FaShieldAlt className="text-3xl text-sky-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Transaction PIN</h3>
                        <p className="text-sm text-slate-500">Confirm your purchase of ₦{parseFloat(amountToPay).toLocaleString()}</p>
                    </div>

                    <div className="flex justify-center gap-3 mb-8">
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                id={`pin-${index}`}
                                type="password"
                                inputMode="numeric"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handlePinChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="w-14 h-14 text-center text-2xl font-black border-2 border-slate-100 rounded-2xl focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all"
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    {pinError && (
                        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold text-center mb-6">
                            {pinError}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowPinModal(false)}
                            className="flex-1 h-12 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handlePinSubmit}
                            disabled={verifyingPin || pin.some(d => d === '')}
                            className="flex-1 h-12 bg-sky-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-100 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {verifyingPin ? 'Processing...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Payment Method Modal - Bottom Sheet */}
            {showPaymentMethodModal && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowPaymentMethodModal(false)}
                    ></div>

                    {/* Bottom Sheet */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl sm:rounded-t-[2.5rem] p-6 sm:p-8 animate-in slide-in-from-bottom-5 shadow-2xl">
                        <div className="max-w-2xl mx-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">How do you want to pay?</h2>
                                    <p className="text-sm text-slate-500 mt-1">Choose your payment method below</p>
                                </div>
                                <button
                                    onClick={() => setShowPaymentMethodModal(false)}
                                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                >
                                    <XMarkIcon className="w-6 h-6 text-slate-600" />
                                </button>
                            </div>

                            {/* Payment Options */}
                            <div className="grid sm:grid-cols-2 gap-4 mb-8">
                                {/* Buy Now Option */}
                                <button
                                    onClick={() => handlePaymentMethodSelect('buy')}
                                    className="relative overflow-hidden group p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-slate-100 hover:border-emerald-500 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-50 text-left"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 group-hover:bg-emerald-500/20 rounded-full -mr-8 -mt-8 transition-colors duration-300"></div>
                                    <div className="relative z-10 space-y-3">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center transition-colors">
                                            <FaWallet className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">Pay Now</h3>
                                            <p className="text-xs sm:text-sm text-slate-500 mt-1">Use your wallet balance</p>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 group-hover:border-emerald-100 transition-colors">
                                            <p className="text-[10px] sm:text-xs font-bold text-slate-400">Instant delivery</p>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/0 to-emerald-50/0 group-hover:from-emerald-50/50 group-hover:to-emerald-50/0 transition-colors duration-300 pointer-events-none"></div>
                                </button>

                                {/* Borrow Option */}
                                <button
                                    onClick={() => handlePaymentMethodSelect('borrow')}
                                    className="relative overflow-hidden group p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-slate-100 hover:border-sky-500 transition-all duration-300 hover:shadow-xl hover:shadow-sky-50 text-left"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/10 group-hover:bg-sky-500/20 rounded-full -mr-8 -mt-8 transition-colors duration-300"></div>
                                    <div className="relative z-10 space-y-3">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-sky-50 group-hover:bg-sky-100 rounded-2xl flex items-center justify-center transition-colors">
                                            <FaBolt className="w-6 h-6 sm:w-7 sm:h-7 text-sky-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-sky-600 transition-colors">Borrow Now</h3>
                                            <p className="text-xs sm:text-sm text-slate-500 mt-1">Repay in 3-7 days with interest</p>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 group-hover:border-sky-100 transition-colors">
                                            <p className="text-[10px] sm:text-xs font-bold text-slate-400">Flexible repayment</p>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-sky-50/0 to-sky-50/0 group-hover:from-sky-50/50 group-hover:to-sky-50/0 transition-colors duration-300 pointer-events-none"></div>
                                </button>
                            </div>

                            {/* Info Box */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                                    <span className="font-bold text-slate-900">Pay Now:</span> Deduct immediately from wallet • <span className="font-bold text-slate-900">Borrow Now:</span> Repay automatically when due
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

