import { useState, useEffect, useRef } from 'react';
import { Head, useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import Button from "@/Components/Button";
import SelectInput from "@/Components/SelectInput";
import Modal from "@/Components/Modal";
import EligibilityAlert from '@/Components/EligibilityAlert';
import { FaUser, FaStar, FaRegStar, FaSearch, FaTimes } from "react-icons/fa";
import axios from "axios";

export default function Electricity({
    auth,
    electricityProviders,
    beneficiaries = [],
    eligibility,
    hasActiveCard,
}) {
    const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [useBNPL, setUseBNPL] = useState(false);
    const [data, setData] = useState({
        meter_number: "",
        meter_type: "prepaid",
        electricity_provider_id: "",
        beneficiary_id: "",
        amount: "",
    });
    const [verifyingPin, setVerifyingPin] = useState(false);
    const [pin, setPin] = useState("");
    const [meterVerified, setMeterVerified] = useState(false);
    const [meterInfo, setMeterInfo] = useState(null);
    const [error, setError] = useState(null);

    const handleBNPLToggle = (checked) => {
        if (checked && !hasActiveCard) {
            window.location.href = route('cards.link', { return_to: route('buy.electricity') });
            return;
        }
        setUseBNPL(checked);
    };

    const handleVerifySmartCard = async () => {
        if (!data.smart_card_number || !data.cable_provider_id) return;

        setVerificationStatus(null);
        try {
            const res = await axios.post(route("cable.verify"), {
                cable_provider_id: data.cable_provider_id,
                smart_card_number: data.smart_card_number,
            });
            setVerificationStatus({
                status: "success",
                message: res.data.message || "Smart card verified successfully",
                customer_name: res.data.data?.customer_name || "",
            });
            setData("customer_name", res.data.data?.customer_name || "");
        } catch (e) {
            const msg = e?.response?.data?.message || "Verification failed";
            setVerificationStatus({ status: "error", message: msg });
        }
    };

    const handlePinSubmit = () => {
        setVerifyingPin(true);
        // Simulate purchase API call
        setTimeout(() => {
            setVerifyingPin(false);
            alert("Purchase successful!");
        }, 1000);
    };

    const handleBeneficiarySelect = (beneficiary) => {
        setSelectedBeneficiary(beneficiary);
        setData({
            ...data,
            meter_number: beneficiary.meter_number,
            meter_type: beneficiary.meta_data?.meter_type || "prepaid",
            electricity_provider_id: beneficiary.electricity_provider_id,
            beneficiary_id: beneficiary.id,
        });
        const provider = electricityProviders.find(
            (p) =>
                p.id.toString() ===
                beneficiary.electricity_provider_id.toString()
        );
        if (provider) {
            setSelectedProvider(provider);
        }
        handleVerifyMeter();
    };

    const filteredBeneficiaries = beneficiaries
        ? beneficiaries.filter(
              (b) =>
                  b.service_type === "electricity" &&
                  (b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      b.meter_number.includes(searchTerm))
          )
        : [];
    useEffect(() => {
        const loadPlans = async () => {
            if (!selectedProvider) return setCablePlans([]);
            try {
                const res = await axios.get(
                    route("cable.plans", selectedProvider.id)
                );
                setCablePlans(res.data || []);
            } catch {
                setCablePlans(selectedProvider.cable_plans || []);
            }
        };
        loadPlans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProvider?.id]);

    // Remove the isavaiale check and show the real UI
    return (
        <AppLayout user={auth.user}>
            <Head title="Electricity Bill Payment" />
            <div className="max-w-2xl mx-auto p-4">
                {eligibility && <EligibilityAlert eligibility={eligibility} />}
                
                <h2 className="text-2xl font-bold mb-4">
                    Pay Electricity Bill
                </h2>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useBNPL}
                            onChange={(e) => handleBNPLToggle(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                        />
                        <span className="ml-3 font-medium text-gray-900">
                            💳 Buy Now, Pay Later
                        </span>
                    </label>
                    <p className="text-sm text-gray-600 mt-2">
                        Borrow electricity credit and repay within 30 days with auto-deduction
                    </p>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Search beneficiary by name or meter number"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1 font-semibold">
                        Select Beneficiary
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        {filteredBeneficiaries.map((b) => (
                            <button
                                key={b.id}
                                className={`btn btn-outline btn-sm ${
                                    selectedBeneficiary?.id === b.id
                                        ? "btn-primary"
                                        : ""
                                }`}
                                onClick={() => handleBeneficiarySelect(b)}
                            >
                                {b.name} ({b.meter_number})
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
