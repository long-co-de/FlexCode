import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FaMobileAlt, FaWifi, FaTv, FaLightbulb, FaArrowRight } from 'react-icons/fa';

export default function Bills({ auth }) {
    const [activeTab, setActiveTab] = useState('all');

    const services = [
        {
            id: 'airtime',
            name: 'Airtime',
            description: 'Purchase airtime for any network',
            icon: <FaMobileAlt className="text-3xl text-blue-500" />,
            route: route('airtime'),
            category: 'telecom'
        },
        {
            id: 'data',
            name: 'Data',
            description: 'Buy data plans for any network',
            icon: <FaWifi className="text-3xl text-green-500" />,
            route: route('data'),
            category: 'telecom'
        },
        {
            id: 'cable',
            name: 'Cable TV',
            description: 'Pay for DSTV, GOTV, and Startimes subscriptions',
            icon: <FaTv className="text-3xl text-red-500" />,
            route: route('cable'),
            category: 'utility'
        },
        {
            id: 'electricity',
            name: 'Electricity',
            description: 'Pay electricity bills for any provider',
            icon: <FaLightbulb className="text-3xl text-yellow-500" />,
            route: route('electricity'),
            category: 'utility'
        },
    ];

    const categories = [
        { id: 'all', name: 'All Services' },
        { id: 'telecom', name: 'Telecom' },
        { id: 'utility', name: 'Utilities' },
    ];

    const filteredServices = activeTab === 'all' 
        ? services 
        : services.filter(service => service.category === activeTab);

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Bills Payment</h2>}
        >
            <Head title="Bills Payment" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 -ws border-b border-gray-200">
                            <h3 className="text-lg font-medium mb-6">Select a Service</h3>
                            
                            {/* Category Tabs */}
                            <div className="flex overflow-x-auto space-x-2 mb-6 pb-2">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        className={`px-4 py-2 whitespace-nowrap rounded-full text-sm font-medium ${
                                            activeTab === category.id
                                                ? 'bg-primary text-white'
                                                : 'bg-base-200 mm--100 igg-700 hover:bg-base-200 mm--200'
                                        }`}
                                        onClick={() => setActiveTab(category.id)}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Services Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredServices.map((service) => (
                                    <Link
                                        key={service.id}
                                        href={service.route}
                                        className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="bg-base-200 mm--100 p-3 rounded-full">
                                                {service.icon}
                                            </div>
                                            <FaArrowRight className="igg-400" />
                                        </div>
                                        <h4 className="text-lg font-medium mt-4 mb-2">{service.name}</h4>
                                        <p className="text-sm igg-500">{service.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 -ws border-b border-gray-200">
                            <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
                            
                            <div className="text-center py-8 igg-500">
                                <p>Your recent bill payment transactions will appear here.</p>
                                <Link
                                    href={route('transactions')}
                                    className="text-primary hover:underline mt-2 inline-block"
                                >
                                    View all transactions
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}