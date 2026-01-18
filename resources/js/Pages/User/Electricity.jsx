import { useState, useEffect, useRef } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
import Modal from '@/Components/Modal';
import EligibilityAlert from '@/Components/EligibilityAlert';
import { 
    FaBolt, FaLightbulb, FaSearch, FaUser, FaHistory, 
    FaWallet, FaCheckCircle, FaTimes, FaShieldAlt, 
    FaInfoCircle, FaCreditCard, FaMapMarkerAlt
} from 'react-icons/fa';
import axios from 'axios';

export default function Electricity({ 
    auth, 
    electricityProviders, 
    beneficiaries = [], 
    eligibility, 
    hasActiveCard 
}) {
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [verifyingMeter, setVerifyingMeter] = useState(false);
    const [meterVerified, setMeterVerified] = useState(null);
    const [verifyError, setVerifyError] = useState(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState('');
    const [verifyingPin, setVerifyingPin] = useState(false);
    const [useBNPL, setUseBNPL] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const pinRefs = [useRef(), useRef(), useRef(), useRef()];

    const { data, setData, post, processing, errors, reset } = useForm({
        electricity_provider_id: '',
        meter_number: '',
        meter_type: 'prepaid',
        amount: '',
        customer_name: '',
        address: '',
        save_as_beneficiary: false,
        beneficiary_name: '',
        pin: '',
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

    const handleProviderSelect = (provider) => {
        setSelectedProvider(provider);
        setData('electricity_provider_id', provider.id);
        setMeterVerified(null);
        setVerifyError(null);
    };

    const handleVerifyMeter = async () => {
        if (!data.electricity_provider_id || !data.meter_number) {
            setVerifyError('Please select provider and enter meter number');
            return;
        }

        setVerifyingMeter(true);
        setVerifyError(null);
        setMeterVerified(null);

        try {
            const response = await axios.post(route('electricity.verify'), {
                electricity_provider_id: data.electricity_provider_id,
                meter_number: data.meter_number,
                meter_type: data.meter_type,
            });

            if (response.data.status === 'success') {
                setMeterVerified(response.data.data);
                setData(prev => ({
                    ...prev,
                    customer_name: response.data.data.customer_name || '',
                    address: response.data.data.address || '',
                }));
            }
        } catch (error) {
            setVerifyError(error.response?.data?.message || 'Failed to verify meter');
        } finally {
            setVerifyingMeter(false);
        }
    };

    const handlePinChange = (index, value) => {
        const newValue = value.replace(/[^0-9]/g, '').slice(0, 1);
        const newPin = [...pin];
        newPin[index] = newValue;
        setPin(newPin);
        
        setData('pin', newPin.join(''));

        if (newValue && index < 3) {
            pinRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs[index - 1].current.focus();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!meterVerified || !data.amount) return;
        setData('use_bnpl', useBNPL);
        setShowPinModal(true);
    };

    const handlePinSubmit = () => {
        setPinError('');
        const pinString = pin.join('');
        if (pinString.length !== 4) {
            setPinError('Enter 4-digit PIN');
            return;
        }

        setVerifyingPin(true);

        const route_ = useBNPL ? 'borrow.electricity.process' : 'electricity.purchase';
        router.post(route(route_), {
            ...data,
            pin: pinString
        }, {
            onSuccess: () => {
                reset();
                setPin(['', '', '', '']);
                setShowPinModal(false);
                setMeterVerified(null);
                setUseBNPL(false);
            },
            onError: (err) => {
                if (err.pin) setPinError(err.pin);
                setVerifyingPin(false);
            },
            onFinish: () => setVerifyingPin(false)
        });
    };

    const handleBNPLToggle = (checked) => {
        if (checked && !hasActiveCard) {
            window.location.href = route('cards.link', { return_to: route('buy.electricity') });
            return;
        }
        setUseBNPL(checked);
        setData('use_bnpl', checked);
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Electricity</h2>
                        <p className="text-sm font-medium text-slate-500">Pay your bills instantly</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={route('transactions')} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-all">
                            <FaHistory className="text-sm" />
                            <span className="text-xs font-bold whitespace-nowrap">History</span>
                        </Link>
                        <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                                <FaWallet className="text-sky-600 text-sm" />
                            </div>
                            <div className="leading-none">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Balance</p>
                                <p className="text-sm font-black text-slate-900">₦{auth.user.wallet_balance.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Electricity Bill Payment" />

            <div className="py-6 sm:py-8">
                <div className="max-w-5xl mx-auto px-4">
                    <EligibilityAlert eligibility={eligibility} />
                    
                    <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 mt-6">
                        {/* Main Form */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* BNPL Promo */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl">
                                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4 sm:gap-6">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[2rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 flex-shrink-0">
                                            <FaBolt className="text-2xl sm:text-3xl text-sky-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-black tracking-tight">Buy Now, Pay Later</h3>
                                            <p className="text-slate-400 text-xs sm:text-sm">Low on cash? Borrow electricity credit and pay in 30 days.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer ml-auto sm:ml-0">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={useBNPL}
                                            onChange={(e) => handleBNPLToggle(e.target.checked)}
                                        />
                                        <div className="w-14 h-8 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-sky-500"></div>
                                    </label>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                            </div>

                            {/* Provider Selection */}
                            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                                <h4 className="text-xs sm:text-sm font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                                        <FaLightbulb className="text-sky-500 text-xs" />
                                    </div>
                                    Choose Provider
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                    {electricityProviders.map((provider) => {
                                        const isActive = selectedProvider?.id === provider.id;
                                        return (
                                            <button
                                                key={provider.id}
                                                type="button"
                                                onClick={() => handleProviderSelect(provider)}
                                                className={`relative group p-4 rounded-2xl sm:rounded-3xl border-2 transition-all text-center flex flex-col items-center justify-center min-h-[120px] sm:min-h-0 ${
                                                    isActive 
                                                    ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-100' 
                                                    : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                                                }`}
                                            >
                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl mx-auto mb-2 flex items-center justify-center text-lg sm:text-xl transition-transform group-hover:scale-110 flex-shrink-0 ${
                                                    isActive ? 'bg-sky-500 text-white shadow-lg' : 'bg-white text-slate-400'
                                                }`}>
                                                    <FaBolt />
                                                </div>
                                                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider leading-tight block ${isActive ? 'text-sky-700' : 'text-slate-600'}`}>
                                                    {provider.name}
                                                </span>
                                                {isActive && (
                                                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-sky-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                                        <FaCheckCircle className="text-white text-[9px] sm:text-[10px]" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Meter Information */}
                                <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                                    <h4 className="text-xs sm:text-sm font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                            <FaCreditCard className="text-emerald-500 text-xs" />
                                        </div>
                                        Meter Details
                                    </h4>
                                    
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                            {['prepaid', 'postpaid'].map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setData('meter_type', type)}
                                                    className={`py-3 rounded-xl sm:rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                                                        data.meter_type === type 
                                                        ? 'border-sky-500 bg-sky-50 text-sky-700' 
                                                        : 'border-slate-50 bg-slate-50 text-slate-500'
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="relative flex-1">
                                                <TextInput
                                                    value={data.meter_number}
                                                    onChange={(e) => setData('meter_number', e.target.value)}
                                                    className="w-full pl-11 sm:pl-12 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border-slate-100 focus:border-sky-500 focus:ring-sky-200 font-black tracking-widest"
                                                    placeholder="Enter meter number"
                                                />
                                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleVerifyMeter}
                                                disabled={verifyingMeter || !data.meter_number || !selectedProvider}
                                                className="w-full sm:w-auto px-8 py-3.5 sm:py-0 rounded-xl sm:rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {verifyingMeter ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify'}
                                            </button>
                                        </div>
                                        <InputError message={errors.meter_number} />

                                        {meterVerified && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-emerald-50 border border-emerald-100">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200">
                                                            <FaUser className="text-white text-sm sm:text-base" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1 opacity-70">Customer Name</p>
                                                            <p className="text-base sm:text-lg font-black text-slate-900 truncate uppercase">{meterVerified.customer_name}</p>
                                                            {meterVerified.address && (
                                                                <div className="flex items-start gap-1.5 mt-2">
                                                                    <FaMapMarkerAlt className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                                                    <p className="text-xs font-bold text-slate-500 leading-relaxed">{meterVerified.address}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Recharge Amount</label>
                                                        <div className="relative">
                                                            <TextInput
                                                                type="number"
                                                                value={data.amount}
                                                                onChange={(e) => setData('amount', e.target.value)}
                                                                className="w-full pl-12 py-4 rounded-xl sm:rounded-2xl border-slate-100 focus:border-sky-500 focus:ring-sky-200 text-xl font-black"
                                                                placeholder="0.00"
                                                            />
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₦</div>
                                                        </div>
                                                        <InputError message={errors.amount} />
                                                    </div>

                                                    {useBNPL && (
                                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Borrow Duration</label>
                                                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setData('duration', 3)}
                                                                    className={`p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                                                        data.duration === 3 
                                                                        ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-100' 
                                                                        : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                                                                    }`}
                                                                >
                                                                    <span className={`text-sm font-black ${data.duration === 3 ? 'text-sky-700' : 'text-slate-600'}`}>3 Days</span>
                                                                    <span className={`text-[10px] font-bold ${data.duration === 3 ? 'text-sky-500' : 'text-slate-400'}`}>10% Interest</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setData('duration', 7)}
                                                                    className={`p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                                                        data.duration === 7 
                                                                        ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-100' 
                                                                        : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                                                                    }`}
                                                                >
                                                                    <span className={`text-sm font-black ${data.duration === 7 ? 'text-sky-700' : 'text-slate-600'}`}>7 Days</span>
                                                                    <span className={`text-[10px] font-bold ${data.duration === 7 ? 'text-sky-500' : 'text-slate-400'}`}>13% Interest</span>
                                                                </button>
                                                            </div>

                                                            {data.amount && (
                                                                <div className="bg-slate-900 rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 text-white space-y-3">
                                                                    <div className="flex justify-between text-xs sm:text-sm">
                                                                        <span className="text-slate-400 font-medium">Recharge Amount</span>
                                                                        <span className="font-bold">₦{parseFloat(data.amount).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs sm:text-sm">
                                                                        <span className="text-slate-400 font-medium">Service Fee & VAT</span>
                                                                        <span className="font-bold text-sky-400">+₦200.00</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs sm:text-sm border-t border-white/5 pt-2">
                                                                        <span className="text-slate-400 font-medium">Total Borrowed</span>
                                                                        <span className="font-bold">₦{(parseFloat(data.amount) + 200).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs sm:text-sm">
                                                                        <span className="text-slate-400 font-medium">Interest ({getInterestRate()}%)</span>
                                                                        <span className="font-bold text-sky-400">+₦{(((parseFloat(data.amount) + 200) * getInterestRate()) / 100).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                                                                        <span className="text-sm font-bold">Total Repayment</span>
                                                                        <span className="text-xl sm:text-2xl font-black text-sky-400">₦{calculateTotalRepayment(parseFloat(data.amount) + 200).toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {!useBNPL && data.amount && (
                                                        <div className="bg-slate-100 rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 space-y-3 animate-in fade-in slide-in-from-top-4">
                                                            <div className="flex justify-between text-xs sm:text-sm">
                                                                <span className="text-slate-500 font-medium">Recharge Amount</span>
                                                                <span className="font-black text-slate-700">₦{parseFloat(data.amount).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs sm:text-sm">
                                                                <span className="text-slate-500 font-medium">Service Fee</span>
                                                                <span className="font-black text-slate-700">₦100.00</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs sm:text-sm">
                                                                <span className="text-slate-500 font-medium">VAT</span>
                                                                <span className="font-black text-slate-700">₦100.00</span>
                                                            </div>
                                                            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                                                <span className="text-sm font-black text-slate-800">Total Payable</span>
                                                                <span className="text-xl sm:text-2xl font-black text-sky-600">₦{(parseFloat(data.amount) + 200).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <button
                                                        type="submit"
                                                        disabled={processing || !data.amount}
                                                        className="w-full py-4 sm:py-5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl sm:rounded-3xl shadow-xl shadow-sky-100 transition-all flex items-center justify-center gap-3 group"
                                                    >
                                                        {useBNPL ? 'Confirm & Borrow' : 'Proceed to Pay'}
                                                        <FaBolt className="text-sky-200 group-hover:scale-125 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {verifyError && (
                                            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 animate-in shake duration-500">
                                                <FaTimes className="flex-shrink-0" />
                                                <p className="text-xs font-bold">{verifyError}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Right Column: Information */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                                <h4 className="text-xs sm:text-sm font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                        <FaInfoCircle className="text-amber-500 text-xs" />
                                    </div>
                                    Quick Tips
                                </h4>
                                <ul className="space-y-4">
                                    {[
                                        { title: 'Check Meter Type', desc: 'Ensure you select the correct meter type (Prepaid/Postpaid).' },
                                        { title: 'Minimum Amount', desc: 'Minimum recharge for most providers is ₦1,000.' },
                                        { title: 'Service Charge', desc: 'A small convenience fee may apply to this transaction.' },
                                        { title: 'Instant Delivery', desc: 'Your token will be delivered instantly via SMS and App.' }
                                    ].map((tip, i) => (
                                        <li key={i} className="flex gap-3">
                                            <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{tip.title}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-relaxed">{tip.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-6 sm:p-8 bg-slate-900 rounded-3xl sm:rounded-[2.5rem] text-white overflow-hidden relative">
                                <div className="relative z-10">
                                    <FaShieldAlt className="text-3xl text-sky-400 mb-4" />
                                    <h4 className="text-base sm:text-lg font-black mb-2">Secure Transaction</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed font-medium">
                                        All payments are encrypted and processed through our secure PCI-DSS compliant infrastructure.
                                    </p>
                                </div>
                                <FaShieldAlt className="absolute -bottom-8 -right-8 text-white/5 text-[120px] rotate-12" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PIN Modal */}
            <Modal show={showPinModal} onClose={() => setShowPinModal(false)} maxWidth="sm">
                <div className="p-6 sm:p-10 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-sky-50 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <FaShieldAlt className="text-2xl sm:text-3xl text-sky-600" />
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Authorize Payment</h3>
                    <p className="text-sm font-medium text-slate-500 mb-8">Enter your 4-digit transaction PIN</p>

                    <div className="flex justify-center gap-3 sm:gap-4 mb-8">
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                ref={pinRefs[index]}
                                type="password"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handlePinChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="w-12 h-14 sm:w-16 sm:h-20 text-center text-xl sm:text-2xl font-black bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl focus:border-sky-500 focus:ring-0 transition-all"
                            />
                        ))}
                    </div>

                    {pinError && (
                        <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center gap-2">
                            <FaTimes /> {pinError}
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handlePinSubmit}
                            disabled={verifyingPin || pin.some(d => !d)}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black rounded-xl sm:rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                        >
                            {verifyingPin ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FaCheckCircle /> Confirm Payment
                                </>
                            )}
                        </button>
                        <button 
                            onClick={() => setShowPinModal(false)}
                            className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Cancel transaction
                        </button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
