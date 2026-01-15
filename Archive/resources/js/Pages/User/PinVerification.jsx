import { useState, useRef, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';

export default function PinVerification() {
    const [pin, setPin] = useState(['', '', '', '']);
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutEndTime, setLockoutEndTime] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        pin: '',
    });

    // Check if there's a saved lockout in localStorage
    useEffect(() => {
        const savedLockoutEnd = localStorage.getItem('pinLockoutEndTime');
        if (savedLockoutEnd) {
            const endTime = parseInt(savedLockoutEnd);
            if (endTime > Date.now()) {
                setIsLocked(true);
                setLockoutEndTime(endTime);
            } else {
                // Lockout period has expired
                localStorage.removeItem('pinLockoutEndTime');
                localStorage.removeItem('pinAttempts');
            }
        }

        // Get saved attempts
        const savedAttempts = localStorage.getItem('pinAttempts');
        if (savedAttempts) {
            setAttempts(parseInt(savedAttempts));
        }
    }, []);

    // Update countdown timer when locked
    useEffect(() => {
        if (!isLocked || !lockoutEndTime) return;

        const timer = setInterval(() => {
            const remaining = Math.max(0, lockoutEndTime - Date.now());

            if (remaining <= 0) {
                setIsLocked(false);
                setLockoutEndTime(null);
                localStorage.removeItem('pinLockoutEndTime');
                localStorage.removeItem('pinAttempts');
                clearInterval(timer);
            } else {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isLocked, lockoutEndTime]);

    useEffect(() => {
        // Focus on first input when component mounts (if not locked)
        if (!isLocked) {
            inputRefs[0].current?.focus();
        }
    }, [isLocked]);

    const handlePinChange = (index, value) => {
        const newValue = value.replace(/[^0-9]/g, '').slice(0, 1);
        const newPin = [...pin];
        newPin[index] = newValue;

        // Move to next input if value is entered
        if (newValue && index < 3) {
            inputRefs[index + 1].current.focus();
        }
        // console.log([newPin, pin])
        setPin(newPin);
        // console.log([newPin, pin])

        // Submit automatically when all digits are filled
        if (newValue && index === 3) {
            setPin(newPin);
            setTimeout(() => {
                handleSubmit({ preventDefault: () => { } });
            }, 300);
        }

        return newPin;
    };

    const handleKeyDown = (e, index) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            if (index > 0 && !pin[index]) {
                inputRefs[index - 1].current.focus();
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        clearErrors('pin');
        const pinString = pin.join('');
        if (pinString.length !== 4) {
            return;
        }

        // Check if account is locked
        if (isLocked) {
            return;
        }

        setData('pin', pinString);
        post(route('pin.verify'), {
            onSuccess: () => {
                // PIN verification successful, redirect will be handled by the controller
                // Reset attempts on successful verification
                setAttempts(0);
                localStorage.removeItem('pinAttempts');
            },
            onError: () => {
                // Increment attempts counter
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                // Save attempts to localStorage
                localStorage.setItem('pinAttempts', newAttempts.toString());

                // Check if we need to lock the account (5 or more attempts)
                if (newAttempts >= 5) {
                    // Lock account for 30 minutes
                    const lockoutEnd = Date.now() + (30 * 60 * 1000); // 30 minutes in milliseconds
                    setIsLocked(true);
                    setLockoutEndTime(lockoutEnd);
                    localStorage.setItem('pinLockoutEndTime', lockoutEnd.toString());
                } else {
                    // Clear PIN inputs
                    setPin(['', '', '', '']);

                    // Focus on first input
                    setTimeout(() => {
                        inputRefs[0].current.focus();
                    }, 100);
                }

                // Reset form errors
                reset('pin');
            }
        });
    };

    return (
        <AppLayout
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Verify PIN</h2>}
        >
            <Head title="Verify PIN" />

            <div className="py-6">
                <div className="max-w-md mx-auto">
                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <h2 className="text-2xl font-semibold mb-6 text-center">
                                Enter Your PIN
                            </h2>

                            <p className="text-center mb-8 iggyy-updatey-600">
                                Please enter your 4-digit PIN to continue.
                            </p>

                            {isLocked ? (
                                <div className="alert alert-error mb-6 flex flex-col items-center p-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-10 w-10 mb-3" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    <h3 className="text-lg font-bold mb-2">Account Temporarily Locked</h3>
                                    <p className="text-center">Too many incorrect PIN attempts. Your account has been locked for 30 minutes.</p>
                                    {timeRemaining && (
                                        <div className="mt-4 text-center">
                                            <p className="text-sm">Time remaining:</p>
                                            <p className="text-2xl font-mono mt-1">{timeRemaining}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {attempts > 0 && (
                                        <div className="alert alert-error mb-6 flex flex-row items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span>Incorrect PIN. Please try again. After 5 incorrect attempts your account will be locked for 30 minutes. ({attempts} failed {attempts === 1 ? 'attempt' : 'attempts'})</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit}>
                                        <div className="flex justify-center gap-4 mb-8">
                                            {pin.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    type="password"
                                                    inputMode="numeric"
                                                    maxLength="1"
                                                    ref={inputRefs[index]}
                                                    value={digit}
                                                    onChange={(e) => {
                                                        const d = handlePinChange(index, e.target.value);
                                                        let dsd = d.join('') ?? '';
                                                        setData('pin',dsd);
                                                    }}
                                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                                    className="android-pin-input input input-bordered w-16 h-16 text-center text-2xl"
                                                    required
                                                />
                                            ))}
                                        </div>

                                        {errors.pin && <InputError message={errors.pin} className="mt-2" />}

                                        <div className="flex justify-center">
                                            <button
                                                type="submit"
                                                disabled={!pin.every(digit => digit !== '') || processing}
                                                className="btn btn-primary"
                                            >
                                                {processing ? 'Verifying...' : 'Verify PIN'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
