// import React, { useState } from 'react';
// import { Head, useForm } from '@inertiajs/react';
// import AdminLayout from '@/Layouts/AdminLayout';
// import InputError from '@/Components/InputError';
// import InputLabel from '@/Components/InputLabel';
// import TextInput from '@/Components/TextInput';
// import Button from '@/Components/Button';
// import Modal from '@/Components/Modal';
// import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

// export default function WalletFundingCharges({ auth, charges, paymentMethods }) {
//     const [showCreateModal, setShowCreateModal] = useState(false);
//     const [showEditModal, setShowEditModal] = useState(false);
//     const [showDeleteModal, setShowDeleteModal] = useState(false);
//     const [currentCharge, setCurrentCharge] = useState(null);

//     const { data: createData, setData: setCreateData, post: postCreate, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm({
//         payment_method: '',
//         percentage: '',
//     });

//     const { data: editData, setData: setEditData, put: putEdit, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
//         percentage: '',
//         is_active: true,
//     });

//     const { delete: destroy, processing: deleteProcessing } = useForm();

//     const handleCreateSubmit = (e) => {
//         e.preventDefault();
//         postCreate(route('admin.wallet-funding-charges.store'), {
//             onSuccess: () => {
//                 resetCreate();
//                 setShowCreateModal(false);
//             },
//         });
//     };

//     const handleEditSubmit = (e) => {
//         e.preventDefault();
//         putEdit(route('admin.wallet-funding-charges.update', currentCharge.id), {
//             onSuccess: () => {
//                 resetEdit();
//                 setShowEditModal(false);
//                 setCurrentCharge(null);
//             },
//         });
//     };

//     const handleDelete = () => {
//         destroy(route('admin.wallet-funding-charges.destroy', currentCharge.id), {
//             onSuccess: () => {
//                 setShowDeleteModal(false);
//                 setCurrentCharge(null);
//             },
//         });
//     };

//     const openEditModal = (charge) => {
//         setCurrentCharge(charge);
//         setEditData({
//             percentage: charge.percentage,
//             is_active: charge.is_active,
//         });
//         setShowEditModal(true);
//     };

//     const openDeleteModal = (charge) => {
//         setCurrentCharge(charge);
//         setShowDeleteModal(true);
//     };

//     return (
//         <AdminLayout
//             user={auth.user}
//             header={<h2 className="font-semibold text-xl igg-800 leading-tight">Wallet Funding Charges</h2>}
//         >
//             <Head title="Wallet Funding Charges" />

//             <div className="py-12">
//                 <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
//                     <div className="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
//                         <div className="p-6 bg-base-100 border-b border-gray-200">
//                             <div className="flex justify-between items-center mb-6">
//                                 <h3 className="text-lg font-medium igg-900">Manage Wallet Funding Charges</h3>
//                                 <Button
//                                     onClick={() => setShowCreateModal(true)}
//                                     className="inline-flex items-center"
//                                 >
//                                     <PlusIcon className="h-5 w-5 mr-1" />
//                                     Add New Charge
//                                 </Button>
//                             </div>

//                             <div className="overflow-x-auto">
//                                 <table className="min-w-full divide-y divide-gray-200">
//                                     <thead className="bg-base-200 mm--50">
//                                         <tr>
//                                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
//                                                 Payment Method
//                                             </th>
//                                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
//                                                 Percentage
//                                             </th>
//                                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
//                                                 Status
//                                             </th>
//                                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
//                                                 Last Updated
//                                             </th>
//                                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium igg-500 uppercase tracking-wider">
//                                                 Actions
//                                             </th>
//                                         </tr>
//                                     </thead>
//                                     <tbody className="bg-base-100 divide-y divide-gray-200">
//                                         {charges.length > 0 ? (
//                                             charges.map((charge) => (
//                                                 <tr key={charge.id}>
//                                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium igg-900">
//                                                         {charge.payment_method}
//                                                     </td>
//                                                     <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
//                                                         {charge.percentage}%
//                                                     </td>
//                                                     <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
//                                                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${charge.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
//                                                             {charge.is_active ? 'Active' : 'Inactive'}
//                                                         </span>
//                                                     </td>
//                                                     <td className="px-6 py-4 whitespace-nowrap text-sm igg-500">
//                                                         {new Date(charge.updated_at).toLocaleString()} by {charge.updater?.name || 'Unknown'}
//                                                     </td>
//                                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                                                         <button
//                                                             onClick={() => openEditModal(charge)}
//                                                             className="text-primary-600 hover:text-primary-900 mr-3"
//                                                         >
//                                                             <PencilIcon className="h-5 w-5 inline" />
//                                                         </button>
//                                                         <button
//                                                             onClick={() => openDeleteModal(charge)}
//                                                             className="text-red-600 hover:text-red-900"
//                                                         >
//                                                             <TrashIcon className="h-5 w-5 inline" />
//                                                         </button>
//                                                     </td>
//                                                 </tr>
//                                             ))
//                                         ) : (
//                                             <tr>
//                                                 <td colSpan="5" className="px-6 py-4 text-center text-sm igg-500">
//                                                     No wallet funding charges found
//                                                 </td>
//                                             </tr>
//                                         )}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Create Modal */}
//             <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)}>
//                 <div className="p-6">
//                     <h2 className="text-lg font-medium mb-4">Add New Wallet Funding Charge</h2>
//                     <form onSubmit={handleCreateSubmit}>
//                         <div className="mb-4">
//                             <InputLabel htmlFor="payment_method" value="Payment Method" />
//                             <select
//                                 id="payment_method"
//                                 className="mt-1 block w-full border-gray-300 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 rounded-md shadow-sm"
//                                 value={createData.payment_method}
//                                 onChange={(e) => setCreateData('payment_method', e.target.value)}
//                                 required
//                             >
//                                 <option value="">Select Payment Method</option>
//                                 {paymentMethods.map((method) => (
//                                     <option key={method.id} value={method.name}>
//                                         {method.name}
//                                     </option>
//                                 ))}
//                                 <option value="Virtual Bank Account">Virtual Bank Account</option>
//                                 <option value="Card Payment">Card Payment</option>
//                                 <option value="Online Payment">Online Payment</option>
//                             </select>
//                             <InputError message={createErrors.payment_method} className="mt-2" />
//                         </div>

//                         <div className="mb-4">
//                             <InputLabel htmlFor="percentage" value="Percentage (%)" />
//                             <TextInput
//                                 id="percentage"
//                                 type="number"
//                                 step="0.01"
//                                 min="0"
//                                 max="100"
//                                 className="mt-1 block w-full"
//                                 value={createData.percentage}
//                                 onChange={(e) => setCreateData('percentage', e.target.value)}
//                                 required
//                             />
//                             <InputError message={createErrors.percentage} className="mt-2" />
//                         </div>

//                         <div className="flex justify-end mt-6">
//                             <Button
//                                 onClick={() => setShowCreateModal(false)}
//                                 className="mr-2"
//                                 type="button"
//                             >
//                                 Cancel
//                             </Button>
//                             <Button
//                                 type="submit"
//                                 processing={createProcessing}
//                             >
//                                 Create
//                             </Button>
//                         </div>
//                     </form>
//                 </div>
//             </Modal>

//             {/* Edit Modal */}
//             <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
//                 <div className="p-6">
//                     <h2 className="text-lg font-medium mb-4">Edit Wallet Funding Charge</h2>
//                     {currentCharge && (
//                         <form onSubmit={handleEditSubmit}>
//                             <div className="mb-4">
//                                 <InputLabel value="Payment Method" />
//                                 <div className="mt-1 p-2 bg-base-200 mm--100 rounded-md">
//                                     {currentCharge.payment_method}
//                                 </div>
//                             </div>

//                             <div className="mb-4">
//                                 <InputLabel htmlFor="percentage" value="Percentage (%)" />
//                                 <TextInput
//                                     id="percentage"
//                                     type="number"
//                                     step="0.01"
//                                     min="0"
//                                     max="100"
//                                     className="mt-1 block w-full"
//                                     value={editData.percentage}
//                                     onChange={(e) => setEditData('percentage', e.target.value)}
//                                     required
//                                 />
//                                 <InputError message={editErrors.percentage} className="mt-2" />
//                             </div>

//                             <div className="mb-4">
//                                 <div className="flex items-center">
//                                     <input
//                                         id="is_active"
//                                         type="checkbox"
//                                         className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
//                                         checked={editData.is_active}
//                                         onChange={(e) => setEditData('is_active', e.target.checked)}
//                                     />
//                                     <label htmlFor="is_active" className="ml-2 block text-sm igg-900">
//                                         Active
//                                     </label>
//                                 </div>
//                                 <InputError message={editErrors.is_active} className="mt-2" />
//                             </div>

//                             <div className="flex justify-end mt-6">
//                                 <Button
//                                     onClick={() => setShowEditModal(false)}
//                                     className="mr-2"
//                                     type="button"
//                                 >
//                                     Cancel
//                                 </Button>
//                                 <Button
//                                     type="submit"
//                                     processing={editProcessing}
//                                 >
//                                     Update
//                                 </Button>
//                             </div>
//                         </form>
//                     )}
//                 </div>
//             </Modal>

//             {/* Delete Modal */}
//             <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
//                 <div className="p-6">
//                     <h2 className="text-lg font-medium mb-4">Delete Wallet Funding Charge</h2>
//                     {currentCharge && (
//                         <>
//                             <p className="mb-4">
//                                 Are you sure you want to delete the charge for <strong>{currentCharge.payment_method}</strong>?
//                             </p>
//                             <div className="flex justify-end">
//                                 <Button
//                                     onClick={() => setShowDeleteModal(false)}
//                                     className="mr-2"
//                                     type="button"
//                                 >
//                                     Cancel
//                                 </Button>
//                                 <Button
//                                     onClick={handleDelete}
//                                     processing={deleteProcessing}
//                                     className="bg-red-600 hover:bg-red-700 focus:bg-red-700"
//                                 >
//                                     Delete
//                                 </Button>
//                             </div>
//                         </>
//                     )}
//                 </div>
//             </Modal>
//         </AdminLayout>
//     );
// }