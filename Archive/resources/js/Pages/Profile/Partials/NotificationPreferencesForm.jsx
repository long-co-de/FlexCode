import { useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';

export default function NotificationPreferencesForm({ className = '', user }) {
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        email_notifications: user.email_notifications,
        transaction_notifications: user.transaction_notifications,
        marketing_notifications: user.marketing_notifications,
        system_notifications: user.system_notifications,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.notifications.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium igg-900">Notification Preferences</h2>
                <p className="mt-1 text-sm igg-600">
                    Update your notification preferences to control what notifications you receive and how you receive them.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <Checkbox
                                name="email_notifications"
                                checked={data.email_notifications}
                                onChange={(e) => setData('email_notifications', e.target.checked)}
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <InputLabel htmlFor="email_notifications" value="Email Notifications" />
                            <p className="igg-500">Receive notifications via email</p>
                        </div>
                    </div>
                    <InputError className="mt-2" message={errors.email_notifications} />
                </div>

                <div className="space-y-4">
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <Checkbox
                                name="transaction_notifications"
                                checked={data.transaction_notifications}
                                onChange={(e) => setData('transaction_notifications', e.target.checked)}
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <InputLabel htmlFor="transaction_notifications" value="Transaction Notifications" />
                            <p className="igg-500">Receive notifications about your transactions</p>
                        </div>
                    </div>
                    <InputError className="mt-2" message={errors.transaction_notifications} />
                </div>

                <div className="space-y-4">
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <Checkbox
                                name="system_notifications"
                                checked={data.system_notifications}
                                onChange={(e) => setData('system_notifications', e.target.checked)}
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <InputLabel htmlFor="system_notifications" value="System Notifications" />
                            <p className="igg-500">Receive system notifications and updates</p>
                        </div>
                    </div>
                    <InputError className="mt-2" message={errors.system_notifications} />
                </div>

                <div className="space-y-4">
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <Checkbox
                                name="marketing_notifications"
                                checked={data.marketing_notifications}
                                onChange={(e) => setData('marketing_notifications', e.target.checked)}
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <InputLabel htmlFor="marketing_notifications" value="Marketing Notifications" />
                            <p className="igg-500">Receive marketing notifications and promotions</p>
                        </div>
                    </div>
                    <InputError className="mt-2" message={errors.marketing_notifications} />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm igg-600">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}