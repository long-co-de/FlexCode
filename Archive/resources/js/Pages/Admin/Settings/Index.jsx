import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
import ApiDetailsWidget from '@/Components/ApiDetailsWidget';
import { Cog6ToothIcon, KeyIcon, PhoneIcon, TvIcon, LightBulbIcon, WalletIcon } from '@heroicons/react/24/outline';
function PercentIcon(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            {...props}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
    );
}
export default function Settings({ auth, settings, apiDetails }) {
    const [activeTab, setActiveTab] = useState('general');

    const { data, setData, post, processing, errors, reset } = useForm({
        site_name: settings.site_name || 'VTU Application',
        site_description: settings.site_description || 'Buy airtime, data, cable TV subscriptions, and pay electricity bills',
        contact_email: settings.contact_email || 'support@vtuapp.com',
        contact_phone: settings.contact_phone || '',
        husmodata_api_key: settings.husmodata_api_key || '',
        husmodata_api_url: settings.husmodata_api_url || 'https://api.husmodata.com/v1',
        // xixapay_api_key: settings.xixapay_api_key || '',
        // xixapay_secret_key: settings.xixapay_secret_key || '',
        // xixapay_base_url: settings.xixapay_base_url || 'https://api.xixapay.com/api/v1',
        // xixapay_business_id: settings.xixapay_business_id || '',
        xixapay_api_key: settings.xixapay_api_key || '',
        xixapay_secret_key: settings.xixapay_secret_key || '',
        xixapay_base_url: settings.xixapay_base_url || 'https://api.xixapay.com/api/v1',
        xixapay_business_id: settings.xixapay_business_id || '',
        airtime_profit_percentage: settings.airtime_profit_percentage || '2',
        data_profit_percentage: settings.data_profit_percentage || '5',
        cable_profit_percentage: settings.cable_profit_percentage || '3',
        electricity_profit_percentage: settings.electricity_profit_percentage || '2',
        airtime_to_cash_charge: settings.airtime_to_cash_charge || '20',
        virtual_bank_deposit_charge: settings.virtual_bank_deposit_charge || '0',
        card_payment_charge: settings.card_payment_charge || '0',
        online_payment_charge: settings.online_payment_charge || '0',
        referral_bonus_percentage: settings.referral_bonus_percentage || '1',
        min_withdrawal_amount: settings.min_withdrawal_amount || '1000',
        maintenance_mode: settings.maintenance_mode === 'true' ? true : false,
        about_content: settings.about_content || '' ,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'));
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl iggyy-updatey-800 leading-tight">System Settings</h2>}
        >
            <Head title="System Settings" />

            <div className="py-12">
                <div className="max-w-[100v h] mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 border-b border-gray-200">
                            <div className="flex flex-col md:flex-row">
                                {/* Sidebar */}
                                <div className="w-full md:w-64 mb-6 md:mb-0 md:mr-6">
                                    <div className="bg-base-200 mm--50 rounded-lg p-4">
                                        <h3 className="text-lg font-medium iggyy-updatey-900 mb-4">Settings</h3>
                                        <ul className="space-y-2">
                                            <li>
                                                <button
                                                    onClick={() => setActiveTab('general')}
                                                    className={`flex items-center w-full p-2 rounded-md ${activeTab === 'general'
                                                            ? 'bg-primary-100 text-primary-700'
                                                            : 'hover:bg-base-200 mm--100'
                                                        }`}
                                                >
                                                    <Cog6ToothIcon className="h-5 w-5 mr-2" />
                                                    General
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => setActiveTab('about')}
                                                    className={`flex items-center w-full p-2 rounded-md ${activeTab === 'about'
                                                            ? 'bg-primary-100 text-primary-700'
                                                            : 'hover:bg-base-200 mm--100'
                                                        }`}
                                                >
                                                    <LightBulbIcon className="h-5 w-5 mr-2" />
                                                    About Page
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => setActiveTab('api')}
                                                    className={`flex items-center w-full p-2 rounded-md ${activeTab === 'api'
                                                            ? 'bg-primary-100 text-primary-700'
                                                            : 'hover:bg-base-200 mm--100'
                                                        }`}
                                                >
                                                    <KeyIcon className="h-5 w-5 mr-2" />
                                                    API Settings
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => setActiveTab('profit')}
                                                    className={`flex items-center w-full p-2 rounded-md ${activeTab === 'profit'
                                                            ? 'bg-primary-100 text-primary-700'
                                                            : 'hover:bg-base-200 mm--100'
                                                        }`}
                                                >
                                                    <PercentIcon className="h-5 w-5 mr-2" />
                                                    Profit Margins
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => setActiveTab('payment')}
                                                    className={`flex items-center w-full p-2 rounded-md ${activeTab === 'payment'
                                                            ? 'bg-primary-100 text-primary-700'
                                                            : 'hover:bg-base-200 mm--100'
                                                        }`}
                                                >
                                                    <WalletIcon className="h-5 w-5 mr-2" />
                                                    Payment Charges
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => setActiveTab('referral')}
                                                    className={`flex items-center w-full p-2 rounded-md ${activeTab === 'referral'
                                                            ? 'bg-primary-100 text-primary-700'
                                                            : 'hover:bg-base-200 mm--100'
                                                        }`}
                                                >
                                                    <WalletIcon className="h-5 w-5 mr-2" />
                                                    Referral System
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Main Content */}
                                <div className="flex-1">
                                    <form onSubmit={handleSubmit}>
                                        {/* General Settings */}
                                        {activeTab === 'general' && (
                                            <div>
                                                <h3 className="text-lg font-medium iggyy-updatey-900 mb-4">General Settings</h3>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                    <div>
                                                        <InputLabel htmlFor="site_name" value="Site Name" />
                                                        <TextInput
                                                            id="site_name"
                                                            type="text"
                                                            className="mt-1 block w-full"
                                                            value={data.site_name}
                                                            onChange={(e) => setData('site_name', e.target.value)}
                                                            required
                                                        />
                                                        <InputError message={errors.site_name} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor="site_description" value="Site Description" />
                                                        <TextInput
                                                            id="site_description"
                                                            type="text"
                                                            className="mt-1 block w-full"
                                                            value={data.site_description}
                                                            onChange={(e) => setData('site_description', e.target.value)}
                                                        />
                                                        <InputError message={errors.site_description} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor="contact_email" value="Contact Email" />
                                                        <TextInput
                                                            id="contact_email"
                                                            type="email"
                                                            className="mt-1 block w-full"
                                                            value={data.contact_email}
                                                            onChange={(e) => setData('contact_email', e.target.value)}
                                                            required
                                                        />
                                                        <InputError message={errors.contact_email} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor="contact_phone" value="Contact Phone" />
                                                        <TextInput
                                                            id="contact_phone"
                                                            type="text"
                                                            className="mt-1 block w-full"
                                                            value={data.contact_phone}
                                                            onChange={(e) => setData('contact_phone', e.target.value)}
                                                        />
                                                        <InputError message={errors.contact_phone} className="mt-2" />
                                                    </div>
                                                </div>

                                                <div className="mb-6">
                                                    <div className="flex items-center">
                                                        <input
                                                            id="maintenance_mode"
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                                            checked={data.maintenance_mode}
                                                            onChange={(e) => setData('maintenance_mode', e.target.checked)}
                                                        />
                                                        <label htmlFor="maintenance_mode" className="ml-2 block text-sm iggyy-updatey-900">
                                                            Enable Maintenance Mode
                                                        </label>
                                                    </div>
                                                    <p className="mt-1 text-sm iggyy-updatey-500">
                                                        When enabled, only administrators can access the site.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* About Page */}
                                        {activeTab === 'about' && (
                                            <div>
                                                <h3 className="text-lg font-medium iggyy-updatey-900 mb-4">About Page Content</h3>
                                                <p className="text-sm iggyy-updatey-500 mb-4">HTML supported. This content is displayed on the public About page.</p>
                                                <div>
                                                    <InputLabel htmlFor="about_content" value="About Content (HTML)" />
                                                    <textarea
                                                        id="about_content"
                                                        className="mt-1 block w-full textarea textarea-bordered min-h-[220px]"
                                                        value={data.about_content}
                                                        onChange={(e) => setData('about_content', e.target.value)}
                                                    />
                                                    <InputError message={errors.about_content} className="mt-2" />
                                                </div>
                                            </div>
                                        )}

                                        {/* API Settings */}
                                        {activeTab === 'api' && (
                                            <div>
                                                <h3 className="text-lg font-medium iggyy-updatey-900 mb-4">API Settings</h3>

                                                <div className="mb-6">
                                                    <h4 className="text-md font-medium iggyy-updatey-700 mb-2">Husmodata API Configuration</h4>
                                                    <p className="text-sm iggyy-updatey-500 mb-4">
                                                        Configure your Husmodata API settings for airtime and data services.
                                                    </p>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <InputLabel htmlFor="husmodata_api_key" value="Husmodata API Key" />
                                                            <TextInput
                                                                id="husmodata_api_key"
                                                                type="text"
                                                                className="mt-1 block w-full"
                                                                value={data.husmodata_api_key}
                                                                onChange={(e) => setData('husmodata_api_key', e.target.value)}
                                                                required
                                                            />
                                                            <InputError message={errors.husmodata_api_key} className="mt-2" />
                                                        </div>

                                                        <div>
                                                            <InputLabel htmlFor="husmodata_api_url" value="Husmodata API URL" />
                                                            <TextInput
                                                                id="husmodata_api_url"
                                                                type="text"
                                                                className="mt-1 block w-full"
                                                                value={data.husmodata_api_url}
                                                                onChange={(e) => setData('husmodata_api_url', e.target.value)}
                                                                required
                                                            />


                                                            <InputError message={errors.husmodata_api_url} className="mt-2" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* XixaPay API Configuration */}
                                                <div className="mb-6 mt-8 pt-6 border-t border-gray-200">
                                                    <h4 className="text-md font-medium iggyy-updatey-700 mb-2">XixaPay API Configuration</h4>
                                                    <p className="text-sm iggyy-updatey-500 mb-4">
                                                        Configure your XixaPay API settings for virtual account services.
                                                    </p>

                                                    <div className="grid grid-cols-1 md gap-6">
                                                        <div>
                                                            <InputLabel htmlFor="xixapay_api_key" value="XixaPay API Key" />
                                                            <TextInput
                                                                id="xixapay_api_key"
                                                                type="text"
                                                                className="mt-1 block w-full"
                                                                value={data.xixapay_api_key}
                                                                onChange={(e) => setData('xixapay_api_key', e.target.value)}
                                                                required
                                                            />
                                                            <InputError message={errors.xixapay_api_key} className="mt-2" />
                                                        </div>

                                                        <div>
                                                            <InputLabel htmlFor="xixapay_secret_key" value="XixaPay Secret Key" />
                                                            <TextInput
                                                                id="xixapay_secret_key"
                                                                type="password"
                                                                className="mt-1 block w-full"
                                                                value={data.xixapay_secret_key}
                                                                onChange={(e) => setData('xixapay_secret_key', e.target.value)}
                                                                required
                                                            />
                                                            <InputError message={errors.xixapay_secret_key} className="mt-2" />
                                                        </div>

                                                        <div>
                                                            <InputLabel htmlFor="xixapay_base_url" value="XixaPay Base URL" />
                                                            <TextInput
                                                                id="xixapay_base_url"
                                                                type="text"
                                                                className="mt-1 block w-full"
                                                                value={data.xixapay_base_url}
                                                                onChange={(e) => setData('xixapay_base_url', e.target.value)}
                                                                required
                                                            />
                                                            <InputError message={errors.xixapay_base_url} className="mt-2" />
                                                        </div>

                                                        <div>
                                                            <InputLabel htmlFor="xixapay_business_id" value="XixaPay Business ID" />
                                                            <TextInput
                                                                id="xixapay_business_id"
                                                                type="text"
                                                                className="mt-1 block w-full"
                                                                value={data.xixapay_business_id}
                                                                onChange={(e) => setData('xixapay_business_id', e.target.value)}
                                                                required
                                                            />
                                                            <InputError message={errors.xixapay_business_id} className="mt-2" />
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex justify-end">
                                                        <a href={route('admin.settings.test-xixapay')} className="btn btn-sm btn-secondary">
                                                            Test XixaPay Connection
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* API Details Widget */}
                                                <div className="mt-8">
                                                    <h4 className="text-md font-medium iggyy-updatey-700 mb-2">API Account Details</h4>
                                                    <p className="text-sm iggyy-updatey-500 mb-4">
                                                        Current balance and virtual account details from Husmodata API.
                                                    </p>
                                                    <ApiDetailsWidget apiDetails={apiDetails} />

                                                    <div className="mt-4 flex justify-end">
                                                        <a href={route('admin.settings.test-api')} className="btn btn-sm btn-secondary">
                                                            Test API Connection
                                                        </a>
                                                        <a href={route('admin.settings.sync-data-plans')} className="btn btn-sm btn-primary ml-2">
                                                            Sync Data Plans
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Profit Margins */}
                                        {activeTab === 'profit' && (
                                            <div>
                                                <h3 className="text-lg font-medium iggyy-updatey-900 mb-4">Profit Margins</h3>
                                                <p className="text-sm iggyy-updatey-500 mb-4">
                                                    Set the profit percentage for each service. This is the markup added to the cost price from the API provider.
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <InputLabel htmlFor="airtime_profit_percentage" value="Airtime Profit Percentage" />
                                                        <div className="mt-1 relative rounded-md shadow-sm">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <PhoneIcon className="h-5 w-5 iggyy-updatey-400" />
                                                            </div>
                                                            <TextInput
                                                                id="airtime_profit_percentage"
                                                                type="number"
                                                                step="0.1"
                                                                min="0"
                                                                className="pl-10 block w-full"
                                                                value={data.airtime_profit_percentage}
                                                                onChange={(e) => setData('airtime_profit_percentage', e.target.value)}
                                                                required
                                                            />
                                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                <span className="iggyy-updatey-500 sm:text-sm">%</span>
                                                            </div>
                                                        </div>
                                                        <InputError message={errors.airtime_profit_percentage} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor="data_profit_percentage" value="Data Profit Percentage" />
                                                        <div className="mt-1 relative rounded-md shadow-sm">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <PhoneIcon className="h-5 w-5 iggyy-updatey-400" />
                                                            </div>
                                                            <TextInput
                                                                id="data_profit_percentage"
                                                                type="number"
                                                                step="0.1"
                                                                min="0"
                                                                className="pl-10 block w-full"
                                                                value={data.data_profit_percentage}
                                                                onChange={(e) => setData('data_profit_percentage', e.target.value)}
                                                                required
                                                            />
                                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                <span className="iggyy-updatey-500 sm:text-sm">%</span>
                                                            </div>
                                                        </div>
                                                        <InputError message={errors.data_profit_percentage} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor="cable_profit_percentage" value="Cable TV Profit Percentage" />
                                                        <div className="mt-1 relative rounded-md shadow-sm">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <TvIcon className="h-5 w-5 iggyy-updatey-400" />
                                                            </div>
                                                            <TextInput
                                                                id="cable_profit_percentage"
                                                                type="number"
                                                                step="0.1"
                                                                min="0"
                                                                className="pl-10 block w-full"
                                                                value={data.cable_profit_percentage}
                                                                onChange={(e) => setData('cable_profit_percentage', e.target.value)}
                                                                required
                                                            />
                                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                <span className="iggyy-updatey-500 sm:text-sm">%</span>
                                                            </div>
                                                        </div>
                                                        <InputError message={errors.cable_profit_percentage} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor="electricity_profit_percentage" value="Electricity Profit Percentage" />
                                                        <div className="mt-1 relative rounded-md shadow-sm">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <LightBulbIcon className="h-5 w-5 iggyy-updatey-400" />
                                                            </div>
                                                            <TextInput
                                                                id="electricity_profit_percentage"
                                                                type="number"
                                                                step="0.1"
                                                                min="0"
                                                                className="pl-10 block w-full"
                                                                value={data.electricity_profit_percentage}
                                                                onChange={(e) => setData('electricity_profit_percentage', e.target.value)}
                                                                required
                                                            />
                                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                <span className="iggyy-updatey-500 sm:text-sm">%</span>
                                                            </div>
                                                        </div>
                                                        <InputError message={errors.electricity_profit_percentage} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor="airtime_to_cash_charge" value="Airtime to Cash Charge Percentage" />
                                                        <div className="mt-1 relative rounded-md shadow-sm">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <PhoneIcon className="h-5 w-5 iggyy-updatey-400" />
                                                            </div>
                                                            <TextInput
                                                                id="airtime_to_cash_charge"
                                                                type="number"
                                                                step="0.1"
                                                                min="0"
                                                                max="100"
                                                                className="pl-10 block w-full"
                                                                value={data.airtime_to_cash_charge}
                                                                onChange={(e) => setData('airtime_to_cash_charge', e.target.value)}
                                                                required
                                                            />
                                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                <span className="iggyy-updatey-500 sm:text-sm">%</span>
                                                            </div>
                                                        </div>
                                                        <p className="mt-1 text-sm iggyy-updatey-500">
                                                            This is the percentage that will be deducted from airtime to cash conversions.
                                                        </p>
                                                        <InputError message={errors.airtime_to_cash_charge} className="mt-2" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment Charges */}
                                        {activeTab === 'payment' && (
                                            <div>
                                                <h3 className="text-lg font-medium iggyy-updatey-900 mb-4">Payment Charges</h3>

                                                <p className="text-sm iggyy-updatey-500 mb-4">
                                                    Configure the charges for different payment methods. These charges will be deducted from the amount deposited by users.
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                    <div>
                                                        <InputLabel htmlFor="virtual_bank_deposit_charge" value="Virtual Bank Deposit Charge (%)" />
                                                        <TextInput
                                                            id="virtual_bank_deposit_charge"
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            className="mt-1 block w-full"
                                                            value={data.virtual_bank_deposit_charge}
                                                            onChange={(e) => setData('virtual_bank_deposit_charge', e.target.value)}
                                                            required
                                                        />
                                                        <p className="mt-1 text-sm iggyy-updatey-500">
                                                            Percentage charge for deposits made via virtual bank accounts
                                                        </p>
                                                        <InputError message={errors.virtual_bank_deposit_charge} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor="card_payment_charge" value="Card Payment Charge (%)" />
                                                        <TextInput
                                                            id="card_payment_charge"
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            className="mt-1 block w-full"
                                                            value={data.card_payment_charge}
                                                            onChange={(e) => setData('card_payment_charge', e.target.value)}
                                                            required
                                                        />
                                                        <p className="mt-1 text-sm iggyy-updatey-500">
                                                            Percentage charge for deposits made via debit/credit cards
                                                        </p>
                                                        <InputError message={errors.card_payment_charge} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor="online_payment_charge" value="Other Online Payment Charge (%)" />
                                                        <TextInput
                                                            id="online_payment_charge"
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            className="mt-1 block w-full"
                                                            value={data.online_payment_charge}
                                                            onChange={(e) => setData('online_payment_charge', e.target.value)}
                                                            required
                                                        />
                                                        <p className="mt-1 text-sm iggyy-updatey-500">
                                                            Percentage charge for deposits made via other online payment methods (USSD, QR, etc.)
                                                        </p>
                                                        <InputError message={errors.online_payment_charge} className="mt-2" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Referral System */}
                                        {activeTab === 'referral' && (
                                            <div>
                                                <h3 className="text-lg font-medium iggyy-updatey-900 mb-4">Referral System</h3>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <InputLabel htmlFor="referral_bonus_percentage" value="Referral Bonus Percentage" />
                                                        <div className="mt-1 relative rounded-md shadow-sm">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <WalletIcon className="h-5 w-5 iggyy-updatey-400" />
                                                            </div>
                                                            <TextInput
                                                                id="referral_bonus_percentage"
                                                                type="number"
                                                                step="0.1"
                                                                min="0"
                                                                className="pl-10 block w-full"
                                                                value={data.referral_bonus_percentage}
                                                                onChange={(e) => setData('referral_bonus_percentage', e.target.value)}
                                                                required
                                                            />
                                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                <span className="iggyy-updatey-500 sm:text-sm">%</span>
                                                            </div>
                                                        </div>
                                                        <p className="mt-1 text-sm iggyy-updatey-500">
                                                            Percentage of transaction amount that referrers earn when their referrals make purchases.
                                                        </p>
                                                        <InputError message={errors.referral_bonus_percentage} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor="min_withdrawal_amount" value="Minimum Withdrawal Amount" />
                                                        <div className="mt-1 relative rounded-md shadow-sm">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <span className="iggyy-updatey-500 sm:text-sm">₦</span>
                                                            </div>
                                                            <TextInput
                                                                id="min_withdrawal_amount"
                                                                type="number"
                                                                step="100"
                                                                min="0"
                                                                className="pl-10 block w-full"
                                                                value={data.min_withdrawal_amount}
                                                                onChange={(e) => setData('min_withdrawal_amount', e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                        <p className="mt-1 text-sm iggyy-updatey-500">
                                                            Minimum amount users can withdraw from their wallet.
                                                        </p>
                                                        <InputError message={errors.min_withdrawal_amount} className="mt-2" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-end mt-6">
                                            <Button type="submit" className="ml-4" processing={processing}>
                                                Save Settings
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

// Custom PercentIcon component
