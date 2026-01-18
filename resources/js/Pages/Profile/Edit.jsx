import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import NotificationPreferencesForm from './Partials/NotificationPreferencesForm';
import { FaUser, FaLock, FaBell, FaShieldAlt } from 'react-icons/fa';

export default function Edit({ auth, mustVerifyEmail, status }) {
    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex flex-col">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Profile Settings</h2>
                    <p className="text-sm font-medium text-slate-500">Manage your account information and preferences</p>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="py-8 max-w-4xl mx-auto px-4 space-y-8">
                {/* Profile Section */}
                <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <FaUser className="text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Personal Information</h3>
                            <p className="text-xs font-medium text-slate-500">Update your name, email and phone number</p>
                        </div>
                    </div>
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="w-full"
                    />
                </div>

                {/* Password Section */}
                <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                            <FaLock className="text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Security</h3>
                            <p className="text-xs font-medium text-slate-500">Keep your account secure with a strong password</p>
                        </div>
                    </div>
                    <UpdatePasswordForm className="w-full" />
                </div>

                {/* Notifications Section */}
                <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                            <FaBell className="text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Notification Preferences</h3>
                            <p className="text-xs font-medium text-slate-500">Control how you receive alerts and updates</p>
                        </div>
                    </div>
                    <NotificationPreferencesForm className="w-full" user={auth.user} />
                </div>
            </div>
        </AppLayout>
    );
}
