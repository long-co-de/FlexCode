import React, { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import EligibilityAlert from '@/Components/EligibilityAlert';
import Modal from '@/Components/Modal';
import axios from 'axios';
import { useEffect } from 'react';
import { FaStar, FaRegStar, FaTimes, FaSearch } from 'react-icons/fa';

const Electricity = ({ providers, eligibility, activeBorrowings, borrowSettings, hasActiveCard, beneficiaries = [] }) => {
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [useBNPL, setUseBNPL] = useState(true);
    const [showBNPLInfo, setShowBNPLInfo] = useState(false);
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
    const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);

    useEffect(() => {
        if (!hasActiveCard && useBNPL) {
            setUseBNPL(false);
            window.location.href = route('cards.link', { return_to: route('borrow.electricity') });
        }
    }, [useBNPL, hasActiveCard]);

    const borrowSettings_ = borrowSettings?.electricity || {};

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
    });

    const filteredBeneficiaries = beneficiaries
        ? beneficiaries.filter(b =>
            b.service_type === 'electricity' &&
            (b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.meter_number.includes(searchTerm))
        )
        : [];

    const handleVerifyMeter = async () => {
        if (!data.electricity_provider_id || !data.meter_number || !data.meter_type) {
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
                setData({
                    ...data,
                    customer_name: response.data.data.customer_name || '',
                    address: response.data.data.address || '',
                });
            }
        } catch (error) {
            setVerifyError(error.response?.data?.message || 'Failed to verify meter');
        } finally {
            setVerifyingMeter(false);
        }
    };

    const handleBeneficiarySelect = (beneficiary) => {
        setSelectedBeneficiary(beneficiary);
        setData({
            ...data,
            electricity_provider_id: beneficiary.electricity_provider_id,
            meter_number: beneficiary.meter_number,
            meter_type: beneficiary.meta_data?.meter_type || 'prepaid',
            beneficiary_id: beneficiary.id,
        });

        const provider = providers.find(p => p.id.toString() === beneficiary.electricity_provider_id.toString());
        if (provider) {
            setSelectedProvider(provider);
        }

        setShowBeneficiaryModal(false);
        
        setTimeout(() => {
            handleVerifyMeter();
        }, 100);
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
        if (e.key === 'Backspace') {
            if (index > 0 && !pin[index]) {
                document.getElementById(`pin-${index - 1}`)?.focus();
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!meterVerified) {
            setVerifyError('Please verify meter first');
            return;
        }

        if (useBNPL) {
            setShowConfirmModal(true);
        } else {
            setShowPinModal(true);
        }
    };

    const handleConfirmBorrow = () => {
        setShowConfirmModal(false);
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

        const route_ = useBNPL ? 'borrow.electricity.process' : 'electricity.purchase';
        post(route_, {
            onSuccess: () => {
                reset();
                setPin(['', '', '', '']);
                setShowPinModal(false);
                setSelectedBeneficiary(null);
                setMeterVerified(null);
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

    const handleEligibilityAction = (actionType) => {
        if (actionType === 'link_card') {
            window.location.href = route('cards.link', { return_to: route('borrow.electricity') });
        }
    };

    const maxBorrowableAmount = Math.min(
        eligibility?.available_credit || 0,
        borrowSettings_?.max_amount || 20000
    );
    const amountValid = data.amount >= (borrowSettings_?.min_amount || 500) &&
                        data.amount <= maxBorrowableAmount;
    const canBorrow = eligibility?.is_eligible && useBNPL && meterVerified && amountValid;
    const exceedsLimit = useBNPL && data.amount && parseFloat(data.amount) > maxBorrowableAmount;

    return (
        <AppLayout>
            <Head title="Borrow Electricity" />
            
            <div className="max-w-6xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Electricity</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Borrow electricity bill payment and repay within {borrowSettings_?.due_days || 30} days
                    </p>
                </div>

                <EligibilityAlert eligibility={eligibility} onAction={handleEligibilityAction} />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                            {/* BNPL Toggle */}
                            <div className="border-b pb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        {!hasActiveCard ? (
                                            <div className="flex items-center space-x-3">
                                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                <div>
                                                    <p className="text-lg font-medium text-gray-700">Buy Now, Pay Later</p>
                                                    <p className="text-sm text-amber-700">Link a payment card to enable borrowing</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={useBNPL}
                                                    onChange={(e) => {
                                                        setUseBNPL(e.target.checked);
                                                        setData('use_bnpl', e.target.checked);
                                                    }}
                                                    disabled={!eligibility?.is_eligible}
                                                    className="w-5 h-5 text-blue-600 rounded"
                                                />
                                                <span className="ml-3 text-lg font-medium text-gray-700">
                                                    Buy Now, Pay Later
                                                </span>
                                            </label>
                                        )}
                                        {hasActiveCard && (
                                            <p className="mt-1 text-sm text-gray-500">
                                                Repay within {borrowSettings_?.due_days || 30} days with auto-deduction
                                            </p>
                                        )}
                                    </div>
                                    {!hasActiveCard ? (
                                        <a
                                            href={route('cards.link', { return_to: route('borrow.electricity') })}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                        >
                                            Link Card
                                        </a>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowBNPLInfo(!showBNPLInfo)}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            ℹ️
                                        </button>
                                    )}
                                </div>
                                
                                {showBNPLInfo && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded text-sm text-gray-700">
                                        <p className="font-medium mb-2">How borrowing works:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Borrow up to ₦{borrowSettings_?.max_amount || 20000}</li>
                                            <li>Interest is added at borrowing time</li>
                                            <li>Repay within {borrowSettings_?.due_days || 30} days</li>
                                            <li>Auto-deduction from your linked card (optional)</li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Beneficiary Selection */}
                            {beneficiaries.length > 0 && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setShowBeneficiaryModal(true)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        📋 Select from saved meters
                                    </button>
                                </div>
                            )}

                            {/* Provider Selection - Card Grid */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Electricity Provider
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {providers.map((provider) => (
                                        <button
                                            key={provider.id}
                                            type="button"
                                            onClick={() => {
                                                setData('electricity_provider_id', provider.id);
                                                setSelectedProvider(provider);
                                                setMeterVerified(null);
                                            }}
                                            className={`p-4 rounded-lg border-2 transition text-left ${
                                                data.electricity_provider_id == provider.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-300 bg-white hover:border-blue-300'
                                            }`}
                                        >
                                            <p className="font-medium text-gray-900">{provider.name}</p>
                                        </button>
                                    ))}
                                </div>
                                {errors.electricity_provider_id && (
                                    <p className="text-red-600 text-sm mt-1">{errors.electricity_provider_id}</p>
                                )}
                            </div>

                            {/* Meter Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Meter Type
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['prepaid', 'postpaid'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                setData('meter_type', type);
                                                setMeterVerified(null);
                                            }}
                                            className={`p-3 rounded-lg border-2 transition text-left capitalize ${
                                                data.meter_type === type
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-300 bg-white hover:border-blue-300'
                                            }`}
                                        >
                                            <p className="font-medium text-gray-900 text-sm">{type}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Meter Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Meter Number
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={data.meter_number}
                                        onChange={(e) => {
                                            setData('meter_number', e.target.value);
                                            setMeterVerified(null);
                                        }}
                                        placeholder="e.g. 12345678901"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyMeter}
                                        disabled={verifyingMeter || !data.electricity_provider_id || !data.meter_number}
                                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
                                    >
                                        {verifyingMeter ? 'Verifying...' : 'Verify'}
                                    </button>
                                </div>
                                {errors.meter_number && <p className="text-red-600 text-sm mt-1">{errors.meter_number}</p>}
                                {verifyError && <p className="text-red-600 text-sm mt-1">{verifyError}</p>}
                            </div>

                            {/* Meter Verification Status */}
                            {meterVerified && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm font-medium text-green-800 mb-2">✓ Meter Verified</p>
                                    <div className="space-y-1 text-sm text-green-700">
                                        <p><strong>Customer Name:</strong> {meterVerified.customer_name}</p>
                                        <p><strong>Address:</strong> {meterVerified.address}</p>
                                    </div>
                                </div>
                            )}

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount (₦)
                                </label>
                                {useBNPL && (
                                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm font-medium text-blue-900">Available to Borrow: <span className="text-xl font-bold">₦{maxBorrowableAmount.toLocaleString()}</span></p>
                                        <p className="text-xs text-blue-700 mt-1">Min: ₦{borrowSettings_?.min_amount || 500} | Max: ₦{maxBorrowableAmount.toLocaleString()}</p>
                                    </div>
                                )}
                                <input
                                    type="number"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    min={borrowSettings_?.min_amount || 500}
                                    max={maxBorrowableAmount}
                                    disabled={!meterVerified}
                                    placeholder="Enter amount"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                                {useBNPL && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Min: ₦{borrowSettings_?.min_amount || 500} - Max: ₦{maxBorrowableAmount.toLocaleString()}
                                    </p>
                                )}
                                {exceedsLimit && (
                                    <p className="text-red-600 text-sm mt-2 font-medium">⚠️ Amount exceeds your available credit (₦{maxBorrowableAmount.toLocaleString()})</p>
                                )}
                                {!amountValid && data.amount && useBNPL && !exceedsLimit && (
                                    <p className="text-red-600 text-sm mt-1">Amount is outside the allowed range</p>
                                )}
                                {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
                            </div>

                            {/* Beneficiary Checkbox */}
                            <div>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.save_as_beneficiary}
                                        onChange={(e) => setData('save_as_beneficiary', e.target.checked)}
                                        disabled={!meterVerified}
                                        className="w-5 h-5 text-blue-600 rounded disabled:opacity-50"
                                    />
                                    <span className="ml-3 text-sm text-gray-700">
                                        Save as beneficiary for future transactions
                                    </span>
                                </label>
                            </div>

                            {/* Beneficiary Name (conditional) */}
                            {data.save_as_beneficiary && meterVerified && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Beneficiary Name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.beneficiary_name}
                                        onChange={(e) => setData('beneficiary_name', e.target.value)}
                                        placeholder="e.g. Home Electricity"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing || (useBNPL && (!eligibility?.is_eligible || !meterVerified || !amountValid))}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition"
                            >
                                {processing ? 'Processing...' : useBNPL ? 'Borrow Now' : 'Continue'}
                            </button>
                        </form>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Summary Card */}
                        {meterVerified && data.amount && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="font-medium text-gray-900 mb-4">Order Summary</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Provider</span>
                                        <span className="font-medium text-gray-900">{selectedProvider?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Amount</span>
                                        <span className="font-medium text-gray-900">₦{parseFloat(data.amount || 0).toLocaleString()}</span>
                                    </div>
                                    {useBNPL && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Interest Rate</span>
                                                <span className="font-medium text-gray-900">{getInterestRate()}%</span>
                                            </div>
                                            <div className="border-t pt-3 flex justify-between">
                                                <span className="text-gray-600">Total to Repay</span>
                                                <span className="font-bold text-lg text-blue-600">
                                                    ₦{calculateTotalRepayment(data.amount).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2">
                                                <p>Due in {borrowSettings_?.due_days || 30} days</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Borrowing Status */}
                        {useBNPL && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="font-medium text-gray-900 mb-4">Your Borrowing Status</h3>
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                        <p className="text-xs text-gray-600 mb-1">You Can Borrow</p>
                                        <p className="text-3xl font-bold text-blue-600">
                                            ₦{maxBorrowableAmount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Limited by your credit score and available credit
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-gray-50 rounded">
                                            <p className="text-xs text-gray-600">Credit Score</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {eligibility?.credit_score || '0'}/100
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {eligibility?.credit_score >= 80 ? '✓ Good' : eligibility?.credit_score >= 50 ? '○ Fair' : '✗ Low'}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded">
                                            <p className="text-xs text-gray-600">Credit Limit</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                ₦{(eligibility?.credit_limit || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-amber-50 rounded border border-amber-200">
                                        <p className="text-xs text-gray-600 mb-1">Interest Rate Applied</p>
                                        <p className="text-lg font-bold text-amber-700">
                                            {getInterestRate()}%
                                        </p>
                                        <p className="text-xs text-amber-600 mt-1">
                                            {eligibility?.credit_score >= 80 ? 'Good credit rate' : 'Standard rate'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Active Borrowings */}
                        {activeBorrowings && activeBorrowings.length > 0 && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="font-medium text-gray-900 mb-4">Active Borrowings</h3>
                                <div className="space-y-3">
                                    {activeBorrowings.map((borrowing) => (
                                        <div key={borrowing.id} className="border rounded p-3 bg-gray-50">
                                            <p className="text-sm font-medium text-gray-900">
                                                ₦{borrowing.total_amount.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Due: {new Date(borrowing.due_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Beneficiary Modal */}
            <Modal show={showBeneficiaryModal} onClose={() => setShowBeneficiaryModal(false)}>
                <div className="p-6 bg-white rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Select Meter</h3>
                        <button
                            onClick={() => setShowBeneficiaryModal(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className="relative mb-4">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or meter number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {filteredBeneficiaries.length > 0 ? (
                            filteredBeneficiaries.map((beneficiary) => (
                                <button
                                    key={beneficiary.id}
                                    onClick={() => handleBeneficiarySelect(beneficiary)}
                                    className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition border border-gray-200"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{beneficiary.name}</p>
                                            <p className="text-sm text-gray-600">{beneficiary.meter_number}</p>
                                        </div>
                                        {beneficiary.is_favorite && <FaStar className="text-yellow-500" />}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 text-sm py-4">No meters found</p>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Confirmation Modal */}
            <Modal show={showConfirmModal} onClose={() => !verifyingPin && setShowConfirmModal(false)}>
                <div className="p-6 bg-white rounded-lg max-w-md mx-auto">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Borrowing</h3>
                    
                    <div className="mb-6 space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-600 mb-1">Amount to Borrow</p>
                            <p className="text-2xl font-bold text-blue-600">₦{parseFloat(data.amount || 0).toLocaleString()}</p>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Provider</span>
                                <span className="font-medium text-gray-900">{selectedProvider?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Meter Number</span>
                                <span className="font-medium text-gray-900">{data.meter_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Meter Type</span>
                                <span className="font-medium text-gray-900 capitalize">{data.meter_type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Interest Rate</span>
                                <span className="font-medium text-gray-900">{getInterestRate()}%</span>
                            </div>
                            <div className="border-t pt-3 flex justify-between">
                                <span className="text-gray-600">Total to Repay</span>
                                <span className="font-bold text-blue-600">₦{calculateTotalRepayment(data.amount).toLocaleString()}</span>
                            </div>
                            <div className="border-t pt-3 flex justify-between">
                                <span className="text-gray-600">Repayment Due</span>
                                <span className="font-medium text-gray-900">{new Date(Date.now() + (borrowSettings_?.due_days || 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                            <p className="text-sm text-amber-800">
                                <span className="font-medium">Impact on your account:</span><br/>
                                Available Credit: ₦{(eligibility?.available_credit || 0).toLocaleString()} → ₦{((eligibility?.available_credit || 0) - parseFloat(data.amount || 0)).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmBorrow}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Continue to PIN
                        </button>
                    </div>
                </div>
            </Modal>

            {/* PIN Modal */}
            <Modal show={showPinModal} onClose={() => !verifyingPin && setShowPinModal(false)}>
                <div className="p-6 bg-white rounded-lg max-w-sm mx-auto">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Transaction PIN</h3>
                    
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-4">Enter your 4-digit PIN to confirm</p>
                        <div className="flex gap-3 justify-center">
                            {pin.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`pin-${index}`}
                                    type="password"
                                    value={digit}
                                    onChange={(e) => handlePinChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    maxLength="1"
                                />
                            ))}
                        </div>
                        {pinError && <p className="text-red-600 text-sm mt-3">{pinError}</p>}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => !verifyingPin && setShowPinModal(false)}
                            disabled={verifyingPin}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePinSubmit}
                            disabled={verifyingPin || pin.join('').length !== 4}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {verifyingPin ? 'Verifying...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
};

export default Electricity;
