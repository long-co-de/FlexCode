import { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function PinReset({ auth }) {
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
        // Handle backspace
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
        // Focus on first new PIN input
        setTimeout(() => {
            newPinRefs[0].current.focus();
        }, 100);
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
        
        const newPinString = newPin.join('');
        const confirmPinString = confirmPin.join('');
        
        if (newPinString !== confirmPinString) {
            setError('pin_confirmation', 'PINs do not match. Please try again.');
            setConfirmPin(['', '', '', '']);
            setTimeout(() => {
                confirmPinRefs[0].current.focus();
            }, 100);
            return;
        }
        
        setData({
            ...data,
            pin: newPinString,
            pin_confirmation: confirmPinString,
        });
        
        post(route('pin.reset-with-password'), {
            onSuccess: () => {
                // PIN reset successful, redirect will be handled by the controller
            },
            onError: (errors) => {
                if (errors.password) {
                    setStep(1);
                }
            }
        });
    };

    return (
        <AppLayout
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Reset PIN</h2>}
        >
            <Head title="Reset PIN" />
            
            <div className="py-6">
                <div className="max-w-md mx-auto">
                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <h2 className="text-2xl font-semibold mb-6 text-center">
                                {step === 1 ? 'Verify Your Identity' : 
                                 step === 2 ? 'Create New PIN' : 
                                 'Confirm New PIN'}
                            </h2>
                            
                            <p className="text-center mb-8 igg-600">
                                {step === 1 ? 'Please enter your account password to verify your identity.' : 
                                 step === 2 ? 'Create a new 4-digit PIN.' : 
                                 'Please re-enter your new PIN to confirm.'}
                            </p>
                            
                            {step === 1 ? (
                                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                    <div>
                                        <InputLabel htmlFor="password" value="Account Password" />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            className="mt-1 block w-full"
                                            autoComplete="current-password"
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>
                                    
                                    <div className="flex justify-center">
                                        <PrimaryButton
                                            type="submit"
                                            disabled={!data.password || processing}
                                            className="w-full justify-center"
                                        >
                                            Continue
                                        </PrimaryButton>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={step === 2 ? handleNewPinContinue : handleSubmit}>
                                    <div className="flex justify-center gap-4 mb-8">
                                        {step === 2 ? (
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
                                    
                                    {step === 2 && errors.pin && <InputError message={errors.pin} className="mt-2" />}
                                    {step === 3 && errors.pin_confirmation && <InputError message={errors.pin_confirmation} className="mt-2" />}
                                    
                                    <div className="flex justify-center">
                                        {step === 2 ? (
                                            <PrimaryButton
                                                type="button"
                                                onClick={handleNewPinContinue}
                                                disabled={!newPin.every(digit => digit !== '')}
                                                className="w-full justify-center"
                                            >
                                                Continue
                                            </PrimaryButton>
                                        ) : (
                                            <PrimaryButton
                                                type="submit"
                                                disabled={!confirmPin.every(digit => digit !== '') || processing}
                                                className="w-full justify-center"
                                            >
                                                {processing ? 'Resetting...' : 'Reset PIN'}
                                            </PrimaryButton>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}