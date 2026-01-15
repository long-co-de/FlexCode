// @/Layouts/GuestLayout.jsx

export default function GuestLayout({ children, title }) {
    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full sm:max-w-md relative">
                {children}
            </div>
        </div>
    );
}