import { useState, useEffect, useRef } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FaPhone, FaWallet, FaCheckCircle, FaExclamationTriangle, FaArrowRight, FaStar, FaSearch, FaTimes, FaBolt } from 'react-icons/fa';
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
    const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
    const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        network_id: '',
        phone_number: '',
        amount: '',
        airtime_type: 'VTU',
        save_as_beneficiary: false,
        beneficiary_name: '',
        pin: '',
        use_bnpl: false,
    });

    const borrowSettings_ = borrowSettings?.airtime || {};
    const currentNetwork = networks.find(n => n.id == selectedNetwork?.id);

    const getInterestRate = () => {
        if (eligibility?.credit_score >= 80) {
            return borrowSettings_.good_credit_interest_rate || 3;
        }
        return borrowSettings_.base_interest_rate || 5;
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

    const filteredBeneficiaries = beneficiaries?.filter(b =>
        b.service_type === 'airtime' &&
        (b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.phone_number.includes(searchTerm))
    ) || [];

    const handleBeneficiarySelect = (beneficiary) => {
        setSelectedBeneficiary(beneficiary);
        setData({
            ...data,
            network_id: beneficiary.network_id,
            phone_number: beneficiary.phone_number,
            airtime_type: beneficiary.meta_data?.airtime_type || 'VTU',
            beneficiary_id: beneficiary.id,
        });
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

    const handlePhoneChange = (e) => {
        setData('phone_number', e.target.value);
        setSelectedBeneficiary(null);
    };

    const handleAmountChange = (e) => {
        setData('amount', e.target.value);
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

    const handleConfirm = (e) => {
        e.preventDefault();
        if (!data.phone_number || data.phone_number.length !== 11) {
            return;
        }
        if (!data.amount || parseFloat(data.amount) < borrowSettings_.min_amount) {
            return;
        }
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
        setData('pin', pinString);

        post(route('borrow.airtime.process'), {
            onSuccess: () => {
                reset();
                setPin(['', '', '', '']);
                setShowPinModal(false);
                setShowConfirmModal(false);
                setStep(1);
                setSelectedNetwork(null);
                setSelectedBeneficiary(null);
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

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="text-2xl font-bold text-gray-800">Borrow Airtime</h2>}
        >
            <Head title="Borrow Airtime" />

            <div className="max-w-2xl mx-auto">
                {eligibility && !eligibility.is_eligible && (
                    <div className="mb-6 alert alert-error bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
                        <FaExclamationTriangle className="text-red-600" />
                        <span className="text-red-800">{eligibility.rejection_reason}</span>
                    </div>
                )}

                {/* BNPL Toggle */}
                {eligibility?.is_eligible && (
                    <div className="mb-6 card bg-indigo-50 border border-indigo-200">
                        <div className="card-body">
                            <label className="flex items-center cursor-pointer gap-3">
                                <input
                                    type="checkbox"
                                    checked={useBNPL}
                                    onChange={(e) => handleBNPLToggle(e.target.checked)}
                                    className="checkbox checkbox-primary"
                                />
                                <div>
                                    <div className="font-semibold text-gray-800">💳 Buy Now, Pay Later</div>
                                    <div className="text-sm text-gray-600">Interest: {getInterestRate()}% | Repay in 30 days</div>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Step 1: Network Selection */}
                {step === 1 && (
                    <div className="card border border-gray-200 shadow-sm">
                        <div className="card-body">
                            <h3 className="text-lg font-semibold mb-6">Step 1: Select Network</h3>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {networks.map((network) => (
                                    <button
                                        key={network.id}
                                        onClick={() => handleNetworkSelect(network)}
                                        className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                                    >
                                        <div className="font-bold text-gray-800">{network.name}</div>
                                        <div className="text-sm text-gray-600 mt-1">Select to continue</div>
                                    </button>
                                ))}
                            </div>

                            {filteredBeneficiaries.length > 0 && (
                                <div className="divider">Recent Beneficiaries</div>
                            )}
                            {filteredBeneficiaries.length > 0 && (
                                <button
                                    onClick={() => setShowBeneficiaryModal(true)}
                                    className="btn btn-outline w-full"
                                >
                                    <FaSearch className="mr-2" />
                                    Select from saved
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Amount & Phone */}
                {step === 2 && selectedNetwork && (
                    <form onSubmit={handleConfirm}>
                        <div className="card border border-gray-200 shadow-sm">
                            <div className="card-body">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold">Step 2: Enter Details</h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
                                            setSelectedNetwork(null);
                                            setData('network_id', '');
                                        }}
                                        className="btn btn-sm btn-ghost"
                                    >
                                        Change Network
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Network Display */}
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="text-sm text-gray-600">Selected Network</div>
                                        <div className="font-bold text-gray-800 text-lg">{selectedNetwork.name}</div>
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="label">
                                            <span className="label-text font-semibold">Phone Number</span>
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="080XXXXXXXX"
                                            maxLength="11"
                                            value={data.phone_number}
                                            onChange={handlePhoneChange}
                                            className="input input-bordered w-full"
                                            required
                                        />
                                        {errors.phone_number && <div className="text-error text-sm mt-1">{errors.phone_number}</div>}
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="label">
                                            <span className="label-text font-semibold">Amount to Borrow (₦)</span>
                                            <span className="label-text-alt text-blue-600">
                                                Min: ₦{borrowSettings_.min_amount} | Max: ₦{borrowSettings_.max_amount}
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Enter amount"
                                            min={borrowSettings_.min_amount}
                                            max={borrowSettings_.max_amount}
                                            value={data.amount}
                                            onChange={handleAmountChange}
                                            className="input input-bordered w-full"
                                            required
                                        />
                                        {errors.amount && <div className="text-error text-sm mt-1">{errors.amount}</div>}

                                        {/* Available Credit Display */}
                                        {useBNPL && eligibility && (
                                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-xs text-gray-600">Available Credit</div>
                                                        <div className="font-bold text-lg text-blue-600">₦{eligibility.available_credit}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-600">Credit Score</div>
                                                        <div className="font-bold text-lg">{eligibility.credit_score}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Total Repayment Preview */}
                                    {data.amount && useBNPL && (
                                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <div className="text-xs text-gray-600">Amount</div>
                                                    <div className="font-bold">₦{parseFloat(data.amount).toLocaleString()}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-600">Interest ({getInterestRate()}%)</div>
                                                    <div className="font-bold">₦{((parseFloat(data.amount) * getInterestRate()) / 100).toLocaleString()}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-600">Total to Repay</div>
                                                    <div className="font-bold text-indigo-600">₦{calculateTotalRepayment(data.amount).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
                                            setSelectedNetwork(null);
                                            setData('network_id', '');
                                        }}
                                        className="btn btn-outline flex-1"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !data.phone_number || !data.amount}
                                        className="btn btn-primary flex-1"
                                    >
                                        {processing ? 'Processing...' : 'Review & Continue'}
                                        <FaArrowRight className="ml-2" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Confirm Borrowing</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600">Network</div>
                                        <div className="font-bold">{selectedNetwork?.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Phone</div>
                                        <div className="font-bold">{data.phone_number}</div>
                                    </div>
                                </div>
                            </div>

                            {useBNPL && (
                                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <div className="text-xs text-gray-600">Amount</div>
                                            <div className="font-bold">₦{parseFloat(data.amount).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-600">Interest</div>
                                            <div className="font-bold">₦{((parseFloat(data.amount) * getInterestRate()) / 100).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-600">Total</div>
                                            <div className="font-bold text-indigo-600">₦{calculateTotalRepayment(data.amount).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-3">
                                        <FaBolt className="inline mr-1" />
                                        Auto-deduction in 30 days
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-action gap-2 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="btn btn-outline"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setShowPinModal(true);
                                }}
                                className="btn btn-primary"
                            >
                                Confirm & Enter PIN
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowConfirmModal(false)}></div>
                </div>
            )}

            {/* PIN Modal */}
            {showPinModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Enter Your PIN</h3>
                        <div className="flex gap-2 justify-center mb-6">
                            {pin.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`pin-${index}`}
                                    type="password"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handlePinChange(index, e.target.value)}
                                    className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg"
                                />
                            ))}
                        </div>
                        {pinError && <div className="alert alert-error mb-4">{pinError}</div>}
                        <div className="modal-action gap-2">
                            <button
                                type="button"
                                onClick={() => setShowPinModal(false)}
                                className="btn btn-outline"
                                disabled={verifyingPin}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePinSubmit}
                                disabled={verifyingPin}
                                className="btn btn-primary"
                            >
                                {verifyingPin ? 'Verifying...' : 'Submit PIN'}
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => !verifyingPin && setShowPinModal(false)}></div>
                </div>
            )}

            {/* Beneficiary Modal */}
            {showBeneficiaryModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Select Beneficiary</h3>
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input input-bordered w-full mb-4"
                        />
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredBeneficiaries.map((b) => (
                                <button
                                    key={b.id}
                                    onClick={() => handleBeneficiarySelect(b)}
                                    className="btn btn-outline w-full justify-start"
                                >
                                    <div className="text-left">
                                        <div className="font-semibold">{b.name}</div>
                                        <div className="text-xs text-gray-600">{b.phone_number}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="modal-action">
                            <button onClick={() => setShowBeneficiaryModal(false)} className="btn btn-outline">
                                Close
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowBeneficiaryModal(false)}></div>
                </div>
            )}
        </AppLayout>
    );
};

export default Airtime;
