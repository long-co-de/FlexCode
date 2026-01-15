import { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    HomeIcon,
    UsersIcon,
    CreditCardIcon,
    DevicePhoneMobileIcon,
    TvIcon,
    BoltIcon,
    TicketIcon,
    BellIcon,
    Cog6ToothIcon,
    UserIcon,
    MagnifyingGlassIcon,
    ChevronRightIcon,
    Bars3Icon,
    XMarkIcon,
    ChartBarIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    EnvelopeIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from "@heroicons/react/24/outline";

export default function AdminLayout({ children, header = null }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        main: true,
        services: true,
        marketing: true,
        settings: true,
    });
    const { auth } = usePage().props;

    // Check if mobile and handle resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setSidebarOpen(false);
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarOpen && isMobile) {
                const sidebar = document.getElementById("mobile-sidebar");
                const menuButton = document.getElementById("mobile-menu-button");
                if (
                    sidebar &&
                    !sidebar.contains(event.target) &&
                    menuButton &&
                    !menuButton.contains(event.target)
                ) {
                    setSidebarOpen(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [sidebarOpen, isMobile]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (sidebarOpen && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [sidebarOpen, isMobile]);

    // Navigation items
    const mainNav = [
        {
            name: "Dashboard",
            href: route("admin.dashboard"),
            icon: HomeIcon,
            current: route().current("admin.dashboard"),
        },
        {
            name: "Users",
            href: route("admin.users"),
            icon: UsersIcon,
            current: route().current("admin.users*"),
        },
        {
            name: "Transactions",
            href: route("admin.transactions"),
            icon: CreditCardIcon,
            current: route().current("admin.transactions*"),
        },
    ];

    const servicesNav = [
        {
            name: "Networks",
            href: route("admin.networks"),
            icon: DevicePhoneMobileIcon,
            current: route().current("admin.networks*"),
        },
        {
            name: "Data Plans",
            href: route("admin.data-plans"),
            icon: DocumentTextIcon,
            current: route().current("admin.data-plans*"),
        },
        {
            name: "Plan Profits",
            href: route("admin.plan-type-profits.index"),
            icon: ChartBarIcon,
            current: route().current("admin.plan-type-profits*"),
        },
        {
            name: "Cable TV",
            href: route("admin.cable-providers"),
            icon: TvIcon,
            current: route().current("admin.cable*"),
        },
        {
            name: "Electricity",
            href: route("admin.electricity-providers"),
            icon: BoltIcon,
            current: route().current("admin.electricity*"),
        },
    ];

    const marketingNav = [
        {
            name: "Coupons",
            href: route("admin.coupons.index"),
            icon: TicketIcon,
            current: route().current("admin.coupons*"),
        },
        {
            name: "Send Notifications",
            href: route("admin.notifications.index"),
            icon: BellIcon,
            current: route().current("admin.notifications.index"),
        },
        {
            name: "Notification History",
            href: route("admin.notifications.history"),
            icon: EnvelopeIcon,
            current: route().current("admin.notifications.history"),
        },
    ];

    const settingsNav = [
        {
            name: "Settings",
            href: route("admin.settings"),
            icon: Cog6ToothIcon,
            current: route().current("admin.settings*"),
        },
        {
            name: "Borrowing Settings",
            href: route("admin.borrow-settings.index"),
            icon: Cog6ToothIcon,
            current: route().current("admin.borrow-settings*"),
        },
        {
            name: "Credit Eligibility",
            href: route("admin.credit-eligibility-settings.index"),
            icon: ShieldCheckIcon,
            current: route().current("admin.credit-eligibility-settings*"),
        },
        {
            name: "Cron Jobs",
            href: route("admin.cron-logs.index"),
            icon: Cog6ToothIcon,
            current: route().current("admin.cron-logs*"),
        },
    ];

    const mobileNavItems = [
        { section: "Main", items: mainNav },
        { section: "Services", items: servicesNav },
        { section: "Marketing", items: marketingNav },
        { section: "Settings", items: settingsNav },
    ];

    const bottomNavItems = [
        {
            name: "Dashboard",
            href: route("admin.dashboard"),
            icon: HomeIcon,
            current: route().current("admin.dashboard"),
        },
        {
            name: "Users",
            href: route("admin.users"),
            icon: UsersIcon,
            current: route().current("admin.users*"),
        },
        {
            name: "Transactions",
            href: route("admin.transactions"),
            icon: CreditCardIcon,
            current: route().current("admin.transactions*"),
        },
        {
            name: "Menu",
            icon: Bars3Icon,
            onClick: () => setSidebarOpen(true),
        },
    ];

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section.toLowerCase()]: !prev[section.toLowerCase()]
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && isMobile && (
                <div className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity" />
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
                <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
                    {/* Logo Section */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                        <div className="flex items-center h-16 px-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">A</span>
                            </div>
                            <div className="ml-3">
                                <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="px-4 pb-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="search"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Search..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto py-4">
                        <nav className="px-3 space-y-1">
                            {/* Main Navigation */}
                            <div className="mb-4">
                                <div className="px-2 py-1">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Main
                                    </h3>
                                </div>
                                {mainNav.map((item) => (
                                    <NavLink key={item.name} item={item} />
                                ))}
                            </div>

                            {/* Services */}
                            <div className="mb-4">
                                <div className="px-2 py-1">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Services
                                    </h3>
                                </div>
                                {servicesNav.map((item) => (
                                    <NavLink key={item.name} item={item} />
                                ))}
                            </div>

                            {/* Marketing */}
                            <div className="mb-4">
                                <div className="px-2 py-1">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Marketing
                                    </h3>
                                </div>
                                {marketingNav.map((item) => (
                                    <NavLink key={item.name} item={item} />
                                ))}
                            </div>

                            {/* Settings */}
                            <div className="mb-4">
                                <div className="px-2 py-1">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Settings
                                    </h3>
                                </div>
                                {settingsNav.map((item) => (
                                    <NavLink key={item.name} item={item} />
                                ))}
                            </div>
                        </nav>
                    </div>

                    {/* User Info */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <UserIcon className="h-4 w-4 text-blue-600" />
                                </div>
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {auth.user.name}
                                </p>
                                <div className="flex items-center text-xs text-gray-500">
                                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                    <span className="truncate">{auth.user.email}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                            <Link
                                href={route("profile.edit")}
                                className="flex-1 text-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Profile
                            </Link>
                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="flex-1 text-center px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Logout
                            </Link>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <aside
                id="mobile-sidebar"
                className={`fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-white transform transition-transform duration-300 ease-in-out md:hidden ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">A</span>
                            </div>
                            <h1 className="ml-3 text-lg font-bold text-gray-900">Admin Panel</h1>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>

                    {/* User Info - Mobile */}
                    <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{auth.user.name}</p>
                                <p className="text-xs text-gray-500">{auth.user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Navigation with Sections */}
                    <div className="flex-1 overflow-y-auto py-4">
                        <nav className="px-3">
                            {mobileNavItems.map((section) => (
                                <div key={section.section} className="mb-4">
                                    <button
                                        onClick={() => toggleSection(section.section)}
                                        className="flex items-center justify-between w-full px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 rounded-lg"
                                    >
                                        <span>{section.section}</span>
                                        {expandedSections[section.section.toLowerCase()] ? (
                                            <ChevronUpIcon className="h-4 w-4" />
                                        ) : (
                                            <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                    
                                    {expandedSections[section.section.toLowerCase()] && (
                                        <div className="mt-1 space-y-1">
                                            {section.items.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                                                        item.current
                                                            ? "bg-blue-50 text-blue-700"
                                                            : "text-gray-700 hover:bg-gray-100"
                                                    }`}
                                                >
                                                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* Mobile Bottom Actions */}
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex space-x-2">
                            <Link
                                href={route("profile.edit")}
                                onClick={() => setSidebarOpen(false)}
                                className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-blue-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Profile
                            </Link>
                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                onClick={() => setSidebarOpen(false)}
                                className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Logout
                            </Link>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="md:pl-64 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6">
                        <div className="flex items-center">
                            {/* Mobile Menu Button */}
                            <button
                                id="mobile-menu-button"
                                onClick={() => setSidebarOpen(true)}
                                className="md:hidden p-2 mr-3 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Bars3Icon className="h-5 w-5 text-gray-600" />
                            </button>

                            {/* Page Title */}
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">
                                    {header || "Dashboard"}
                                </h1>
                                <div className="hidden md:flex items-center text-sm text-gray-500 mt-0.5">
                                    <span>Admin</span>
                                    {header && (
                                        <>
                                            <ChevronRightIcon className="h-3 w-3 mx-2" />
                                            <span>{header}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center space-x-3">
                            <button className="p-2 rounded-lg hover:bg-gray-100 relative transition-colors">
                                <BellIcon className="h-5 w-5 text-gray-500" />
                                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 pb-16 md:pb-0">
                    <div className="py-6 px-4 sm:px-6 md:px-8">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
                    <div className="flex items-center justify-around px-2 py-2">
                        {bottomNavItems.map((item) => (
                            item.onClick ? (
                                <button
                                    key={item.name}
                                    onClick={item.onClick}
                                    className={`flex flex-col items-center px-3 py-1.5 rounded-lg transition-colors ${
                                        sidebarOpen ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="text-[10px] mt-1 font-medium">{item.name}</span>
                                </button>
                            ) : (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex flex-col items-center px-3 py-1.5 rounded-lg transition-colors ${
                                        item.current ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="text-[10px] mt-1 font-medium">{item.name}</span>
                                </Link>
                            )
                        ))}
                    </div>
                </div>

                {/* Footer - Desktop Only */}
                <footer className="hidden md:block bg-white border-t border-gray-200 py-4 px-4 sm:px-6 md:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="text-sm text-gray-500">
                                © {new Date().getFullYear()} Admin Panel • v1.0.0
                            </div>
                            <div className="mt-2 md:mt-0 text-sm text-gray-500">
                                Last updated: Today
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

// Navigation Link Component
function NavLink({ item }) {
    return (
        <Link
            href={item.href}
            className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors ${
                item.current
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
        >
            <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    item.current ? "text-blue-600" : "text-gray-400"
                }`}
            />
            <span className="truncate">{item.name}</span>
            {item.current && (
                <div className="ml-auto w-2 h-2 rounded-full bg-blue-600"></div>
            )}
        </Link>
    );
}