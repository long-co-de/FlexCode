import { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';

export default function PinSetup() {
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
            
            // Move to next input if value is entered
            if (newValue && index < 3) {
                confirmInputRefs[index + 1].current.focus();
            }
            if (!newValue && index > 0) {
                confirmInputRefs[index - 1].current.focus();
            }
        } else {
            const newPin = [...pin];
            newPin[index] = newValue;
            setPin(newPin);
            
            // Move to next input if value is entered
            if (newValue && index < 3) {
                inputRefs[index + 1].current.focus();
            }
        }
    };

    const handleKeyDown = (e, index, isPinConfirmation = false) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            if (isPinConfirmation) {
                if (index > 0 && !confirmPin[index]) {
                    confirmInputRefs[index - 1].current.focus();
                }
            } else {
                if (index > 0 && !pin[index]) {
                    inputRefs[index - 1].current.focus();
                }
            }
        }
    };

    const handleContinue = () => {
        if (pin.every(digit => digit !== '')) {
            setStep(2);
            // Focus on first confirmation input
            setTimeout(() => {
                confirmInputRefs[0].current.focus();
            }, 100);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const pinString = pin.join('');
        const confirmPinString = confirmPin.join('');
        
        if (pinString !== confirmPinString) {
            alert('PINs do not match. Please try again.');
            setConfirmPin(['', '', '', '']);
            setTimeout(() => {
                confirmInputRefs[0].current.focus();
            }, 100);
            return;
        }
        
        setData('pin', pinString);
        post(route('pin.setup'), {
            onSuccess: () => {
                // PIN setup successful, redirect will be handled by the controller
                // The controller will redirect to the intended URL or dashboard
            },
        });
    };

    return (
        <AppLayout
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Set Up PIN</h2>}
        >
            <Head title="Set Up PIN" />
            
            <div className="py-6">
                <div className="max-w-md mx-auto">
                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <h2 className="text-2xl font-semibold mb-6 text-center">
                                {step === 1 ? 'Create Your 4-Digit PIN' : 'Confirm Your PIN'}
                            </h2>
                            
                            <p className="text-center mb-8 iggyy-updatey-600">
                                {step === 1 
                                    ? 'This PIN will be required for all transactions and app access.' 
                                    : 'Please re-enter your PIN to confirm.'}
                            </p>
                            
                            <form onSubmit={step === 1 ? handleContinue : handleSubmit}>
                                <div className="flex justify-center gap-4 mb-8">
                                    {step === 1 ? (
                                        // PIN setup inputs
                                        pin.map((digit, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength="1"
                                                ref={inputRefs[index]}
                                                value={digit}
                                                onChange={(e) => handlePinChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, index)}
                                                className="android-pin-input input input-bordered w-16 h-16 text-center text-2xl"
                                                required
                                            />
                                        ))
                                    ) : (
                                        // PIN confirmation inputs
                                        confirmPin.map((digit, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength="1"
                                                ref={confirmInputRefs[index]}
                                                value={digit}
                                                onChange={(e) => handlePinChange(index, e.target.value, true)}
                                                onKeyDown={(e) => handleKeyDown(e, index, true)}
                                                className="android-pin-input input input-bordered w-16 h-16 text-center text-2xl"
                                                required
                                            />
                                        ))
                                    )}
                                </div>
                                
                                {errors.pin && <InputError message={errors.pin} className="mt-2" />}
                                
                                <div className="flex justify-center">
                                    {step === 1 ? (
                                        <button
                                            type="button"
                                            onClick={handleContinue}
                                            disabled={!pin.every(digit => digit !== '')}
                                            className="btn btn-primary"
                                        >
                                            Continue
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={!confirmPin.every(digit => digit !== '') || processing}
                                            className="btn btn-primary"
                                        >
                                            {processing ? 'Setting up...' : 'Confirm PIN'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}