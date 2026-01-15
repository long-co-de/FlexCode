import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
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
    ArrowRightOnRectangleIcon,
    MagnifyingGlassIcon,
    ChevronRightIcon,
    Bars3Icon,
    XMarkIcon,
    ChartBarIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function AdminLayout({ children, header = null }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { auth } = usePage().props;

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarOpen && isMobile) {
                const sidebar = document.getElementById('mobile-sidebar');
                const menuButton = document.getElementById('menu-button');
                if (sidebar && !sidebar.contains(event.target) && 
                    menuButton && !menuButton.contains(event.target)) {
                    setSidebarOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen, isMobile]);

    // Navigation items
    const mainNav = [
        { name: 'Dashboard', href: route('admin.dashboard'), icon: HomeIcon, current: route().current('admin.dashboard') },
        { name: 'Users', href: route('admin.users'), icon: UsersIcon, current: route().current('admin.users*') },
        { name: 'Transactions', href: route('admin.transactions'), icon: CreditCardIcon, current: route().current('admin.transactions*') },
    ];

    const servicesNav = [
        { name: 'Networks', href: route('admin.networks'), icon: DevicePhoneMobileIcon, current: route().current('admin.networks*') },
        { name: 'Data Plans', href: route('admin.data-plans'), icon: DocumentTextIcon, current: route().current('admin.data-plans*') },
        { name: 'Plan Profits', href: route('admin.plan-type-profits.index'), icon: ChartBarIcon, current: route().current('admin.plan-type-profits*') },
        { name: 'Cable TV', href: route('admin.cable-providers'), icon: TvIcon, current: route().current('admin.cable*') },
        { name: 'Electricity', href: route('admin.electricity-providers'), icon: BoltIcon, current: route().current('admin.electricity*') },
    ];

    const marketingNav = [
        { name: 'Coupons', href: route('admin.coupons.index'), icon: TicketIcon, current: route().current('admin.coupons*') },
        { name: 'Send Notifications', href: route('admin.notifications.index'), icon: BellIcon, current: route().current('admin.notifications.index') },
        { name: 'Notification History', href: route('admin.notifications.history'), icon: EnvelopeIcon, current: route().current('admin.notifications.history') },
    ];

    const settingsNav = [
        { name: 'Settings', href: route('admin.settings'), icon: Cog6ToothIcon, current: route().current('admin.settings*') },
        { name: 'Borrowing Settings', href: route('admin.borrow-settings.index'), icon: Cog6ToothIcon, current: route().current('admin.borrow-settings*') },
        { name: 'Credit Eligibility', href: route('admin.credit-eligibility-settings.index'), icon: ShieldCheckIcon, current: route().current('admin.credit-eligibility-settings*') },
        { name: 'Cron Jobs', href: route('admin.cron-logs.index'), icon: Cog6ToothIcon, current: route().current('admin.cron-logs*') },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && isMobile && (
                <div className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity" />
            )}

            {/* Desktop Sidebar - Sticky */}
            <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64">
                <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
                    {/* Sticky header section */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                        <div className="flex items-center h-16 px-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
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

                    {/* Scrollable navigation */}
                    <div className="flex-1 overflow-y-auto py-2">
                        <nav className="px-3 space-y-1">
                            {/* Main Navigation */}
                            <div className="px-2 py-1">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Main
                                </h3>
                            </div>
                            {mainNav.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}

                            {/* Services */}
                            <div className="px-2 py-1 mt-4">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Services
                                </h3>
                            </div>
                            {servicesNav.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}

                            {/* Marketing */}
                            <div className="px-2 py-1 mt-4">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Marketing
                                </h3>
                            </div>
                            {marketingNav.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}

                            {/* Settings */}
                            <div className="px-2 py-1 mt-4">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Settings
                                </h3>
                            </div>
                            {settingsNav.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}
                        </nav>
                    </div>

                    {/* Sticky user info at bottom */}
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
                                href={route('profile.edit')}
                                className="flex-1 text-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                                Profile
                            </Link>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="flex-1 text-center px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
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
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Mobile header */}
                    <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">A</span>
                            </div>
                            <h1 className="ml-3 text-lg font-bold text-gray-900">Admin Panel</h1>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                        >
                            <XMarkIcon className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto py-4">
                        <nav className="px-3 space-y-1">
                            {[...mainNav, ...servicesNav, ...marketingNav, ...settingsNav].map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium ${
                                        item.current
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Mobile user info */}
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{auth.user.name}</p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="md:pl-64 flex flex-col min-h-screen">
                {/* Top Header - Sticky */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6">
                        <div className="flex items-center">
                            <button
                                id="menu-button"
                                onClick={() => setSidebarOpen(true)}
                                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                            >
                                <Bars3Icon className="h-6 w-6 text-gray-500" />
                            </button>
                            
                            {/* Page title */}
                            <div className="ml-2 md:ml-0">
                                <h1 className="text-lg font-semibold text-gray-900">
                                    {header || 'Dashboard'}
                                </h1>
                                <div className="hidden md:flex items-center text-sm text-gray-500 mt-0.5">
                                    <span>Admin</span>
                                    {header && (
                                        <>
                                            <ChevronRightIcon className="h-3 w-3 mx-1" />
                                            <span>{header}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Right side actions */}
                        <div className="flex items-center space-x-3">
                            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                                <BellIcon className="h-5 w-5 text-gray-500" />
                                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                            </button>
                            
                            {/* Quick actions dropdown */}
                            <div className="hidden md:flex items-center space-x-2">
                                <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                                    Quick Actions
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1">
                    <div className="py-6 px-4 sm:px-6 md:px-8">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 md:px-8">
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
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                item.current ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <span className="truncate">{item.name}</span>
            {item.current && (
                <div className="ml-auto w-2 h-2 rounded-full bg-blue-600"></div>
            )}
        </Link>
    );
}