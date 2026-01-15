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
    ArrowTrendingUpIcon,
    ChevronRightIcon,
    FingerPrintIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Welcome({ auth }) {
    return (
        <div className="min-h-screen bg-slate-50 selection:bg-sky-100 selection:text-sky-900">
            <Head title="BorrowLite — Smart Payments & Flexible Borrowing" />

            {/* Navigation */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-200">
                                <img src="/ico.png" alt="logo" className="h-7 w-auto brightness-0 invert" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-slate-900">
                                Borrow<span className="text-sky-600">Lite</span>
                            </span>
                        </div>
                        
                        <div className="hidden md:flex items-center gap-8">
                            <Link href={route('about')} className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
                                About
                            </Link>
                            <Link href={'#services'} className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
                                Services
                            </Link>
                            <Link href={'#borrow'} className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
                                Borrow
                            </Link>
                            
                            <div className="h-6 w-px bg-slate-200 mx-2" />

                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-full hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Link
                                        href={route('login')}
                                        className="text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-sky-600 rounded-full hover:bg-sky-500 transition-all shadow-md shadow-sky-100 hover:shadow-sky-200"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>
                        
                        <button className="md:hidden p-2 text-slate-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-sky-100/50 rounded-full blur-3xl opacity-50" />
                        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl opacity-50" />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="text-center lg:text-left space-y-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-xs font-bold tracking-wider uppercase">
                                    <BoltIcon className="w-4 h-4" />
                                    Instant Financial Freedom
                                </div>
                                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                                    Spend smarter, <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-600">
                                        borrow better.
                                    </span>
                                </h1>
                                <p className="text-lg sm:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                    The all-in-one platform for your daily essentials. Pay bills instantly or borrow what you need today and pay back when you're ready.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:-translate-y-0.5"
                                    >
                                        Get Started Now
                                        <ChevronRightIcon className="ml-2 w-5 h-5" />
                                    </Link>
                                    <Link
                                        href={'#services'}
                                        className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all"
                                    >
                                        View Services
                                    </Link>
                                </div>
                                <div className="flex items-center justify-center lg:justify-start gap-6 pt-4">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 overflow-hidden">
                                                <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        Joined by <span className="font-bold text-slate-900">10k+</span> users this month
                                    </div>
                                </div>
                            </div>
                            
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 to-blue-400/20 rounded-[2.5rem] blur-2xl -z-10 transform scale-95 translate-y-4" />
                                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8">
                                        <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center">
                                            <FingerPrintIcon className="w-6 h-6 text-sky-600" />
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-slate-500">Available Limit</p>
                                            <h3 className="text-4xl font-bold text-slate-900">₦25,000.00</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <PhoneIcon className="w-6 h-6 text-sky-600 mb-2" />
                                                <p className="text-xs font-semibold text-slate-500">Airtime</p>
                                                <p className="font-bold text-slate-900">Instant</p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <BoltIcon className="w-6 h-6 text-amber-500 mb-2" />
                                                <p className="text-xs font-semibold text-slate-500">Electricity</p>
                                                <p className="font-bold text-slate-900">24/7</p>
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <button className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-sky-200 hover:shadow-xl transition-all">
                                                Unlock Higher Limit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section id="services" className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold tracking-[0.2em] text-sky-600 uppercase">Our Services</h2>
                                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Everything you need in <br className="hidden sm:block" /> one powerful app.</h3>
                            </div>
                            <p className="text-slate-500 max-w-md">
                                Experience seamless transactions with our suite of digital services designed for your daily needs.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { icon: PhoneIcon, title: "Airtime Top-up", desc: "Recharge any network instantly with zero convenience fees.", color: "text-sky-600", bg: "bg-sky-50" },
                                { icon: DevicePhoneMobileIcon, title: "Data Bundles", desc: "Get the best data deals for all networks at wholesale prices.", color: "text-blue-600", bg: "bg-blue-50" },
                                { icon: TvIcon, title: "Cable TV", desc: "Never miss your favorite shows. Pay DStv, GOtv, & StarTimes.", color: "text-indigo-600", bg: "bg-indigo-50" },
                                { icon: LightBulbIcon, title: "Utility Bills", desc: "Pay electricity bills for all discos without leaving your home.", color: "text-amber-600", bg: "bg-amber-50" },
                            ].map((service, index) => (
                                <div key={index} className="group p-8 rounded-[2rem] bg-slate-50 border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-xl transition-all duration-300">
                                    <div className={`w-14 h-14 ${service.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        <service.icon className={`w-7 h-7 ${service.color}`} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h4>
                                    <p className="text-slate-600 text-sm leading-relaxed">{service.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Borrow Feature Section */}
                <section id="borrow" className="py-24 bg-slate-900 overflow-hidden relative">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px]" />
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-sm font-bold tracking-[0.2em] text-sky-400 uppercase">Borrow Anytime</h2>
                                    <h3 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">Need Airtime, Data, or Electricity? <br /> Borrow Now!</h3>
                                </div>
                                <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                                    Our smart borrowing system analyzes your usage patterns to offer you instant credit. Build your score and unlock higher limits.
                                </p>
                                
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center mt-1">
                                            <CheckCircleIcon className="w-4 h-4 text-sky-400" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-white">Instant Approval</h5>
                                            <p className="text-sm text-slate-500">No paperwork required.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center mt-1">
                                            <CheckCircleIcon className="w-4 h-4 text-sky-400" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-white">Low Interest</h5>
                                            <p className="text-sm text-slate-500">Transparent flat rates.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-900 bg-white rounded-2xl hover:bg-slate-100 transition-all shadow-xl shadow-white/5"
                                    >
                                        Check Your Eligibility
                                    </Link>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                {[
                                    { title: "Borrow Airtime", limit: "₦500 - ₦2,000", icon: PhoneIcon },
                                    { title: "Borrow Data", limit: "1GB - 10GB", icon: DevicePhoneMobileIcon },
                                    { title: "Electricity Loan", limit: "Up to ₦5,000", icon: LightBulbIcon },
                                    { title: "Cable Subs", limit: "Coming Soon", icon: TvIcon },
                                ].map((item, i) => (
                                    <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
                                        <item.icon className="w-8 h-8 text-sky-400 mb-6" />
                                        <h4 className="text-lg font-bold text-white mb-1">{item.title}</h4>
                                        <p className="text-slate-400 text-sm">{item.limit}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Choose Us */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                            <h2 className="text-sm font-bold tracking-[0.2em] text-sky-600 uppercase">Trust & Security</h2>
                            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Built for speed, <br className="sm:hidden" /> secured for peace of mind.</h3>
                        </div>

                        <div className="grid md:grid-cols-3 gap-12">
                            {[
                                { icon: ShieldCheckIcon, title: "Bank-Grade Security", desc: "Your data is encrypted with the same standards used by top global banks." },
                                { icon: ArrowPathIcon, title: "Instant Fulfillment", desc: "No delays. Transactions are processed in real-time, 24 hours a day." },
                                { icon: UserGroupIcon, title: "Customer Centric", desc: "Our support team is always available to help you with any issues." },
                            ].map((item, i) => (
                                <div key={i} className="text-center space-y-6">
                                    <div className="w-16 h-16 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900">
                                        <item.icon className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900">{item.title}</h4>
                                    <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="relative bg-gradient-to-br from-sky-600 to-blue-700 rounded-[3rem] p-8 md:p-16 overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <WalletIcon className="w-64 h-64 text-white" />
                            </div>
                            <div className="relative z-10 max-w-2xl text-center md:text-left space-y-8">
                                <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">Ready to take control of your finances?</h2>
                                <p className="text-sky-100 text-lg opacity-90">Join 50,000+ Nigerians who use BorrowLite daily for their transactions and smart loans.</p>
                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-sky-700 bg-white rounded-2xl hover:bg-sky-50 transition-all shadow-xl shadow-blue-900/20"
                                    >
                                        Open a Free Account
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all"
                                    >
                                        Log In to Account
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1 space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
                                    <img src="/ico.png" alt="logo" className="h-5 brightness-0 invert" />
                                </div>
                                <span className="text-xl font-bold text-slate-900">BorrowLite</span>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Providing smart financial solutions for everyday Nigerians. Borrow airtime, data, and electricity with ease.
                            </p>
                            <div className="flex gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-9 h-9 rounded-full bg-slate-200 hover:bg-sky-600 hover:text-white transition-colors cursor-pointer flex items-center justify-center text-slate-600">
                                        <div className="w-4 h-4" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Product</h4>
                            <ul className="space-y-4 text-sm text-slate-500">
                                <li><a href="#services" className="hover:text-sky-600 transition-colors">Airtime & Data</a></li>
                                <li><a href="#services" className="hover:text-sky-600 transition-colors">Utility Bills</a></li>
                                <li><a href="#borrow" className="hover:text-sky-600 transition-colors">Smart Loans</a></li>
                                <li><a href="#" className="hover:text-sky-600 transition-colors">Agent Portal</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Company</h4>
                            <ul className="space-y-4 text-sm text-slate-500">
                                <li><a href={route('about')} className="hover:text-sky-600 transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-sky-600 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-sky-600 transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-sky-600 transition-colors">Cookie Policy</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Support</h4>
                            <ul className="space-y-4 text-sm text-slate-500">
                                <li><a href="#" className="hover:text-sky-600 transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-sky-600 transition-colors">Contact Us</a></li>
                                <li><a href="mailto:help@borrowlite.com" className="hover:text-sky-600 transition-colors">help@borrowlite.com</a></li>
                                <li className="text-slate-900 font-semibold">+234 800 000 0000</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                        <p>© {new Date().getFullYear()} BorrowLite. All rights reserved.</p>
                        <p>Licensed by the Central Bank of Nigeria.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
