import { useState, useRef, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import ResponsiveModal from '@/Components/ResponsiveModal';
import InputError from '@/Components/InputError';
import Button from '@/Components/Button';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';

export default function PinVerificationModal({ 
    show = false, 
    onClose = () => {}, 
    onPinVerified = () => {},
    title = "Enter Your PIN",
    description = "Please enter your 4-digit PIN to continue with this transaction."
}) {
    const [pin, setPin] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showResetForm, setShowResetForm] = useState(false);
    const [password, setPassword] = useState('');
    const [newPin, setNewPin] = useState('');
    const [newPinConfirmation, setNewPinConfirmation] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetProcessing, setResetProcessing] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];
    
    useEffect(() => {
        if (show) {
            // Reset state when modal is opened
            setPin(['', '', '', '']);
            setError('');
            setProcessing(false);
            setShowResetForm(false);
            setPassword('');
            setNewPin('');
            setNewPinConfirmation('');
            setResetError('');
            setResetProcessing(false);
            setResetSuccess(false);
            
            // Focus on first input when modal is opened
            setTimeout(() => {
                if (inputRefs[0].current) {
                    inputRefs[0].current.focus();
                }
            }, 100);
        }
    }, [show]);
    
    const handlePinChange = (index, value) => {
        const newValue = value.replace(/[^0-9]/g, '').slice(0, 1);
        const newPin = [...pin];
        newPin[index] = newValue;
        setPin(newPin);
        
        // Clear any previous errors
        if (error) {
            setError('');
        }
        
        // Move to next input if value is entered
        if (newValue && index < 3) {
            inputRefs[index + 1].current.focus();
        }
        
        // Submit automatically when all digits are filled
        if (newValue && index === 3) {
            // Make sure we have all 4 digits before submitting
            const completePin = [...newPin.slice(0, 3), newValue];
            if (completePin.every(digit => digit !== '')) {
                setTimeout(() => {
                    handleSubmit(completePin.join(''));
                }, 300);
            }
        }
    };
    
    const handleKeyDown = (e, index) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            if (index > 0 && !pin[index]) {
                inputRefs[index - 1].current.focus();
            }
        }
    };
    
    const handleSubmit = (pinString = null) => {
        // If pinString is not provided, use the current pin state
        const pinToSubmit = pinString || pin.join('');
        
        // Validate PIN before submission
        if (!pinToSubmit || pinToSubmit.length !== 4 || !/^\d{4}$/.test(pinToSubmit)) {
            setError('Please enter a valid 4-digit PIN');
            return;
        }
        
        setProcessing(true);
        
        // Call the API to verify the PIN
        fetch('/api/pin/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
            body: JSON.stringify({ pin: pinToSubmit }),
        })
        .then(response => response.json())
        .then(data => {
            setProcessing(false);
            
            if (data.message === 'PIN verified successfully.') {
                // PIN verified successfully
                onPinVerified(pinToSubmit);
            } else {
                // PIN verification failed
                setError(data.message || 'Invalid PIN. Please try again.');
                setPin(['', '', '', '']);
                inputRefs[0].current.focus();
            }
        })
        .catch(error => {
            setProcessing(false);
            setError('An error occurred while verifying your PIN. Please try again.');
            setPin(['', '', '', '']);
            inputRefs[0].current.focus();
        });
    };
    
    const handleResetPin = (e) => {
        e.preventDefault();
        
        if (newPin !== newPinConfirmation) {
            setResetError('PIN confirmation does not match.');
            return;
        }
        
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            setResetError('PIN must be 4 digits.');
            return;
        }
        
        setResetProcessing(true);
        
        // Call the API to reset PIN using password
        fetch('/api/pin/reset-with-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
            body: JSON.stringify({ 
                password: password,
                pin: newPin,
                pin_confirmation: newPinConfirmation
            }),
        })
        .then(response => response.json())
        .then(data => {
            setResetProcessing(false);
            
            if (data.message === 'PIN reset successfully.') {
                // PIN reset successfully
                setResetSuccess(true);
                setResetError('');
                
                // After 2 seconds, go back to PIN verification
                setTimeout(() => {
                    setShowResetForm(false);
                    setPin(['', '', '', '']);
                    setError('');
                    
                    // Focus on first input
                    setTimeout(() => {
                        if (inputRefs[0].current) {
                            inputRefs[0].current.focus();
                        }
                    }, 100);
                }, 2000);
            } else {
                // PIN reset failed
                setResetError(data.message || 'Failed to reset PIN. Please check your password and try again.');
            }
        })
        .catch(error => {
            setResetProcessing(false);
            setResetError('An error occurred while resetting your PIN. Please try again.');
        });
    };
    
    return (
        <ResponsiveModal show={show} onClose={onClose} maxWidth="sm">
            <div className="p-6">
                {renderContent()}
            </div>
        </ResponsiveModal>
    );
    
    function renderContent() {
        if (showResetForm) {
            return (
                <>
                    <h2 className="text-lg font-medium igg-900 dark:igg-100">
                        Reset Your PIN
                    </h2>
                    
                    <p className="mt-1 text-sm igg-600 dark:igg-400">
                        Enter your account password and a new 4-digit PIN.
                    </p>
                    
                    {resetSuccess ? (
                        <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-md">
                            PIN reset successfully! Redirecting...
                        </div>
                    ) : (
                        <form onSubmit={handleResetPin} className="mt-6 space-y-4">
                            <div>
                                <InputLabel htmlFor="password" value="Account Password" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                    autoComplete="current-password"
                                    disabled={resetProcessing}
                                />
                            </div>
                            
                            <div>
                                <InputLabel htmlFor="new-pin" value="New PIN" />
                                <TextInput
                                    id="new-pin"
                                    type="password"
                                    inputMode="numeric"
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                    className="mt-1 block w-full"
                                    required
                                    maxLength="4"
                                    placeholder="4-digit PIN"
                                    disabled={resetProcessing}
                                />
                            </div>
                            
                            <div>
                                <InputLabel htmlFor="new-pin-confirmation" value="Confirm New PIN" />
                                <TextInput
                                    id="new-pin-confirmation"
                                    type="password"
                                    inputMode="numeric"
                                    value={newPinConfirmation}
                                    onChange={(e) => setNewPinConfirmation(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                    className="mt-1 block w-full"
                                    required
                                    maxLength="4"
                                    placeholder="Confirm 4-digit PIN"
                                    disabled={resetProcessing}
                                />
                            </div>
                            
                            {resetError && (
                                <InputError message={resetError} className="mt-2" />
                            )}
                            
                            <div className="flex items-center justify-between mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowResetForm(false)}
                                    className="text-sm igg-600 hover:igg-900"
                                    disabled={resetProcessing}
                                >
                                    Back to PIN Entry
                                </button>
                                
                                <Button
                                    type="submit"
                                    disabled={resetProcessing || !password || !newPin || !newPinConfirmation}
                                    processing={resetProcessing}
                                >
                                    Reset PIN
                                </Button>
                            </div>
                        </form>
                    )}
                </>
            ) else {
                return (
                    <>
                        <h2 className="text-lg font-medium igg-900 dark:igg-100">
                            {title}
                        </h2>
                        
                        <p className="mt-1 text-sm igg-600 dark:igg-400">
                            {description}
                        </p>
                        
                        <div className="mt-6">
                            <div className="flex justify-center space-x-3">
                                {pin.map((digit, index) => (
                                    <input
                                        key={index}
                                        type="password"
                                        inputMode="numeric"
                                        maxLength="1"
                                        ref={inputRefs[index]}
                                        value={digit}
                                        onChange={(e) => handlePinChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        className="w-14 h-14 text-center text-xl border-gray-300 dark:border-gray-700 dark:bg-base-200 mm--900 dark:igg-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        disabled={processing}
                                        required
                                    />
                                ))}
                            </div>
                            
                            {error && (
                                <InputError message={error} className="mt-2" />
                            )}
                            
                            <div className="mt-4 text-center">
                                <div className="flex flex-col space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowResetForm(true)}
                                        className="text-sm text-indigo-600 hover:text-indigo-900"
                                    >
                                        Forgot PIN? Reset with Password
                                    </button>
                                    <Link
                                        href={route('pin.reset.show')}
                                        className="text-sm igg-600 hover:igg-900"
                                        onClick={() => onClose()}
                                    >
                                        Go to PIN Reset Page
                                    </Link>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={onClose}
                                className="mr-3"
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            
                            <Button
                                onClick={() => handleSubmit()}
                                disabled={!pin.every(digit => digit !== '') || processing}
                                className="ml-3"
                                processing={processing}
                            >
                                {processing ? 'Verifying...' : 'Verify PIN'}
                            </Button>
                        </div>
                    </>
                );
            }
        }
    }
}