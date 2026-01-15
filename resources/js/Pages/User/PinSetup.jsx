import { useState, useRef, useEffect } from 'react';
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
        confirm_pin: '',
    });

    // Update form data whenever pin or confirmPin changes
    useEffect(() => {
        const pinString = pin.join('');
        if (pinString.length === 4) {
            setData('pin', pinString);
        }
    }, [pin]);

    useEffect(() => {
        const confirmPinString = confirmPin.join('');
        if (confirmPinString.length === 4) {
            setData('confirm_pin', confirmPinString);
        }
    }, [confirmPin]);

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

    const handleContinue = (e) => {
        e?.preventDefault?.();
        if (pin.every(digit => digit !== '')) {
            // Make sure pin is set in form data before proceeding
            setData('pin', pin.join(''));
            setStep(2);
            setTimeout(() => confirmInputRefs[0].current?.focus(), 100);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const pinString = pin.join('');
        const confirmPinString = confirmPin.join('');
        
        if (pinString !== confirmPinString) {
            // Clear confirm pin and refocus
            setConfirmPin(['', '', '', '']);
            setData('confirm_pin', '');
            setTimeout(() => confirmInputRefs[0].current?.focus(), 100);
            
            // Set error in form
            setData('errors', { pin: 'PINs do not match. Please try again.' });
            return;
        }
        
        // Ensure both pins are set before submission
        setData({
            pin: pinString,
            confirm_pin: confirmPinString,
        });
        
        post(route('pin.setup'));
    };

    // Check if all PIN digits are filled
    const isPinComplete = pin.every(digit => digit !== '');
    const isConfirmPinComplete = confirmPin.every(digit => digit !== '');

    return (
        <AppLayout user={auth.user}>
            <Head title="Set Up PIN" />
            
            <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-[2rem] text-primary mb-6 border border-primary/20 shadow-sm transition-transform hover:scale-110">
                            <span className="text-3xl">{step === 1 ? <FaShieldAlt /> : <FaCheckCircle />}</span>
                        </div>
                        <h2 className="text-3xl font-black text-base-content mb-2">
                            {step === 1 ? 'Secure Your Account' : 'Confirm Your PIN'}
                        </h2>
                        <p className="text-base-content/60 font-medium">
                            {step === 1 
                                ? 'Create a 4-digit PIN to authorize transactions and secure your wallet.' 
                                : 'Please re-enter your security PIN to confirm.'}
                        </p>
                    </div>

                    <div className="bg-base-100 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-base-300/50 border border-base-300 relative overflow-hidden">
                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2].map(i => (
                                <div 
                                    key={i} 
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                        step >= i 
                                            ? 'w-12 bg-primary' 
                                            : 'w-4 bg-base-300'
                                    }`}
                                ></div>
                            ))}
                        </div>

                        <div className="space-y-8">
                            <form onSubmit={step === 2 ? handleSubmit : undefined}>
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
                                                    ? 'border-primary bg-primary/10 text-base-content' 
                                                    : 'border-base-300 bg-base-200 text-base-content/40 focus:border-primary/50'
                                                }`}
                                            required
                                        />
                                    ))}
                                </div>
                                
                                {/* Display any errors from form submission */}
                                {errors.pin && (
                                    <div className="bg-error/10 border border-error/20 rounded-2xl p-4 flex items-center gap-3 mt-4">
                                        <FaExclamationTriangle className="text-error flex-shrink-0" />
                                        <p className="text-[10px] font-bold text-error-content">{errors.pin}</p>
                                    </div>
                                )}
                                
                                <div className="space-y-4 mt-8">
                                    {step === 1 ? (
                                        <button
                                            type="button"
                                            onClick={handleContinue}
                                            disabled={!isPinComplete}
                                            className="w-full h-14 bg-primary text-primary-content rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-focus transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            Continue
                                            <FaArrowRight className="text-[10px]" />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={!isConfirmPinComplete || processing}
                                            className="w-full h-14 bg-primary text-primary-content rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-focus transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {processing ? (
                                                <div className="w-4 h-4 border-2 border-primary-content/30 border-t-primary-content rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    Complete Setup
                                                    <FaArrowRight className="text-[10px]" />
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {step === 2 && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setStep(1);
                                                // Clear any errors when going back
                                                setData('errors', {});
                                            }}
                                            className="w-full text-[10px] font-black text-base-content/40 uppercase tracking-widest hover:text-base-content/80 transition-colors"
                                        >
                                            Go Back
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="text-center mt-8">
                            <p className="text-[10px] font-black text-base-content/40 uppercase tracking-widest flex items-center justify-center gap-2">
                                <FaLock className="text-primary" />
                                Secure Transaction PIN
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}