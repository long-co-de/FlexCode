import { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
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
    FaExchangeAlt,FaShieldAlt,
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
        switch (transaction.status) {
            case "success" || "successful":
                return {
                    bg: "bg-emerald-50",
                    text: "text-emerald-600",
                    icon: <FaCheckCircle className="text-emerald-500" />,
                    pill: "bg-emerald-100 text-emerald-700"
                };
            case "pending":
                return {
                    bg: "bg-amber-50",
                    text: "text-amber-600",
                    icon: <FaExclamationCircle className="text-amber-500" />,
                    pill: "bg-amber-100 text-amber-700"
                };
            default:
                return {
                    bg: "bg-rose-50",
                    text: "text-rose-600",
                    icon: <FaTimesCircle className="text-rose-500" />,
                    pill: "bg-rose-100 text-rose-700"
                };
        }
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
                        className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <FaArrowLeft className="text-xs" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Receipt</h2>
                        <p className="text-sm font-medium text-slate-500">Transaction details</p>
                    </div>
                </div>
            }
        >
            <Head title="Transaction Details" />

            <div className="py-6 sm:py-8">
                <div className="max-w-xl mx-auto px-4">
                    {/* Receipt Card */}
                    <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        {/* Header Branding */}
                        <div className={`p-6 sm:p-8 text-center border-b border-dashed border-slate-100 relative ${styles.bg}`}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-20"></div>
                            <img src="/logo.jpg" alt="Logo" className="h-10 sm:h-12 mx-auto mb-6 rounded-xl shadow-sm" />
                            
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] bg-white shadow-lg flex items-center justify-center mx-auto mb-4 text-3xl sm:text-4xl">
                                {styles.icon}
                            </div>
                            
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">
                                ₦{transaction.amount.toLocaleString()}
                            </h3>
                            <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${styles.pill}`}>
                                {transaction.status}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                                {formatDate(transaction.created_at)}
                            </p>
                        </div>

                        {/* Details Grid */}
                        <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
                            <div className="grid gap-4">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 group">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</span>
                                    <button 
                                        onClick={copyReference}
                                        className="flex items-center gap-2 font-black text-slate-800 hover:text-sky-600 transition-colors min-w-0"
                                    >
                                        <span className="text-xs sm:text-sm tracking-tighter truncate">{transaction.reference}</span>
                                        <FaCopy className={`text-xs flex-shrink-0 ${copySuccess ? 'text-emerald-500' : 'text-slate-300'}`} />
                                    </button>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
                                    <span className="text-[10px] sm:text-xs font-black text-slate-800 capitalize bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 uppercase">
                                        {transaction.type.replace("_", " ")}
                                    </span>
                                </div>

                                {transaction.fee > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Fee</span>
                                        <span className="text-sm font-black text-rose-500">₦{transaction.fee.toLocaleString()}</span>
                                    </div>
                                )}

                                {transaction.recipient && (
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Recipient</span>
                                        <span className="text-sm font-black text-slate-800 truncate">{transaction.recipient}</span>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Description</span>
                                    <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                                        {transaction.description}
                                    </p>
                                </div>

                                {transaction.meta_data && Object.keys(transaction.meta_data).length > 0 && (
                                    <div className="pt-4 space-y-4">
                                        {transaction.meta_data.payment_method && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</span>
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">{transaction.meta_data.payment_method}</span>
                                            </div>
                                        )}
                                        {transaction.meta_data.coupon_code && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coupon</span>
                                                <span className="text-sm font-black text-sky-600 tracking-widest">{transaction.meta_data.coupon_code}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Security Footer */}
                        <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-3">
                            <FaShieldAlt className="text-slate-300 text-xs" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure Transaction Receipt</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-8">
                        <a
                            href={route("transactions.receipt", transaction.id)}
                            className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
                        >
                            <FaDownload className="text-sky-500" /> Save Receipt
                        </a>

                        <button
                            onClick={() => setShowShareModal(true)}
                            className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
                        >
                            <FaShare className="text-sky-400" /> Share via Email
                        </button>
                    </div>
                </div>
            </div>

            {/* Share Receipt Modal */}
            <Modal show={showShareModal} onClose={() => setShowShareModal(false)} maxWidth="sm">
                <div className="p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <FaEnvelope className="text-sky-500 text-xl" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Share Receipt</h3>
                        <p className="text-slate-500 text-xs font-medium">Send this receipt to an email address</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <InputLabel value="Email Address" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1" />
                            <TextInput
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                className="w-full p-4 rounded-xl sm:rounded-2xl border-slate-100 focus:border-sky-500 focus:ring-sky-200 font-bold"
                                placeholder="recipient@example.com"
                                required
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Send Now <FaArrowRight className="text-[10px]" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </Modal>
        </AppLayout>
    );
}
