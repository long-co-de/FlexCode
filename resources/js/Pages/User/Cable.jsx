import { useState, useEffect, useRef } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
import SelectInput from '@/Components/SelectInput';
import Modal from '@/Components/Modal';
import { 
    FaTv, FaSatellite, FaSearch, FaUser, FaHistory, 
    FaWallet, FaCheckCircle, FaTimes, FaShieldAlt, 
    FaChevronRight, FaInfoCircle, FaCreditCard, FaTag
} from 'react-icons/fa';

export default function Cable({ auth, cableProviders, beneficiaries = [] }) {
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [cablePlans, setCablePlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState('');
    const [verifyingPin, setVerifyingPin] = useState(false);
    const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
    const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const pinRefs = [useRef(), useRef(), useRef(), useRef()];

    const { data, setData, post, processing, errors, reset } = useForm({
        cable_provider_id: '',
        cable_plan_id: '',
        smart_card_number: '',
        customer_name: '',
        pin: '',
        save_as_beneficiary: false,
        beneficiary_name: '',
        beneficiary_id: '',
    });

    useEffect(() => {
        if (selectedProvider) {
            setCablePlans(selectedProvider.cable_plans || []);
            setData('cable_provider_id', selectedProvider.id);
        } else {
            setCablePlans([]);
        }
    }, [selectedProvider]);

    useEffect(() => {
        if (selectedPlan) {
            setData('cable_plan_id', selectedPlan.id);
        }
    }, [selectedPlan]);

    const handleProviderSelect = (provider) => {
        setSelectedProvider(provider);
        setSelectedPlan(null);
        setData('cable_plan_id', '');
        setVerificationStatus(null);
    };

    const handleVerifySmartCard = () => {
        if (!data.smart_card_number || !data.cable_provider_id) return;

        // Simulation for now - would normally be an API call
        setVerificationStatus({
            status: 'success',
            message: 'IUC Number verified',
            customer_name: 'John Doe',
        });
        setData('customer_name', 'John Doe');
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
        if (!verificationStatus || !selectedPlan) return;
        setData('save_as_beneficiary', saveAsBeneficiary);
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

        post(route('cable.purchase'), {
            onSuccess: () => {
                reset();
                setPin(['', '', '', '']);
                setShowPinModal(false);
                setSelectedPlan(null);
                setSelectedProvider(null);
                setVerificationStatus(null);
                setSelectedBeneficiary(null);
                setSaveAsBeneficiary(false);
            },
            onError: (err) => {
                if (err.pin) setPinError(err.pin);
                setVerifyingPin(false);
            },
            onFinish: () => setVerifyingPin(false)
        });
    };

    const filteredBeneficiaries = beneficiaries?.filter(b => 
        b.service_type === 'cable' && 
        (b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         b.smart_card_number.includes(searchTerm))
    ) || [];

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Cable TV</h2>
                        <p className="text-sm font-medium text-slate-500">Fast subscription & renewal</p>
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
            <Head title="Cable TV Subscription" />

            <div className="py-6 sm:py-8">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
                        {/* Main Form */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Provider Selection */}
                            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                                <h4 className="text-xs sm:text-sm font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                                        <FaTv className="text-sky-500 text-xs" />
                                    </div>
                                    Choose Provider
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                    {cableProviders.map((provider) => {
                                        const isActive = selectedProvider?.id === provider.id;
                                        return (
                                            <button
                                                key={provider.id}
                                                type="button"
                                                onClick={() => handleProviderSelect(provider)}
                                                className={`relative group p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all text-center flex flex-col items-center justify-center ${
                                                    isActive 
                                                    ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-100' 
                                                    : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                                                }`}
                                            >
                                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl mx-auto mb-2 sm:mb-3 flex items-center justify-center text-xl sm:text-2xl transition-transform group-hover:scale-110 flex-shrink-0 ${
                                                    isActive ? 'bg-sky-500 text-white shadow-lg' : 'bg-white text-slate-400'
                                                }`}>
                                                    <FaSatellite />
                                                </div>
                                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${isActive ? 'text-sky-700' : 'text-slate-600'}`}>
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
                                {/* Smart Card Verification */}
                                <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                                    <h4 className="text-xs sm:text-sm font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                            <FaCreditCard className="text-emerald-500 text-xs" />
                                        </div>
                                        IUC / Smart Card
                                    </h4>
                                    
                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="relative flex-1">
                                                <TextInput
                                                    value={data.smart_card_number}
                                                    onChange={(e) => setData('smart_card_number', e.target.value)}
                                                    className="w-full pl-11 sm:pl-12 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border-slate-100 focus:border-sky-500 focus:ring-sky-200"
                                                    placeholder="Enter IUC number"
                                                />
                                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleVerifySmartCard}
                                                disabled={!data.smart_card_number || !selectedProvider}
                                                className="w-full sm:w-auto px-8 py-3.5 sm:py-0 rounded-xl sm:rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center"
                                            >
                                                Verify
                                            </button>
                                        </div>
                                        <InputError message={errors.smart_card_number} />

                                        {verificationStatus && (
                                            <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-4 ${
                                                verificationStatus.status === 'success' 
                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                                                : 'bg-rose-50 border-rose-100 text-rose-800'
                                            }`}>
                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                                    verificationStatus.status === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                                }`}>
                                                    {verificationStatus.status === 'success' ? <FaCheckCircle /> : <FaTimes />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Customer Name</p>
                                                    <p className="font-black text-base sm:text-lg truncate uppercase">{verificationStatus.customer_name}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Plan Selection */}
                                <div className={`bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 transition-all ${
                                    !verificationStatus ? 'opacity-50 pointer-events-none grayscale' : ''
                                }`}>
                                    <h4 className="text-xs sm:text-sm font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                            <FaTag className="text-amber-500 text-xs" />
                                        </div>
                                        Select Package
                                    </h4>
                                    
                                    <div className="grid gap-3">
                                        {cablePlans.map((plan) => (
                                            <button
                                                key={plan.id}
                                                type="button"
                                                onClick={() => setSelectedPlan(plan)}
                                                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all flex items-center justify-between group text-left ${
                                                    selectedPlan?.id === plan.id 
                                                    ? 'border-sky-500 bg-sky-50 shadow-sm' 
                                                    : 'border-slate-50 hover:border-slate-200'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 ${
                                                        selectedPlan?.id === plan.id ? 'bg-sky-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        <FaSatellite className="text-xs sm:text-sm" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`font-black text-xs sm:text-sm uppercase tracking-tight truncate ${selectedPlan?.id === plan.id ? 'text-sky-900' : 'text-slate-700'}`}>
                                                            {plan.plan_name}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{plan.validity}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-4">
                                                    <p className={`font-black text-sm sm:text-base ${selectedPlan?.id === plan.id ? 'text-sky-600' : 'text-slate-900'}`}>
                                                        ₦{plan.amount}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedPlan && (
                                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                                        <button
                                            type="submit"
                                            className="w-full py-4 sm:py-5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl sm:rounded-3xl shadow-xl shadow-sky-100 transition-all flex items-center justify-center gap-3 group"
                                        >
                                            Complete Subscription
                                            <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Right Column: Info */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                                <h4 className="text-xs sm:text-sm font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                        <FaInfoCircle className="text-amber-500 text-xs" />
                                    </div>
                                    Subscription Tips
                                </h4>
                                <ul className="space-y-4">
                                    {[
                                        { title: 'Decoder ON', desc: 'Keep your decoder turned on during subscription for instant activation.' },
                                        { title: 'Verify IUC', desc: 'Always double-check your IUC/Smart card number before paying.' },
                                        { title: 'Auto-Renewal', desc: 'Subscriptions are active immediately after successful payment.' }
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

                            <div className="p-6 sm:p-8 bg-sky-50 rounded-3xl sm:rounded-[2.5rem] border border-sky-100 relative overflow-hidden">
                                <div className="relative z-10">
                                    <FaShieldAlt className="text-3xl text-sky-600 mb-4" />
                                    <h4 className="text-base sm:text-lg font-black text-sky-900 mb-2">Secure Payment</h4>
                                    <p className="text-sky-700/60 text-xs leading-relaxed font-medium">
                                        Your subscription is processed through a secure automated gateway ensuring 100% uptime.
                                    </p>
                                </div>
                                <FaTv className="absolute -bottom-6 -right-6 text-sky-100 text-[100px] -rotate-12" />
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
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl sm:rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
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
