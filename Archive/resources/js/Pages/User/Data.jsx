import { useState, useEffect, useRef } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    FaSimCard, FaPhone, FaWallet, FaClock, FaTag, FaSearch, 
    FaTimes, FaStar, FaUser, FaArrowRight, FaShieldAlt, 
    FaBolt, FaPercent, FaBuilding, FaGift, FaBriefcase, 
    FaTicketAlt, FaGlobe, FaCheckCircle, FaExclamationTriangle,
    FaMobileAlt, FaUserPlus, FaLock, FaCreditCard
} from 'react-icons/fa';
import { GiPayMoney, GiReceiveMoney } from 'react-icons/gi';
import { TbBuilding, TbGift, TbGlobe, TbBuildingSkyscraper } from 'react-icons/tb';

export default function Data({ auth, networks, beneficiaries, flash, eligibility, hasActiveCard }) {
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [dataPlans, setDataPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [planType, setPlanType] = useState('ALL');
    const [showPinModal, setShowPinModal] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState('');
    const [verifyingPin, setVerifyingPin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
    const [saveBeneficiary, setSaveBeneficiary] = useState(false);
    const [beneficiaryName, setBeneficiaryName] = useState('');
    const [useBNPL, setUseBNPL] = useState(false);
    const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);

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

    const planTypes = [
        { id: 'ALL', name: 'All Plans', icon: <FaGlobe className="text-lg" /> },
        { id: 'SME', name: 'SME', icon: <FaBuilding className="text-lg" /> },
        { id: 'GIFTING', name: 'Gifting', icon: <FaGift className="text-lg" /> },
        { id: 'CORPORATE GIFTING', name: 'Corporate', icon: <FaBriefcase className="text-lg" /> },
        { id: 'DIRECT COUPON', name: 'Direct', icon: <FaTicketAlt className="text-lg" /> }
    ];

    // Network icon mapping
    const networkIcons = {
        'MTN': { icon: <FaSimCard className="text-xl" />, color: 'text-yellow-500' },
        'GLO': { icon: <FaSimCard className="text-xl" />, color: 'text-green-500' },
        'AIRTEL': { icon: <FaSimCard className="text-xl" />, color: 'text-red-500' },
        '9MOBILE': { icon: <FaSimCard className="text-xl" />, color: 'text-purple-500' }
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
        setShowPhoneModal(true);
    };

    const handlePlanTypeChange = (type) => {
        setPlanType(type);
    };

    const filteredPlans = planType === 'ALL'
        ? dataPlans
        : dataPlans.filter(plan => plan.plan_type === planType);

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
        if (newValue && index < 3) {
            document.getElementById(`pin-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (index > 0 && !pin[index]) {
                document.getElementById(`pin-${index - 1}`).focus();
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!data.phone_number || data.phone_number.length !== 11) {
            return;
        }

        setData('save_as_beneficiary', saveBeneficiary);
        if (saveBeneficiary) {
            setData('beneficiary_name', beneficiaryName);
        }

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
        setData('pin', pinString);
        setData('use_bnpl', useBNPL);

        const routeName = useBNPL ? 'borrow.data.process' : 'data.purchase';
        post(route(routeName), {
            onSuccess: () => {
                reset();
                setPin(['', '', '', '']);
                setShowPinModal(false);
                setShowPhoneModal(false);
                setSelectedPlan(null);
                setSelectedNetwork(null);
                setSelectedBeneficiary(null);
                setSaveBeneficiary(false);
                setBeneficiaryName('');
                setSearchTerm('');
            },
            onError: (errors) => {
                if (errors.pin) {
                    setPinError(errors.pin);
                }
                setVerifyingPin(false);
            },
            onFinish: () => {
                setVerifyingPin(false);
            }
        });
    };

    const handleBNPLToggle = (checked) => {
        if (checked && !hasActiveCard) {
            window.location.href = route('cards.link', { return_to: route('borrow.data') });
            return;
        }
        setUseBNPL(checked);
        setData('use_bnpl', checked);
        router.get('/borrow/data');
    };

    useEffect(() => {
        const pinString = pin.join('');
        setData('pin', pinString);
    }, [pin]);

    const closePhoneModal = () => {
        setShowPhoneModal(false);
        setSelectedPlan(null);
        setData('data_plan_id', '');
        setData('phone_number', '');
        setSelectedBeneficiary(null);
        setData('beneficiary_id', '');
        setSaveBeneficiary(false);
        setBeneficiaryName('');
        setSearchTerm('');
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Buy Data</h2>
                        <p className="text-gray-600">Purchase data bundles instantly</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-100">
                            <FaWallet className="text-blue-600" />
                            <span className="font-semibold text-gray-800">₦{auth.user.wallet_balance.toLocaleString()}</span>
                        </div>
                        {useBNPL && (
                            <div className="badge badge-success gap-1">
                                <GiReceiveMoney />
                                BNPL Active
                            </div>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Buy Data" />

            {/* Eligibility Alert */}
            {eligibility && (
                <div className="mb-6">
                    {eligibility.can_transact ? (
                        <div className="alert alert-success bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
                            <FaCheckCircle className="text-emerald-600" />
                            <span className="text-emerald-800">Your account is verified and ready for transactions</span>
                        </div>
                    ) : (
                        <div className="alert alert-error bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
                            <FaExclamationTriangle className="text-red-600" />
                            <span className="text-red-800">{eligibility.rejection_reason}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content - Left Side */}
                <div className="lg:col-span-2 space-y-6">
                    {/* BNPL Banner */}
                    <div className="card bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
                        <div className="card-body p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-xl">
                                        <GiPayMoney className="text-2xl" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Buy Now, Pay Later</h3>
                                        <p className="text-sm opacity-90">Get data now and pay in 30 days</p>
                                    </div>
                                </div>
                                <label className="cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-lg toggle-success"
                                        checked={useBNPL}
                                        onChange={(e) => handleBNPLToggle(e.target.checked)}
                                    />
                                </label>
                            </div>
                            {useBNPL && (
                                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <FaBolt className="text-yellow-300 animate-pulse" />
                                        <span className="text-sm">Auto-deduction enabled on due date</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Network Selection */}
                    <div className="card border border-gray-200 shadow-sm">
                        <div className="card-body">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <FaMobileAlt className="text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Select Network</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {networks.map((network) => {
                                    const networkUpper = network.name.toUpperCase();
                                    const networkConfig = networkIcons[networkUpper] || { icon: <FaSimCard />, color: 'text-gray-500' };
                                    
                                    return (
                                        <button
                                            key={network.id}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedNetwork?.id === network.id 
                                                ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                            onClick={() => handleNetworkSelect(network)}
                                        >
                                            <div className={`p-3 rounded-lg ${networkConfig.color} bg-white mb-3`}>
                                                {networkConfig.icon}
                                            </div>
                                            <span className="font-medium text-gray-800">{network.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Data Plans */}
                    {selectedNetwork && (
                        <div className="card border border-gray-200 shadow-sm">
                            <div className="card-body">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-indigo-50 rounded-lg">
                                            <FaTag className="text-indigo-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-800">Available Data Plans</h3>
                                    </div>
                                    <div className="flex gap-1 overflow-x-auto">
                                        {planTypes.map((type) => (
                                            <button
                                                key={type.id}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${planType === type.id 
                                                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                                onClick={() => handlePlanTypeChange(type.id)}
                                            >
                                                {type.icon}
                                                <span className="text-sm font-medium whitespace-nowrap">{type.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {filteredPlans.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredPlans.map((plan) => (
                                            <div
                                                key={plan.id}
                                                className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${selectedPlan?.id === plan.id 
                                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => handlePlanSelect(plan)}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900">{plan.data_amount}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="badge badge-outline badge-sm bg-gray-100 text-gray-700">
                                                                {plan.plan_type}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-sm text-gray-500">
                                                                <FaClock className="text-xs" />
                                                                {plan.validity}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xl font-bold text-gray-900">
                                                            ₦{plan.selling_price}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {selectedNetwork?.name}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="btn btn-primary btn-sm w-full">
                                                    Select Plan
                                                    <FaArrowRight className="ml-2" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                            <FaTimes className="text-2xl text-gray-400" />
                                        </div>
                                        <h4 className="font-medium text-gray-700 mb-2">No plans available</h4>
                                        <p className="text-gray-500 text-sm">Try selecting a different plan type</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Summary - Right Sidebar */}
                <div className="lg:col-span-1">
                    {selectedPlan ? (
                        <div className="card border border-gray-200 shadow-sm sticky top-6">
                            <div className="card-body">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <FaTag className="text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Order Summary</h3>
                                </div>

                                <div className="space-y-5">
                                    {/* Network Info */}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className={`p-2 rounded-lg ${networkIcons[selectedNetwork?.name.toUpperCase()]?.color || 'text-gray-500'} bg-white`}>
                                            {networkIcons[selectedNetwork?.name.toUpperCase()]?.icon || <FaSimCard />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{selectedNetwork?.name}</h4>
                                            <p className="text-sm text-gray-600">Mobile Network</p>
                                        </div>
                                    </div>

                                    {/* Plan Details */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Data Amount:</span>
                                            <span className="font-semibold text-gray-900">{selectedPlan.data_amount}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Validity:</span>
                                            <span className="text-gray-800">{selectedPlan.validity}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Plan Type:</span>
                                            <span className="badge badge-outline badge-sm">{selectedPlan.plan_type}</span>
                                        </div>
                                    </div>

                                    <div className="divider my-2"></div>

                                    {/* Total Amount */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-gray-700">Total Amount</span>
                                            <span className="text-2xl font-bold text-gray-900">
                                                ₦{selectedPlan.selling_price}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Wallet Balance</span>
                                            <span className={`font-medium ${
                                                parseFloat(selectedPlan.selling_price) > parseFloat(auth.user.wallet_balance) && !useBNPL 
                                                    ? 'text-red-600' 
                                                    : 'text-green-600'
                                            }`}>
                                                ₦{auth.user.wallet_balance.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* BNPL Status */}
                                    {useBNPL && (
                                        <div className="alert alert-success bg-emerald-50 border-emerald-200">
                                            <GiReceiveMoney className="text-emerald-600" />
                                            <div>
                                                <p className="font-medium text-emerald-800">BNPL Activated</p>
                                                <p className="text-sm text-emerald-700">Pay in 30 days</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Insufficient Balance Warning */}
                                    {parseFloat(selectedPlan.selling_price) > parseFloat(auth.user.wallet_balance) && !useBNPL && (
                                        <div className="alert alert-error bg-red-50 border-red-200">
                                            <FaExclamationTriangle className="text-red-600" />
                                            <div>
                                                <p className="font-medium text-red-800">Insufficient Balance</p>
                                                <p className="text-sm text-red-700">Please fund your wallet or activate BNPL</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Continue Button */}
                                    <button
                                        className="btn btn-primary w-full btn-lg shadow-md"
                                        onClick={() => setShowPhoneModal(true)}
                                        disabled={parseFloat(selectedPlan.selling_price) > parseFloat(auth.user.wallet_balance) && !useBNPL}
                                    >
                                        Continue to Payment
                                        <FaArrowRight className="ml-2" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card border border-gray-200 shadow-sm">
                            <div className="card-body text-center py-12">
                                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <FaSimCard className="text-2xl text-gray-400" />
                                </div>
                                <h4 className="font-medium text-gray-700 mb-2">No Plan Selected</h4>
                                <p className="text-gray-500 text-sm">Select a network and choose a data plan to continue</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Phone Number Modal */}
            {showPhoneModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md p-0 overflow-hidden">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 bg-white p-6 pb-4 border-b">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xl font-bold text-gray-900">Enter Phone Number</h3>
                                <button 
                                    onClick={closePhoneModal}
                                    className="btn btn-circle btn-ghost btn-sm hover:bg-gray-100"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <p className="text-gray-600">Who should receive this data?</p>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            {/* Order Summary */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${networkIcons[selectedNetwork?.name.toUpperCase()]?.color || 'text-gray-500'}`}>
                                            {networkIcons[selectedNetwork?.name.toUpperCase()]?.icon || <FaSimCard className="text-2xl" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{selectedPlan?.data_amount}</h4>
                                            <p className="text-sm text-gray-600">{selectedPlan?.validity}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-gray-900">
                                            ₦{selectedPlan?.selling_price}
                                        </div>
                                        {useBNPL && (
                                            <div className="badge badge-success badge-sm mt-1">
                                                <GiReceiveMoney className="mr-1" />
                                                BNPL
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Saved Beneficiaries */}
                            {beneficiaries && beneficiaries.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <FaUser className="text-gray-500" />
                                            <span className="font-medium text-gray-800">Saved Beneficiaries</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                className="input input-bordered input-sm pl-9 w-40"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                                        {filteredBeneficiaries.map((beneficiary) => (
                                            <div
                                                key={beneficiary.id}
                                                className={`border rounded-lg p-3 cursor-pointer transition-all ${selectedBeneficiary?.id === beneficiary.id 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => handleBeneficiarySelect(beneficiary)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="avatar placeholder">
                                                            <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center">
                                                                <FaUser className="text-sm" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 text-sm">
                                                                {beneficiary.name}
                                                            </h4>
                                                            <p className="text-gray-600 text-xs">{beneficiary.phone_number}</p>
                                                        </div>
                                                    </div>
                                                    {beneficiary.is_favorite ? (
                                                        <FaStar className="text-yellow-500 text-sm" />
                                                    ) : (
                                                        <FaStar className="text-gray-300 text-sm" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Phone Input */}
                            <div className="mb-6">
                                <label className="label">
                                    <span className="label-text font-medium text-gray-800">Phone Number</span>
                                </label>
                                {selectedBeneficiary ? (
                                    <div className="input input-bordered flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FaPhone className="text-gray-500" />
                                            <span className="font-medium">{selectedBeneficiary.phone_number}</span>
                                            <div className="badge badge-primary badge-sm">
                                                <FaUser className="mr-1 text-xs" />
                                                Saved
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs"
                                            onClick={() => {
                                                setSelectedBeneficiary(null);
                                                setData('phone_number', '');
                                                setData('beneficiary_id', '');
                                            }}
                                        >
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <div className="join w-full">
                                        <div className="join-item bg-gray-100 px-4 flex items-center border border-gray-300 border-r-0">
                                            <FaPhone className="text-gray-500" />
                                        </div>
                                        <input
                                            type="text"
                                            className="input input-bordered join-item flex-1"
                                            placeholder="08123456789"
                                            value={data.phone_number}
                                            onChange={handlePhoneChange}
                                            maxLength="11"
                                        />
                                    </div>
                                )}
                                {errors.phone_number && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">{errors.phone_number}</span>
                                    </label>
                                )}
                            </div>

                            {/* Save Beneficiary */}
                            {!selectedBeneficiary && (
                                <div className="mb-6">
                                    <div className="form-control">
                                        <label className="label cursor-pointer justify-start gap-3">
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-primary"
                                                checked={saveBeneficiary}
                                                onChange={(e) => setSaveBeneficiary(e.target.checked)}
                                            />
                                            <div className="flex items-center gap-2">
                                                <FaUserPlus className="text-gray-500" />
                                                <span className="label-text text-gray-700">Save as beneficiary</span>
                                            </div>
                                        </label>
                                    </div>

                                    {saveBeneficiary && (
                                        <div className="mt-3">
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                placeholder="Enter beneficiary name"
                                                value={beneficiaryName}
                                                onChange={(e) => setBeneficiaryName(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Ported Number Checkbox */}
                            <div className="mb-6">
                                <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary mt-1"
                                        checked={data.ported_number}
                                        onChange={(e) => setData('ported_number', e.target.checked)}
                                    />
                                    <div>
                                        <span className="font-medium text-gray-800">Bypass Number Validator</span>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Check if this is a ported number or if you're experiencing validation issues
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="modal-action sticky bottom-0 bg-white p-6 pt-4 border-t">
                            <button
                                type="button"
                                onClick={closePhoneModal}
                                className="btn btn-ghost text-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!data.phone_number || data.phone_number.length !== 11 || processing}
                                className="btn btn-primary"
                            >
                                Continue
                                <FaArrowRight className="ml-2" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PIN Verification Modal */}
            {showPinModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-sm">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <FaLock className="text-2xl text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Confirm Purchase</h3>
                            <p className="text-gray-600 mt-2">Enter your 4-digit PIN to complete the transaction</p>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-900">{selectedPlan?.data_amount}</h4>
                                    <p className="text-sm text-gray-600">{selectedNetwork?.name}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-gray-900">
                                        ₦{selectedPlan?.selling_price}
                                    </div>
                                    {useBNPL && (
                                        <div className="badge badge-success badge-sm mt-1">
                                            <GiReceiveMoney className="mr-1" />
                                            BNPL
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaPhone className="text-xs" />
                                <span>To: {data.phone_number}</span>
                            </div>
                        </div>

                        {/* PIN Input */}
                        <div className="mb-6">
                            <div className="flex justify-center gap-3 mb-4">
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
                                        className="input input-bordered w-14 h-14 text-center text-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                            {pinError && (
                                <div className="text-center text-error text-sm">
                                    {pinError}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="modal-action">
                            <button
                                type="button"
                                onClick={() => setShowPinModal(false)}
                                className="btn btn-ghost text-gray-600"
                                disabled={verifyingPin}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePinSubmit}
                                disabled={verifyingPin || pin.some(digit => digit === '')}
                                className="btn btn-primary"
                            >
                                {verifyingPin ? (
                                    <>
                                        <span className="loading loading-spinner"></span>
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm Purchase'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}