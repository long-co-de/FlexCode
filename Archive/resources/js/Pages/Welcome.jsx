import { Link, Head } from '@inertiajs/react';
import {
    PhoneIcon,
    TvIcon,
    LightBulbIcon,
    WalletIcon,
    ShieldCheckIcon,
    CreditCardIcon,
    DevicePhoneMobileIcon,
    BoltIcon,
    ArrowDownTrayIcon,
    UserGroupIcon,
    CheckCircleIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Welcome to BorrowLite" />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <img src="/ico.png" alt="logo" className="h-10 w-auto" />
                            <span className="ml-2 text-xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                                BorrowLite
                            </span>
                        </div>
                        
                        <div className="hidden md:flex items-center space-x-8">
                            <Link href={route('about')} className="text-gray-600 hover:text-sky-600 transition-colors">
                                About
                            </Link>
                            <Link href={'#services'} className="text-gray-600 hover:text-sky-600 transition-colors">
                                Services
                            </Link>
                            <Link href={'#borrow'} className="text-gray-600 hover:text-sky-600 transition-colors">
                                Borrow
                            </Link>
                            
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-shadow"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <div className="flex items-center space-x-4">
                                    <Link
                                        href={route('login')}
                                        className="text-gray-600 hover:text-sky-600 transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-shadow"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>
                        
                        <Link href='/register' className="md:hidden btn btn-primary rounded-xl">
                           Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-sky-50 to-blue-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Smart Way to
                                <span className="block bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent mt-2">
                                    Pay & Borrow
                                </span>
                            </h1>
                            <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
                                Instant airtime, data, bill payments with smart borrowing features. 
                                Get what you need now, pay later.
                            </p>
                            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link
                                    href={route('register')}
                                    className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-3 rounded-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                                >
                                    Start Free Trial
                                </Link>
                                <Link
                                    href={'#services'}
                                    className="border-2 border-sky-500 text-sky-600 px-8 py-3 rounded-lg hover:bg-sky-50 transition-colors"
                                >
                                    Explore Services
                                </Link>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <div className="absolute -top-6 -left-6 w-64 h-64 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                            <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                            <div className="relative bg-white rounded-2xl shadow-2xl p-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-6 rounded-xl">
                                        <PhoneIcon className="w-8 h-8 text-sky-600" />
                                        <h3 className="mt-4 font-semibold text-gray-900">Airtime</h3>
                                        <p className="mt-2 text-sm text-gray-600">Instant recharge</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-6 rounded-xl">
                                        <DevicePhoneMobileIcon className="w-8 h-8 text-sky-600" />
                                        <h3 className="mt-4 font-semibold text-gray-900">Data</h3>
                                        <p className="mt-2 text-sm text-gray-600">Smart bundles</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-6 rounded-xl">
                                        <TvIcon className="w-8 h-8 text-sky-600" />
                                        <h3 className="mt-4 font-semibold text-gray-900">TV</h3>
                                        <p className="mt-2 text-sm text-gray-600">Cable subscriptions</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-6 rounded-xl">
                                        <LightBulbIcon className="w-8 h-8 text-sky-600" />
                                        <h3 className="mt-4 font-semibold text-gray-900">Bills</h3>
                                        <p className="mt-2 text-sm text-gray-600">Electricity & more</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Borrow Feature Section */}
            <section id="borrow" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                            Smart Borrowing
                            <span className="block text-sm font-normal text-sky-600 mt-2">PAY LATER FEATURES</span>
                        </h2>
                        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                            Get what you need now. Flexible repayment options with zero hidden charges.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-gradient-to-b from-sky-50 to-white p-8 rounded-2xl border border-sky-100">
                            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                                <ArrowTrendingUpIcon className="w-6 h-6 text-sky-600" />
                            </div>
                            <h3 className="mt-6 text-xl font-semibold text-gray-900">Borrow Airtime</h3>
                            <p className="mt-3 text-gray-600">
                                Emergency calls? Borrow airtime instantly and repay when you recharge next.
                            </p>
                            <ul className="mt-4 space-y-2">
                                <li className="flex items-center text-sm text-gray-600">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                                    Instant approval
                                </li>
                                <li className="flex items-center text-sm text-gray-600">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                                    Flexible repayment
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-b from-sky-50 to-white p-8 rounded-2xl border border-sky-100">
                            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                                <DevicePhoneMobileIcon className="w-6 h-6 text-sky-600" />
                            </div>
                            <h3 className="mt-6 text-xl font-semibold text-gray-900">Borrow Data</h3>
                            <p className="mt-3 text-gray-600">
                                Stay connected with emergency data loans for important tasks.
                            </p>
                            <ul className="mt-4 space-y-2">
                                <li className="flex items-center text-sm text-gray-600">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                                    Quick processing
                                </li>
                                <li className="flex items-center text-sm text-gray-600">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                                    Competitive rates
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-b from-sky-50 to-white p-8 rounded-2xl border border-sky-100">
                            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                                <WalletIcon className="w-6 h-6 text-sky-600" />
                            </div>
                            <h3 className="mt-6 text-xl font-semibold text-gray-900">Credit Score</h3>
                            <p className="mt-3 text-gray-600">
                                Build your credit score with timely repayments for better borrowing limits.
                            </p>
                            <ul className="mt-4 space-y-2">
                                <li className="flex items-center text-sm text-gray-600">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                                    Score tracking
                                </li>
                                <li className="flex items-center text-sm text-gray-600">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                                    Limit increases
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-20 bg-gradient-to-b from-white to-sky-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                            All Services
                            <span className="block text-sm font-normal text-sky-600 mt-2">EVERYTHING YOU NEED</span>
                        </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: PhoneIcon, title: "Airtime", desc: "All networks, instant delivery", color: "sky" },
                            { icon: DevicePhoneMobileIcon, title: "Data", desc: "Best rates, all bundles", color: "blue" },
                            { icon: TvIcon, title: "TV", desc: "DStv, GOtv, StarTimes", color: "sky" },
                            { icon: LightBulbIcon, title: "Electricity", desc: "All distribution companies", color: "blue" },
                        ].map((service, index) => (
                            <div key={index} className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-sky-300 hover:shadow-lg transition-all duration-300">
                                <div className={`w-12 h-12 bg-${service.color}-100 rounded-lg flex items-center justify-center group-hover:bg-${service.color}-50 transition-colors`}>
                                    <service.icon className={`w-6 h-6 text-${service.color}-600`} />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-gray-900">{service.title}</h3>
                                <p className="mt-2 text-gray-600">{service.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                                Why Choose
                                <span className="block bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                                    BorrowLite?
                                </span>
                            </h2>
                            <p className="mt-6 text-gray-600">
                                We combine seamless bill payments with smart borrowing features to give you complete financial flexibility.
                            </p>
                            
                            <div className="mt-8 space-y-6">
                                {[
                                    { icon: BoltIcon, title: "Lightning Fast", desc: "Instant processing for all transactions" },
                                    { icon: ShieldCheckIcon, title: "Bank-Level Security", desc: "Your data and payments are protected" },
                                    { icon: CreditCardIcon, title: "Flexible Payment", desc: "Multiple payment options available" },
                                    { icon: UserGroupIcon, title: "Smart Borrowing", desc: "Emergency airtime and data loans" },
                                ].map((feature, index) => (
                                    <div key={index} className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                                                <feature.icon className="w-5 h-5 text-sky-600" />
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                                            <p className="mt-1 text-gray-600">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600 rounded-3xl transform rotate-3"></div>
                            <div className="relative bg-white rounded-3xl shadow-2xl p-8">
                                <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white p-6 rounded-2xl">
                                    <h3 className="text-xl font-semibold">Quick Borrow Example</h3>
                                    <p className="mt-2 opacity-90">Get ₦500 airtime now, repay ₦550 in 7 days</p>
                                </div>
                                
                                <div className="mt-8 space-y-4">
                                    {[
                                        { label: "Borrow Limit", value: "₦5,000" },
                                        { label: "Processing Time", value: "< 30 seconds" },
                                        { label: "Repayment Period", value: "7-14 days" },
                                        { label: "Credit Score", value: "Build as you repay" },
                                    ].map((item, index) => (
                                        <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100">
                                            <span className="text-gray-600">{item.label}</span>
                                            <span className="font-semibold text-gray-900">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <button className="mt-8 w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 rounded-lg hover:shadow-lg transition-shadow">
                                    Check Your Eligibility
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-sky-500 to-blue-600">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white">
                        Start Your Smart Financial Journey
                    </h2>
                    <p className="mt-4 text-xl text-sky-100 max-w-2xl mx-auto">
                        Join thousands who trust BorrowLite for instant payments and smart borrowing.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href={route('register')}
                            className="bg-white text-sky-600 px-8 py-3 rounded-lg font-semibold hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                            Create Free Account
                        </Link>
                        <Link
                            href={'#borrow'}
                            className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                        >
                            Learn About Borrowing
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12" id='contact'>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center">
                                <img src="/ico.png" alt="logo" className="h-8 w-auto" />
                                <span className="ml-2 text-lg font-bold">BorrowLite</span>
                            </div>
                            <p className="mt-4 text-gray-400">
                                Smart payments with borrowing flexibility.
                            </p>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold">Services</h3>
                            <ul className="mt-4 space-y-2">
                                <li><a href="#services" className="text-gray-400 hover:text-white">Airtime</a></li>
                                <li><a href="#services" className="text-gray-400 hover:text-white">Data</a></li>
                                <li><a href="#services" className="text-gray-400 hover:text-white">TV</a></li>
                                <li><a href="#services" className="text-gray-400 hover:text-white">Electricity</a></li>
                                <li><a href="#borrow" className="text-gray-400 hover:text-white">Borrowing</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold">Company</h3>
                            <ul className="mt-4 space-y-2">
                                <li><a href={route('about')} className="text-gray-400 hover:text-white">About Us</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white">Privacy</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold">Contact</h3>
                            <ul className="mt-4 space-y-3 text-gray-400">
                                <li className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    +234 800 000 0000
                                </li>
                                <li className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    help@borrowlite.com
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
                        <p>&copy; {new Date().getFullYear()} BorrowLite. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>
        </>
    );
}