import { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import Modal from "@/Components/Modal";
import {
    FaArrowLeft,
    FaDownload,
    FaShare,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationCircle,
    FaWallet,
    FaExchangeAlt,
    FaShieldAlt,
    FaArrowDown,
    FaArrowUp,
    FaCopy,
    FaPrint,
    FaEnvelope,
    FaArrowRight
} from "react-icons/fa";

export default function TransactionDetails({ auth, transaction }) {
    const [showShareModal, setShowShareModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("transactions.share", transaction.id), {
            onSuccess: () => {
                reset();
                setShowShareModal(false);
            },
        });
    };

    const getStatusStyles = () => {
        const status = transaction.status.toLowerCase();
        if (status === "success" || status === "successful") {
            return {
                bg: "bg-success/10",
                text: "text-success",
                icon: <FaCheckCircle className="text-success" />,
                pill: "bg-success text-success-content"
            };
        }
        if (status === "pending") {
            return {
                bg: "bg-warning/10",
                text: "text-warning",
                icon: <FaExclamationCircle className="text-warning" />,
                pill: "bg-warning text-warning-content"
            };
        }
        return {
            bg: "bg-error/10",
            text: "text-error",
            icon: <FaTimesCircle className="text-error" />,
            pill: "bg-error text-error-content"
        };
    };

    const styles = getStatusStyles();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const copyReference = () => {
        navigator.clipboard.writeText(transaction.reference);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link 
                        href={route("transactions")} 
                        className="btn btn-ghost btn-circle"
                    >
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-base-content">Receipt</h2>
                        <p className="text-sm text-base-content/60">Transaction details</p>
                    </div>
                </div>
            }
        >
            <Head title="Transaction Details" />

            <div className="py-6 sm:py-8">
                <div className="max-w-xl mx-auto px-4">
                    {/* Receipt Card */}
                    <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden rounded-3xl sm:rounded-[2.5rem]">
                        {/* Header Branding */}
                        <div className={`p-6 sm:p-8 text-center border-b border-base-300 ${styles.bg}`}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-base-content/10 to-transparent"></div>
                            <img 
                                src="/logo.jpg" 
                                alt="Logo" 
                                className="h-10 sm:h-12 mx-auto mb-6 rounded-xl shadow-sm bg-base-200 p-2" 
                            />
                            
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] bg-base-100 shadow-lg flex items-center justify-center mx-auto mb-4 text-3xl sm:text-4xl">
                                {styles.icon}
                            </div>
                            
                            <h3 className="text-2xl sm:text-3xl font-bold text-base-content mb-2">
                                ₦{transaction.amount.toLocaleString()}
                            </h3>
                            <div className={`badge badge-lg ${styles.pill} font-black uppercase tracking-widest`}>
                                {transaction.status}
                            </div>
                            <p className="text-xs text-base-content/60 font-bold uppercase tracking-widest mt-4">
                                {formatDate(transaction.created_at)}
                            </p>
                        </div>

                        {/* Details Grid */}
                        <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
                            <div className="grid gap-4">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 group">
                                    <span className="text-xs font-bold text-base-content/60 uppercase tracking-widest">Reference</span>
                                    <button 
                                        onClick={copyReference}
                                        className="flex items-center gap-2 font-bold text-base-content hover:text-primary transition-colors min-w-0"
                                    >
                                        <span className="text-sm tracking-tighter truncate">{transaction.reference}</span>
                                        <FaCopy className={`text-xs flex-shrink-0 ${copySuccess ? 'text-success' : 'text-base-content/30'}`} />
                                    </button>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-base-content/60 uppercase tracking-widest">Type</span>
                                    <span className="text-xs font-bold text-base-content capitalize badge badge-outline uppercase">
                                        {transaction.type.replace("_", " ")}
                                    </span>
                                </div>

                                {transaction.fee > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-base-content/60 uppercase tracking-widest">Service Fee</span>
                                        <span className="text-sm font-bold text-error">₦{transaction.fee.toLocaleString()}</span>
                                    </div>
                                )}

                                {transaction.recipient && (
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-xs font-bold text-base-content/60 uppercase tracking-widest whitespace-nowrap">Recipient</span>
                                        <span className="text-sm font-bold text-base-content truncate">{transaction.recipient}</span>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-base-300">
                                    <span className="text-xs font-bold text-base-content/60 uppercase tracking-widest block mb-2">Description</span>
                                    <p className="text-sm font-bold text-base-content/80 leading-relaxed bg-base-200 p-4 rounded-2xl border border-base-300">
                                        {transaction.description}
                                    </p>
                                </div>

                                {transaction.meta_data && Object.keys(transaction.meta_data).length > 0 && (
                                    <div className="pt-4 space-y-4">
                                        {transaction.meta_data.payment_method && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-base-content/60 uppercase tracking-widest">Method</span>
                                                <span className="text-sm font-bold text-base-content uppercase tracking-tighter">{transaction.meta_data.payment_method}</span>
                                            </div>
                                        )}
                                        {transaction.meta_data.coupon_code && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-base-content/60 uppercase tracking-widest">Coupon</span>
                                                <span className="text-sm font-bold text-primary tracking-widest">{transaction.meta_data.coupon_code}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Security Footer */}
                        <div className="p-4 sm:p-6 bg-base-200 border-t border-base-300 flex items-center justify-center gap-3">
                            <FaShieldAlt className="text-base-content/30 text-xs" />
                            <span className="text-xs font-bold text-base-content/60 uppercase tracking-widest">Secure Transaction Receipt</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-8">
                        <a
                            href={route("transactions.receipt", transaction.id)}
                            className="btn btn-outline rounded-2xl gap-3 py-4"
                        >
                            <FaDownload className="text-primary" /> 
                            <span className="text-xs font-bold uppercase tracking-widest">Save Receipt</span>
                        </a>

                        <button
                            onClick={() => setShowShareModal(true)}
                            className="btn btn-primary rounded-2xl gap-3 py-4"
                        >
                            <FaShare /> 
                            <span className="text-xs font-bold uppercase tracking-widest">Share via Email</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Share Receipt Modal */}
            <Modal show={showShareModal} onClose={() => setShowShareModal(false)} maxWidth="sm">
                <div className="p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <FaEnvelope className="text-primary text-xl" />
                        </div>
                        <h3 className="text-xl font-bold text-base-content">Share Receipt</h3>
                        <p className="text-base-content/60 text-sm">Send this receipt to an email address</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <InputLabel 
                                value="Email Address" 
                                className="text-xs font-bold text-base-content/60 uppercase tracking-widest mb-2" 
                            />
                            <TextInput
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                className="input input-bordered w-full"
                                placeholder="recipient@example.com"
                                required
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn btn-primary w-full py-4 rounded-2xl gap-3"
                        >
                            {processing ? (
                                <span className="loading loading-spinner"></span>
                            ) : (
                                <>
                                    Send Now <FaArrowRight className="text-sm" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </Modal>
        </AppLayout>
    );
}