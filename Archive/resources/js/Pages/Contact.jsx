import React, { useState } from 'react';
import { Head, useForm,Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
import { SocailLinks } from './Success';

export default function Contact({ auth, info }) {
    const [messageSent, setMessageSent] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: auth.user ? auth.user.name : '',
        email: auth.user ? auth.user.email : '',
        phone: auth.user ? auth.user.phone_number : '',
        subject: '',
        message: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/contact');
        // In a real application, you would send this data to your backend
        // For now, we'll just simulate a successful submission
        // setTimeout(() => {
        //     setMessageSent(true);
        //     reset('subject', 'message');
        // }, 1000);
    };

    return (
        <div
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Contact Us</h2>}
        >
                {/* Navigation */}
                <nav className="relative z-10 px-4 pt-6 sm:px-6 lg:px-8 bg-primary py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="text-white text-3xl font-bold">Paylow</div>
                        </div>
                        <div className="grid ms-auto xl:flex items-center space-x-4">
                          

                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="btn btn-outline btn-sm text-white border-white hover:bg-base-100 hover:text-primary"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="btn btn-ghost btn-sm text-white"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="btn btn-outline btn-sm text-white border-white hover:bg-base-100 hover:text-primary"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>




            <Head title="Contact Us" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-base-100 -ws overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-base-100 -ws border-b border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h2 className="text-2xl font-bold igg-800 mb-4">Get in Touch</h2>
                                    <p className="igg-600 mb-6">
                                        We'd love to hear from you! Whether you have a question about our services,
                                        need help with your account, or want to provide feedback, our team is here to assist you.
                                    </p>

                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold igg-700 mb-3">Contact Information</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0 mt-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 igg-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="igg-800 font-medium">Phone</p>
                                                    <p className="igg-600">{auth.info?.phone}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0 mt-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 igg-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="igg-800 font-medium">Email</p>
                                                    <p className="igg-600">{auth.info?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0 mt-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 igg-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="igg-800 font-medium">Address</p>
                                                    <p className="igg-600">123 Business Avenue, Lagos, Nigeria</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold igg-700 mb-3">Business Hours</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="igg-600">Monday - Friday:</span>
                                                <span className="igg-800">8:00 AM - 6:00 PM</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="igg-600">Saturday:</span>
                                                <span className="igg-800">9:00 AM - 4:00 PM</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="igg-600">Sunday:</span>
                                                <span className="igg-800">Closed</span>
                                            </div>
                                        </div>
                                        <SocailLinks />
                                        <p className="mt-3 igg-600">
                                            <strong>Note:</strong> Our online services are available 24/7, and our customer
                                            support team is available via email and chat outside of business hours.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold igg-800 mb-4">Send Us a Message</h2>

                                    {messageSent ? (
                                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
                                            <strong className="font-bold">Thank you!</strong>
                                            <span className="block sm:inline"> Your message has been sent successfully. We'll get back to you as soon as possible.</span>
                                            <button
                                                className="text-green-700 hover:text-green-900 mt-4 bg-green-100 px-4 py-2 rounded"
                                                onClick={() => setMessageSent(false)}
                                            >
                                                Send Another Message
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <InputLabel htmlFor="name" value="Name" />
                                                <TextInput
                                                    id="name"
                                                    type="text"
                                                    className="mt-1 block w-full"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    required
                                                />
                                                <InputError message={errors.name} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="email" value="Email" />
                                                <TextInput
                                                    id="email"
                                                    type="email"
                                                    className="mt-1 block w-full"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    required
                                                />
                                                <InputError message={errors.email} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="phone" value="Phone Number" />
                                                <TextInput
                                                    id="phone"
                                                    type="text"
                                                    className="mt-1 block w-full"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', e.target.value)}
                                                />
                                                <InputError message={errors.phone} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="subject" value="Subject" />
                                                <TextInput
                                                    id="subject"
                                                    type="text"
                                                    className="mt-1 block w-full"
                                                    value={data.subject}
                                                    onChange={(e) => setData('subject', e.target.value)}
                                                    required
                                                />
                                                <InputError message={errors.subject} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="message" value="Message" />
                                                <textarea
                                                    id="message"
                                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                    rows="5"
                                                    value={data.message}
                                                    onChange={(e) => setData('message', e.target.value)}
                                                    required
                                                ></textarea>
                                                <InputError message={errors.message} className="mt-2" />
                                            </div>

                                            <div className="flex items-center justify-end">
                                                <Button type="submit" className="ml-4" processing={processing}>
                                                    Send Message
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}