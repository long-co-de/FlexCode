import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useMemo, useState, useEffect } from 'react';
import PaystackWrapper from '@/Components/PaystackWrapper';
import axios from 'axios';
import {
    ArrowPathIcon,
    ArrowRightIcon,
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    CreditCardIcon,
    ExclamationTriangleIcon,
    ShieldCheckIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

const LinkCard = ({
    paystackPublicKey,
    userEmail,
    userPhoneNumber = '',
    networks = [],
    returnUrl = null,
    initialCard = null,
    initialReward = null,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isClaimingReward, setIsClaimingReward] = useState(false);
    const [error, setError] = useState('');
    const [cardDetails, setCardDetails] = useState(initialCard);
    const [reward, setReward] = useState(initialReward);
    const [selectedNetworkId, setSelectedNetworkId] = useState(initialReward?.network_id ? String(initialReward.network_id) : '');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    
    // Mobile app-like states
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const loadingSteps = [
        { message: 'Initializing secure connection...', icon: '🔒' },
        { message: 'Verifying payment details...', icon: '✓' },
        { message: 'Processing your card...', icon: '💳' },
        { message: 'Linking card to your account...', icon: '🔗' },
        { message: 'Almost there...', icon: '✨' },
    ];

    const activeRewardMessage = useMemo(() => {
        if (!reward) return null;
        if (reward.last_error) return reward.last_error;
        return reward.message || null;
    }, [reward]);

    // Auto-advance loading steps
    useEffect(() => {
        let interval;
        if (showLoadingOverlay && loadingStep < loadingSteps.length - 1) {
            interval = setInterval(() => {
                setLoadingStep(prev => {
                    const next = prev + 1;
                    setLoadingMessage(loadingSteps[next].message);
                    return next;
                });
            }, 1800);
        }
        return () => clearInterval(interval);
    }, [showLoadingOverlay, loadingStep]);

    const redirectUser = (delay = 2500) => {
        setTimeout(() => {
            window.location.href = returnUrl || route('dashboard');
        }, delay);
    };

    const showToast = (message, isError = true) => {
        setToastMessage(message);
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 4000);
    };

    const startMobileLoading = () => {
        setLoadingStep(0);
        setLoadingMessage(loadingSteps[0].message);
        setShowLoadingOverlay(true);
    };

    const stopMobileLoading = () => {
        setShowLoadingOverlay(false);
        setLoadingStep(0);
    };

    const showSuccess = () => {
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 3000);
    };

    const handlePaystackSuccess = async (response) => {
        startMobileLoading();
        setError('');

        try {
            const { data: result } = await axios.post(route('cards.link-from-payment'), {
                reference: response.reference,
                status: response.status,
            });

            if (!result.success) {
                stopMobileLoading();
                showToast(result.message || 'Failed to link card. Please try again.');
                return;
            }

            setCardDetails(result.data.card);
            setReward(result.data.reward || null);
            
            stopMobileLoading();
            showSuccess();

            if (!result.data.reward?.requires_network_selection) {
                setTimeout(() => redirectUser(), 2000);
            }
        } catch (err) {
            console.error('Card linking error:', err);
            stopMobileLoading();
            showToast('An error occurred while linking your card. Please try again.');
        }
    };

    const handlePaystackClose = () => {
        showToast('Card linking cancelled. Please try again.');
    };

    const handleClaimReward = async () => {
        if (!selectedNetworkId) {
            showToast('Select your network to receive the N50 airtime reward.');
            return;
        }

        setIsClaimingReward(true);
        setError('');

        try {
            const { data: result } = await axios.post(route('cards.link-reward'), {
                network_id: selectedNetworkId,
            });

            if (!result.success) {
                setReward(result.data?.reward || reward);
                showToast(result.message || 'Failed to send your airtime reward. Please try again.');
                setIsClaimingReward(false);
                return;
            }

            setReward(result.data.reward || reward);
            setIsClaimingReward(false);
            showSuccess();
            setTimeout(() => redirectUser(2200), 1500);
        } catch (err) {
            console.error('Card reward error:', err);
            setReward(err.response?.data?.data?.reward || reward);
            showToast(err.response?.data?.message || 'An error occurred while sending your airtime reward.');
            setIsClaimingReward(false);
        }
    };

    const handleDeleteExpiredCard = async () => {
        if (!cardDetails?.id) return;

        if (!window.confirm('Are you sure you want to delete this card? You will need to link a new card to continue borrowing.')) {
            return;
        }

        setIsDeleting(true);
        setError('');

        try {
            const { data: result } = await axios.delete(route('cards.delete-expired', cardDetails.id));

            if (result.success) {
                setDeleteSuccess(true);
                setCardDetails(null);
                showSuccess();
                setTimeout(() => {
                    const url = returnUrl || route('cards.link');
                    window.location.href = url;
                }, 2000);
            } else {
                showToast(result.message || 'Failed to delete card.');
                setIsDeleting(false);
            }
        } catch (err) {
            console.error('Card deletion error:', err);
            showToast('An error occurred while deleting your card.');
            setIsDeleting(false);
        }
    };

    const renderRewardPanel = () => {
        if (!reward?.eligible) {
            return (
                <div className="bg-base-200 border border-base-300 rounded-2xl p-5">
                    <p className="text-sm font-semibold text-base-content/80">
                        {reward?.message || 'Your first-card airtime reward has already been used.'}
                    </p>
                </div>
            );
        }

        if (reward.status === 'blocked_missing_phone') {
            return (
                <div className="bg-warning/10 border border-warning/20 rounded-2xl p-5 space-y-3">
                    <p className="text-sm font-bold text-warning-content">N50 airtime reward is waiting for you.</p>
                    <p className="text-sm text-warning-content/80">
                        Add a valid phone number to your profile, then come back to finish the reward claim.
                    </p>
                    <button
                        type="button"
                        onClick={() => redirectUser(0)}
                        className="btn btn-warning btn-sm"
                    >
                        Continue
                    </button>
                </div>
            );
        }

        if (reward.status === 'claimed') {
            return (
                <div className="bg-success/10 border border-success/20 rounded-2xl p-5 space-y-2">
                    <p className="text-sm font-bold text-success-content">N50 airtime sent successfully.</p>
                    <p className="text-sm text-success-content/80">
                        {reward.phone_number ? `Delivered to ${reward.phone_number}` : activeRewardMessage}
                    </p>
                </div>
            );
        }

        return (
            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-5">
                <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">First Link Reward</p>
                    <h3 className="text-xl font-extrabold text-base-content">Claim your N50 airtime</h3>
                    <p className="text-sm text-base-content/70">
                        We will send the reward to <span className="font-bold text-base-content">{reward.phone_number || userPhoneNumber || 'your saved phone number'}</span>.
                    </p>
                    {activeRewardMessage && (
                        <p className={`text-sm ${reward.can_retry ? 'text-error' : 'text-primary'}`}>
                            {activeRewardMessage}
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-bold text-base-content/80">Select Network</label>
                    <select
                        value={selectedNetworkId}
                        onChange={(e) => setSelectedNetworkId(e.target.value)}
                        className="select select-bordered w-full"
                    >
                        <option value="">Choose network</option>
                        {networks.map((network) => (
                            <option key={network.id} value={network.id}>
                                {network.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={handleClaimReward}
                    disabled={isClaimingReward}
                    className="btn btn-primary w-full"
                >
                    {isClaimingReward ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Sending Reward...
                        </>
                    ) : reward.can_retry ? 'Retry N50 Airtime Reward' : 'Send N50 Airtime'}
                </button>
            </div>
        );
    };

    return (
        <AppLayout>
            <Head title="Link Payment Card - BorrowLite" />

            <div className="min-h-screen bg-base-200 py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    {cardDetails ? (
                        <div className="card bg-base-100 shadow-xl border border-base-300 animate-in fade-in zoom-in duration-500">
                            <div className="bg-gradient-to-br from-success to-success/80 px-8 py-16 text-center rounded-t-2xl">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl mb-6 ring-8 ring-white/10">
                                    <CheckCircleIcon className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-3xl font-extrabold text-white mb-3">Card Linked Successfully!</h1>
                                <p className="text-success-content/90 font-medium">Your card is now ready for borrowing and repayments.</p>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="bg-base-200 rounded-3xl p-8 border border-base-300">
                                    <h3 className="text-sm font-bold text-base-content/50 uppercase tracking-widest mb-6">Linked Card Details</h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Card Type', value: cardDetails.card_type, icon: CreditCardIcon },
                                            { label: 'Card Number', value: `**** **** **** ${cardDetails.last_four}`, icon: CreditCardIcon },
                                            { label: 'Bank', value: cardDetails.bank, icon: BanknotesIcon },
                                            cardDetails.expires_at && {
                                                label: 'Expires',
                                                value: new Date(cardDetails.expires_at).toLocaleDateString(),
                                                icon: ClockIcon,
                                            },
                                        ].filter(Boolean).map((item, i) => (
                                            <div key={i} className="flex justify-between items-center py-3 border-b border-base-300 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="w-5 h-5 text-base-content/40" />
                                                    <span className="text-base-content/70 font-medium">{item.label}</span>
                                                </div>
                                                <span className="font-bold text-base-content capitalize">{item.value}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-4">
                                            <span className="text-base-content/70 font-medium">Status</span>
                                            <span className="badge badge-success gap-2">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {cardDetails.is_expired && (
                                    <div className="alert alert-error shadow-lg">
                                        <ExclamationTriangleIcon className="h-6 w-6" />
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold">Card Expired</h4>
                                            <p className="text-sm opacity-90">
                                                Your card has expired and is no longer available for borrowing. Please delete this card and link a new one to continue.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleDeleteExpiredCard}
                                            disabled={isDeleting}
                                            className="btn btn-error btn-sm"
                                        >
                                            {isDeleting ? (
                                                <span className="loading loading-spinner loading-sm"></span>
                                            ) : (
                                                <TrashIcon className="w-5 h-5" />
                                            )}
                                            {isDeleting ? 'Deleting...' : 'Delete Card'}
                                        </button>
                                    </div>
                                )}

                                <div className="alert alert-warning shadow-lg">
                                    <BanknotesIcon className="w-5 h-5" />
                                    <span className="text-sm font-semibold">
                                        N100 card-linking fee has been charged. It is not refunded.
                                    </span>
                                </div>

                                {reward && renderRewardPanel()}

                                <div className="text-center space-y-4">
                                    {deleteSuccess ? (
                                        <>
                                            <div className="flex items-center justify-center gap-3 text-success">
                                                <CheckCircleIcon className="w-6 h-6" />
                                                <p className="text-sm font-medium">Card deleted successfully!</p>
                                            </div>
                                            <p className="text-sm text-base-content/60">Redirecting...</p>
                                        </>
                                    ) : reward?.requires_network_selection ? null : (
                                        <>
                                            <div className="flex items-center justify-center gap-3 text-base-content/40">
                                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                <p className="text-sm font-medium italic">Redirecting you back safely...</p>
                                            </div>
                                            <div className="flex justify-center">
                                                <span className="loading loading-spinner loading-lg text-primary"></span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card bg-base-100 shadow-xl border border-base-300">
                            <div className="bg-gradient-to-br from-primary to-primary/80 px-8 py-16 text-center relative overflow-hidden rounded-t-2xl">
                                <CreditCardIcon className="absolute -top-10 -right-10 w-48 h-48 text-white/10 -rotate-12" />
                                <div className="relative z-10">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl mb-6 ring-8 ring-white/10">
                                        <CreditCardIcon className="w-10 h-10 text-white" />
                                    </div>
                                    <h1 className="text-4xl font-extrabold text-white mb-3">Link Your Card</h1>
                                    <p className="text-primary-content/90 font-medium">Pay N100, link your first card, and unlock N50 airtime reward.</p>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-6">
                                    <h2 className="text-sm font-bold text-base-content/50 uppercase tracking-widest">Why Link a Card?</h2>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {[
                                            { title: 'Instant Access', desc: 'Borrow airtime and data faster.', icon: CheckCircleIcon },
                                            { title: 'Auto-Pay', desc: 'Enable secure automated repayments.', icon: ArrowPathIcon },
                                            { title: 'First Link Reward', desc: 'Get N50 airtime after your first successful link.', icon: BanknotesIcon },
                                            { title: 'Bank-Grade', desc: 'Protected with Paystack tokenization.', icon: ShieldCheckIcon },
                                        ].map((item, idx) => (
                                            <div key={idx} className="card bg-base-200 hover:bg-base-300 transition-all cursor-pointer">
                                                <div className="card-body p-4">
                                                    <item.icon className="h-6 w-6 text-primary mb-3" />
                                                    <p className="text-sm font-bold text-base-content mb-1">{item.title}</p>
                                                    <p className="text-xs text-base-content/60 leading-relaxed">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="alert alert-error shadow-lg animate-in slide-in-from-top-2">
                                        <ExclamationTriangleIcon className="h-5 w-5" />
                                        <span className="text-sm font-semibold">{error}</span>
                                    </div>
                                )}

                                <div className="card bg-base-200 shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <ShieldCheckIcon className="w-12 h-12" />
                                    </div>
                                    <div className="card-body">
                                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-primary">Secure Process</h3>
                                        <ul className="space-y-3">
                                            {[
                                                'Enter card details via Paystack',
                                                'Approve N100 card-linking fee',
                                                'First successful link unlocks N50 airtime',
                                                userPhoneNumber ? `Reward goes to ${userPhoneNumber} after network confirmation` : 'Reward goes to your saved phone number after network confirmation',
                                            ].map((step, i) => (
                                                <li key={i} className="flex items-center gap-3 text-xs font-medium text-base-content/70">
                                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary">
                                                        {i + 1}
                                                    </div>
                                                    {step}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="alert alert-warning shadow-lg">
                                    <p className="text-sm font-bold">Important</p>
                                    <p className="text-sm">
                                        Linking a card costs N100. The fee is not refunded.
                                    </p>
                                </div>

                                <div className="space-y-6 pt-2">
                                    <PaystackWrapper
                                        publicKey={paystackPublicKey}
                                        email={userEmail}
                                        amount={100 * 100}
                                        onSuccess={handlePaystackSuccess}
                                        onClose={handlePaystackClose}
                                        className="btn btn-primary w-full"
                                        text={
                                            <>
                                                Pay N100 and Link Card
                                                <ArrowRightIcon className="w-5 h-5" />
                                            </>
                                        }
                                        metadata={{
                                            custom_fields: [
                                                {
                                                    display_name: 'Purpose',
                                                    variable_name: 'purpose',
                                                    value: 'card_linking',
                                                },
                                            ],
                                        }}
                                    />

                                    <div className="flex flex-col items-center gap-4">
                                        <div className="badge badge-ghost gap-2">
                                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase tracking-tighter">
                                                Verified for {userEmail}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-base-content/40 text-center leading-relaxed">
                                            By linking your card, you agree to our <span className="link link-hover">Terms of Service</span> and authorize
                                            <br /> secure automatic repayments for borrowed credits.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile App-like Loading Overlay */}
            {showLoadingOverlay && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="text-center max-w-sm mx-auto px-8">
                        <div className="relative mb-8">
                            {/* Animated circle */}
                            <div className="w-24 h-24 mx-auto relative">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                                    {loadingSteps[loadingStep]?.icon || '💳'}
                                </div>
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2">
                            {loadingStep === loadingSteps.length - 1 ? 'Finalizing...' : 'Processing'}
                        </h3>
                        
                        <p className="text-sm text-white/70 mb-6">
                            {loadingMessage}
                        </p>
                        
                        {/* Progress dots */}
                        <div className="flex justify-center gap-2">
                            {loadingSteps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        idx <= loadingStep 
                                            ? 'w-6 bg-primary' 
                                            : 'w-1.5 bg-white/20'
                                    }`}
                                />
                            ))}
                        </div>
                        
                        <p className="text-xs text-white/40 mt-6">
                            Please don't close this window
                        </p>
                    </div>
                </div>
            )}

            {/* Success Animation Modal */}
            {showSuccessAnimation && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="text-center animate-in zoom-in-95 duration-500">
                        <div className="w-32 h-32 mx-auto mb-4 relative">
                            <div className="absolute inset-0 bg-success rounded-full animate-ping opacity-20"></div>
                            <div className="relative w-full h-full bg-success rounded-full flex items-center justify-center shadow-lg">
                                <CheckCircleIcon className="w-16 h-16 text-white" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
                        <p className="text-white/80">Card linked successfully</p>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {showErrorToast && (
                <div className="fixed bottom-6 left-4 right-4 z-[220] animate-in slide-in-from-bottom-5 duration-300">
                    <div className="max-w-md mx-auto">
                        <div className="alert alert-error shadow-lg">
                            <ExclamationTriangleIcon className="h-5 w-5" />
                            <span className="text-sm font-medium flex-1">{toastMessage}</span>
                            <button 
                                onClick={() => setShowErrorToast(false)}
                                className="btn btn-ghost btn-sm btn-circle"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
};

export default LinkCard;