import { useEffect, useState } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { Link, usePage } from "@inertiajs/react";
import {
    HomeIcon,
    UserIcon,
    CreditCardIcon,
    BellIcon,
    Cog6ToothIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    ArrowLeftOnRectangleIcon,
    Bars3Icon,
    XMarkIcon,
    ArrowRightOnRectangleIcon,
    ArrowPathIcon,
    WifiIcon,
    PhoneIcon,
    BanknotesIcon,
    CogIcon,
    MoonIcon,
    SunIcon,
    UserCircleIcon
} from "@heroicons/react/24/outline";
import Notiflix from "notiflix";

export default function AgentLayout({ user, header, children }) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem("theme") ?? "light");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { flash } = usePage().props;

    useEffect(() => {
        document.querySelector("html").setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);
    
    useEffect(() => {
        if (flash?.error) {
            Notiflix.Report.failure("", flash?.error);
        }
        if (flash?.success) {
            Notiflix.Report.success("", flash?.success);
        }
        if (flash?.info) {
            Notiflix.Report.info("", flash?.info);
        }
        if (flash?.warning) {
            Notiflix.Report.warning("", flash?.warning, "");
        }
    }, [flash]);

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    const navigationItems = [
        {
            name: "Dashboard",
            href: route("agent.dashboard"),
            icon: HomeIcon,
            active: route().current("agent.dashboard"),
        },
        {
            name: "Transactions",
            href: route("agent.transactions"),
            icon: CreditCardIcon,
            active: route().current("agent.transactions"),
        },
        {
            name: "Users",
            href: route("agent.users"),
            icon: UserIcon,
            active: route().current("agent.users*"),
        },
        {
            name: "Messages",
            href: route("agent.messages"),
            icon: ChatBubbleLeftRightIcon,
            active: route().current("agent.messages"),
        },
       
    ];

    const bottomNavItems = navigationItems.slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Desktop Sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:z-50">
                <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-5 pb-4 overflow-y-auto">
                    {/* Logo */}
                    <div className="flex items-center flex-shrink-0 px-6 mb-8">
                        <Link href="/">
                            <ApplicationLogo className="h-10 w-auto" />
                        </Link>
                    </div>
                    
                    {/* User Profile Card */}
                    <div className="px-6 mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <UserCircleIcon className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {user.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    Agent Account
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Wallet Balance</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                ₦{user.wallet_balance || "0.00"}
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1">
                        {navigationItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                    item.active
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                }`}
                            >
                                <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${
                                    item.active 
                                        ? "text-blue-600 dark:text-blue-400" 
                                        : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                                }`} />
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Bottom Actions */}
                    <div className="px-4 mt-auto space-y-2">
                        <button
                            onClick={toggleTheme}
                            className="flex items-center px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg w-full transition-colors duration-200"
                        >
                            {theme === "light" ? (
                                <>
                                    <MoonIcon className="mr-3 h-5 w-5 text-gray-400" />
                                    Dark Mode
                                </>
                            ) : (
                                <>
                                    <SunIcon className="mr-3 h-5 w-5 text-yellow-400" />
                                    Light Mode
                                </>
                            )}
                        </button>
                        <Link
                            href={route("logout")}
                            method="post"
                            as="button"
                            className="flex items-center px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg w-full transition-colors duration-200"
                        >
                            <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
                            Logout
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-md text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>
                        <Link href="/" className="ml-4">
                            <ApplicationLogo className="h-8 w-auto" />
                        </Link>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        >
                            {theme === "light" ? (
                                <MoonIcon className="h-5 w-5" />
                            ) : (
                                <SunIcon className="h-5 w-5" />
                            )}
                        </button>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center text-sm focus:outline-none">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                        <UserCircleIcon className="h-5 w-5 text-white" />
                                    </div>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="right" width="48">
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {user.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {user.email}
                                    </div>
                                </div>
                                <Dropdown.Link href={route("profile.edit")}>
                                    <UserIcon className="w-4 h-4 mr-2" />
                                    Profile Settings
                                </Dropdown.Link>
                                <Dropdown.Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                    <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2" />
                                    Log Out
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <div className={`lg:hidden fixed inset-0 z-50 ${sidebarOpen ? 'block' : 'hidden'}`}>
                <div className="fixed inset-0 bg-gray-600/75" onClick={() => setSidebarOpen(false)} />
                <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg">
                    <div className="flex flex-col h-full">
                        {/* Sidebar Header */}
                        <div className="px-4 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <Link href="/" className="flex items-center">
                                    <ApplicationLogo className="h-8 w-auto" />
                                </Link>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 rounded-md text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            {/* User Info */}
                            <div className="mt-6">
                                <div className="flex items-center space-x-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                        <UserCircleIcon className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Agent
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Wallet Balance</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        ₦{user.wallet_balance || "0.00"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Navigation */}
                        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                            {navigationItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                        item.active
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${
                                        item.active 
                                            ? "text-blue-600 dark:text-blue-400" 
                                            : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                                    }`} />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>

                        {/* Sidebar Footer */}
                        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="flex items-center justify-center px-4 py-3 w-full bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-700 dark:text-red-300 rounded-lg font-medium hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/30 dark:hover:to-red-700/30 transition-colors duration-200"
                            >
                                <ArrowLeftOnRectangleIcon className="mr-2 h-5 w-5" />
                                Logout
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-around items-center h-16">
                    {bottomNavItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 h-full ${
                                item.active
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                        >
                            <item.icon className={`h-5 w-5 ${item.active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                            <span className="text-xs mt-1">{item.name}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:pl-64">
                {/* Mobile Header Spacing */}
                <div className="lg:hidden h-16" />
                
                {/* Header */}
                {header && (
                    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                {/* Main Content */}
                <main className="min-h-screen">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Mobile Bottom Nav Spacing */}
                        <div className="pb-16 lg:pb-0" />
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}