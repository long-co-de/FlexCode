import { useState, useEffect, useRef } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    PhoneIcon, 
    WalletIcon, 
    ClockIcon, 
    TagIcon, 
    MagnifyingGlassIcon, 
    XMarkIcon, 
    StarIcon, 
    UserIcon, 
    ArrowRightIcon, 
    ShieldCheckIcon, 
    BoltIcon, 
    BuildingOfficeIcon, 
    GiftIcon, 
    BriefcaseIcon, 
    TicketIcon, 
    GlobeAltIcon, 
    CheckCircleIcon, 
    ExclamationTriangleIcon,
    DevicePhoneMobileIcon,
    UserPlusIcon,
    LockClosedIcon,
    CreditCardIcon,
    ChevronRightIcon,
    BanknotesIcon,
    ArrowPathIcon,
    ArrowUpIcon,
    ArrowDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export default function Data({ auth, networks, beneficiaries, flash, eligibility, hasActiveCard }) {
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [dataPlans, setDataPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [planType, setPlanType] = useState('ALL');
    const [sortBy, setSortBy] = useState('asc'); // 'asc' or 'desc' for data quantity
    const [showPinModal, setShowPinModal] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState('');
    const [verifyingPin, setVerifyingPin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
    const [saveBeneficiary, setSaveBeneficiary] = useState(false);
    const [beneficiaryName, setBeneficiaryName] = useState('');
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        network_id: '',
        data_plan_id: '',
        phone_number: '',
        pin: '',
        save_as_beneficiary: false,
        beneficiary_name: '',
        beneficiary_id: '',
        ported_number: false,
        use_bnpl: false,
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

    const planTypes = [
        { id: 'ALL', name: 'All Plans', icon: GlobeAltIcon },
        { id: 'SME', name: 'SME', icon: BuildingOfficeIcon },
        { id: 'GIFTING', name: 'Gifting', icon: GiftIcon },
        // { id: 'CORPORATE GIFTING', name: 'Corporate', icon: BriefcaseIcon },  // Disabled for now
        { id: 'DIRECT COUPON', name: 'Direct', icon: TicketIcon }
    ];

    const networkIcons = {
        'MTN': { color: 'bg-amber-400', text: 'text-amber-900', border: 'border-amber-200' },
        'GLO': { color: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-200' },
        'AIRTEL': { color: 'bg-rose-600', text: 'text-white', border: 'border-rose-200' },
        '9MOBILE': { color: 'bg-green-800', text: 'text-white', border: 'border-green-200' }
    };

    useEffect(() => {
        if (selectedNetwork) {
            setDataPlans(selectedNetwork.dataplans || []);
            setData('network_id', selectedNetwork.id);
        } else {
            setDataPlans([]);
        }
    }, [selectedNetwork]);

    useEffect(() => {
        if (selectedPlan) {
            setData('data_plan_id', selectedPlan.id);
        }
    }, [selectedPlan]);

    const handleNetworkSelect = (network) => {
        setSelectedNetwork(network);
        setSelectedPlan(null);
        setData('data_plan_id', '');
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setData('data_plan_id', plan.id);
        setShowPaymentMethodModal(true);
    };

    // Function to parse data amount and convert to comparable value (in MB)
    const parseDataAmount = (dataAmount) => {
        if (!dataAmount) return 0;
        const amountStr = String(dataAmount).trim().toUpperCase();
        
        if (amountStr.includes('GB')) {
            const gbValue = parseFloat(amountStr.replace('GB', '').trim());
            return gbValue * 1024; // Convert GB to MB
        } else if (amountStr.includes('MB')) {
            return parseFloat(amountStr.replace('MB', '').trim());
        }
        return 0;
    };

    // Sort plans by data quantity
    const sortedPlans = (plans) => {
        const sorted = [...plans].sort((a, b) => {
            const aAmount = parseDataAmount(a.data_amount);
            const bAmount = parseDataAmount(b.data_amount);
            
            return sortBy === 'asc' ? aAmount - bAmount : bAmount - aAmount;
        });
        return sorted;
    };

    const filteredPlans = sortedPlans(
        planType === 'ALL'
            ? dataPlans
            : dataPlans.filter(plan => plan.plan_type === planType)
    );

    const handleBeneficiarySelect = (beneficiary) => {
        setSelectedBeneficiary(beneficiary);
        setData('phone_number', beneficiary.phone_number);
        setData('beneficiary_id', beneficiary.id);
        setSaveBeneficiary(false);
    };

    const handlePhoneChange = (e) => {
        setData('phone_number', e.target.value);
        setSelectedBeneficiary(null);
        setData('beneficiary_id', '');
    };

    const filteredBeneficiaries = beneficiaries
        ? beneficiaries.filter(b =>
            b.service_type === 'data' &&
            (b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.phone_number.includes(searchTerm))
        )
        : [];

    const handlePinChange = (index, value) => {
        const newValue = value.replace(/[^0-9]/g, '').slice(0, 1);
        const newPin = [...pin];
        newPin[index] = newValue;
        setPin(newPin);
        
        // Update form data with the string version of the PIN
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.phone_number || data.phone_number.length < 10) return;
        setData('save_as_beneficiary', saveBeneficiary);
        if (saveBeneficiary) setData('beneficiary_name', beneficiaryName);
        setShowPhoneModal(false);
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
        const routeName = data.use_bnpl ? 'borrow.data.process' : 'data.purchase';
        
        router.post(route(routeName), {
            ...data,
            pin: pinString
        }, {
            onSuccess: () => {
                reset();
                setPin(['', '', '', '']);
                setShowPinModal(false);
                setSelectedPlan(null);
                setSelectedNetwork(null);
            },
            onError: (errors) => {
                if (errors.pin) setPinError(errors.pin);
                setVerifyingPin(false);
            },
            onFinish: () => setVerifyingPin(false)
        });
    };

    const handlePaymentMethodSelect = (method) => {
        setData('use_bnpl', method === 'borrow');
        setShowPaymentMethodModal(false);
        setShowPhoneModal(true);
    };

    return (
        <AppLayout>
            <Head title="Buy Data Bundles — BorrowLite" />

            <div className="max-w-6xl mx-auto py-6 px-4 sm:py-10 sm:px-6 lg:px-8">
                {/* Responsive Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Purchase Data</h1>
                        <p className="text-sm sm:text-base text-slate-500 mt-1">Select a network and plan to stay connected.</p>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                        <div className="flex-shrink-0 bg-white border border-slate-100 px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-3">
                            <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                                <WalletIcon className="w-5 h-5 text-sky-600" />
                            </div>
                            <div className="leading-none">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Balance</p>
                                <p className="text-sm font-black text-slate-900">₦{auth.user.wallet_balance.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left Column: Selection */}
                    <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                        {/* Network Grid */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <div className="w-1 h-4 bg-sky-500 rounded-full" />
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">1. Select Network</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                                {networks.map((network) => {
                                    const net = network.name.toUpperCase();
                                    const config = networkIcons[net] || { color: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
                                    const isSelected = selectedNetwork?.id === network.id;

                                    return (
                                        <button
                                            key={network.id}
                                            onClick={() => handleNetworkSelect(network)}
                                            className={`relative group p-3 sm:p-6 rounded-3xl sm:rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-3 sm:gap-4 ${isSelected ? 'border-sky-500 bg-sky-50 shadow-lg shadow-sky-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                        >
                                            <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl ${config.color} flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform`}>
                                                <DevicePhoneMobileIcon className={`w-6 h-6 sm:w-10 sm:h-10 ${config.text}`} />
                                            </div>
                                            <span className={`text-xs sm:text-base font-black ${isSelected ? 'text-sky-900' : 'text-slate-600'}`}>
                                                {network.name}
                                            </span>
                                            {isSelected && (
                                                <div className="absolute -top-2 -right-2 bg-sky-500 text-white rounded-full p-1 shadow-md">
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Plan List */}
                        {selectedNetwork && (
                            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-sky-500 rounded-full" />
                                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest whitespace-nowrap">2. Choose Data Plan</h2>
                                    </div>
                                    <div className="hidden lg:flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide w-full max-w-full lg:max-w-[70%]">
                                        {planTypes.map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setPlanType(type.id)}
                                                className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${planType === type.id ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            >
                                                <type.icon className="w-3.5 h-3.5 sm:w-4 h-4" />
                                                {type.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sort Controls */}
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sort by Quantity:</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSortBy('asc')}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                                sortBy === 'asc'
                                                    ? 'bg-sky-600 text-white shadow-md'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            <ArrowUpIcon className="w-3.5 h-3.5" />
                                            Small to Large
                                        </button>
                                        <button
                                            onClick={() => setSortBy('desc')}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                                sortBy === 'desc'
                                                    ? 'bg-sky-600 text-white shadow-md'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            <ArrowDownIcon className="w-3.5 h-3.5" />
                                            Large to Small
                                        </button>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    {filteredPlans.length > 0 ? (
                                        filteredPlans.map((plan) => (
                                            <button
                                                key={plan.id}
                                                onClick={() => handlePlanSelect(plan)}
                                                className={`group w-full text-left p-5 sm:p-6 rounded-3xl sm:rounded-[2rem] border-2 transition-all duration-300 relative overflow-hidden ${selectedPlan?.id === plan.id ? 'border-sky-500 bg-white shadow-xl ring-4 ring-sky-50' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'}`}
                                            >
                                                <div className="flex justify-between items-start mb-4 gap-4">
                                                    <div className="min-w-0">
                                                        <h4 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                                                            {plan.data_amount}
                                                        </h4>
                                                        <div className="flex items-center flex-wrap gap-2 mt-1">
                                                            <div className="flex items-center gap-1 text-slate-400">
                                                                <ClockIcon className="w-3.5 h-3.5" />
                                                                <span className="text-[10px] font-bold uppercase tracking-tighter">{plan.validity}</span>
                                                            </div>
                                                            <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-200" />
                                                            <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500 px-1.5 py-0.5 bg-slate-50 rounded">{plan.plan_type}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right leading-none flex-shrink-0">
                                                        <p className="text-lg sm:text-xl font-black text-slate-900">₦{plan.selling_price}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Price</p>
                                                    </div>
                                                </div>
                                                <div className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs transition-all ${selectedPlan?.id === plan.id ? 'bg-sky-600 text-white shadow-lg shadow-sky-100' : 'bg-slate-50 text-slate-600 group-hover:bg-slate-100'}`}>
                                                    Purchase Plan
                                                    <ChevronRightIcon className="w-4 h-4" />
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-16 text-center bg-slate-50 rounded-3xl sm:rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                                <XMarkIcon className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">No Plans Available</h3>
                                            <p className="text-slate-500 text-sm">Try selecting a different category or network.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column: Order Summary (Desktop) */}
                    <div className="hidden lg:block lg:col-span-4">
                        <div className="sticky top-24 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                                    <TagIcon className="w-6 h-6 text-sky-600" />
                                    Order Summary
                                </h3>
                                
                                {selectedPlan ? (
                                    <div className="space-y-6">
                                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200/50">
                                                <div className={`w-12 h-12 rounded-2xl ${networkIcons[selectedNetwork?.name.toUpperCase()]?.color || 'bg-slate-200'} flex items-center justify-center shadow-md`}>
                                                    <DevicePhoneMobileIcon className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase leading-none mb-1">Network</p>
                                                    <p className="text-base font-black text-slate-900">{selectedNetwork?.name}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-medium">Data Bundle</span>
                                                    <span className="text-slate-900 font-bold">{selectedPlan.data_amount}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-medium">Validity</span>
                                                    <span className="text-slate-900 font-bold">{selectedPlan.validity}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-medium">Category</span>
                                                    <span className="px-2 py-0.5 bg-white text-slate-600 rounded-md text-[10px] font-bold border border-slate-200 uppercase">
                                                        {selectedPlan.plan_type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {data.use_bnpl && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repayment Duration</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setData('duration', 3)}
                                                            className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                                                data.duration === 3 
                                                                ? 'border-sky-500 bg-sky-50 shadow-sm' 
                                                                : 'border-slate-50 hover:border-slate-100 bg-slate-50/50'
                                                            }`}
                                                        >
                                                            <span className={`text-[10px] font-bold ${data.duration === 3 ? 'text-sky-700' : 'text-slate-600'}`}>3 Days</span>
                                                            <span className={`text-[8px] font-bold ${data.duration === 3 ? 'text-sky-500' : 'text-slate-400'}`}>10% Interest</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setData('duration', 7)}
                                                            className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                                                data.duration === 7 
                                                                ? 'border-sky-500 bg-sky-50 shadow-sm' 
                                                                : 'border-slate-50 hover:border-slate-100 bg-slate-50/50'
                                                            }`}
                                                        >
                                                            <span className={`text-[10px] font-bold ${data.duration === 7 ? 'text-sky-700' : 'text-slate-600'}`}>7 Days</span>
                                                            <span className={`text-[8px] font-bold ${data.duration === 7 ? 'text-sky-500' : 'text-slate-400'}`}>13% Interest</span>
                                                        </button>
                                                    </div>

                                                    <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-2">
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-400">Principal</span>
                                                            <span className="font-bold">₦{parseFloat(selectedPlan.selling_price).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-400">Interest ({getInterestRate()}%)</span>
                                                            <span className="font-bold text-sky-400">+₦{((parseFloat(selectedPlan.selling_price) * getInterestRate()) / 100).toLocaleString()}</span>
                                                        </div>
                                                        <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                                                            <span className="text-[10px] font-bold">Total Repay</span>
                                                            <span className="text-lg font-black text-sky-400">₦{calculateTotalRepayment(selectedPlan.selling_price).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-end justify-between px-2">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                                                    <p className="text-3xl font-black text-slate-900">₦{selectedPlan.selling_price}</p>
                                                </div>
                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 px-6">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <TagIcon className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium">Select a plan to see your order summary here.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                                    Secure Checkout
                                </h4>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                    Transactions are encrypted and processed through our secure automated system. Guaranteed delivery within 60 seconds.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile-First Phone Number Modal */}
            {showPhoneModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPhoneModal(false)} />
                    
                    <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto">
                        <div className="absolute right-6 top-6">
                            <button onClick={() => setShowPhoneModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6 sm:space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-sky-50 rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0">
                                    <PhoneIcon className="w-6 h-6 sm:w-7 sm:h-7 text-sky-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">Recipient Details</h3>
                                    <p className="text-sm font-medium text-slate-500">Enter phone number to receive data.</p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${networkIcons[selectedNetwork?.name.toUpperCase()]?.color || 'bg-slate-200'} flex items-center justify-center text-white font-bold text-xs`}>
                                        {selectedNetwork?.name.substring(0, 1)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase truncate">{selectedNetwork?.name}</p>
                                        <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{selectedPlan?.data_amount}</p>
                                    </div>
                                </div>
                                <p className="text-base sm:text-lg font-black text-slate-900 flex-shrink-0">₦{selectedPlan?.selling_price}</p>
                            </div>

                            {beneficiaries?.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1 gap-2">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Recent</h4>
                                        <div className="relative flex-1 max-w-[180px]">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Search..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {filteredBeneficiaries.map((beneficiary) => (
                                            <button
                                                key={beneficiary.id}
                                                onClick={() => handleBeneficiarySelect(beneficiary)}
                                                className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${selectedBeneficiary?.id === beneficiary.id ? 'border-sky-500 bg-sky-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                                            >
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                                    <UserIcon className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-700 max-w-[60px] truncate">{beneficiary.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest ml-1">Recipient Number</label>
                                    <div className="relative group">
                                        <DevicePhoneMobileIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-sky-600 transition-colors" />
                                        <input
                                            type="tel"
                                            placeholder="e.g. 08123456789"
                                            value={data.phone_number}
                                            onChange={handlePhoneChange}
                                            required
                                            className="w-full pl-14 pr-4 py-4 sm:py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl sm:rounded-[1.5rem] text-lg font-black text-slate-900 focus:border-sky-500 focus:ring-0 transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between p-4 bg-sky-50/50 rounded-2xl border border-sky-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                                                <UserPlusIcon className="w-4 h-4 text-sky-600" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">Save as beneficiary?</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={saveBeneficiary}
                                                onChange={(e) => setSaveBeneficiary(e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                                        </label>
                                    </div>

                                    {saveBeneficiary && (
                                        <div className="animate-in slide-in-from-top-2 duration-300">
                                            <input
                                                type="text"
                                                placeholder="Enter beneficiary name"
                                                value={beneficiaryName}
                                                onChange={(e) => setBeneficiaryName(e.target.value)}
                                                required={saveBeneficiary}
                                                className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:border-sky-500 focus:ring-0 transition-all"
                                            />
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={!data.phone_number || data.phone_number.length < 10}
                                    className="w-full py-4 sm:py-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-black rounded-2xl sm:rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-3 group"
                                >
                                    Review & Pay
                                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Secure PIN Modal */}
            {showPinModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowPinModal(false)} />
                    
                    <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-10 animate-in zoom-in-95 duration-300">
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-sky-50 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                <LockClosedIcon className="w-10 h-10 text-sky-600" />
                            </div>
                            
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Security PIN</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1">Enter your 4-digit PIN to authorize transaction.</p>
                            </div>

                            <div className="flex justify-center gap-4">
                                {pin.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`pin-${index}`}
                                        type="password"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handlePinChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        className="w-14 h-16 sm:w-16 sm:h-20 text-center text-2xl font-black bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-sky-500 focus:ring-0 transition-all"
                                    />
                                ))}
                            </div>

                            {pinError && (
                                <div className="flex items-center justify-center gap-2 text-rose-600 bg-rose-50 py-3 rounded-xl border border-rose-100">
                                    <ExclamationTriangleIcon className="w-4 h-4" />
                                    <span className="text-xs font-bold">{pinError}</span>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    onClick={handlePinSubmit}
                                    disabled={verifyingPin || pin.some(d => !d)}
                                    className="w-full py-4 sm:py-5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black rounded-2xl sm:rounded-[1.5rem] shadow-xl shadow-sky-100 transition-all flex items-center justify-center gap-3"
                                >
                                    {verifyingPin ? (
                                        <>
                                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheckIcon className="w-6 h-6" />
                                            Confirm Payment
                                        </>
                                    )}
                                </button>
                                <button 
                                    onClick={() => setShowPinModal(false)}
                                    className="w-full mt-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Cancel Transaction
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                            <WalletIcon className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
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
                                    onClick={() => {
                                        if (!hasActiveCard) {
                                            window.location.href = route('cards.link', { return_to: route('borrow.data') });
                                            return;
                                        }
                                        handlePaymentMethodSelect('borrow');
                                    }}
                                    className="relative overflow-hidden group p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-slate-100 hover:border-sky-500 transition-all duration-300 hover:shadow-xl hover:shadow-sky-50 text-left"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/10 group-hover:bg-sky-500/20 rounded-full -mr-8 -mt-8 transition-colors duration-300"></div>
                                    <div className="relative z-10 space-y-3">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-sky-50 group-hover:bg-sky-100 rounded-2xl flex items-center justify-center transition-colors">
                                            <BoltIcon className="w-6 h-6 sm:w-7 sm:h-7 text-sky-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-sky-600 transition-colors">Borrow Now</h3>
                                            <p className="text-xs sm:text-sm text-slate-500 mt-1">Repay in 3-7 days with interest</p>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 group-hover:border-sky-100 transition-colors">
                                            {!hasActiveCard ? (
                                                <p className="text-[10px] sm:text-xs font-bold text-rose-500">Link card to borrow</p>
                                            ) : (
                                                <p className="text-[10px] sm:text-xs font-bold text-slate-400">Flexible repayment</p>
                                            )}
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

