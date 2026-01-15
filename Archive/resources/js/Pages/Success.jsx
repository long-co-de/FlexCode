import { Head, Link } from "@inertiajs/react";
import { FaWhatsapp } from 'react-icons/fa'
function SocailLink() {
    return (
        <>
       <div className="divider text-primary divider-primary">Our Handles </div>
            <div className="grid grid-cols-2 p-2 bg-base-00 rounded-md gap-2 items-center">
                <a target="_blank" href="https://wa.me/2348157238832" className="flex items-center justify-center">
                    <FaWhatsapp className="w-8 h-8 text-green-700" />
                    <div className="text-center text-xs ms-2">
                        Customer Care
                    </div>
                </a>
                <a target="_blank" href="https://whatsapp.com/0029VbAsfvsHVvTQyWxVgi1Q" className="flex items-center justify-center">
                    <FaWhatsapp className="w-8 h-8 text-green-700" />
                    <div className="text-center text-xs ms-2">
                        More info and Update
                    </div>
                </a>
            </div>
        </>
    )
}
function SuccessPage() {
    return (<>
        <div className="w-[100vw] h-[100vh] flex items-center justify-center p-4">
            <div className="card bg-base-100 max-w-md w-full p-4">
                <div className="card-body">
                    <Head title="Thanks 😀😀😀" />
                    <h3 className="card-title">
                        Thanks 😀😀😀
                    </h3>
                    <p className="lorem">
                        Thanks For Contact us
                    </p>
                    <div className="p-2">
                        <Link href="/dashboard" className="btn btn-">
                            Go Back
                        </Link>
                    </div>
                    <SocailLink />
                </div>
            </div>
        </div>
    </>);
}
export const SocailLinks = SocailLink;
export default SuccessPage;