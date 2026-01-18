import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            phone_number: user.phone_number || '',
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-2">
                    <InputLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="name" value="Full Name" />

                    <TextInput
                        id="name"
                        className="w-full py-4 px-6 rounded-2xl border-slate-100 focus:border-primary focus:ring-primary/10 text-sm font-bold bg-slate-50/50"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div className="space-y-2">
                    <InputLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="email" value="Email Address" />

                    <TextInput
                        id="email"
                        type="email"
                        className="w-full py-4 px-6 rounded-2xl border-slate-100 focus:border-primary focus:ring-primary/10 text-sm font-bold bg-slate-50/50"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div className="space-y-2">
                    <InputLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="phone_number" value="Phone Number" />

                    <TextInput
                        id="phone_number"
                        type="text"
                        className="w-full py-4 px-6 rounded-2xl border-slate-100 focus:border-primary focus:ring-primary/10 text-sm font-bold bg-slate-50/50"
                        value={data.phone_number}
                        onChange={(e) => setData('phone_number', e.target.value)}
                        autoComplete="tel"
                        placeholder="e.g. 08012345678"
                    />

                    <InputError className="mt-2" message={errors.phone_number} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-xs font-bold text-amber-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="ml-2 underline hover:text-amber-900 focus:outline-none"
                            >
                                Re-send verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-xs font-black text-emerald-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-4">
                    <button 
                        disabled={processing}
                        className="px-8 py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest"
                    >
                        {processing ? 'Saving...' : 'Save Changes'}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                            ✓ Saved
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
