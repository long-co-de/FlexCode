import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import Button from '@/Components/Button';

export default function PlanTypeProfitsEdit({ auth, planTypeProfit }) {
    const { data, setData, patch, processing, errors } = useForm({
        profit_percentage: planTypeProfit.profit_percentage,
        is_active: planTypeProfit.is_active,
    });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('admin.plan-type-profits.update', planTypeProfit.id));
    };
    
    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">Edit Plan Type Profit Percentage</h2>}
        >
            <Head title="Edit Plan Type Profit Percentage" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <div className="mb-6">
                                <InputLabel htmlFor="plan_type" value="Plan Type" />
                                <div className="mt-1 text-lg font-medium">{planTypeProfit.plan_type}</div>
                            </div>
                            
                            <form onSubmit={handleSubmit}>
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
                                        Update
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