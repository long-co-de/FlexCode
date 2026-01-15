import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import Button from '@/Components/Button';

export default function PlanTypeProfitsCreate({ auth, availablePlanTypes }) {
    const { data, setData, post, processing, errors } = useForm({
        plan_type: '',
        profit_percentage: 5.00,
        is_active: true,
    });
    
    const [customPlanType, setCustomPlanType] = useState(false);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.plan-type-profits.store'));
    };
    
    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Add Plan Type Profit Percentage</h2>}
        >
            <Head title="Add Plan Type Profit Percentage" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-6">
                                    <InputLabel htmlFor="plan_type" value="Plan Type" />
                                    
                                    {availablePlanTypes.length > 0 && !customPlanType ? (
                                        <div className="mt-1">
                                            <select
                                                id="plan_type"
                                                className="select select-bordered w-full"
                                                value={data.plan_type}
                                                onChange={(e) => setData('plan_type', e.target.value)}
                                            >
                                                <option value="">Select a plan type</option>
                                                {availablePlanTypes.map((type) => (
                                                    <option key={type} value={type}>
                                                        {type}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <TextInput
                                            id="plan_type"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.plan_type}
                                            onChange={(e) => setData('plan_type', e.target.value)}
                                        />
                                    )}
                                    
                                    {availablePlanTypes.length > 0 && (
                                        <div className="mt-2">
                                            <label className="flex items-center">
                                                <Checkbox
                                                    name="custom_plan_type"
                                                    checked={customPlanType}
                                                    onChange={(e) => {
                                                        setCustomPlanType(e.target.checked);
                                                        if (!e.target.checked) {
                                                            setData('plan_type', '');
                                                        }
                                                    }}
                                                />
                                                <span className="ml-2 text-sm igg-600">
                                                    Enter custom plan type
                                                </span>
                                            </label>
                                        </div>
                                    )}
                                    
                                    <InputError message={errors.plan_type} className="mt-2" />
                                </div>
                                
                                <div className="mb-6">
                                    <InputLabel htmlFor="profit_percentage" value="Profit Percentage (%)" />
                                    <TextInput
                                        id="profit_percentage"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        className="mt-1 block w-full"
                                        value={data.profit_percentage}
                                        onChange={(e) => setData('profit_percentage', e.target.value)}
                                    />
                                    <InputError message={errors.profit_percentage} className="mt-2" />
                                </div>
                                
                                <div className="mb-6">
                                    <label className="flex items-center">
                                        <Checkbox
                                            name="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <span className="ml-2 text-sm igg-600">
                                            Active
                                        </span>
                                    </label>
                                </div>
                                
                                <div className="flex items-center justify-end mt-4">
                                    <Link
                                        href={route('admin.plan-type-profits.index')}
                                        className="btn btn-outline mr-2"
                                    >
                                        Cancel
                                    </Link>
                                    <Button className="btn btn-primary" disabled={processing}>
                                        Create
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}