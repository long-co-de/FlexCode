import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { StarIcon, WifiIcon, BanknotesIcon, TvIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function UpgradePro({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Upgrade to Pro</h2>}
        >
            <Head title="Upgrade to Pro" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="text-center mb-10">
                                <h1 className="text-3xl font-bold igg-900">Unlock Pro Benefits</h1>
                                <p className="mt-4 text-lg igg-600">Take your business to the next level with Pro features</p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Higher Profits */}
                                <div className="border border-primary rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <BanknotesIcon className="h-8 w-8 text-primary" />
                                        <h3 className="text-xl font-semibold ml-3">Higher Profits</h3>
                                    </div>
                                    <p className="igg-600">Earn 2% profit on all airtime transactions. Set your own margins for data, TV, and electricity.</p>
                                </div>

                                {/* Marketing Materials */}
                                <div className="border border-primary rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <ChartBarIcon className="h-8 w-8 text-primary" />
                                        <h3 className="text-xl font-semibold ml-3">Marketing Bundle</h3>
                                    </div>
                                    <p className="igg-600">Get beautiful banner templates for social media and offline advertising.</p>
                                </div>

                                {/* API Access */}
                                <div className="border border-primary rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <WifiIcon className="h-8 w-8 text-primary" />
                                        <h3 className="text-xl font-semibold ml-3">API Access</h3>
                                    </div>
                                    <p className="igg-600">Integrate our services directly into your applications with API access.</p>
                                </div>
                            </div>

                            <div className="mt-12">
                                <div className="max-w-2xl mx-auto bg-primary bg-opacity-5 rounded-xl p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-2xl font-bold igg-900">Pro Membership</h3>
                                            <p className="text-lg igg-600">Annual subscription</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-primary">₦50,000</div>
                                            <div className="text-sm igg-500">per year</div>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-center">
                                            <StarIcon className="h-5 w-5 text-primary mr-3" />
                                            <span>2% profit on all airtime sales</span>
                                        </li>
                                        <li className="flex items-center">
                                            <StarIcon className="h-5 w-5 text-primary mr-3" />
                                            <span>Custom profit margins for other services</span>
                                        </li>
                                        <li className="flex items-center">
                                            <StarIcon className="h-5 w-5 text-primary mr-3" />
                                            <span>Professional marketing materials</span>
                                        </li>
                                        <li className="flex items-center">
                                            <StarIcon className="h-5 w-5 text-primary mr-3" />
                                            <span>API access for integration</span>
                                        </li>
                                        <li className="flex items-center">
                                            <StarIcon className="h-5 w-5 text-primary mr-3" />
                                            <span>Priority customer support</span>
                                        </li>
                                    </ul>

                                    <button className="w-full btn btn-primary btn-lg">
                                        Upgrade Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
