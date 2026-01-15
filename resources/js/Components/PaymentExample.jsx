import { useState } from 'react';
import PinVerificationModal from '@/Components/PinVerificationModal';
import Button from '@/Components/Button';

export default function PaymentExample() {
    const [showPinModal, setShowPinModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    
    // Sample payment data
    const paymentData = {
        amount: 5000,
        recipient: '08012345678',
        service: 'airtime'
    };
    
    const handlePaymentClick = () => {
        // Show PIN verification modal before proceeding with payment
        setShowPinModal(true);
    };
    
    const handlePinVerified = (pin) => {
        // PIN has been verified, proceed with payment
        setShowPinModal(false);
        setPaymentStatus('processing');
        
        // Make API request with PIN in header
        fetch('/api/services/airtime/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-PIN': pin // Include PIN in header
            },
            body: JSON.stringify({
                network_id: 1,
                phone_number: paymentData.recipient,
                amount: paymentData.amount,
                airtime_type: 'VTU'
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.message && data.message.includes('successful')) {
                setPaymentStatus('success');
            } else {
                setPaymentStatus('error');
            }
        })
        .catch(error => {
            setPaymentStatus('error');
        });
    };
    
    return (
        <div className="p-6 bg-base-100 -ws rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            
            <div className="mb-4">
                <p className="igg-600">Service: <span className="font-medium igg-900 capitalize">{paymentData.service}</span></p>
                <p className="igg-600">Recipient: <span className="font-medium igg-900">{paymentData.recipient}</span></p>
                <p className="igg-600">Amount: <span className="font-medium igg-900">₦{paymentData.amount.toLocaleString()}</span></p>
            </div>
            
            {paymentStatus === 'success' && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                    Payment successful! Your transaction has been completed.
                </div>
            )}
            
            {paymentStatus === 'error' && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    Payment failed. Please try again later.
                </div>
            )}
            
            <div className="flex justify-end">
                <Button
                    onClick={handlePaymentClick}
                    disabled={paymentStatus === 'processing' || paymentStatus === 'success'}
                >
                    {paymentStatus === 'processing' ? 'Processing...' : 'Make Payment'}
                </Button>
            </div>
            
            {/* PIN Verification Modal */}
            <PinVerificationModal
                show={showPinModal}
                onClose={() => setShowPinModal(false)}
                onPinVerified={handlePinVerified}
                title="Verify Payment"
                description={`Please enter your 4-digit PIN to authorize payment of ₦${paymentData.amount.toLocaleString()} for ${paymentData.service}.`}
            />
        </div>
    );
}