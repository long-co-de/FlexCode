import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function About({ auth, settings }) {

    return (
        <div
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">About Us</h2>}
        >
            <Head title="About Us" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 -ws border-b border-gray-200">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold igg-800 mb-4">Our Story</h2>
                                <p className="igg-600 mb-4">
                                    Welcome to our platform, your one-stop solution for all digital services in Nigeria.
                                    Founded in 2023, we've been committed to providing seamless, reliable, and affordable
                                    utility payment services to individuals and businesses across the country.
                                </p>
                                <p className="igg-600 mb-4">
                                    What started as a small initiative to solve the everyday challenges of utility payments
                                    has grown into a comprehensive platform serving thousands of customers daily. Our journey
                                    has been driven by a simple mission: to make digital services accessible to everyone.
                                </p>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-2xl font-bold igg-800 mb-4">Our Mission</h2>
                                <p className="igg-600 mb-4">
                                    Our mission is to simplify utility payments and digital services for all Nigerians.
                                    We believe that everyone deserves access to convenient, secure, and affordable ways
                                    to pay for essential services like airtime, data, cable TV, and electricity.
                                </p>
                                <p className="igg-600 mb-4">
                                    We're committed to continuous innovation, exceptional customer service, and building
                                    a platform that our users can trust with their everyday transactions.
                                </p>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-2xl font-bold igg-800 mb-4">Our Services</h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="border rounded-lg p-4">
                                        <h3 className="text-xl font-semibold igg-700 mb-2">Airtime Recharge</h3>
                                        <p className="igg-600">
                                            Instantly recharge airtime for all major networks in Nigeria with discounted rates
                                            and special bonuses. Our VTU service ensures your recharge is delivered instantly.
                                        </p>
                                    </div>
                                    <div className="border rounded-lg p-4">
                                        <h3 className="text-xl font-semibold igg-700 mb-2">Data Bundles</h3>
                                        <p className="igg-600">
                                            Stay connected with affordable data plans for all networks. We offer competitive
                                            prices and a wide range of options to suit your browsing needs.
                                        </p>
                                    </div>
                                    <div className="border rounded-lg p-4">
                                        <h3 className="text-xl font-semibold igg-700 mb-2">Cable TV Subscriptions</h3>
                                        <p className="igg-600">
                                            Never miss your favorite shows. Renew your DStv, GOtv, and StarTimes subscriptions
                                            easily through our platform with instant activation.
                                        </p>
                                    </div>
                                    <div className="border rounded-lg p-4">
                                        <h3 className="text-xl font-semibold igg-700 mb-2">Electricity Bills</h3>
                                        <p className="igg-600">
                                            Pay for electricity tokens for all distribution companies in Nigeria. Get your token
                                            instantly and keep your lights on without the hassle of queues.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-2xl font-bold igg-800 mb-4">Why Choose Us</h2>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="text-center p-4">
                                        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold igg-700 mb-2">Fast & Reliable</h3>
                                        <p className="igg-600">
                                            Our services are delivered instantly, ensuring you get what you pay for without delays.
                                        </p>
                                    </div>
                                    <div className="text-center p-4">
                                        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold igg-700 mb-2">Secure Transactions</h3>
                                        <p className="igg-600">
                                            Your security is our priority. All transactions are protected with industry-standard encryption.
                                        </p>
                                    </div>
                                    <div className="text-center p-4">
                                        <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold igg-700 mb-2">24/7 Support</h3>
                                        <p className="igg-600">
                                            Our customer support team is always available to assist you with any issues or questions.
                                        </p>
                                    </div>
                                </div>
                            </div>

                         
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
