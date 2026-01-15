import { Link, router, useForm } from "@inertiajs/react";
import { FaShieldAlt, FaUser, FaLock, FaArrowRight, FaCheckCircle, FaLightbulb, FaExchangeAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import TextInput from "@/Components/TextInput";
import InputError from '@/Components/InputError';
import { useState, useEffect } from "react";

function WebviewWelcome({ auth }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isReturningUser, setIsReturningUser] = useState(false);

    useEffect(() => {
        const storedName = localStorage?.getItem("last_name") || (auth?.user?.name ?? "");
        const storedEmail = localStorage?.getItem("auth_email") || (auth?.user?.email ?? "");
        setName(storedName);
        setEmail(storedEmail);
        // Set returning user if email exists
        setIsReturningUser(!!storedEmail);
    }, [auth]);

    if (auth.user) {
        router.get("/dashboard");
    }

    const { data, setData, post, processing, errors, reset } = useForm({
        email: email,
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("login"));
    };

    const handleSwitchAccount = () => {
        // Clear stored email and redirect to login
        localStorage.removeItem("auth_email");
        localStorage.removeItem("last_name");
        router.get(route('login'));
    };

    const features = [
        "Borrow Airtime, Data & Electricity",
        "Pay Back Easily in 7-30 Days",
        "Bill Payments",
        "Build Your Credit Score",
        "Active Card Required"
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/70">
            {/* Header Section */}
            <div className="relative h-[45vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                <div className="relative h-full flex flex-col items-center justify-center px-6">
                    {/* Animated Logo */}
                    <div className="mb-6 animate-bounce-slow">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-30 animate-pulse"></div>
                            <div className="relative bg-white rounded-full p-4 shadow-2xl transform transition-transform hover:scale-105">
                                <img
                                    src="/ico.png"
                                    alt="App Logo"
                                    className="w-20 h-20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Greeting Section */}
                    <div className="text-center text-white space-y-3 max-w-md">
                        <h3 className="text-3xl font-bold animate-slide-up">
                            Hello{name ? `, ${name}` : "!"} 👋
                        </h3>
                        <p className="text-white/90 text-lg leading-relaxed animate-slide-up animation-delay-100">
                            {name 
                                ? "Welcome back! Let's get you signed in." 
                                : "Ready to join thousands managing their finances smarter?"
                            }
                        </p>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                        <div className="w-64 h-8 bg-base-100 rounded-t-full shadow-lg"></div>
                    </div>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="relative bg-base-100 min-h-[55vh] rounded-t-[3rem] -mt-8 shadow-2xl">
                <div className="p-6">
                    {!isReturningUser ? (
                        <div className="space-y-8 animate-fade-in">
                            {/* Features Card */}
                            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <FaShieldAlt className="text-primary text-xl" />
                                    <h4 className="text-lg font-semibold text-primary">Why Choose Us?</h4>
                                </div>
                                
                                <div className="space-y-3">
                                    {features.map((feature, index) => (
                                        <div 
                                            key={index}
                                            className="flex items-center gap-3 animate-slide-right"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <FaCheckCircle className="text-green-500" />
                                            <span className="text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                    <div className="flex items-start gap-3">
                                        <FaLightbulb className="text-yellow-500 mt-1" />
                                        <p className="text-sm text-yellow-800">
                                            <strong>Pro Tip:</strong> Keep a good credit record to unlock better benefits and higher limits.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Badge */}
                            <div className="text-center">
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                                    <FaUser className="text-sm" />
                                    <span className="font-semibold">1,000+ Active Users</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-4">
                                <Link
                                    href={route("register")}
                                    className="block w-full"
                                >
                                    <button className="btn btn-primary w-full rounded-full  text-lg font-semibold shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] group">
                                        <span>Start Your Journey</span>
                                        <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>

                                <div className="text-center pt-4">
                                    <p className="text-gray-600">
                                        Already have an account?{" "}
                                        <Link 
                                            href={route("login")}
                                            className="text-primary font-semibold hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                                        >
                                            Sign In
                                            <FaArrowRight className="text-sm" />
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto space-y-8 animate-fade-in">
                            {/* Welcome Back Header */}
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <FaUser className="text-primary text-xl" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-semibold text-gray-800">Welcome back, {name}</h4>
                                        <p className="text-sm text-gray-500">Enter your password to continue</p>
                                    </div>
                                </div>
                                
                                {/* Switch Account Button */}
                                <button
                                    onClick={handleSwitchAccount}
                                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
                                >
                                    <FaExchangeAlt className="text-xs" />
                                    <span>Not {name}? Switch account</span>
                                </button>
                            </div>

                            {/* Login Form */}
                            <form onSubmit={submit} className="space-y-6">
                                <div className="space-y-1">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Password for your account
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FaLock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <TextInput
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={data.password}
                                            className="pl-10 pr-10 pl-10 block w-full rounded-xl border border-gray-200 bg-white py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                                            autoComplete="current-password"
                                            onChange={(e) => setData("password", e.target.value)}
                                            placeholder="Enter your password"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? (
                                                <span className="text-sm">Hide</span>
                                            ) : (
                                                <span className="text-sm">Show</span>
                                            )}
                                        </button>
                                    </div>
                                    <InputError
                                        message={errors.password}
                                        className="text-sm mt-1"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                            className="checkbox checkbox-primary checkbox-sm"
                                        />
                                        <span className="text-sm text-gray-600">Remember this device</span>
                                    </label>
                                    
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm text-primary hover:text-primary/80 font-medium"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="btn btn-primary w-full rounded-full p text-lg font-semibold shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Signing in...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                Continue to Dashboard
                                                <FaArrowRight />
                                            </span>
                                        )}
                                    </button>

                                    {/* Alternative Login Options */}
                                    <div className="pt-4">
                                        <button
                                            type="button"
                                            onClick={handleSwitchAccount}
                                            className="w-full btn btn-outline btn-sm rounded-full border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                                        >
                                            Sign in with different email
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Bottom Section */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                {/* Security Badge */}
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                                        <FaShieldAlt className="text-green-500" />
                                        <span>Your data is protected with 256-bit encryption</span>
                                    </div>
                                </div>

                                {/* Need Help Section */}
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">
                                        Need help?{" "}
                                        <Link 
                                            href="#"
                                            className="text-primary hover:text-primary/80 font-medium"
                                        >
                                            Contact Support
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add CSS animations */}
            <style jsx>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slide-right {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                
                .animate-slide-up {
                    animation: slide-up 0.6s ease-out;
                }
                
                .animate-slide-right {
                    animation: slide-right 0.5s ease-out forwards;
                    opacity: 0;
                }
                
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out;
                }
                
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
                
                .animation-delay-100 {
                    animation-delay: 100ms;
                }
            `}</style>
        </div>
    );
}

export default WebviewWelcome;