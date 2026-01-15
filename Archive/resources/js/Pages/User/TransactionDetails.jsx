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
    FaExchangeAlt,
    FaArrowDown,
    FaArrowUp,
} from "react-icons/fa";

export default function TransactionDetails({ auth, transaction }) {
    const [showShareModal, setShowShareModal] = useState(false);

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

    const getStatusIcon = () => {
        if (transaction.status === "successful") {
            return <FaCheckCircle className="text-green-500 text-4xl" />;
        } else if (transaction.status === "pending") {
            return <FaExclamationCircle className="text-yellow-500 text-4xl" />;
        } else {
            return <FaTimesCircle className="text-red-500 text-4xl" />;
        }
    };

    const getTransactionIcon = () => {
        switch (transaction.type) {
            case "wallet_funding":
                return <FaArrowDown className="text-green-500 text-2xl" />;
            case "wallet_transfer":
                return <FaExchangeAlt className="text-blue-500 text-2xl" />;
            case "withdrawal":
                return <FaArrowUp className="text-red-500 text-2xl" />;
            default:
                return <FaWallet className="igg-500 text-2xl" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center">
                    <Link href={route("transactions")} className="mr-4">
                        <FaArrowLeft className="igg-600" />
                    </Link>
                    <h2 className="font-semibold text-xl igg-800 leading-tight">
                        Transaction Details
                    </h2>
                </div>
            }
        >
            <Head title="Transaction Details" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    {/* Transaction Status Card */}
                    <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 flex flex-col items-center justify-center">
                            <div className="my-2">
                                <img src="/logo.jpg" alt="" className=" h-16" />
                            </div>
                            <div className="mb-4  items-center">
                                {getStatusIcon()}
                            </div>
                            <h3 className="text-2xl font-bold mb-2">
                                ₦{transaction.amount.toLocaleString()}
                            </h3>
                            <p
                                className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                    transaction.status === "successful"
                                        ? "bg-green-100 text-green-800"
                                        : transaction.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                }`}
                            >
                                {transaction.status.toUpperCase()}
                            </p>
                            <p className="igg-500 mt-2">
                                {formatDate(transaction.created_at)}
                            </p>
                        </div>
                    </div>

                    {/* Transaction Details Card */}
                    <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <h3 className="text-lg font-medium mb-4">
                                Transaction Details
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="igg-600">
                                        Transaction Type
                                    </span>
                                    <div className="flex items-center">
                                        <span className="mr-2">
                                            {getTransactionIcon()}
                                        </span>
                                        <span className="font-medium capitalize">
                                            {transaction.type.replace("_", " ")}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="igg-600">Reference</span>
                                    <span className="font-medium">
                                        {transaction.reference}
                                    </span>
                                </div>

                                {transaction.fee > 0 && (
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="igg-600">Fee</span>
                                        <span className="font-medium">
                                            ₦{transaction.fee.toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                {transaction.recipient && (
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="igg-600">
                                            Recipient
                                        </span>
                                        <span className="font-medium">
                                            {transaction.recipient}
                                        </span>
                                    </div>
                                )}

                                {transaction.description && (
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="igg-600">
                                            Description
                                        </span>
                                        <span className="font-medium text-right max-w-xs">
                                            {transaction.description}
                                        </span>
                                    </div>
                                )}

                                {transaction.meta_data &&
                                    Object.keys(transaction.meta_data).length >
                                        0 && (
                                        <>
                                            {transaction.meta_data
                                                .payment_method && (
                                                <div className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="igg-600">
                                                        Payment Method
                                                    </span>
                                                    <span className="font-medium">
                                                        {
                                                            transaction
                                                                .meta_data
                                                                .payment_method
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {transaction.meta_data
                                                .coupon_code && (
                                                <div className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="igg-600">
                                                        Coupon Code
                                                    </span>
                                                    <span className="font-medium">
                                                        {
                                                            transaction
                                                                .meta_data
                                                                .coupon_code
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4">
                        <a
                            href={route("transactions.receipt", transaction.id)}
                            className="inline-flex items-center px-4 py-2 bg-base-100 -ws border border-gray-300 rounded-md font-semibold text-xs igg-700 uppercase tracking-widest shadow-sm hover:bg-base-200 mm--50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            <FaDownload className="mr-2" /> Download Receipt
                        </a>

                        <button
                            onClick={() => setShowShareModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-primary border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-dark focus:bg-primary-dark active:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            <FaShare className="mr-2" /> Share Receipt
                        </button>
                    </div>
                </div>
            </div>

            {/* Share Receipt Modal */}
            <Modal
                show={showShareModal}
                onClose={() => setShowShareModal(false)}
            >
                <div className="p-6">
                    <h2 className="text-lg font-medium igg-900 mb-4">
                        Share Receipt
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <InputLabel htmlFor="email" value="Email Address" />
                            <TextInput
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button
                                type="button"
                                className="mr-2"
                                onClick={() => setShowShareModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="ml-2"
                                processing={processing}
                            >
                                Send Receipt
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AppLayout>
    );
}
