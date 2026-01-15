import { useState, useEffect } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Modal from '@/Components/Modal';
import { 
    FaPhone, FaWallet, FaCheckCircle, FaExclamationTriangle, 
    FaArrowRight, FaSearch, FaBolt, FaShieldAlt, FaSimCard,
    FaInfoCircle, FaCalendarAlt, FaHistory
} from 'react-icons/fa';
import { GiReceiveMoney } from 'react-icons/gi';

const Airtime = ({ auth, networks, eligibility, activeBorrowings, borrowSettings, hasActiveCard, beneficiaries = [] }) => {
    const [step, setStep] = useState(1);
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [useBNPL, setUseBNPL] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState('');
    const [verifyingPin, setVerifyingPin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        network_id: '',
        phone_number: '',
        amount: '',
        airtime_type: 'VTU',
        save_as_beneficiary: false,
        beneficiary_name: '',
        pin: '',
        use_bnpl: true,
        duration: 7,
    });

    const borrowSettings_ = borrowSettings?.airtime || {};

    const getInterestRate = () => {
        if (data.duration === 3) {
            return 10;
        }
        return 13;
    };

    const calculateTotalRepayment = (amount) => {
        const rate = getInterestRate();
        const interest = (parseFloat(amount || 0) * rate) / 100;
        return parseFloat(amount || 0) + interest;
    };

    const handleNetworkSelect = (network) => {
        setSelectedNetwork(network);
        setData('network_id', network.id);
        setStep(2);
    };

    const handleBeneficiarySelect = (beneficiary) => {
        setData({
            ...data,
            network_id: beneficiary.network_id,
            phone_number: beneficiary.phone_number,
            airtime_type: beneficiary.meta_data?.airtime_type || 'VTU',
            beneficiary_id: beneficiary.id,
        });
        const network = networks.find(n => n.id.toString() === beneficiary.network_id.toString());
        if (network) setSelectedNetwork(network);
        setShowBeneficiaryModal(false);
        setStep(2);
    };

    const handleBNPLToggle = (checked) => {
        if (checked && !hasActiveCard) {
            window.location.href = route('cards.link', { return_to: route('borrow.airtime') });
            return;
        }
        setUseBNPL(checked);
        setData('use_bnpl', checked);
    };

    const handlePinChange = (index, value) => {
        const newValue = value.replace(/[^0-9]/g, '').slice(0, 1);
        const newPin = [...pin];
        newPin[index] = newValue;
        setPin(newPin);
        if (newValue && index < 3) {
            document.getElementById(`pin-${index + 1}`)?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && index > 0 && !pin[index]) {
            document.getElementById(`pin-${index - 1}`).focus();
        }
    };

    const handleConfirm = (e) => {
        e.preventDefault();
        if (!data.phone_number || data.phone_number.length !== 11) return;
        if (!data.amount || parseFloat(data.amount) < borrowSettings_.min_amount) return;
        setShowConfirmModal(true);
    };

    const handlePinSubmit = () => {
        setPinError('');
        const pinString = pin.join('');
        if (pinString.length !== 4) {
            setPinError('Please enter a 4-digit PIN');
            return;
        }

        setVerifyingPin(true);
        
        router.post(route('borrow.airtime.process'), {
            ...data,
            pin: pinString
        }, {
            onSuccess: () => {
                reset();
                setPin(['', '', '', '']);
                setShowPinModal(false);
                setShowConfirmModal(false);
                setStep(1);
                setSelectedNetwork(null);
            },
            onError: (errors) => {
                if (errors.pin) setPinError(errors.pin);
                setVerifyingPin(false);
            },
            onFinish: () => setVerifyingPin(false)
        });
    };

    const filteredBeneficiaries = beneficiaries?.filter(b =>
        b.service_type === 'airtime' &&
        (b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.phone_number.includes(searchTerm))
    ) || [];

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
                        <h2 className="text-xl font-bold text-slate-800">Borrow Airtime</h2>
                        <p className="text-sm text-slate-500">Get airtime now, pay later</p>
                    </div>
                    <Link href={route('transactions')} className="btn btn-ghost btn-sm gap-2 text-slate-600">
                        <FaHistory />
                        <span className="hidden sm:inline">History</span>
                    </Link>
                </div>
            }
        >
            <Head title="Borrow Airtime" />

            <div className="py-8">
                <div className="max-w-2xl mx-auto px-4">
                    {/* Eligibility Alert */}
                    {eligibility && !eligibility.is_eligible && (
                        <div className="mb-8 overflow-hidden bg-rose-50 border border-rose-100 rounded-3xl p-6 flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                                <FaExclamationTriangle className="text-rose-600 text-xl" />
                            </div>
                            <div>
                                <h4 className="font-bold text-rose-900">Not Eligible</h4>
                                <p className="text-rose-700 text-sm">{eligibility.rejection_reason}</p>
                            </div>
                        </div>
                    )}

                    {/* Credit Score Card */}
                    {eligibility?.is_eligible && (
                        <div className="mb-8 relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl">
                            <div className="relative z-10 grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Available Credit</p>
                                    <h3 className="text-3xl font-black">₦{eligibility.available_credit.toLocaleString()}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Credit Score</p>
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="h-2 w-20 bg-white/20 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-emerald-400" 
                                                style={{ width: `${eligibility.credit_score}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xl font-black">{eligibility.credit_score}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                        </div>
                    )}

                    {/* Multi-step Flow */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        {/* Progress Bar */}
                        <div className="flex h-1.5 w-full bg-slate-50">
                            <div 
                                className="h-full bg-indigo-500 transition-all duration-500" 
                                style={{ width: step === 1 ? '50%' : '100%' }}
                            ></div>
                        </div>

                        <div className="p-8">
                            {step === 1 ? (
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 mb-2">Select Network</h3>
                                        <p className="text-slate-500 text-sm">Choose the network you want to top up</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {networks.map((network) => {
                                            const name = network.name.toUpperCase();
                                            const color = networkColors[name] || 'bg-slate-400';
                                            return (
                                                <button
                                                    key={network.id}
                                                    onClick={() => handleNetworkSelect(network)}
                                                    className="group relative p-1 rounded-2xl transition-all hover:scale-[1.02]"
                                                >
                                                    <div className={`h-28 rounded-xl flex flex-col items-center justify-center text-white overflow-hidden shadow-sm ${color}`}>
                                                        <span className="text-xl font-black tracking-tighter italic opacity-80">{name}</span>
                                                        <span className="text-[10px] font-bold mt-2 opacity-60">SELECT</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {filteredBeneficiaries.length > 0 && (
                                        <div className="pt-4 border-t border-slate-50">
                                            <button
                                                onClick={() => setShowBeneficiaryModal(true)}
                                                className="w-full h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-3 text-slate-600 font-bold transition-all"
                                            >
                                                <FaSearch className="text-sm" />
                                                Select from Beneficiaries
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleConfirm} className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 mb-1">Recharge Details</h3>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${networkColors[selectedNetwork?.name.toUpperCase()] || 'bg-slate-400'}`}></div>
                                                <span className="text-xs font-bold text-slate-500">{selectedNetwork?.name} Network</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep(1);
                                                setSelectedNetwork(null);
                                            }}
                                            className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Phone Number */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone Number</label>
                                            <div className="relative">
                                                <input
                                                    type="tel"
                                                    value={data.phone_number}
                                                    onChange={(e) => setData('phone_number', e.target.value)}
                                                    className="w-full h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold"
                                                    placeholder="080 0000 0000"
                                                    maxLength="11"
                                                    required
                                                />
                                                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                            {errors.phone_number && <p className="text-rose-500 text-xs font-bold ml-2">{errors.phone_number}</p>}
                                        </div>

                                        {/* Amount */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end ml-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount to Borrow</label>
                                                <span className="text-[10px] font-bold text-indigo-500">Min ₦{borrowSettings_.min_amount}</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={data.amount}
                                                    onChange={(e) => setData('amount', e.target.value)}
                                                    className="w-full h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-xl font-black"
                                                    placeholder="0.00"
                                                    min={borrowSettings_.min_amount}
                                                    max={borrowSettings_.max_amount}
                                                    required
                                                />
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₦</span>
                                            </div>
                                            {errors.amount && <p className="text-rose-500 text-xs font-bold ml-2">{errors.amount}</p>}
                                        </div>

                                        {/* Borrow Duration */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Borrow Duration</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('duration', 3)}
                                                    className={`h-20 rounded-2xl border-2 transition-all p-4 flex flex-col justify-center ${
                                                        data.duration === 3 
                                                        ? 'border-indigo-600 bg-indigo-50/50' 
                                                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span className={`text-sm font-black ${data.duration === 3 ? 'text-indigo-600' : 'text-slate-600'}`}>3 Days</span>
                                                    <span className={`text-[10px] font-bold ${data.duration === 3 ? 'text-indigo-400' : 'text-slate-400'}`}>10% Interest</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('duration', 7)}
                                                    className={`h-20 rounded-2xl border-2 transition-all p-4 flex flex-col justify-center ${
                                                        data.duration === 7 
                                                        ? 'border-indigo-600 bg-indigo-50/50' 
                                                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span className={`text-sm font-black ${data.duration === 7 ? 'text-indigo-600' : 'text-slate-600'}`}>7 Days</span>
                                                    <span className={`text-[10px] font-bold ${data.duration === 7 ? 'text-indigo-400' : 'text-slate-400'}`}>13% Interest</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Repayment Summary */}
                                        {data.amount && (
                                            <div className="bg-slate-900 rounded-3xl p-6 text-white">
                                                <div className="flex justify-between items-center mb-6">
                                                    <span className="text-slate-400 text-xs font-bold uppercase">Repayment Details</span>
                                                    <div className="flex items-center gap-2 text-emerald-400">
                                                        <FaCalendarAlt className="text-[10px]" />
                                                        <span className="text-[10px] font-bold">Due in {data.duration} Days</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-400">Principal Amount</span>
                                                        <span className="font-bold">₦{parseFloat(data.amount).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-400">Interest ({getInterestRate()}%)</span>
                                                        <span className="font-bold text-amber-400">₦{((parseFloat(data.amount) * getInterestRate()) / 100).toLocaleString()}</span>
                                                    </div>
                                                    <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-center">
                                                        <span className="font-bold">Total to Repay</span>
                                                        <span className="text-2xl font-black text-indigo-400">₦{calculateTotalRepayment(data.amount).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={processing || !data.phone_number || !data.amount}
                                            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {processing ? (
                                                <span className="loading loading-spinner"></span>
                                            ) : (
                                                <>
                                                    Review & Borrow
                                                    <FaArrowRight className="text-sm" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Security Info */}
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                                <FaShieldAlt className="text-sky-500" />
                            </div>
                            <div>
                                <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Secure</h5>
                                <p className="text-[10px] text-slate-500">Encrypted transaction</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                <FaBolt className="text-amber-500" />
                            </div>
                            <div>
                                <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Instant</h5>
                                <p className="text-[10px] text-slate-500">Fast processing</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} maxWidth="md">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <GiReceiveMoney className="text-3xl text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Confirm Borrowing</h3>
                        <p className="text-sm text-slate-500">Please review your request carefully</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 space-y-4 mb-8">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Recipient</span>
                            <span className="font-bold text-slate-800">{data.phone_number}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Network</span>
                            <span className="font-bold text-slate-800">{selectedNetwork?.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Borrow Amount</span>
                            <span className="font-bold text-slate-800">₦{parseFloat(data.amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-800">Total Repayment</span>
                            <span className="font-black text-indigo-600">₦{calculateTotalRepayment(data.amount).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="flex-1 h-12 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                setShowConfirmModal(false);
                                setShowPinModal(true);
                            }}
                            className="flex-1 h-12 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
                        >
                            Confirm & PIN
                        </button>
                    </div>
                </div>
            </Modal>

            {/* PIN Modal */}
            <Modal show={showPinModal} onClose={() => !verifyingPin && setShowPinModal(false)} maxWidth="md">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FaShieldAlt className="text-3xl text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Authorize Transaction</h3>
                        <p className="text-sm text-slate-500">Enter your 4-digit PIN to complete borrowing</p>
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
                                className="w-14 h-14 text-center text-2xl font-black border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
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
                            onClick={() => setShowPinModal(false)}
                            disabled={verifyingPin}
                            className="flex-1 h-12 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePinSubmit}
                            disabled={verifyingPin || pin.some(d => d === '')}
                            className="flex-1 h-12 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {verifyingPin ? 'Processing...' : 'Authorize'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Beneficiary Modal */}
            <Modal show={showBeneficiaryModal} onClose={() => setShowBeneficiaryModal(false)} maxWidth="md">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-800">Beneficiaries</h3>
                        <button onClick={() => setShowBeneficiaryModal(false)} className="text-slate-400 hover:text-slate-600">
                            <FaArrowRight className="rotate-180" />
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all text-sm"
                        />
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {filteredBeneficiaries.map((b) => (
                            <button
                                key={b.id}
                                onClick={() => handleBeneficiarySelect(b)}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:ring-2 hover:ring-indigo-100 transition-all text-left group"
                            >
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-400 font-bold border border-slate-100 group-hover:border-indigo-200 group-hover:text-indigo-500 transition-all">
                                    {b.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800">{b.name}</p>
                                    <p className="text-xs text-slate-500">{b.phone_number}</p>
                                </div>
                                <div className={`w-8 h-8 rounded-lg ${networkColors[networks.find(n => n.id == b.network_id)?.name.toUpperCase()] || 'bg-slate-200'} flex items-center justify-center text-[10px] text-white font-black italic`}>
                                    {networks.find(n => n.id == b.network_id)?.name.substring(0, 3)}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
};

export default Airtime;
