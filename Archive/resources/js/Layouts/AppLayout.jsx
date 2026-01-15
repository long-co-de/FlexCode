import { usePage } from "@inertiajs/react";
import AndroidLayout from "@/Layouts/AndroidLayout";
import AdminLayout from "@/Layouts/AdminLayout";
import Notiflix from "notiflix";
import { useEffect } from "react";

export default function AppLayout({ header, children }) {
    const { auth, flash } = usePage().props;
    const isAdmin = auth.user.role === "admin";

    // Choose the appropriate layout based on user role
    useEffect(() => {
        if (flash.message) {
            Notiflix.Notify.success(flash.message);
        }
        if (flash.error) {
            Notiflix.Notify.failure(flash.error);
        }
        if (flash.warning) {
            Notiflix.Notify.warning(flash.warning);
        }
        if (flash.info) {
            Notiflix.Notify.info(flash.info);
        }
        if (flash.success) {
            Notiflix.Notify.success(flash.success);
        }
    }, [flash]);
    return (
        <>
            {isAdmin ? (
                <AdminLayout header={header}>{children}</AdminLayout>
            ) : (
                <AndroidLayout header={header}>{children}</AndroidLayout>
            )}
        </>
    );
}
