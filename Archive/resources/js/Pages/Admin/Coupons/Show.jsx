import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { format } from 'date-fns';

export default function Show({ auth, coupon }) {
    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Treasure Hunt Code Details</h2>}
        >
            <Head title="Treasure Hunt Code Details" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 -ws border-b border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium">Treasure Hunt Code: {coupon.prefix || 'PI'}-{coupon.code}</h3>
                                <div>
                                    <Link
                                        href={route('admin.coupons.index')}
                                        className="px-4 py-2 bg-base-200 mm--300 igg-800 rounded-md hover:bg-base-200 mm--400 mr-2"
                                    >
                                        Back to Treasure Hunt Codes
                                    </Link>
                                    {coupon.status === 'active' && (
                                        <Link
                                            href={route('admin.coupons.destroy', coupon.id)}
                                            method="delete"
                                            as="button"
                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                        >
                                            Delete Treasure Hunt Code
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="bg-base-200 mm--50 p-4 rounded-lg mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium igg-500">Prefix</h4>
                                        <p className="text-lg font-semibold">{coupon.prefix || 'PI'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium igg-500">Code</h4>
                                        <p className="text-lg font-semibold">{coupon.code}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium igg-500">Full Code</h4>
                                        <p className="text-lg font-semibold">{coupon.prefix || 'PI'}-{coupon.code}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium igg-500">Amount</h4>
                                        <p className="text-lg font-semibold">₦{coupon.amount}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium igg-500">Status</h4>
                                        <p className="text-lg">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                coupon.status === 'active' ? 'bg-green-100 text-green-800' :
                                                coupon.status === 'used' ? 'bg-blue-100 text-blue-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {coupon.status}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium igg-500">Created At</h4>
                                        <p className="text-lg">{format(new Date(coupon.created_at), 'MMM dd, yyyy HH:mm')}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium igg-500">Expires At</h4>
                                        <p className="text-lg">{coupon.expires_at ? format(new Date(coupon.expires_at), 'MMM dd, yyyy HH:mm') : 'Never'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium igg-500">Created By</h4>
                                        <p className="text-lg">{coupon.creator ? coupon.creator.name : 'System'}</p>
                                    </div>
                                </div>
                            </div>

                            {coupon.description && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium igg-500 mb-2">Description</h4>
                                    <p className="igg-700">{coupon.description}</p>
                                </div>
                            )}

                            {coupon.status === 'used' && coupon.user && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-medium igg-500 mb-2">Redemption Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h5 className="text-xs font-medium igg-500">Used By</h5>
                                            <p>{coupon.user.name} ({coupon.user.email})</p>
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-medium igg-500">Used At</h5>
                                            <p>{coupon.used_at ? format(new Date(coupon.used_at), 'MMM dd, yyyy HH:mm') : '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}