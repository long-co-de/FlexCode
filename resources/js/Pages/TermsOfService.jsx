import { Head } from '@inertiajs/react';

export default function TermsOfService() {
    return (
        <div>
            <Head title="Terms of Service" />
            
            <div className="py-12 min-h-screen bg-base-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-base-100 rounded-lg shadow-md p-6 md:p-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
                        <p className="text-gray-500 mb-8">Last updated: January 2024</p>

                        <div className="space-y-8 text-gray-700 leading-relaxed">
                            {/* Agreement to Terms */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                                <p>
                                    By accessing and using this mobile application and website, you accept and agree to be bound by and comply with the terms 
                                    and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                                </p>
                            </section>

                            {/* Use License */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                                <p className="mb-4">Permission is granted to temporarily download one copy of the materials (information or software) on our application for personal, 
                                    non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Modify or copy the materials</li>
                                    <li>Use the materials for any commercial purpose or for any public display</li>
                                    <li>Attempt to decompile or reverse engineer any software contained on the application</li>
                                    <li>Remove any copyright or other proprietary notations from the materials</li>
                                    <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                                    <li>Attempt to gain unauthorized access to any portion or feature of the application</li>
                                </ul>
                            </section>

                            {/* User Accounts */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                                <p className="mb-4">If you use this application, you are responsible for maintaining the confidentiality of your account information and password and for restricting access to your computer. 
                                    You agree to accept responsibility for all activities that occur under your account or password. You must notify us immediately of any unauthorized uses of your account.</p>
                                <p>
                                    You agree that all information you provide to register with this application is accurate and complete. 
                                    You must be at least 18 years old to use this application.
                                </p>
                            </section>

                            {/* Transactions and Payments */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">4. Transactions and Payments</h2>
                                <ul className="list-disc pl-6 space-y-2 mb-4">
                                    <li>You authorize us to process payments through the payment methods you provide</li>
                                    <li>You agree that all transactions are final unless explicitly stated otherwise</li>
                                    <li>Refunds are subject to our refund policy</li>
                                    <li>You are responsible for all charges to your account, regardless of whether the transaction was authorized by you</li>
                                    <li>We reserve the right to cancel any transaction suspected of fraud or unauthorized use</li>
                                </ul>
                            </section>

                            {/* User Content and Conduct */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">5. User Content and Conduct</h2>
                                <p className="mb-4">You agree not to:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Transmit any unlawful, threatening, abusive, defamatory, obscene, or otherwise objectionable material</li>
                                    <li>Disrupt the normal flow of dialogue within our application</li>
                                    <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the application</li>
                                    <li>Use the application to impersonate any person or entity</li>
                                    <li>Attempt to gain unauthorized access to any portion or feature of the application</li>
                                    <li>Interfere with or disrupt servers or networks connected to the application</li>
                                    <li>Use the application for any purpose that would be illegal or prohibited by these terms</li>
                                </ul>
                            </section>

                            {/* Disclaimer of Warranties */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">6. Disclaimer of Warranties</h2>
                                <p>
                                    The materials on our application are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim 
                                    and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, 
                                    or non-infringement of intellectual property or other violation of rights.
                                </p>
                            </section>

                            {/* Limitation of Liability */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
                                <p>
                                    In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, 
                                    or due to business interruption) arising out of the use or inability to use the materials on the application, even if we or our authorized 
                                    representative has been notified orally or in writing of the possibility of such damage.
                                </p>
                            </section>

                            {/* Accuracy of Materials */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">8. Accuracy of Materials</h2>
                                <p>
                                    The materials appearing on our application could include technical, typographical, or photographic errors. 
                                    Our company does not warrant that any of the materials on our application are accurate, complete, or current. 
                                    Our company may make changes to the materials contained on our application at any time without notice.
                                </p>
                            </section>

                            {/* Links */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">9. Links</h2>
                                <p>
                                    Our company has not reviewed all of the sites linked to its Internet web site and is not responsible for the contents of any such linked site. 
                                    The inclusion of any link does not imply endorsement by our company of the site. Use of any such linked website is at the user's own risk.
                                </p>
                            </section>

                            {/* Service Availability */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">10. Service Availability</h2>
                                <p>
                                    We make no warranty that the application will be uninterrupted, timely, secure, or error-free. We do not guarantee continuous access to the application 
                                    and may suspend or discontinue the application or any service for maintenance or for any other reason.
                                </p>
                            </section>

                            {/* Modification of Terms */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">11. Modification of Terms</h2>
                                <p>
                                    Our company may revise these terms of service for our application at any time without notice. By using this application, you are agreeing to be bound 
                                    by the then current version of these terms of service.
                                </p>
                            </section>

                            {/* Governing Law */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
                                <p>
                                    These terms and conditions of use are governed by and construed in accordance with the laws of Nigeria, 
                                    and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                                </p>
                            </section>

                            {/* Contact Information */}
                            <section>
                                <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
                                <p className="mb-4">If you have any questions about these Terms of Service, please contact us:</p>
                                <div className="bg-base-200 p-4 rounded">
                                    <p><strong>Email:</strong> support@vtu-app.com</p>
                                    <p><strong>Phone:</strong> +234 (0) XXX XXX XXXX</p>
                                    <p><strong>Address:</strong> [Your Company Address]</p>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
