import { Head, Link } from "@inertiajs/react";
import AgentLayout from "@/Layouts/AgentLayout";
import { FaArrowLeft } from "react-icons/fa";

export default function TransactionDetails({ auth, transaction }) {
    return (
        <AgentLayout
            user={auth.user}
            header={
                <div className="flex items-center">
                    <Link href={route("agent.transactions")} className="mr-4">
                        <FaArrowLeft className="igg-600" />
                    </Link>
                    <h2 className="font-semibold text-xl igg-800 leading-tight">
                        Transaction Details
                    </h2>
                </div>
            }
        >
            <Head title="Agent Transaction Details" />

            <div className="py-8">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 -ws shadow-sm sm:rounded-lg">
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <div className="igg-600 text-sm">Reference</div>
                                    <div className="font-medium">{transaction.reference}</div>
                                </div>
                                <div>
                                    <div className="igg-600 text-sm">User</div>
                                    <div className="font-medium">{transaction.user?.name || "Unknown"}</div>
                                </div>
                                <div>
                                    <div className="igg-600 text-sm">Amount</div>
                                    <div className="font-medium">₦{Number(transaction.amount).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="igg-600 text-sm">Status</div>
                                    <div className="font-medium capitalize">{transaction.status}</div>
                                </div>
                                <div>
                                    <div className="igg-600 text-sm">Type</div>
                                    <div className="font-medium capitalize">{String(transaction.type || "").replace("_", " ")}</div>
                                </div>
                                <div>
                                    <div className="igg-600 text-sm">Date</div>
                                    <div className="font-medium">{transaction.created_at}</div>
                                </div>
                            </div>

                            {transaction.description && (
                                <div className="pt-4 border-t border-base-200">
                                    <div className="igg-600 text-sm mb-1">Description</div>
                                    <div className="font-medium">{transaction.description}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AgentLayout>
    );
}
