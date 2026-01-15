import { useState, useRef } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';

export default function PinChange({ auth }) {
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
            
            if (newValue && index < 3) {
                currentPinRefs[index + 1].current.focus();
            }
        } else if (pinType === 'new') {
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
        // Handle backspace
        if (e.key === 'Backspace') {
            if (pinType === 'current') {
                if (index > 0 && !currentPin[index]) {
                    currentPinRefs[index - 1].current.focus();
                }
            } else if (pinType === 'new') {
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

    const handleContinue = () => {
        if (currentPin.every(digit => digit !== '')) {
            setStep(2);
            // Focus on first new PIN input
            setTimeout(() => {
                newPinRefs[0].current.focus();
            }, 100);
        }
    };

    const handleNewPinContinue = () => {
        if (newPin.every(digit => digit !== '')) {
            setStep(3);
            // Focus on first confirmation input
            setTimeout(() => {
                confirmPinRefs[0].current.focus();
            }, 100);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const currentPinString = currentPin.join('');
        const newPinString = newPin.join('');
        const confirmPinString = confirmPin.join('');
        
        if (newPinString !== confirmPinString) {
            alert('New PINs do not match. Please try again.');
            setConfirmPin(['', '', '', '']);
            setTimeout(() => {
                confirmPinRefs[0].current.focus();
            }, 100);
            return;
        }
        
        setData({
            current_pin: currentPinString,
            pin: newPinString,
            pin_confirmation: confirmPinString,
        });
        
        patch(route('pin.update'), {
            onSuccess: () => {
                // PIN change successful, redirect will be handled by the controller
            },
            onError: (errors) => {
                if (errors.current_pin) {
                    setStep(1);
                    setCurrentPin(['', '', '', '']);
                    setTimeout(() => {
                        currentPinRefs[0].current.focus();
                    }, 100);
                }
            }
        });
    };

    return (
        <AppLayout
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Change PIN</h2>}
        >
            <Head title="Change PIN" />
            
            <div className="py-6">
                <div className="max-w-md mx-auto">
                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <h2 className="text-2xl font-semibold mb-6 text-center">
                                {step === 1 ? 'Enter Current PIN' : 
                                 step === 2 ? 'Create New PIN' : 
                                 'Confirm New PIN'}
                            </h2>
                            
                            <p className="text-center mb-8 iggyy-updatey-600">
                                {step === 1 ? 'Please enter your current 4-digit PIN.' : 
                                 step === 2 ? 'Create a new 4-digit PIN.' : 
                                 'Please re-enter your new PIN to confirm.'}
                            </p>
                            
                            <form onSubmit={step === 1 ? handleContinue : step === 2 ? handleNewPinContinue : handleSubmit}>
                                <div className="flex justify-center gap-4 mb-8">
                                    {step === 1 ? (
                                        // Current PIN inputs
                                        currentPin.map((digit, index) => (
                                            <input
                                                key={index}
                                                type="password"
                                                inputMode="numeric"
                                                maxLength="1"
                                                ref={currentPinRefs[index]}
                                                value={digit}
                                                onChange={(e) => handlePinChange(index, e.target.value, 'current')}
                                                onKeyDown={(e) => handleKeyDown(e, index, 'current')}
                                                className="w-16 h-16 text-center text-2xl border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring focus:ring-primary-200"
                                                required
                                            />
                                        ))
                                    ) : step === 2 ? (
                                        // New PIN inputs
                                        newPin.map((digit, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength="1"
                                                ref={newPinRefs[index]}
                                                value={digit}
                                                onChange={(e) => handlePinChange(index, e.target.value, 'new')}
                                                onKeyDown={(e) => handleKeyDown(e, index, 'new')}
                                                className="w-16 h-16 text-center text-2xl border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring focus:ring-primary-200"
                                                required
                                            />
                                        ))
                                    ) : (
                                        // Confirm PIN inputs
                                        confirmPin.map((digit, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength="1"
                                                ref={confirmPinRefs[index]}
                                                value={digit}
                                                onChange={(e) => handlePinChange(index, e.target.value, 'confirm')}
                                                onKeyDown={(e) => handleKeyDown(e, index, 'confirm')}
                                                className="w-16 h-16 text-center text-2xl border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring focus:ring-primary-200"
                                                required
                                            />
                                        ))
                                    )}
                                </div>
                                
                                {step === 1 && errors.current_pin && <InputError message={errors.current_pin} className="mt-2" />}
                                {step === 2 && errors.pin && <InputError message={errors.pin} className="mt-2" />}
                                {step === 3 && errors.pin_confirmation && <InputError message={errors.pin_confirmation} className="mt-2" />}
                                
                                <div className="flex flex-col items-center space-y-4">
                                    {step === 1 ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleContinue}
                                                disabled={!currentPin.every(digit => digit !== '')}
                                                className="btn btn-primary"
                                            >
                                                Continue
                                            </button>
                                            
                                            <Link
                                                href={route('pin.reset.show')}
                                                className="text-sm igg-600 hover:igg-900"
                                            >
                                                Forgot PIN? Reset with Password
                                            </Link>
                                        </>
                                    ) : step === 2 ? (
                                        <button
                                            type="button"
                                            onClick={handleNewPinContinue}
                                            disabled={!newPin.every(digit => digit !== '')}
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
                                            {processing ? 'Updating...' : 'Change PIN'}
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