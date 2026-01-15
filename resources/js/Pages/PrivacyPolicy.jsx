import { Head } from '@inertiajs/react';

export default function PrivacyPolicy() {
    return (
        <div>
            <Head title="Privacy Policy" />
            
            <div className="py-12 min-h-screen bg-base-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-base-100 rounded-lg shadow-md p-6 md:p-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
                        <p className="text-gray-500 mb-8">Last updated: January 2024</p>

                        <div className="space-y-8 text-gray-700 leading-relaxed">
                            {/* Introduction */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                                <p>
                                    Welcome to our VTU (Virtual Top-Up) application ("we," "us," "our," or "Company"). 
                                    We are committed to protecting your privacy and ensuring you have a positive experience on our platform. 
                                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application 
                                    and related services.
                                </p>
                            </section>

                            {/* Information We Collect */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                                <p className="mb-4">We may collect information about you in a variety of ways. The information we may collect on the site includes:</p>
                                
                                <h3 className="text-lg font-semibold mb-2 mt-4">Personal Data</h3>
                                <ul className="list-disc pl-6 space-y-2 mb-4">
                                    <li>First and last name</li>
                                    <li>Email address</li>
                                    <li>Phone number</li>
                                    <li>Postal address</li>
                                    <li>Bank account details (for transactions)</li>
                                    <li>Payment card information</li>
                                    <li>Date of birth</li>
                                    <li>Gender</li>
                                </ul>

                                <h3 className="text-lg font-semibold mb-2 mt-4">Device Information</h3>
                                <ul className="list-disc pl-6 space-y-2 mb-4">
                                    <li>Device type and model</li>
                                    <li>Operating system</li>
                                    <li>IP address</li>
                                    <li>Mobile network information</li>
                                    <li>Device identifiers</li>
                                </ul>

                                <h3 className="text-lg font-semibold mb-2 mt-4">Usage Information</h3>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Pages visited</li>
                                    <li>Features used</li>
                                    <li>Search queries</li>
                                    <li>Time and duration of activities</li>
                                    <li>Transaction history</li>
                                </ul>
                            </section>

                            {/* Use of Your Information */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">3. Use of Your Information</h2>
                                <p className="mb-4">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the application to:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Process your transactions and send related information</li>
                                    <li>Email you regarding your account or transaction</li>
                                    <li>Fulfill and manage purchases, orders, payments, and other transactions related to the application</li>
                                    <li>Generate a personal profile about you so that future visits to our application will be personalized</li>
                                    <li>Increase the efficiency and operation of the application</li>
                                    <li>Monitor and analyze usage and trends to improve your experience with the application</li>
                                    <li>Notify you of updates to the application</li>
                                    <li>Offer new products, services, and/or recommendations to you</li>
                                </ul>
                            </section>

                            {/* Disclosure of Your Information */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">4. Disclosure of Your Information</h2>
                                <p className="mb-4">We may share information we have collected about you in certain situations:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information is necessary to comply with the law</li>
                                    <li><strong>Third-Party Service Providers:</strong> We may share your information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</li>
                                    <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of assets, bankruptcy, or financing of the Company</li>
                                    <li><strong>Fraud Prevention:</strong> We may disclose your information when we believe it is necessary to investigate, prevent, or take action regarding possible illegal activities</li>
                                </ul>
                            </section>

                            {/* Security of Your Information */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">5. Security of Your Information</h2>
                                <p>
                                    We use administrative, technical, and physical security measures to help protect your personal information. 
                                    However, no method of transmission over the Internet or method of electronic storage is 100% secure. 
                                    While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
                                </p>
                            </section>

                            {/* Contact Us */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
                                <p className="mb-4">If you have questions or comments about this Privacy Policy, please contact us at:</p>
                                <div className="bg-base-200 p-4 rounded">
                                    <p><strong>Email:</strong> support@vtu-app.com</p>
                                    <p><strong>Phone:</strong> +234 (0) XXX XXX XXXX</p>
                                    <p><strong>Address:</strong> [Your Company Address]</p>
                                </div>
                            </section>

                            {/* Changes to This Policy */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">7. Changes to This Privacy Policy</h2>
                                <p>
                                    We may update this privacy policy from time to time in order to reflect, for example, changes to our practices 
                                    or for other operational, legal or regulatory reasons. We will notify you of any significant changes by updating the 
                                    "Last updated" date of this Privacy Policy.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
