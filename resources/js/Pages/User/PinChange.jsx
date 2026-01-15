import { useState, useRef } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FaLock, FaShieldAlt, FaArrowRight, FaCheckCircle, FaExclamationTriangle, FaHistory } from 'react-icons/fa';

export default function PinChange() {
    const { auth } = usePage().props;
    const [currentPin, setCurrentPin] = useState(['', '', '', '']);
    const [newPin, setNewPin] = useState(['', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
    const [step, setStep] = useState(1);
    
    const currentPinRefs = [useRef(), useRef(), useRef(), useRef()];
    const newPinRefs = [useRef(), useRef(), useRef(), useRef()];
    const confirmPinRefs = [useRef(), useRef(), useRef(), useRef()];
    
    const { data, setData, patch, processing, errors, reset } = useForm({
        current_pin: '',
        pin: '',
        pin_confirmation: '',
    });

    const handlePinChange = (index, value, pinType) => {
        const newValue = value.replace(/[^0-9]/g, '').slice(0, 1);
        
        if (pinType === 'current') {
            const newCurrentPin = [...currentPin];
            newCurrentPin[index] = newValue;
            setCurrentPin(newCurrentPin);
            if (newValue && index < 3) currentPinRefs[index + 1].current.focus();
        } else if (pinType === 'new') {
            const newPinValue = [...newPin];
            newPinValue[index] = newValue;
            setNewPin(newPinValue);
            if (newValue && index < 3) newPinRefs[index + 1].current.focus();
        } else if (pinType === 'confirm') {
            const newConfirmPin = [...confirmPin];
            newConfirmPin[index] = newValue;
            setConfirmPin(newConfirmPin);
            if (newValue && index < 3) confirmPinRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (e, index, pinType) => {
        if (e.key === 'Backspace') {
            if (pinType === 'current' && index > 0 && !currentPin[index]) currentPinRefs[index - 1].current.focus();
            else if (pinType === 'new' && index > 0 && !newPin[index]) newPinRefs[index - 1].current.focus();
            else if (pinType === 'confirm' && index > 0 && !confirmPin[index]) confirmPinRefs[index - 1].current.focus();
        }
    };

    const handleContinue = (e) => {
        if (e) e.preventDefault();
        if (currentPin.every(digit => digit !== '')) {
            setStep(2);
            setTimeout(() => newPinRefs[0].current?.focus(), 100);
        }
    };

    const handleNewPinContinue = (e) => {
        if (e) e.preventDefault();
        if (newPin.every(digit => digit !== '')) {
            setStep(3);
            setTimeout(() => confirmPinRefs[0].current?.focus(), 100);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const currentPinString = currentPin.join('');
        const newPinString = newPin.join('');
        const confirmPinString = confirmPin.join('');
        
        if (newPinString !== confirmPinString) {
            reset('pin_confirmation');
            setConfirmPin(['', '', '', '']);
            setTimeout(() => confirmPinRefs[0].current?.focus(), 100);
            return;
        }
        
        setData({
            current_pin: currentPinString,
            pin: newPinString,
            pin_confirmation: confirmPinString,
        });
        
        patch(route('pin.update'), {
            onError: (errors) => {
                if (errors.current_pin) {
                    setStep(1);
                    setCurrentPin(['', '', '', '']);
                    setTimeout(() => currentPinRefs[0].current?.focus(), 100);
                }
            }
        });
    };

    const renderStepHeader = () => {
        switch(step) {
            case 1: return { icon: <FaLock />, title: "Current PIN", desc: "Enter your current 4-digit security PIN." };
            case 2: return { icon: <FaShieldAlt />, title: "New PIN", desc: "Choose a new 4-digit PIN for your account." };
            case 3: return { icon: <FaCheckCircle />, title: "Confirm PIN", desc: "Re-enter your new PIN to confirm." };
        }
    };

    const header = renderStepHeader();

    return (
        <AppLayout user={auth.user}>
            <Head title="Change PIN" />
            
            <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-50 rounded-[2rem] text-sky-500 mb-6 border border-sky-100 shadow-sm transition-transform hover:scale-110">
                            <span className="text-3xl">{header.icon}</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">{header.title}</h2>
                        <p className="text-slate-500 font-medium">{header.desc}</p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-sky-500' : 'w-2 bg-slate-100'}`}></div>
                            ))}
                        </div>

                        <form onSubmit={step === 1 ? handleContinue : step === 2 ? handleNewPinContinue : handleSubmit} className="space-y-8">
                            <div className="flex justify-between gap-4">
                                {(step === 1 ? currentPin : step === 2 ? newPin : confirmPin).map((digit, index) => (
                                    <input
                                        key={index}
                                        type="password"
                                        inputMode="numeric"
                                        maxLength="1"
                                        ref={step === 1 ? currentPinRefs[index] : step === 2 ? newPinRefs[index] : confirmPinRefs[index]}
                                        value={digit}
                                        onChange={(e) => handlePinChange(index, e.target.value, step === 1 ? 'current' : step === 2 ? 'new' : 'confirm')}
                                        onKeyDown={(e) => handleKeyDown(e, index, step === 1 ? 'current' : step === 2 ? 'new' : 'confirm')}
                                        className={`w-full h-16 md:h-20 text-center text-3xl font-black rounded-2xl border-2 transition-all outline-none
                                            ${digit 
                                                ? 'border-sky-500 bg-sky-50 text-slate-800' 
                                                : 'border-slate-100 bg-slate-50 text-slate-400 focus:border-sky-200'
                                            }`}
                                        required
                                    />
                                ))}
                            </div>
                            
                            {(errors.current_pin || errors.pin || errors.pin_confirmation) && (
                                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
                                    <FaExclamationTriangle className="text-rose-500 flex-shrink-0" />
                                    <p className="text-[10px] font-bold text-rose-800">{errors.current_pin || errors.pin || errors.pin_confirmation}</p>
                                </div>
                            )}
                            
                            <div className="space-y-4">
                                <button
                                    type="submit"
                                    disabled={!(step === 1 ? currentPin : step === 2 ? newPin : confirmPin).every(digit => digit !== '') || processing}
                                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            {step === 3 ? 'Change PIN' : 'Continue'}
                                            <FaArrowRight className="text-[10px]" />
                                        </>
                                    )}
                                </button>

                                {step === 1 && (
                                    <Link
                                        href={route('pin.reset.show')}
                                        className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-500 transition-colors"
                                    >
                                        <FaHistory className="text-[8px]" />
                                        Forgot PIN? Reset with Password
                                    </Link>
                                )}

                                {step > 1 && (
                                    <button 
                                        type="button"
                                        onClick={() => setStep(step - 1)}
                                        className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        Go Back
                                    </button>
                                )}
                            </div>
                        </form>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
