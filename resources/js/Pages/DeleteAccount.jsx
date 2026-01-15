import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function DeleteAccount({ auth }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDeleteAccount = async () => {
        if (!password) {
            setError('Please enter your password to confirm deletion');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            router.delete(route('profile.destroy'), {
                data: { password },
                onSuccess: () => {
                    setIsLoading(false);
                },
                onError: (errors) => {
                    setIsLoading(false);
                    if (errors.password) {
                        setError(errors.password);
                    } else {
                        setError('An error occurred while deleting your account. Please try again.');
                    }
                },
            });
        } catch (err) {
            setIsLoading(false);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div>
            <Head title="Delete Account" />
            
            <div className="py-12 min-h-screen bg-base-200">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-base-100 rounded-lg shadow-md p-6 md:p-8">
                        <div className="mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-error mb-2">Delete Account</h1>
                            <p className="text-gray-600">Permanently delete your account and all associated data</p>
                        </div>

                        {/* Warning Alert */}
                        <div className="alert alert-error mb-6">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm">This action cannot be undone. Once deleted, your account and all data will be permanently removed.</span>
                            </div>
                        </div>

                        {/* Account Information */}
                        <div className="bg-base-200 rounded-lg p-4 mb-6">
                            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Email:</span>
                                    <span className="font-medium">{auth.user?.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Account Status:</span>
                                    <span className="font-medium">Active</span>
                                </div>
                            </div>
                        </div>

                        {/* What Gets Deleted */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">What Will Be Deleted</h3>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                <li>Your account and profile information</li>
                                <li>Your transaction history and records</li>
                                <li>Your saved payment methods and beneficiaries</li>
                                <li>Your wallet balance and credits</li>
                                <li>All personal data associated with your account</li>
                            </ul>
                        </div>

                        {/* Important Notes */}
                        <div className="bg-warning/10 border border-warning rounded-lg p-4 mb-6">
                            <h3 className="text-lg font-semibold mb-3 text-warning">Important Notes</h3>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                                <li>Please ensure you have no pending transactions before deleting your account</li>
                                <li>Any balance in your wallet will be forfeited</li>
                                <li>You will not be able to recover your account after deletion</li>
                                <li>We may retain some data for legal and compliance purposes</li>
                            </ul>
                        </div>

                        {/* Confirmation Section */}
                        {!showConfirm ? (
                            <button
                                onClick={() => setShowConfirm(true)}
                                className="btn btn-error w-full"
                            >
                                Delete My Account
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold">Enter your password to confirm deletion</span>
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Enter your password"
                                        className="input input-bordered w-full"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError('');
                                        }}
                                        disabled={isLoading}
                                    />
                                </div>

                                {error && (
                                    <div className="alert alert-error">
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowConfirm(false);
                                            setPassword('');
                                            setError('');
                                        }}
                                        className="btn btn-outline flex-1"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="btn btn-error flex-1"
                                        disabled={isLoading || !password}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Deleting...
                                            </>
                                        ) : (
                                            'Confirm Deletion'
                                        )}
                                    </button>
                                </div>

                                <p className="text-xs text-gray-500 text-center">
                                    This action is irreversible. Please make sure you understand the consequences.
                                </p>
                            </div>
                        )}

                        {/* Support */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-gray-600 mb-3">Need help? Contact our support team before deleting your account.</p>
                            <div className="flex gap-3">
                                <button className="btn btn-outline btn-sm">
                                    <a href={route('contact')}>Contact Support</a>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
