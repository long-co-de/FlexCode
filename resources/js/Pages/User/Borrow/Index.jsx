import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    FaPhone, FaWifi, FaLightbulb, FaTv, FaArrowRight, 
    FaShieldAlt, FaClock, FaCheckCircle, FaExclamationTriangle,
    FaCoins, FaHistory, FaInfoCircle, FaLock, FaCreditCard
} from 'react-icons/fa';
import { GiReceiveMoney } from 'react-icons/gi';

export default function Index({ auth, eligibility, summary, has_card }) {
    const services = [
        { 
            label: 'Airtime', 
            icon: <FaPhone />, 
            route: 'borrow.airtime', 
            color: 'text-blue-500', 
            bg: 'bg-blue-50', 
            desc: 'Get instant airtime top-up now and pay later.' 
        },
        { 
            label: 'Data Bundle', 
            icon: <FaWifi />, 
            route: 'borrow.data', 
            color: 'text-emerald-500', 
            bg: 'bg-emerald-50', 
            desc: 'Stay connected with instant data plans on credit.' 
        },
        { 
            label: 'Electricity', 
            icon: <FaLightbulb />, 
            route: 'borrow.electricity', 
            color: 'text-rose-500', 
            bg: 'bg-rose-50', 
            desc: 'Never stay in darkness. Pay for power later.' 
        },
        { 
            label: 'Cable TV', 
            icon: <FaTv />, 
            route: 'borrow.index', // Assuming same for now
            color: 'text-amber-500', 
            bg: 'bg-amber-50', 
            desc: 'Don\'t miss your favorite shows. Subscribe on credit.' 
        },
    ];

    const stats = [
        { 
            label: 'Available Credit', 
            value: `₦${Number(eligibility?.available_credit || 0).toLocaleString()}`, 
            icon: <FaCoins className="text-sky-500" />, 
            color: 'bg-sky-50' 
        },
        { 
            label: 'Total Borrowed', 
            value: `₦${Number(summary?.total_borrowed || 0).toLocaleString()}`, 
            icon: <GiReceiveMoney className="text-emerald-500" />, 
            color: 'bg-emerald-50' 
        },
        { 
            label: 'Active Loans', 
            value: summary?.active_borrowings || 0, 
            icon: <FaClock className="text-amber-500" />, 
            color: 'bg-amber-50' 
        },
        { 
            label: 'Total Due', 
            value: `₦${Number(summary?.total_due || 0).toLocaleString()}`, 
            icon: <FaExclamationTriangle className="text-rose-500" />, 
            color: 'bg-rose-50' 
        }
    ];

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Borrowing Dashboard</h2>
                        <p className="text-sm text-slate-500">Access instant credit for your essential services</p>
                    </div>
                    <Link
                        href={route('borrow.my-borrowings')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-all text-sm font-bold"
                    >
                        <FaHistory className="text-xs" />
                        My History
                    </Link>
                </div>
            }
        >
            <Head title="Borrowing" />

            <div className="py-8 max-w-7xl mx-auto px-4 space-y-8">
                {/* Eligibility Header */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Your Credit Limit</p>
                                <h3 className="text-4xl font-black text-white">
                                    ₦{Number(eligibility?.credit_limit || 0).toLocaleString()}
                                </h3>
                                <p className="text-sky-400 text-xs font-bold mt-2 flex items-center gap-2">
                                    <FaCheckCircle /> Available: ₦{Number(eligibility?.available_credit || 0).toLocaleString()}
                                </p>
                            </div>
                            {!has_card ? (
                                <Link
                                    href={route('cards.index')}
                                    className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg shadow-rose-500/20"
                                >
                                    <FaLock className="text-xs" />
                                    Link Card to Unlock
                                </Link>
                            ) : (
                                <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md flex items-center gap-2">
                                    <FaShieldAlt className="text-sky-400 text-xs" />
                                    <span className="text-[10px] font-bold text-sky-100 uppercase tracking-widest">Verified Account</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                            <div className={`w-10 h-10 rounded-2xl ${stat.color} flex items-center justify-center mb-3`}>
                                {stat.icon}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-lg font-black text-slate-800">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Services Section */}
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-6 px-2">Choose a Service to Borrow</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {services.map((service, i) => (
                            <Link
                                key={i}
                                href={has_card ? route(service.route) : '#'}
                                className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all group relative overflow-hidden ${
                                    !has_card ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-md hover:border-sky-100'
                                }`}
                            >
                                <div className="relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl ${service.bg} ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        <span className="text-2xl">{service.icon}</span>
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">{service.label}</h4>
                                    <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-xs">{service.desc}</p>
                                    
                                    <div className="flex items-center gap-2 text-sky-500 font-bold text-sm group-hover:gap-3 transition-all">
                                        {has_card ? (
                                            <>
                                                Get Started <FaArrowRight className="text-xs" />
                                            </>
                                        ) : (
                                            <>
                                                <FaLock className="text-xs" /> Link Card to Access
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Background decoration */}
                                <div className={`absolute top-0 right-0 w-32 h-32 ${service.bg} opacity-20 blur-3xl -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100 flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0">
                        <FaInfoCircle className="text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sky-900 mb-1">Automatic Settlement</h4>
                        <p className="text-sm text-sky-700 leading-relaxed">
                            Your borrowings are automatically settled from your wallet balance or next deposit. 
                            Maintain a good credit score by ensuring your wallet is funded before the due date.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
