import { useState, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FaShieldAlt, FaArrowRight, FaCheckCircle, FaExclamationTriangle, FaLock } from 'react-icons/fa';

export default function PinSetup() {
    const { auth } = usePage().props;
    const [pin, setPin] = useState(['', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
    const [step, setStep] = useState(1);
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];
    const confirmInputRefs = [useRef(), useRef(), useRef(), useRef()];
    
    const { data, setData, post, processing, errors } = useForm({
        pin: '',
    });

    const handlePinChange = (index, value, isPinConfirmation = false) => {
        const newValue = value.replace(/[^0-9]/g, '').slice(0, 1);
        
        if (isPinConfirmation) {
            const newConfirmPin = [...confirmPin];
            newConfirmPin[index] = newValue;
            setConfirmPin(newConfirmPin);
            if (newValue && index < 3) confirmInputRefs[index + 1].current.focus();
        } else {
            const newPinValue = [...pin];
            newPinValue[index] = newValue;
            setPin(newPinValue);
            if (newValue && index < 3) inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (e, index, isPinConfirmation = false) => {
        if (e.key === 'Backspace') {
            if (isPinConfirmation && index > 0 && !confirmPin[index]) confirmInputRefs[index - 1].current.focus();
            else if (!isPinConfirmation && index > 0 && !pin[index]) inputRefs[index - 1].current.focus();
        }
    };

    const handleContinue = () => {
        if (pin.every(digit => digit !== '')) {
            setStep(2);
            setTimeout(() => confirmInputRefs[0].current?.focus(), 100);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const pinString = pin.join('');
        const confirmPinString = confirmPin.join('');
        
        if (pinString !== confirmPinString) {
            setConfirmPin(['', '', '', '']);
            setTimeout(() => confirmInputRefs[0].current?.focus(), 100);
            return;
        }
        
        setData('pin', pinString);
        post(route('pin.setup'));
    };

    return (
        <AppLayout user={auth.user}>
            <Head title="Set Up PIN" />
            
            <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-50 rounded-[2rem] text-sky-500 mb-6 border border-sky-100 shadow-sm transition-transform hover:scale-110">
                            <span className="text-3xl">{step === 1 ? <FaShieldAlt /> : <FaCheckCircle />}</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">
                            {step === 1 ? 'Secure Your Account' : 'Confirm Your PIN'}
                        </h2>
                        <p className="text-slate-500 font-medium">
                            {step === 1 
                                ? 'Create a 4-digit PIN to authorize transactions and secure your wallet.' 
                                : 'Please re-enter your security PIN to confirm.'}
                        </p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2].map(i => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-12 bg-sky-500' : 'w-4 bg-slate-100'}`}></div>
                            ))}
                        </div>

                        <form onSubmit={step === 1 ? handleContinue : handleSubmit} className="space-y-8">
                            <div className="flex justify-between gap-4">
                                {(step === 1 ? pin : confirmPin).map((digit, index) => (
                                    <input
                                        key={index}
                                        type="password"
                                        inputMode="numeric"
                                        maxLength="1"
                                        ref={step === 1 ? inputRefs[index] : confirmInputRefs[index]}
                                        value={digit}
                                        onChange={(e) => handlePinChange(index, e.target.value, step === 2)}
                                        onKeyDown={(e) => handleKeyDown(e, index, step === 2)}
                                        className={`w-full h-16 md:h-20 text-center text-3xl font-black rounded-2xl border-2 transition-all outline-none
                                            ${digit 
                                                ? 'border-sky-500 bg-sky-50 text-slate-800' 
                                                : 'border-slate-100 bg-slate-50 text-slate-400 focus:border-sky-200'
                                            }`}
                                        required
                                    />
                                ))}
                            </div>
                            
                            {errors.pin && (
                                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
                                    <FaExclamationTriangle className="text-rose-500 flex-shrink-0" />
                                    <p className="text-[10px] font-bold text-rose-800">{errors.pin}</p>
                                </div>
                            )}
                            
                            <div className="space-y-4">
                                <button
                                    type="submit"
                                    disabled={!(step === 1 ? pin : confirmPin).every(digit => digit !== '') || processing}
                                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            {step === 2 ? 'Complete Setup' : 'Continue'}
                                            <FaArrowRight className="text-[10px]" />
                                        </>
                                    )}
                                </button>

                                {step === 2 && (
                                    <button 
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        Go Back
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="text-center mt-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                <FaLock className="text-sky-500" />
                                Secure Transaction PIN
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
