import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';

export default function EditCableProvider({ auth, cableProvider }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: cableProvider.name || '',
        code: cableProvider.code || '',
        logo: null,
        is_active: cableProvider.is_active,
        _method: 'PATCH',
    });

    const [previewUrl, setPreviewUrl] = useState(cableProvider.logo || null);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Create FormData to handle file upload
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('code', data.code);
        formData.append('is_active', data.is_active ? 1 : 0);
        formData.append('_method', 'PATCH');
        
        if (data.logo) {
            formData.append('logo', data.logo);
        }
        
        patch(route('admin.cable-providers.update', cableProvider.id), formData);
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

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Edit Cable Provider</h2>}
        >
            <Head title="Edit Cable Provider" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <InputLabel htmlFor="name" value="Provider Name" />
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
                                    <InputLabel htmlFor="code" value="Provider Code" />
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
                                    <InputLabel htmlFor="logo" value="Provider Logo" />
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
                                        Update Provider
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