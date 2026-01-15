import { useState, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FaLock, FaKey, FaShieldAlt, FaArrowRight, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function PinReset() {
    const { auth } = usePage().props;
    const [newPin, setNewPin] = useState(['', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
    const [step, setStep] = useState(1);
    
    const newPinRefs = [useRef(), useRef(), useRef(), useRef()];
    const confirmPinRefs = [useRef(), useRef(), useRef(), useRef()];
    
    const { data, setData, post, processing, errors, reset, setError } = useForm({
        password: '',
        pin: '',
        pin_confirmation: '',
    });

    const handlePinChange = (index, value, pinType) => {
        const newValue = value.replace(/[^0-9]/g, '').slice(0, 1);
        
        if (pinType === 'new') {
            const newPinValue = [...newPin];
            newPinValue[index] = newValue;
            setNewPin(newPinValue);
            
            if (newValue && index < 3) {
                newPinRefs[index + 1].current.focus();
            }
        } else if (pinType === 'confirm') {
            const newConfirmPin = [...confirmPin];
            newConfirmPin[index] = newValue;
            setConfirmPin(newConfirmPin);
            
            if (newValue && index < 3) {
                confirmPinRefs[index + 1].current.focus();
            }
        }
    };

    const handleKeyDown = (e, index, pinType) => {
        if (e.key === 'Backspace') {
            if (pinType === 'new') {
                if (index > 0 && !newPin[index]) {
                    newPinRefs[index - 1].current.focus();
                }
            } else if (pinType === 'confirm') {
                if (index > 0 && !confirmPin[index]) {
                    confirmPinRefs[index - 1].current.focus();
                }
            }
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (!data.password) {
            setError('password', 'Please enter your account password');
            return;
        }
        setStep(2);
        setTimeout(() => {
            newPinRefs[0].current?.focus();
        }, 100);
    };

    const handleNewPinContinue = (e) => {
        if (e) e.preventDefault();
        if (newPin.every(digit => digit !== '')) {
            setStep(3);
            setTimeout(() => {
                confirmPinRefs[0].current?.focus();
            }, 100);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const newPinString = newPin.join('');
        const confirmPinString = confirmPin.join('');
        
        if (newPinString !== confirmPinString) {
            setError('pin_confirmation', 'PINs do not match. Please try again.');
            setConfirmPin(['', '', '', '']);
            setTimeout(() => {
                confirmPinRefs[0].current?.focus();
            }, 100);
            return;
        }
        
        setData({
            ...data,
            pin: newPinString,
            pin_confirmation: confirmPinString,
        });
        
        post(route('pin.reset-with-password'), {
            onError: (errors) => {
                if (errors.password) {
                    setStep(1);
                }
            }
        });
    };

    const renderStepHeader = () => {
        switch(step) {
            case 1:
                return {
                    icon: <FaKey />,
                    title: "Verify Identity",
                    desc: "Enter your account password to authorize PIN reset."
                };
            case 2:
                return {
                    icon: <FaShieldAlt />,
                    title: "Create New PIN",
                    desc: "Choose a secure 4-digit PIN for your transactions."
                };
            case 3:
                return {
                    icon: <FaCheckCircle />,
                    title: "Confirm PIN",
                    desc: "Re-enter your new PIN to ensure accuracy."
                };
        }
    };

    const header = renderStepHeader();

    return (
        <AppLayout user={auth.user}>
            <Head title="Reset PIN" />
            
            <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
                <div className="max-w-md w-full">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-50 rounded-[2rem] text-sky-500 mb-6 border border-sky-100 shadow-sm transition-transform hover:scale-110">
                            <span className="text-3xl">{header.icon}</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">{header.title}</h2>
                        <p className="text-slate-500 font-medium px-4">{header.desc}</p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                        {/* Progress Dots */}
                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-sky-500' : 'w-2 bg-slate-100'}`}></div>
                            ))}
                        </div>

                        {step === 1 ? (
                            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Account Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
                                            <FaLock className="text-sm" />
                                        </div>
                                        <input
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-sky-500 focus:bg-white transition-all outline-none font-bold"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    {errors.password && (
                                        <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 px-1">
                                            <FaExclamationTriangle className="text-[8px]" /> {errors.password}
                                        </p>
                                    )}
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={!data.password || processing}
                                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    Continue
                                    <FaArrowRight className="text-[10px]" />
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={step === 2 ? handleNewPinContinue : handleSubmit} className="space-y-8">
                                <div className="flex justify-between gap-4">
                                    {(step === 2 ? newPin : confirmPin).map((digit, index) => (
                                        <input
                                            key={index}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength="1"
                                            ref={step === 2 ? newPinRefs[index] : confirmPinRefs[index]}
                                            value={digit}
                                            onChange={(e) => handlePinChange(index, e.target.value, step === 2 ? 'new' : 'confirm')}
                                            onKeyDown={(e) => handleKeyDown(e, index, step === 2 ? 'new' : 'confirm')}
                                            className={`w-full h-16 md:h-20 text-center text-3xl font-black rounded-2xl border-2 transition-all outline-none
                                                ${digit 
                                                    ? 'border-sky-500 bg-sky-50 text-slate-800' 
                                                    : 'border-slate-100 bg-slate-50 text-slate-400 focus:border-sky-200'
                                                }`}
                                            required
                                        />
                                    ))}
                                </div>
                                
                                {(errors.pin || errors.pin_confirmation) && (
                                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
                                        <FaExclamationTriangle className="text-rose-500 flex-shrink-0" />
                                        <p className="text-[10px] font-bold text-rose-800">{errors.pin || errors.pin_confirmation}</p>
                                    </div>
                                )}
                                
                                <button
                                    type="submit"
                                    disabled={!(step === 2 ? newPin : confirmPin).every(digit => digit !== '') || processing}
                                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            {step === 2 ? 'Continue' : 'Reset PIN'}
                                            <FaArrowRight className="text-[10px]" />
                                        </>
                                    )}
                                </button>

                                <button 
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                >
                                    Go Back
                                </button>
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
