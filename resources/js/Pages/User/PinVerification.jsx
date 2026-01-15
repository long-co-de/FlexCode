import { useState, useRef, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FaLock, FaShieldAlt, FaExclamationTriangle, FaClock, FaCheckCircle } from 'react-icons/fa';

export default function PinVerification() {
    const { auth } = usePage().props;
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
                localStorage.removeItem('pinLockoutEndTime');
                localStorage.removeItem('pinAttempts');
            }
        }

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
        if (!isLocked) {
            inputRefs[0].current?.focus();
        }
    }, [isLocked]);

    const handlePinChange = (index, value) => {
        const newValue = value.replace(/[^0-9]/g, '').slice(0, 1);
        const newPin = [...pin];
        newPin[index] = newValue;

        if (newValue && index < 3) {
            inputRefs[index + 1].current.focus();
        }
        
        setPin(newPin);

        if (newValue && index === 3) {
            const pinString = newPin.join('');
            if (pinString.length === 4) {
                handleSubmitAutomatically(pinString);
            }
        }

        return newPin;
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (index > 0 && !pin[index]) {
                inputRefs[index - 1].current.focus();
            }
        }
    };

    const handleSubmitAutomatically = (pinString) => {
        setData('pin', pinString);
        // Delay slightly for better UX
        setTimeout(() => {
            post(route('pin.verify'), {
                onSuccess: () => {
                    setAttempts(0);
                    localStorage.removeItem('pinAttempts');
                },
                onError: () => {
                    handleError();
                }
            });
        }, 300);
    };

    const handleError = () => {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('pinAttempts', newAttempts.toString());

        if (newAttempts >= 5) {
            const lockoutEnd = Date.now() + (30 * 60 * 1000);
            setIsLocked(true);
            setLockoutEndTime(lockoutEnd);
            localStorage.setItem('pinLockoutEndTime', lockoutEnd.toString());
        } else {
            setPin(['', '', '', '']);
            setTimeout(() => {
                inputRefs[0].current?.focus();
            }, 100);
        }
        reset('pin');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLocked) return;
        
        const pinString = pin.join('');
        if (pinString.length !== 4) return;

        handleSubmitAutomatically(pinString);
    };

    return (
        <AppLayout user={auth.user}>
            <Head title="Verify PIN" />

            <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
                <div className="max-w-md w-full">
                    {/* Security Icon Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-50 rounded-[2rem] text-sky-500 mb-6 border border-sky-100 shadow-sm">
                            <FaShieldAlt className="text-3xl" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">Security Check</h2>
                        <p className="text-slate-500 font-medium">Please enter your 4-digit PIN to authorize access.</p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                        {isLocked ? (
                            <div className="space-y-6 text-center py-4">
                                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                                    <FaLock className="text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2">Account Locked</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Too many incorrect attempts. For your security, access has been restricted.
                                    </p>
                                </div>
                                
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Wait for</p>
                                    <div className="flex items-center justify-center gap-2 text-2xl font-black text-slate-800">
                                        <FaClock className="text-sky-500 text-lg" />
                                        <span className="font-mono">{timeRemaining}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {attempts > 0 && (
                                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 animate-shake">
                                        <FaExclamationTriangle className="text-rose-500 mt-0.5 flex-shrink-0" />
                                        <div className="text-xs">
                                            <p className="font-bold text-rose-800">Incorrect PIN</p>
                                            <p className="text-rose-600 font-medium">{5 - attempts} attempts remaining before lockout.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between gap-4">
                                    {pin.map((digit, index) => (
                                        <input
                                            key={index}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength="1"
                                            ref={inputRefs[index]}
                                            value={digit}
                                            disabled={processing}
                                            onChange={(e) => handlePinChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            className={`w-full h-16 md:h-20 text-center text-3xl font-black rounded-2xl border-2 transition-all outline-none
                                                ${digit 
                                                    ? 'border-sky-500 bg-sky-50 text-slate-800' 
                                                    : 'border-slate-100 bg-slate-50 text-slate-400 focus:border-sky-200'
                                                } ${errors.pin ? 'border-rose-300 bg-rose-50' : ''}`}
                                            required
                                        />
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    disabled={!pin.every(digit => digit !== '') || processing}
                                    className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <FaLock className="text-xs" />
                                            Verify PIN
                                        </>
                                    )}
                                </button>
                                
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                        <FaShieldAlt className="text-sky-500" />
                                        End-to-end encrypted
                                    </p>
                                </div>
                            </form>
                        )}
                        
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

