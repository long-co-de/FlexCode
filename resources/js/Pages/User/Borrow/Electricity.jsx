import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import EligibilityAlert from '@/Components/EligibilityAlert';
import Modal from '@/Components/Modal';
import axios from 'axios';
import {
    FaBolt, FaLightbulb, FaSearch, FaUser, FaHistory,
    FaWallet, FaCheckCircle, FaTimes, FaShieldAlt,
    FaInfoCircle, FaCreditCard, FaMapMarkerAlt, FaPercent,
    FaArrowRight, FaClock, FaExclamationTriangle
} from 'react-icons/fa';
import { GiPayMoney } from 'react-icons/gi';

const Electricity = ({ auth, providers, eligibility, activeBorrowings, borrowSettings, hasActiveCard, beneficiaries = [] }) => {
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [useBNPL, setUseBNPL] = useState(true);
    const [verifyingMeter, setVerifyingMeter] = useState(false);
    const [meterVerified, setMeterVerified] = useState(null);
    const [verifyError, setVerifyError] = useState(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState('');
    const [verifyingPin, setVerifyingPin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);

    const pinRefs = [useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        if (!hasActiveCard && useBNPL) {
            setUseBNPL(false);
            window.location.href = route('cards.link', { return_to: route('borrow.electricity') });
        }
    }, [useBNPL, hasActiveCard]);

    const borrowSettings_ = borrowSettings?.electricity || {};
    const minimumBorrowAmount = borrowSettings_?.effective_min_amount || borrowSettings_?.min_amount || 1000;
    const dueDays = Number(borrowSettings_?.due_days ?? 7);

    const getInterestRate = () => {
        const baseRate = Number(borrowSettings_?.base_interest_rate ?? 13);
        const goodRate = Number(borrowSettings_?.good_credit_interest_rate ?? baseRate);
        const score = Number(eligibility?.credit_score ?? 0);

        if (score >= 80) {
            return Number.isFinite(goodRate) ? goodRate : baseRate;
        }

        return Number.isFinite(baseRate) ? baseRate : 13;
    };

    const calculateTotalRepayment = (amount) => {
        const rate = getInterestRate();
        const interest = (parseFloat(amount || 0) * rate) / 100;
        return parseFloat(amount || 0) + interest;
    };

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
        use_bnpl: true,
    });

    const handleVerifyMeter = async () => {
        if (!data.electricity_provider_id || !data.meter_number) {
            setVerifyError('Please fill all fields');
            return;
        }

        setVerifyingMeter(true);
        setVerifyError(null);
        setMeterVerified(null);

        try {
            const response = await axios.post(route('borrow.electricity.verify'), {
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
        if (!meterVerified) {
            setVerifyError('Please verify meter first');
            return;
        }
        setShowConfirmModal(true);
    };

    const handlePinSubmit = () => {
        setPinError('');
        const pinString = pin.join('');
        if (pinString.length !== 4) {
            setPinError('Enter 4-digit PIN');
            return;
        }

        setVerifyingPin(true);

        router.post(route('borrow.electricity.process'), {
            ...data,
            pin: pinString
        }, {
            onSuccess: () => {
                reset();
                setPin(['', '', '', '']);
                setShowPinModal(false);
                setMeterVerified(null);
                setSelectedProvider(null);
            },
            onError: (err) => {
                if (err.pin) setPinError(err.pin);
                setVerifyingPin(false);
            },
            onFinish: () => setVerifyingPin(false)
        });
    };

    const maxBorrowableAmount = Math.min(
        eligibility?.available_credit || 0,
        borrowSettings_?.max_amount || 20000
    );

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Borrow Electricity</h2>
                        <p className="text-sm text-slate-500">Emergency credit for your meter</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={route('borrow.my-borrowings')} className="btn btn-ghost btn-sm gap-2 text-slate-600">
                            <FaHistory />
                            <span className="hidden sm:inline">My Borrowings</span>
                        </Link>
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                                <FaCreditCard className="text-sky-600 text-sm" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none">Credit Limit</p>
                                <p className="text-sm font-bold text-slate-700">₦{eligibility?.available_credit.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Borrow Electricity" />

            <div className="py-8">
                <div className="max-w-5xl mx-auto px-4">
                    <EligibilityAlert eligibility={eligibility} />

                    <div className="grid lg:grid-cols-12 gap-8 mt-6">
                        <div className="lg:col-span-8 space-y-6">
                            {/* Borrow Badge */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-xl">
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[2rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                        <GiPayMoney className="text-3xl text-sky-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black tracking-tight">Borrow Electricity Credit</h3>
                                        <p className="text-slate-400 text-sm">Borrow up to ₦{maxBorrowableAmount.toLocaleString()} with {getInterestRate()}% interest.</p>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                            </div>

                            {/* Provider Selection */}
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                                <h4 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                                        <FaLightbulb className="text-sky-500 text-xs" />
                                    </div>
                                    Choose Provider
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {providers.map((provider) => {
                                        const isActive = data.electricity_provider_id === provider.id;
                                        return (
                                            <button
                                                key={provider.id}
                                                type="button"
                                                onClick={() => {
                                                    setData('electricity_provider_id', provider.id);
                                                    setSelectedProvider(provider);
                                                    setMeterVerified(null);
                                                }}
                                                className={`relative group p-4 rounded-3xl border-2 transition-all text-center ${
                                                    isActive
                                                    ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-100'
                                                    : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                                                }`}
                                            >
                                                <div className={`w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center text-xl transition-transform group-hover:scale-110 ${
                                                    isActive ? 'bg-sky-500 text-white shadow-lg' : 'bg-white text-slate-400'
                                                }`}>
                                                    <FaBolt />
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-wider leading-tight block ${isActive ? 'text-sky-700' : 'text-slate-600'}`}>
                                                    {provider.name}
                                                </span>
                                                {isActive && (
                                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                                        <FaCheckCircle className="text-white text-[10px]" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Meter Details */}
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                                <h4 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <FaCreditCard className="text-emerald-500 text-xs" />
                                    </div>
                                    Meter Information
                                </h4>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        {['prepaid', 'postpaid'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setData('meter_type', type)}
                                                className={`py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                                                    data.meter_type === type
                                                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                                                    : 'border-slate-50 bg-slate-50 text-slate-500'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="relative flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                value={data.meter_number}
                                                onChange={(e) => setData('meter_number', e.target.value)}
                                                className="w-full pl-12 py-4 rounded-2xl border-slate-100 focus:border-sky-500 focus:ring-sky-200 font-black tracking-widest"
                                                placeholder="Enter meter number"
                                            />
                                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleVerifyMeter}
                                            disabled={verifyingMeter || !data.meter_number || !data.electricity_provider_id}
                                            className="px-6 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                                        >
                                            {verifyingMeter ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify'}
                                        </button>
                                    </div>

                                    {verifyError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">{verifyError}</p>}

                                    {meterVerified && (
                                        <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                                                    <FaUser />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Name</p>
                                                    <p className="font-black text-slate-800">{meterVerified.customer_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center">
                                                    <FaMapMarkerAlt />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Address</p>
                                                    <p className="text-xs font-bold text-slate-600 leading-tight">{meterVerified.address}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className={`bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all ${
                                !meterVerified ? 'opacity-50 pointer-events-none' : ''
                            }`}>
                                <h4 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                        <FaBolt className="text-amber-500 text-xs" />
                                    </div>
                                    Borrow Amount
                                </h4>

                                <div className="space-y-6">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repayment Period</span>
                                        <span className="text-xs font-black text-slate-700">{dueDays} days</span>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            className="w-full pl-12 py-5 rounded-2xl border-slate-100 focus:border-sky-500 focus:ring-sky-200 text-2xl font-black"
                                            placeholder="0.00"
                                            max={maxBorrowableAmount}
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">₦</div>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min: ₦{minimumBorrowAmount}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max: ₦{maxBorrowableAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Repayment Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl sticky top-8">
                                <h3 className="text-lg font-black mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <FaInfoCircle className="text-sky-400 text-sm" />
                                    </div>
                                    Repayment
                                </h3>

                                <div className="space-y-6">
                                    <div className="pb-6 border-b border-white/10">
                                        <div className="flex justify-between mb-4">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Interest Rate</span>
                                            <span className="font-black text-sm text-sky-400">{getInterestRate()}%</span>
                                        </div>
                                        <div className="flex justify-between mb-4">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Due Date</span>
                                            <span className="font-black text-sm">{dueDays} Days</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Interest</span>
                                            <span className="font-black text-sm text-rose-400">
                                                +₦{((parseFloat(data.amount || 0) * getInterestRate()) / 100).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Repay</span>
                                            <span className="text-2xl font-black text-sky-400">₦{calculateTotalRepayment(data.amount).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {parseFloat(data.amount) > maxBorrowableAmount ? (
                                        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest text-center">
                                            Limit Exceeded
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!meterVerified || !data.amount || parseFloat(data.amount) < minimumBorrowAmount}
                                            className="w-full py-5 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-sky-500/20 hover:bg-sky-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            Confirm Borrow <FaArrowRight className="text-xs" />
                                        </button>
                                    )}

                                    <div className="pt-4 text-center">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                            By clicking confirm, you agree to our credit terms and automated repayment policy.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} maxWidth="md">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-[2rem] bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <FaExclamationTriangle className="text-white text-2xl" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Review Terms</h3>
                        <p className="text-slate-500 text-xs">Please review your borrowing terms</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal</span>
                            <span className="font-black text-slate-800">₦{parseFloat(data.amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest ({getInterestRate()}%)</span>
                            <span className="font-black text-rose-500">+₦{((parseFloat(data.amount || 0) * getInterestRate()) / 100).toLocaleString()}</span>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-slate-900 text-white flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Repayment</span>
                            <span className="text-xl font-black text-sky-400">₦{calculateTotalRepayment(data.amount).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                setShowConfirmModal(false);
                                setShowPinModal(true);
                            }}
                            className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all"
                        >
                            Accept & Continue
                        </button>
                    </div>
                </div>
            </Modal>

            {/* PIN Modal */}
            <Modal show={showPinModal} onClose={() => setShowPinModal(false)} maxWidth="sm">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-[2rem] bg-slate-900 flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <FaShieldAlt className="text-sky-400 text-2xl" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Security PIN</h3>
                        <p className="text-slate-500 text-xs">Enter your 4-digit PIN to authorize</p>
                    </div>

                    <div className="flex justify-center gap-4 mb-8">
                        {pin.map((digit, i) => (
                            <input
                                key={i}
                                ref={pinRefs[i]}
                                type="password"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handlePinChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, i)}
                                className="w-14 h-16 rounded-2xl border-2 border-slate-100 text-center text-2xl font-black focus:border-sky-500 focus:ring-sky-200 transition-all"
                            />
                        ))}
                    </div>

                    {pinError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center mb-6">{pinError}</p>}

                    <button
                        onClick={handlePinSubmit}
                        disabled={verifyingPin || pin.join('').length !== 4}
                        className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {verifyingPin ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Confirm Borrowing <FaCheckCircle className="text-xs" /></>
                        )}
                    </button>
                </div>
            </Modal>
        </AppLayout>
    );
};

export default Electricity;
