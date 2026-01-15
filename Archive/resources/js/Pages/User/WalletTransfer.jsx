import { useState, useEffect, useRef } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
import Modal from '@/Components/Modal';
import { FaExchangeAlt, FaArrowLeft, FaUser, FaCheck, FaBell, FaStar, FaHistory, FaSearch, FaUserPlus } from 'react-icons/fa';
import axios from 'axios';
import Notiflix from 'notiflix';

export default function WalletTransfer({ auth }) {
    const [verifyingUser, setVerifyingUser] = useState(false);
    const [verifiedUser, setVerifiedUser] = useState(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState('');
    const [verifyingPin, setVerifyingPin] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
    const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
    const notificationTimeout = useRef(null);
    const [transferHistory, setTransferHistory] = useState([]);
    const [showSaveBeneficiaryModal, setShowSaveBeneficiaryModal] = useState(false);
    const [saveBeneficiaryName, setSaveBeneficiaryName] = useState('');
    const [filteredBeneficiaries, setFilteredBeneficiaries] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Load beneficiaries and transfer history on mount
    useEffect(() => {
        // Load beneficiaries
        axios.get(route('beneficiaries.index.api'))
            .then(response => {
                setBeneficiaries(response.data.beneficiaries || []);
                setFilteredBeneficiaries(response.data.beneficiaries || []);
            })
            .catch(error => {
                console.error('Error loading beneficiaries:', error);
            });

        // Load transfer history
        // axios.get(route('wallet.transfer.history'))
        //     .then(response => {
        //         setTransferHistory(response.data.history || []);
        //     })
        //     .catch(error => {
        //         console.error('Error loading transfer history:', error);
        //     });
    }, []);

    const { data, setData, post, processing, errors, reset } = useForm({
        recipient_phone: '',
        amount: '',
        pin: '',
    });

    // Reset verified user when phone number changes
    useEffect(() => {
        if (verifiedUser && data.recipient_phone !== verifiedUser.phone_number) {
            setVerifiedUser(null);
        }
    }, [data.recipient_phone]);

    // Filter beneficiaries based on search query
    useEffect(() => {
        const filtered = beneficiaries.filter(beneficiary =>
            beneficiary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            beneficiary.phone_number.includes(searchQuery)
        );
        setFilteredBeneficiaries(filtered);
    }, [searchQuery, beneficiaries]);

    const verifyUser = () => {
        if (!data.recipient_phone) return;

        setVerifyingUser(true);

        axios.post(route('api.verify-user'), { phone_number: data.recipient_phone })
            .then(response => {
                if (response.data.success) {
                    setVerifiedUser(response.data.user);
                } else {
                    setVerifiedUser(null);
                }
            })
            .catch(error => {
                console.error('Error verifying user:', error);
                setVerifiedUser(null);
                Notiflix.Report.info('Failed','the provided credentails not found');
            })
            .finally(() => {
                setVerifyingUser(false);
            });
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

        if (!verifiedUser) {
            verifyUser();
            return;
        }

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
        post(route('wallet.transfer'), {
            onSuccess: (response) => {
                reset();
                setPin(['', '', '', '']);
                setShowPinModal(false);

                // Add the new transfer to history
                setTransferHistory(prevHistory => [{
                    id: Date.now(),
                    recipient_name: verifiedUser.name,
                    recipient_phone: verifiedUser.phone_number,
                    amount: data.amount,
                    created_at: new Date().toLocaleString()
                }, ...prevHistory]);

                // Check if recipient is already a beneficiary
                const isExistingBeneficiary = beneficiaries.some(
                    b => b.phone_number === verifiedUser.phone_number
                );

                if (!isExistingBeneficiary) {
                    // Ask to save as beneficiary
                    setTimeout(() => {
                        if (window.confirm('Would you like to save this recipient as a beneficiary?')) {
                            setShowSaveBeneficiaryModal(true);
                        }
                    }, 500);
                }

                setShowSuccess(true);
                setShowNotification(true);
                if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
                notificationTimeout.current = setTimeout(() => setShowNotification(false), 4000);

                setVerifiedUser(null);
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

    useEffect(() => {
        const pinString = pin.join('');
        setData('pin', pinString);
    }, [pin]);

    const handleBeneficiarySelect = (beneficiary) => {
        setData('recipient_phone', beneficiary.phone_number);
        setVerifiedUser({
            name: beneficiary.name,
            phone_number: beneficiary.phone_number
        });
    };

    const handleSaveBeneficiary = () => {
        if (!verifiedUser) return;

        axios.post(route('beneficiaries.store'), {
            name: saveBeneficiaryName || verifiedUser.name,
            phone_number: verifiedUser.phone_number
        })
        .then(response => {
            setBeneficiaries([...beneficiaries, response.data.beneficiary]);
            setShowSaveBeneficiaryModal(false);
            setSaveBeneficiaryName('');
            Notiflix.Report.success('Success', 'Beneficiary saved successfully', 'OK');
        })
        .catch(error => {
            console.error('Error saving beneficiary:', error);
            Notiflix.Report.failure('Error', 'Failed to save beneficiary', 'OK');
        });
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-2">
                    <Link href={route('wallet')} className="mr-4">
                        <FaArrowLeft className="igg-600" />
                    </Link>
                    <h2 className="font-semibold text-xl igg-800 leading-tight">Wallet Transfer</h2>
                </div>
            }
        >
            <Head title="Wallet Transfer" />

            {/* Notification Toast */}
            {showNotification && (
                <div className="fixed top-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center animate-fade-in">
                    <FaBell className="mr-3 animate-pulse text-2xl" />
                    <span className="font-semibold">Transfer successful! Recipient has been notified.</span>
                </div>
            )}

            {/* Success Modal */}
            {showSuccess && (
                <Modal show={showSuccess} onClose={() => setShowSuccess(false)}>
                    <div className="p-8 flex flex-col items-center">
                        <div className="bg-green-500 p-4 rounded-full shadow-lg mb-4 animate-bounce">
                            <FaCheck className="text-white text-4xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-700 mb-2 tracking-tight">Transfer Successful!</h2>
                        <p className="text-green-600 mb-6 text-center">Your transfer was completed and the recipient has been notified instantly.</p>
                        <Button onClick={() => setShowSuccess(false)} className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-2 font-semibold text-xs uppercase tracking-widest shadow-md">Close</Button>
                    </div>
                </Modal>
            )}

            <div className="py-12 bg-gradient-to -br from-base-100 via-base-300 to-base-200 min-h-screen">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Beneficiaries Section */}
                        <div className="md:col-span-1">
                            <div className="rounded-3xl shadow-xl bg-base-100 border border-base-100 overflow-hidden mb-6">
                                <div className="p-6">
                                    <h3 className="text-lg font-bold mb-4 text-blue-700 flex items-center">
                                        <FaUserPlus className="mr-2" /> Beneficiaries
                                    </h3>
                                    <div className="mb-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search beneficiaries..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 rounded-lg"
                                            />
                                            <FaSearch className="absolute left-3 top-3 text-blue-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {filteredBeneficiaries.map((beneficiary) => (
                                            <button
                                                key={beneficiary.id}
                                                onClick={() => handleBeneficiarySelect(beneficiary)}
                                                className="w-full p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition flex items-center"
                                            >
                                                <div className="bg-blue-200 p-2 rounded-full mr-3">
                                                    <FaUser className="text-blue-600" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold text-blue-700">{beneficiary.name}</div>
                                                    <div className="text-sm text-blue-500">{beneficiary.phone_number}</div>
                                                </div>
                                            </button>
                                        ))}
                                        {filteredBeneficiaries.length === 0 && (
                                            <div className="text-center py-4 text-blue-400">
                                                No beneficiaries found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transfer Form Section */}
                        <div className="md:col-span-2">
                            <div className="rounded-3xl shadow-2xl bg-base-100 /95 border border-blue-100 overflow-hidden mb-6">
                                <div className="p-8 flex flex-col items-center">
                                    <div className="bg-blue-500 p-4 rounded-full shadow-lg mb-4 animate-bounce">
                                        <FaExchangeAlt className="text-white text-4xl" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-blue-700 mb-2 tracking-tight">Wallet Transfer</h2>
                                    <p className="text-blue-500 mb-6 text-center">Send money instantly to any user on the platform.</p>
                                    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-6">
                                        <div>
                                            <InputLabel htmlFor="recipient_phone" value="Recipient Phone Number" />
                                            <div className="flex mt-1">
                                                <TextInput
                                                    id="recipient_phone"
                                                    type="text"
                                                    className="block w-full rounded-l-lg border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition"
                                                    value={data.recipient_phone}
                                                    onChange={(e) => setData('recipient_phone', e.target.value)}
                                                    required
                                                    placeholder="Enter recipient phone number"
                                                    disabled={verifiedUser !== null}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={verifyUser}
                                                    disabled={verifyingUser || !data.recipient_phone || verifiedUser !== null}
                                                    className={`px-4 py-2 rounded-r-lg font-semibold transition-colors ${verifyingUser ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} text-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
                                                >
                                                    {verifyingUser ? 'Verifying...' : 'Verify'}
                                                </button>
                                            </div>
                                            <InputError message={errors.recipient_phone} className="mt-2" />
                                        </div>
                                        {verifiedUser && (
                                            <div className="mb-2 flex items-center bg-green-50 border border-green-200 rounded-lg p-3 animate-fade-in">
                                                <div className="bg-green-100 p-2 rounded-full mr-3">
                                                    <FaUser className="text-green-600 text-xl" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-green-800">{verifiedUser.name}</p>
                                                    <p className="text-xs text-green-600">{verifiedUser.phone_number}</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <FaCheck className="text-green-500 text-lg" />
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <InputLabel htmlFor="amount" value="Amount (₦)" />
                                            <TextInput
                                                id="amount"
                                                type="number"
                                                className="mt-1 block w-full border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition rounded-lg"
                                                value={data.amount}
                                                onChange={(e) => setData('amount', e.target.value)}
                                                required
                                                min="100"
                                                placeholder="Enter amount"
                                            />
                                            <InputError message={errors.amount} className="mt-2" />
                                        </div>
                                        <div className="flex items-center justify-between mt-8">
                                            <Link
                                                href={route('wallet')}
                                                className="inline-flex items-center px-4 py-2 bg-base-100  border border-gray-300 rounded-lg font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
                                            >
                                                Cancel
                                            </Link>
                                            <Button
                                                type="submit"
                                                processing={processing}
                                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 font-semibold text-xs uppercase tracking-widest shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
                                            >
                                                {!verifiedUser ? 'Verify Recipient' : 'Continue to Transfer'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>


                        </div>
                    </div>
                </div>
            </div>

            {/* PIN Verification Modal */}
            <Modal show={showPinModal} onClose={() => setShowPinModal(false)}>
                <div className="p-8">
                    <h2 className="text-xl font-bold mb-4 text-blue-700">Enter Your PIN</h2>
                    <p className="text-sm text-blue-500 mb-6">
                        Please enter your 4-digit PIN to confirm this transfer of ₦{data.amount} to {verifiedUser?.name}.
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
                                className="w-14 h-14 text-center text-2xl border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-blue-50"
                                required
                            />
                        ))}
                    </div>
                    {pinError && (
                        <div className="text-red-500 text-sm text-center mb-4">{pinError}</div>
                    )}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowPinModal(false)}
                            className="px-4 py-2 bg-base-100  border border-gray-300 rounded-lg font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handlePinSubmit}
                            disabled={verifyingPin || pin.some(digit => digit === '')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-xs uppercase tracking-widest hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 transition"
                        >
                            {verifyingPin ? 'Processing...' : 'Confirm Transfer'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Save Beneficiary Modal */}
            <Modal show={showSaveBeneficiaryModal} onClose={() => setShowSaveBeneficiaryModal(false)}>
                <div className="p-8">
                    <h2 className="text-xl font-bold mb-4 text-blue-700">Save as Beneficiary</h2>
                    <p className="text-sm text-blue-500 mb-6">
                        Save this recipient as a beneficiary for quick transfers in the future.
                    </p>
                    <div className="mb-6">
                        <InputLabel htmlFor="beneficiary_name" value="Beneficiary Name" />
                        <TextInput
                            id="beneficiary_name"
                            type="text"
                            className="mt-1 block w-full"
                            value={saveBeneficiaryName}
                            onChange={(e) => setSaveBeneficiaryName(e.target.value)}
                            placeholder={verifiedUser?.name}
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowSaveBeneficiaryModal(false)}
                            className="px-4 py-2 bg-base-100  border border-gray-300 rounded-lg font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveBeneficiary}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-xs uppercase tracking-widest hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
                        >
                            Save Beneficiary
                        </button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
