import { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
import SelectInput from '@/Components/SelectInput';
import Modal from '@/Components/Modal';

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

    const handleProviderChange = (e) => {
        const providerId = e.target.value;
        if (!providerId) {
            setSelectedProvider(null);
            setSelectedPlan(null);
            return;
        }

        const provider = cableProviders.find(p => p.id.toString() === providerId);
        setSelectedProvider(provider);
        setSelectedPlan(null);
        setData('cable_plan_id', '');
        setVerificationStatus(null);
    };

    const handlePlanChange = (e) => {
        const planId = e.target.value;
        if (!planId) {
            setSelectedPlan(null);
            return;
        }

        const plan = cablePlans.find(p => p.id.toString() === planId);
        setSelectedPlan(plan);
    };

    const handleVerifySmartCard = () => {
        if (!data.smart_card_number || !data.cable_provider_id) {
            return;
        }

        // In a real application, this would make an API call to verify the smart card
        // For this example, we'll simulate a successful verification
        setVerificationStatus({
            status: 'success',
            message: 'Smart card verified successfully',
            customer_name: 'John Doe',
        });

        setData('customer_name', 'John Doe');
    };

    const handlePinChange = (index, value) => {
        const newValue = value.replace(/[^0-9]/g, '').slice(0, 1);
        const newPin = [...pin];
        newPin[index] = newValue;
        setPin(newPin);

        // Move to next input if value is entered
        if (newValue && index < 3) {
            document.getElementById(`pin-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (e, index) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            if (index > 0 && !pin[index]) {
                document.getElementById(`pin-${index - 1}`).focus();
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate required fields
        if (!verificationStatus || !selectedPlan) {
            return;
        }

        // Update save_as_beneficiary in the form data
        setData('save_as_beneficiary', saveAsBeneficiary);

        // Show PIN modal
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

        // Set the PIN in the form data
        setData('pin', pinString);

        // Submit the form with PIN
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

    const handleBeneficiarySelect = (beneficiary) => {
        setSelectedBeneficiary(beneficiary);
        setData({
            ...data,
            smart_card_number: beneficiary.smart_card_number,
            beneficiary_id: beneficiary.id,
            cable_provider_id: beneficiary.cable_provider_id,
        });

        // Update the selected provider
        const provider = cableProviders.find(p => p.id.toString() === beneficiary.cable_provider_id.toString());
        if (provider) {
            setSelectedProvider(provider);
            setCablePlans(provider.cable_plans || []);
        }

        // Verify the smart card
        handleVerifySmartCard();
    };
    const isavaiale = false;
    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Cable TV Subscription</h2>}
        >
            <Head title="Cable TV Subscription" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-6">
                                            <InputLabel htmlFor="cable_provider_id" value="Select Cable Provider" />
                                            <SelectInput
                                                id="cable_provider_id"
                                                className="mt-1 block w-full"
                                                value={data.cable_provider_id}
                                                onChange={handleProviderChange}
                                                required
                                            >
                                                <option value="">Select a provider</option>
                                                {cableProviders.map((provider) => (
                                                    <option key={provider.id} value={provider.id}>
                                                        {provider.name}
                                                    </option>
                                                ))}
                                            </SelectInput>
                                            <InputError message={errors.cable_provider_id} className="mt-2" />
                                        </div>

                                        <div className="mb-6">
                                            <InputLabel htmlFor="smart_card_number" value="Smart Card / IUC Number" />
                                            <div className="flex">
                                                <TextInput
                                                    id="smart_card_number"
                                                    type="text"
                                                    className="mt-1 block w-full rounded-r-none"
                                                    value={data.smart_card_number}
                                                    onChange={(e) => setData('smart_card_number', e.target.value)}
                                                    required
                                                    placeholder="Enter smart card number"
                                                />
                                                <Button
                                                    type="button"
                                                    className="mt-1 rounded-l-none"
                                                    onClick={handleVerifySmartCard}
                                                    disabled={!data.smart_card_number || !data.cable_provider_id}
                                                >
                                                    Verify
                                                </Button>
                                            </div>
                                            <InputError message={errors.smart_card_number} className="mt-2" />
                                        </div>

                                        {verificationStatus && (
                                            <div className={`mb-6 p-3 rounded-md ${
                                                verificationStatus.status === 'success'
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-red-50 text-red-700'
                                            }`}>
                                                <p>{verificationStatus.message}</p>
                                                {verificationStatus.status === 'success' && (
                                                    <p className="font-semibold mt-1">Customer: {verificationStatus.customer_name}</p>
                                                )}
                                            </div>
                                        )}

                                        <div className="mb-6">
                                            <InputLabel htmlFor="cable_plan_id" value="Select Subscription Plan" />
                                            <SelectInput
                                                id="cable_plan_id"
                                                className="mt-1 block w-full"
                                                value={data.cable_plan_id}
                                                onChange={handlePlanChange}
                                                required
                                                disabled={!selectedProvider || !verificationStatus}
                                            >
                                                <option value="">Select a plan</option>
                                                {cablePlans.map((plan) => (
                                                    <option key={plan.id} value={plan.id}>
                                                        {plan.name} - ₦{plan.selling_price} for {plan.validity}
                                                    </option>
                                                ))}
                                            </SelectInput>
                                            <InputError message={errors.cable_plan_id} className="mt-2" />
                                        </div>

                                        <div className="flex items-center justify-end">
                                            <Button
                                                type="submit"
                                                className="ml-4"
                                                processing={processing}
                                                disabled={!verificationStatus || !selectedPlan}
                                            >
                                                Pay Now
                                            </Button>
                                        </div>
                                    </form>
                                </div>

                                <div>
                                    <div className="bg-base-200 mm--50 p-6 rounded-lg">
                                        <h3 className="text-lg font-medium iggyy-updatey-900 mb-4">Order Summary</h3>

                                        <div className="mb-4">
                                            <p className="text-sm font-medium iggyy-updatey-500">Provider</p>
                                            <p className="mt-1">{selectedProvider ? selectedProvider.name : 'Not selected'}</p>
                                        </div>

                                        {verificationStatus && verificationStatus.status === 'success' && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium iggyy-updatey-500">Customer Name</p>
                                                <p className="mt-1">{verificationStatus.customer_name}</p>
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <p className="text-sm font-medium iggyy-updatey-500">Subscription Plan</p>
                                            <p className="mt-1">{selectedPlan ? selectedPlan.name : 'Not selected'}</p>
                                        </div>

                                        {selectedPlan && (
                                            <>
                                                <div className="mb-4">
                                                    <p className="text-sm font-medium iggyy-updatey-500">Validity</p>
                                                    <p className="mt-1">{selectedPlan.validity}</p>
                                                </div>

                                                <div className="mb-4">
                                                    <p className="text-sm font-medium iggyy-updatey-500">Price</p>
                                                    <p className="mt-1 text-lg font-semibold">₦{selectedPlan.selling_price}</p>
                                                </div>
                                            </>
                                        )}

                                        <div className="mb-4">
                                            <p className="text-sm font-medium iggyy-updatey-500">Wallet Balance</p>
                                            <p className="mt-1">₦{auth.user.wallet_balance}</p>
                                        </div>

                                        {selectedPlan && parseFloat(selectedPlan.selling_price) > parseFloat(auth.user.wallet_balance) && (
                                            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                                                Your wallet balance is insufficient for this transaction. Please fund your wallet.
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
                <div className="p-6">
                    <h2 className="text-lg font-medium mb-4">Enter Your PIN</h2>
                    <p className="text-sm igg-600 mb-6">
                        Please enter your 4-digit PIN to confirm this {selectedProvider?.name} subscription of {selectedPlan?.name} for ₦{selectedPlan?.selling_price}.
                    </p>

                    <div className="flex justify-center gap-4 mb-6">
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
                                className="w-12 h-12 text-center text-xl border rounded-md focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        ))}
                    </div>

                    {pinError && (
                        <div className="text-red-500 text-sm text-center mb-4">
                            {pinError}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowPinModal(false)}
                            className="px-4 py-2 bg-base-100 -ws border border-gray-300 rounded-md font-semibold text-xs igg-700 uppercase tracking-widest shadow-sm hover:bg-base-200 mm--50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handlePinSubmit}
                            disabled={verifyingPin || pin.some(digit => digit === '')}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition ease-in-out duration-150"
                        >
                            {verifyingPin ? 'Processing...' : 'Confirm Payment'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
