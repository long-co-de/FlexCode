import { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';

export default function EditPaymentMethod({ auth, paymentMethod }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: paymentMethod.name || '',
        code: paymentMethod.code || '',
        type: paymentMethod.type || '',
        logo: null,
        config: paymentMethod.config || {},
        is_active: paymentMethod.is_active,
        _method: 'PATCH',
    });

    const [previewUrl, setPreviewUrl] = useState(paymentMethod.logo || null);
    const [configFields, setConfigFields] = useState([]);

    useEffect(() => {
        // Convert config object to array of key-value pairs for editing
        const fields = [];
        if (paymentMethod.config) {
            Object.keys(paymentMethod.config).forEach(key => {
                fields.push({
                    key,
                    value: paymentMethod.config[key]
                });
            });
        }
        
        if (fields.length === 0) {
            fields.push({ key: '', value: '' });
        }
        
        setConfigFields(fields);
    }, [paymentMethod.config]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Convert config fields to object
        const configObject = {};
        configFields.forEach(field => {
            if (field.key.trim() !== '') {
                configObject[field.key] = field.value;
            }
        });
        
        // Create FormData to handle file upload
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('code', data.code);
        formData.append('type', data.type);
        formData.append('config', JSON.stringify(configObject));
        formData.append('is_active', data.is_active ? 1 : 0);
        formData.append('_method', 'PATCH');
        
        if (data.logo) {
            formData.append('logo', data.logo);
        }
        
        patch(route('admin.payment-methods.update', paymentMethod.id), formData);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setData('logo', file);
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfigChange = (index, field, value) => {
        const updatedFields = [...configFields];
        updatedFields[index][field] = value;
        setConfigFields(updatedFields);
    };

    const addConfigField = () => {
        setConfigFields([...configFields, { key: '', value: '' }]);
    };

    const removeConfigField = (index) => {
        const updatedFields = [...configFields];
        updatedFields.splice(index, 1);
        setConfigFields(updatedFields);
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Edit Payment Method</h2>}
        >
            <Head title="Edit Payment Method" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <InputLabel htmlFor="name" value="Method Name" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="code" value="Method Code" />
                                    <TextInput
                                        id="code"
                                        type="text"
                                        name="code"
                                        value={data.code}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('code', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.code} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="type" value="Method Type" />
                                    <select
                                        id="type"
                                        name="type"
                                        value={data.type}
                                        className="mt-1 block w-full border-gray-300 focus:border-primary-500 focus:ring-primary-500 rounded-md shadow-sm"
                                        onChange={(e) => setData('type', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="card">Card</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="wallet">Wallet</option>
                                        <option value="ussd">USSD</option>
                                        <option value="qr">QR Code</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <InputError message={errors.type} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="logo" value="Method Logo" />
                                    <input
                                        id="logo"
                                        type="file"
                                        name="logo"
                                        className="mt-1 block w-full"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                    />
                                    <InputError message={errors.logo} className="mt-2" />
                                    
                                    {previewUrl && (
                                        <div className="mt-2">
                                            <p className="text-sm igg-500 mb-1">Current Logo:</p>
                                            <img src={previewUrl} alt="Preview" className="h-20 w-20 object-contain border rounded" />
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <InputLabel value="Configuration" />
                                    <div className="mt-2 space-y-2">
                                        {configFields.map((field, index) => (
                                            <div key={index} className="flex space-x-2">
                                                <TextInput
                                                    type="text"
                                                    placeholder="Key"
                                                    value={field.key}
                                                    className="w-1/3"
                                                    onChange={(e) => handleConfigChange(index, 'key', e.target.value)}
                                                />
                                                <TextInput
                                                    type="text"
                                                    placeholder="Value"
                                                    value={field.value}
                                                    className="w-1/2"
                                                    onChange={(e) => handleConfigChange(index, 'value', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeConfigField(index)}
                                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addConfigField}
                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Add Field
                                        </button>
                                    </div>
                                    <InputError message={errors.config} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center">
                                        <input
                                            id="is_active"
                                            type="checkbox"
                                            name="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <InputLabel htmlFor="is_active" value="Active" className="ml-2" />
                                    </div>
                                    <InputError message={errors.is_active} className="mt-2" />
                                </div>

                                <div className="flex items-center justify-end mt-4">
                                    <Button
                                        type="button"
                                        className="mr-4 bg-base-200 mm--300 igg-800"
                                        onClick={() => window.history.back()}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="ml-4" processing={processing}>
                                        Update Payment Method
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