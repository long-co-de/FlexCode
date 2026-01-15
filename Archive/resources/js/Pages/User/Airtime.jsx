import { useState, useEffect, useRef } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
import SelectInput from '@/Components/SelectInput';
import Modal from '@/Components/Modal';
import AppLayout from '@/Layouts/AppLayout';
import { 
    FaUser, FaStar, FaRegStar, FaSearch, FaTimes, FaPhone, 
    FaWallet, FaTag, FaPercent, FaGift, FaShareAlt, FaExchangeAlt,
    FaMobileAlt, FaSimCard, FaCreditCard, FaShieldAlt, FaBolt,
    FaArrowRight, FaCheckCircle, FaExclamationTriangle,
    FaSave, FaUserPlus, FaLock
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
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState('');
    const [verifyingPin, setVerifyingPin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const phoneInputRef = useRef(null);
    const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
    const [useBNPL, setUseBNPL] = useState(false);

    const airtimeTypes = [
        { 
            id: 'VTU', 
            name: 'VTU', 
            description: 'Virtual Top-Up directly to the recipient\'s phone',
            icon: <FaMobileAlt className="text-xl" />,
            color: 'text-blue-600'
        },
        { 
            id: 'AWOOF', 
            name: 'Awoof', 
            description: 'Special discounted airtime with bonus',
            icon: <FaGift className="text-xl" />,
            color: 'text-purple-600'
        },
        { 
            id: 'SHARE', 
            name: 'Share', 
            description: 'Share airtime from your phone to recipient',
            icon: <FaShareAlt className="text-xl" />,
            color: 'text-green-600'
        },
        { 
            id: 'SELL', 
            name: 'Sell', 
            description: 'Convert airtime to cash at a discount',
            icon: <FaExchangeAlt className="text-xl" />,
            color: 'text-red-600'
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
    });

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

        // Update discount when network changes
        if (network.airtimeDiscounts && Array.isArray(network.airtimeDiscounts) && network.airtimeDiscounts.length > 0) {
            const activeDiscount = network.airtimeDiscounts.find(d => d.is_active);
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
        if (network) {
            setSelectedNetwork(network);
        }

        if (beneficiary.meta_data?.airtime_type) {
            setAirtimeType(beneficiary.meta_data.airtime_type);
        }
    };

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

        if (!data.network_id || !data.phone_number || !data.amount || parseFloat(data.amount) < 50) {
            return;
        }

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
        let d = '';
        let kdss = [];
        document.querySelectorAll('.piniss').forEach(e => {
            d = d + e.value;
            kdss.push(e.value);
        });
        setPin(kdss);

        setData('pin', d);
        setData('use_bnpl', useBNPL);

        const routeName = useBNPL ? 'borrow.airtime.process' : 'airtime.purchase';
        post(route(routeName), {
            onSuccess: () => {
                reset();
                setPin(['', '', '', '']);
                setShowPinModal(false);
                setSelectedBeneficiary(null);
                setSaveAsBeneficiary(false);
                setSearchTerm('');
            },
            onBefore: () => {
                let d = '';
                document.querySelectorAll('.piniss').forEach(e => {
                    d = d + e.value;
                });
                setData('pin', d);
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

    const filteredBeneficiaries = beneficiaries
        ? beneficiaries.filter(b =>
            b.service_type === 'airtime' &&
            (b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.phone_number.includes(searchTerm))
        )
        : [];

    useEffect(() => {
        let d = '';
        document.querySelectorAll('.piniss').forEach(e => {
            d = d + e.value;
        });
        setData('pin', d);
    }, [pin, data]);

    // Network icon mapping
    const networkIcons = {
        'MTN': { icon: <FaSimCard />, color: 'text-yellow-500' },
        'GLO': { icon: <FaSimCard />, color: 'text-green-500' },
        'AIRTEL': { icon: <FaSimCard />, color: 'text-red-500' },
        '9MOBILE': { icon: <FaSimCard />, color: 'text-purple-500' }
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Buy Airtime</h2>
                        <p className="text-gray-600">Instant airtime recharge for any network</p>
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
            <Head title="Buy Airtime" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                                                <p className="text-sm opacity-90">Get airtime now and pay in 30 days</p>
                                            </div>
                                        </div>
                                        <label className="cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-lg toggle-success"
                                                checked={useBNPL}
                                                onChange={(e) => setUseBNPL(e.target.checked)}
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

                            {/* Airtime Type Selection */}
                            <div className="card border border-gray-200 shadow-sm">
                                <div className="card-body">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <FaTag className="text-blue-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-800">Select Airtime Type</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {airtimeTypes.map((type) => (
                                            <div
                                                key={type.id}
                                                className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${airtimeType === type.id
                                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                onClick={() => handleAirtimeTypeChange(type.id)}
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`p-2 rounded-lg ${type.color} bg-white`}>
                                                        {type.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{type.name}</h4>
                                                        <p className="text-sm text-gray-600">{type.description}</p>
                                                    </div>
                                                </div>
                                                {airtimeType === type.id && (
                                                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                                                        <FaCheckCircle />
                                                        <span>Selected</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Network Selection */}
                            <div className="card border border-gray-200 shadow-sm">
                                <div className="card-body">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <FaSimCard className="text-blue-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-800">Select Network</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {networks.map((network) => {
                                            const networkUpper = network.name.toUpperCase();
                                            const networkConfig = networkIcons[networkUpper] || { icon: <FaSimCard />, color: 'text-gray-500' };
                                            const hasDiscount = network.airtimeDiscounts &&
                                                Array.isArray(network.airtimeDiscounts) &&
                                                network.airtimeDiscounts.length > 0 &&
                                                network.airtimeDiscounts[0].is_active;

                                            return (
                                                <button
                                                    key={network.id}
                                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${data.network_id?.toString() === network.id.toString()
                                                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    onClick={() => handleNetworkChange(network)}
                                                >
                                                    <div className={`p-3 rounded-lg ${networkConfig.color} bg-white mb-3 relative`}>
                                                        {networkConfig.icon}
                                                        {hasDiscount && (
                                                            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                                <FaPercent className="text-xs" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-gray-800 mb-1">{network.name}</span>
                                                    {hasDiscount && (
                                                        <span className="text-xs text-green-600 font-medium">
                                                            {network.airtimeDiscounts[0].discount_percentage}% OFF
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Beneficiaries Selection */}
                            {beneficiaries.length > 0 && (
                                <div className="card border border-gray-200 shadow-sm">
                                    <div className="card-body">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-2">
                                                <FaUser className="text-gray-500" />
                                                <h3 className="font-semibold text-gray-800">Saved Beneficiaries</h3>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search beneficiaries..."
                                                    className="input input-bordered input-sm pl-9 w-full md:w-60"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                            </div>
                                        </div>

                                        <div className="space-y-3 max-h-64 overflow-y-auto p-1">
                                            {filteredBeneficiaries.length > 0 ? (
                                                filteredBeneficiaries.map((beneficiary) => (
                                                    <div
                                                        key={beneficiary.id}
                                                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm ${selectedBeneficiary?.id === beneficiary.id
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        onClick={() => handleBeneficiarySelect(beneficiary)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="avatar placeholder">
                                                                    <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center">
                                                                        <FaUser />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-medium text-gray-900">{beneficiary.name}</h4>
                                                                    <p className="text-sm text-gray-600">{beneficiary.phone_number}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {beneficiary.is_favorite ? (
                                                                    <FaStar className="text-yellow-500" />
                                                                ) : (
                                                                    <FaRegStar className="text-gray-300" />
                                                                )}
                                                                {selectedBeneficiary?.id === beneficiary.id && (
                                                                    <FaCheckCircle className="text-blue-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        {beneficiary.network && (
                                                            <div className="mt-2 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full inline-block">
                                                                {beneficiary.network.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4 text-gray-500">
                                                    No matching beneficiaries found
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 text-right">
                                            <Link 
                                                href={route('beneficiaries.index', { type: 'airtime' })}
                                                className="text-sm text-blue-600 hover:underline flex items-center gap-1 justify-end"
                                            >
                                                <FaUserPlus className="text-xs" />
                                                Manage Beneficiaries
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Phone Input Section */}
                            <div className="card border border-gray-200 shadow-sm">
                                <div className="card-body">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FaPhone className="text-gray-500" />
                                        <h3 className="font-semibold text-gray-800">Recipient Details</h3>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Phone Number Input */}
                                        <div>
                                            <InputLabel htmlFor="phone_number" value="Phone Number" />
                                            <div className="mt-2">
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
                                                            onChange={(e) => setData('phone_number', e.target.value)}
                                                            maxLength="11"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <InputError message={errors.phone_number} className="mt-2" />
                                        </div>

                                        {/* Save as Beneficiary */}
                                        {!selectedBeneficiary && (
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-primary"
                                                        checked={saveAsBeneficiary}
                                                        onChange={(e) => {
                                                            setSaveAsBeneficiary(e.target.checked);
                                                            if (e.target.checked) {
                                                                setData('beneficiary_name', data.phone_number);
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <FaSave className="text-gray-500" />
                                                        <span className="text-gray-700">Save as beneficiary</span>
                                                    </div>
                                                </label>

                                                {saveAsBeneficiary && (
                                                    <div>
                                                        <InputLabel htmlFor="beneficiary_name" value="Beneficiary Name" />
                                                        <TextInput
                                                            id="beneficiary_name"
                                                            type="text"
                                                            className="mt-1 block w-full"
                                                            value={data.beneficiary_name}
                                                            onChange={(e) => setData('beneficiary_name', e.target.value)}
                                                            required={saveAsBeneficiary}
                                                            placeholder="Enter a name for this beneficiary"
                                                        />
                                                        <InputError message={errors.beneficiary_name} className="mt-2" />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Amount Input */}
                                        <div>
                                            <InputLabel htmlFor="amount" value="Amount (Minimum ₦50)" />
                                            <div className="mt-2">
                                                <TextInput
                                                    id="amount"
                                                    type="number"
                                                    min="50"
                                                    step="1"
                                                    className="block w-full"
                                                    value={data.amount}
                                                    onChange={(e) => setData('amount', e.target.value)}
                                                    required
                                                    placeholder="Enter amount"
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 mt-3">
                                                {[100, 200, 500, 1000].map(amount => (
                                                    <button
                                                        key={amount}
                                                        type="button"
                                                        className="py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                                        onClick={() => setData('amount', amount)}
                                                    >
                                                        ₦{amount}
                                                    </button>
                                                ))}
                                            </div>
                                            <InputError message={errors.amount} className="mt-2" />
                                        </div>

                                        {/* Ported Number Checkbox */}
                                        <div>
                                            <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary mt-1"
                                                    checked={data.ported_number || false}
                                                    onChange={e => setData('ported_number', e.target.checked)}
                                                    id="ported_number"
                                                />
                                                <div>
                                                    <span className="font-medium text-gray-800">Bypass Number Validator</span>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Check if this is a ported number or if you're experiencing validation issues
                                                    </p>
                                                </div>
                                            </label>
                                            <InputError message={errors.ported_number} className="mt-2" />
                                        </div>

                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            onClick={handleSubmit}
                                            className="w-full btn-lg"
                                            processing={processing}
                                            disabled={!data.network_id || !data.phone_number || !data.amount || parseFloat(data.amount) < 50}
                                        >
                                            Continue to Payment
                                            <FaArrowRight className="ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary - Right Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="card border border-gray-200 shadow-sm sticky top-6">
                                <div className="card-body">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <FaTag className="text-blue-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-800">Order Summary</h3>
                                    </div>

                                    <div className="space-y-5">
                                        {/* Airtime Type */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Airtime Type:</span>
                                            <div className="flex items-center gap-2">
                                                {airtimeTypes.find(t => t.id === airtimeType)?.icon}
                                                <span className="font-medium text-gray-900">{airtimeType}</span>
                                            </div>
                                        </div>

                                        {/* Network */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Network:</span>
                                            <div className="flex items-center gap-2">
                                                {selectedNetwork && networkIcons[selectedNetwork.name.toUpperCase()]?.icon}
                                                <span className="font-medium text-gray-900">
                                                    {selectedNetwork ? selectedNetwork.name : 'Not selected'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Discount Information */}
                                        {parseFloat(discount) > 0 && (
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaPercent className="text-green-600" />
                                                    <span className="font-medium text-green-800">Discount Applied</span>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-700">
                                                        {parseFloat(discount).toFixed(2)}% OFF
                                                    </div>
                                                    <p className="text-sm text-green-600 mt-1">
                                                        Save on {selectedNetwork?.name} airtime
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Amount Breakdown */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Amount:</span>
                                                <span className="font-medium text-gray-900">₦{data.amount || '0.00'}</span>
                                            </div>

                                            {parseFloat(discount) > 0 && data.amount && (
                                                <>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600">Discount:</span>
                                                        <span className="font-medium text-green-600">
                                                            -₦{(parseFloat(data.amount || 0) - parseFloat(amountToPay || 0)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-3 border-t">
                                                        <span className="font-medium text-gray-800">Amount to Pay:</span>
                                                        <span className="text-xl font-bold text-gray-900">
                                                            ₦{amountToPay}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Wallet Balance */}
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-gray-700">Wallet Balance</span>
                                                <span className="font-bold text-gray-900">
                                                    ₦{auth.user.wallet_balance.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Available</span>
                                                <span className={`font-medium ${
                                                    parseFloat(amountToPay) > parseFloat(auth.user.wallet_balance) && !useBNPL
                                                        ? 'text-red-600'
                                                        : 'text-green-600'
                                                }`}>
                                                    {parseFloat(amountToPay) > parseFloat(auth.user.wallet_balance) && !useBNPL
                                                        ? 'Insufficient'
                                                        : 'Sufficient'
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {/* Insufficient Balance Warning */}
                                        {parseFloat(amountToPay) > parseFloat(auth.user.wallet_balance) && !useBNPL && (
                                            <div className="alert alert-error bg-red-50 border-red-200">
                                                <FaExclamationTriangle className="text-red-600" />
                                                <div>
                                                    <p className="font-medium text-red-800">Insufficient Balance</p>
                                                    <p className="text-sm text-red-700">Please fund your wallet or activate BNPL</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* BNPL Status */}
                                        {useBNPL && (
                                            <div className="alert alert-success bg-emerald-50 border-emerald-200">
                                                <GiReceiveMoney className="text-emerald-600" />
                                                <div>
                                                    <p className="font-medium text-emerald-800">BNPL Activated</p>
                                                    <p className="text-sm text-emerald-700">Pay in 30 days with auto-deduction</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PIN Verification Modal */}
            <Modal show={showPinModal} onClose={() => setShowPinModal(false)}>
                <div className="p-6 max-w-md mx-auto">
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
                                <h4 className="font-bold text-gray-900">Airtime Purchase</h4>
                                <p className="text-sm text-gray-600">{selectedNetwork?.name} - {airtimeType}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-gray-900">
                                    ₦{data.amount}
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
                                    className="piniss w-14 h-14 text-center text-2xl border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowPinModal(false)}
                            className="btn btn-ghost"
                            disabled={verifyingPin}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                let d = '';
                                document.querySelectorAll('.piniss').forEach(e => {
                                    d = d + e.value;
                                });
                                setData('pin', d);
                                handlePinSubmit();
                            }}
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
            </Modal>
        </AppLayout>
    );
}