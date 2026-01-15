import { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    Bars3Icon,
    HomeIcon,
    CreditCardIcon,
    PhoneIcon,
    TvIcon,
    LightBulbIcon,
    WalletIcon,
    UserGroupIcon,
    Cog6ToothIcon,
    ArrowLeftOnRectangleIcon,
    UserIcon,
    BellIcon,
    ShieldCheckIcon,
    MoonIcon,
    SunIcon,
    WifiIcon,
    ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import ApplicationLogo from "@/Components/ApplicationLogo";
import NotificationDropdown from "@/Components/NotificationDropdown";
import Notiflix from "notiflix";

export default function Authenticated({ user, header, children }) {
    const [showDrawer, setShowDrawer] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [theme, setTheme] = useState(
        localStorage.getItem("theme") ?? "light"
    );
    const { auth, flash } = usePage().props;
    const isAdmin = auth.user.role === "admin";
    const isAgent = auth.user.role === "agent";
    // Handle responsive behavior
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        localStorage.setItem("last_name", auth.user.name);
        localStorage.setItem("auth_email", auth.user.email);
        // Initial check
        checkScreenSize();

        // Add event listener for window resize
        window.addEventListener("resize", checkScreenSize);
        // Cleanup
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    // Close drawer when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            const drawer = document.getElementById("sidebar-drawer");
            const toggleButton = document.getElementById("drawer-toggle");

            if (
                drawer &&
                showDrawer &&
                !drawer.contains(event.target) &&
                !toggleButton.contains(event.target)
            ) {
                setShowDrawer(false);
            }
        };

        if (showDrawer && isMobile) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDrawer, isMobile]);

    // Prevent body scroll when drawer is open on mobile
    useEffect(() => {
        if (isMobile) {
            if (showDrawer) {
                document.body.style.overflow = "hidden";
            } else {
                document.body.style.overflow = "auto";
            }
        }

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showDrawer, isMobile]);
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
    useEffect(() => {
        document.querySelector("html").setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);
    return (
        <div className="min-h-screen bg-base-200 mm--50">
            {/* Top Navigation Bar */}
            <nav className="bg-base-100 -ws border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            {/* Mobile menu button */}
                            <button
                                id="drawer-toggle"
                                onClick={() => setShowDrawer(!showDrawer)}
                                className="inline-flex items-center justify-center p-2 rounded-md igg-500 hover:igg-600 hover:bg-base-200 mm--100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
                                aria-expanded="false"
                            >
                                <span className="sr-only">Open main menu</span>
                                <Bars3Icon className="h-6 w-6" />
                            </button>

                            {/* Logo */}
                            <div className="flex-shrink-0 flex items-center ml-2 md:ml-0">
                                <Link href={route("dashboard")}>
                                    <ApplicationLogo className="block h-9 w-auto fill-current igg-800 dark:bg-white rounded-full" />
                                </Link>
                            </div>
                        </div>

                        {/* Right side navigation items */}
                        <div className="flex items-center">
                            {/* Wallet balance */}
                            <div className="hidden md:flex items-center mr-4 px-3 py-1 bg-base-200 mm--50 rounded-full">
                                <WalletIcon className="h-4 w-4 text-primary-600 mr-1" />
                                <span className="text-sm font-medium igg-700">
                                    ₦{auth.user.wallet_balance}
                                </span>
                            </div>

                            {/* Notifications */}
                            <div className="mr-3">
                                <NotificationDropdown />
                            </div>

                            {/* User menu */}
                            <div className="relative">
                                <div className="flex items-center">
                                    <span className="hidden md:inline-block mr-2 text-sm font-medium igg-700">
                                        {auth.user.name}
                                    </span>
                                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
                                        {auth.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <i
                                        className="theme text-primary cursor-pointer"
                                        onClick={(e) => {
                                            setTheme(
                                                theme == "light"
                                                    ? "dark"
                                                    : "light"
                                            );
                                        }}
                                    >
                                        {theme == "light" ? (
                                            <SunIcon className="h-5 w-5" />
                                        ) : (
                                            <MoonIcon className="h-5 w-5" />
                                        )}
                                    </i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer Backdrop */}
            {showDrawer && isMobile && (
                <div className="fixed inset-0 bg-base-200 mm--600 bg-opacity-50 z-40 transition-opacity md:hidden" />
            )}

            {/* Sidebar / Drawer */}
            <div
                id="sidebar-drawer"
                className={`fixed md:stickym top-0 left-0 z-40 h-screen w-64 transition-transform duration-300 ease-in-out transform ${
                    showDrawer || !isMobile
                        ? "translate-x-0"
                        : "-translate-x-full"
                } md:translate-x-0 bg-base-100 -ws border-r border-gray-200 pt-0  overflow-y-auto`}
            >
                <div className="px-3 py-4 my-0">
                    {/* Mobile only: User info */}
                    <div className="md:hidden p-4 mb-4 bg-base-200 mm--50 rounded-lg">
                        <div className="font-medium igg-800">
                            {auth.user.name}
                        </div>
                        <div className="text-sm igg-500">{auth.user.email}</div>
                        <div className="mt-2 flex items-center text-sm font-medium igg-700">
                            <WalletIcon className="h-4 w-4 text-primary-600 mr-1" />
                            Wallet: ₦{auth.user.wallet_balance}
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <ul className="space-y-1">
                        <SidebarLink
                            href={route("dashboard")}
                            active={route().current("dashboard")}
                        >
                            <HomeIcon className="h-5 w-5 mr-3 igg-500" />
                            Dashboard
                        </SidebarLink>
                        {isAgent && (
                            <>
                                <SidebarHeading>Agent</SidebarHeading>
                                <SidebarLink
                                    href={`/agent/dashboard`}
                                    active={"aganet/dashboard"}
                                >
                                    {/* <Gri className="h-5 w-5 mr-3 igg-500" /> */}
                                    Dashboard
                                </SidebarLink>
                            </>
                        )}
                        {isAdmin ? (
                            <>
                                <SidebarHeading>Admin</SidebarHeading>
                                <SidebarLink
                                    href={route("admin.users")}
                                    active={route().current("admin.users")}
                                >
                                    <UserGroupIcon className="h-5 w-5 mr-3 igg-500" />
                                    Users
                                </SidebarLink>
                                <SidebarLink
                                    href={route("admin.transactions")}
                                    active={route().current(
                                        "admin.transactions"
                                    )}
                                >
                                    <CreditCardIcon className="h-5 w-5 mr-3 igg-500" />
                                    Transactions
                                </SidebarLink>

                                <SidebarHeading>Services</SidebarHeading>
                                <SidebarLink
                                    href={route("admin.networks")}
                                    active={route().current("admin.networks")}
                                >
                                    <PhoneIcon className="h-5 w-5 mr-3 igg-500" />
                                    Networks
                                </SidebarLink>
                                <SidebarLink
                                    href={route("admin.data-plans")}
                                    active={route().current("admin.data-plans")}
                                >
                                    <WifiIcon className="h-5 w-5 mr-3 igg-500" />
                                    Data Plans
                                </SidebarLink>
                                <SidebarLink
                                    href={route("admin.cable-providers")}
                                    active={route().current(
                                        "admin.cable-providers"
                                    )}
                                >
                                    <TvIcon className="h-5 w-5 mr-3 igg-500" />
                                    Cable Providers
                                </SidebarLink>
                                <SidebarLink
                                    href={route("admin.cable-plans")}
                                    active={route().current(
                                        "admin.cable-plans"
                                    )}
                                >
                                    <TvIcon className="h-5 w-5 mr-3 igg-500" />
                                    Cable Plans
                                </SidebarLink>
                                <SidebarLink
                                    href={route("admin.electricity-providers")}
                                    active={route().current(
                                        "admin.electricity-providers"
                                    )}
                                >
                                    <LightBulbIcon className="h-5 w-5 mr-3 igg-500" />
                                    Electricity Providers
                                </SidebarLink>
                                <SidebarLink
                                    href={route("admin.payment-methods")}
                                    active={route().current(
                                        "admin.payment-methods"
                                    )}
                                >
                                    <WalletIcon className="h-5 w-5 mr-3 igg-500" />
                                    Payment Methods
                                </SidebarLink>

                                <SidebarHeading>System</SidebarHeading>
                                <SidebarLink
                                    href={route("admin.settings")}
                                    active={route().current("admin.settings")}
                                >
                                    <Cog6ToothIcon className="h-5 w-5 mr-3 igg-500" />
                                    Settings
                                </SidebarLink>
                            </>
                        ) : (
                            <>
                                {/* <SidebarHeading>Upgrade</SidebarHeading> */}
                                {/* <SidebarLink
                                    href={route("upgrade.pro")}
                                    active={route().current("upgrade.pro")}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 igg-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                    Upgrade to Pro
                                </SidebarLink> */}

                                <SidebarHeading>Services</SidebarHeading>
                                <SidebarLink
                                    href={route("airtime")}
                                    active={route().current("airtime")}
                                >
                                    <PhoneIcon className="h-5 w-5 mr-3 igg-500" />
                                    Buy Airtime
                                </SidebarLink>
                                <SidebarLink
                                    href={route("data")}
                                    active={route().current("data")}
                                >
                                    <WifiIcon className="h-5 w-5 mr-3 igg-500" />
                                    Buy Data
                                </SidebarLink>
                                <SidebarLink
                                    href={route("cable")}
                                    active={route().current("cable")}
                                >
                                    <TvIcon className="h-5 w-5 mr-3 igg-500" />
                                    Cable Subscription
                                </SidebarLink>
                                <SidebarLink
                                    href={route("electricity")}
                                    active={route().current("electricity")}
                                >
                                    <LightBulbIcon className="h-5 w-5 mr-3 igg-500" />
                                    Electricity Bill
                                </SidebarLink>

                                <SidebarHeading>Account</SidebarHeading>
                                <SidebarLink
                                    href={route("wallet")}
                                    active={route().current("wallet")}
                                >
                                    <WalletIcon className="h-5 w-5 mr-3 igg-500" />
                                    Wallet
                                </SidebarLink>
                                <SidebarLink
                                    href={route("transactions")}
                                    active={route().current("transactions")}
                                >
                                    <ArrowsUpDownIcon className="h-5 w-5 mr-3 igg-500" />
                                    Transactions
                                </SidebarLink>
                                <SidebarLink
                                    href={route("cards.index")}
                                    active={route().current("cards.index")}
                                >
                                    <CreditCardIcon className="h-5 w-5 mr-3 igg-500" />
                                    My Card
                                </SidebarLink>
                                <SidebarLink
                                    href={route("borrow.my-borrowings")}
                                    active={route().current(
                                        "borrow.my-borrowings"
                                    )}
                                >
                                    <CreditCardIcon className="h-5 w-5 mr-3 igg-500" />
                                    BorrowLite
                                </SidebarLink>
                            </>
                        )}

                        <SidebarHeading>User</SidebarHeading>
                        <SidebarLink
                            href={route("notifications.index")}
                            active={route().current("notifications.index")}
                        >
                            <BellIcon className="h-5 w-5 mr-3 igg-500" />
                            Notifications
                        </SidebarLink>
                        <SidebarLink
                            href={route("pin.reset.show")}
                            active={route().current("pin.reset.show")}
                        >
                            <ShieldCheckIcon className="h-5 w-5 mr-3 igg-500" />
                            Reset Pin
                        </SidebarLink>
                        <SidebarLink
                            href={route("pin.edit")}
                            active={route().current("pin.edit")}
                        >
                            <ShieldCheckIcon className="h-5 w-5 mr-3 igg-500" />
                            Change Pin
                        </SidebarLink>
                        <SidebarLink
                            href={route("profile.edit")}
                            active={route().current("profile.edit")}
                        >
                            <UserIcon className="h-5 w-5 mr-3 igg-500" />
                            Profile
                        </SidebarLink>

                        <SidebarHeading>Information</SidebarHeading>
                        <SidebarLink
                            href={route("about")}
                            active={route().current("about")}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-3 igg-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            About Us
                        </SidebarLink>
                        <SidebarLink
                            href={route("contact")}
                            active={route().current("contact")}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-3 igg-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                            Contact Us
                        </SidebarLink>

                        <SidebarLink
                            href={route("logout")}
                            method="post"
                            as="button"
                        >
                            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 igg-500" />
                            Logout
                        </SidebarLink>
                        <div className="lg:hidden py-12"></div>
                    </ul>
                </div>
            </div>

            {/* Main Content */}
            <div className="md:pl-64 flex flex-col min-h-screen pt-16">
                <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
            <div className="android-nav-bar lg:hidden bg-base-100 w-full left-0 bottom-0 border-t border-t-primary py-4 rouded-t-2xl">
                <Link
                    href={route("dashboard")}
                    className={`flex flex-col items-center py-3`}
                >
                    <HomeIcon
                        className={`h-7 w-7 ${
                            route().current("dashboard")
                                ? "text-primary"
                                : "text-base-content"
                        }`}
                    />
                    <span
                        className={`text-xs ${
                            route().current("dashboard")
                                ? "text-primary"
                                : "text-base-content"
                        }`}
                    >
                        Home
                    </span>
                </Link>

                <Link
                    href={route("airtime")}
                    className={`flex flex-col items-center py-3`}
                >
                    <PhoneIcon
                        className={`h-7 w-7 ${
                            route().current("airtime")
                                ? "text-primary"
                                : "text-base-content"
                        }`}
                    />
                    <span
                        className={`text-xs ${
                            route().current("airtime")
                                ? "text-primary"
                                : "text-base-content"
                        }`}
                    >
                        Airtime
                    </span>
                </Link>

                <Link
                    href={route("data")}
                    className={`flex flex-col items-center py-3`}
                >
                    <WifiIcon
                        className={`h-7 w-7 ${
                            route().current("data")
                                ? "text-primary"
                                : "text-base-content"
                        }`}
                    />
                    <span
                        className={`text-xs ${
                            route().current("data")
                                ? "text-primary"
                                : "text-base-content"
                        }`}
                    >
                        Data
                    </span>
                </Link>

                <Link
                    href={route("wallet")}
                    className={`flex flex-col items-center py-3`}
                >
                    <WalletIcon
                        className={`h-7 w-7 ${
                            route().current("wallet")
                                ? "text-primary"
                                : "text-base-content"
                        }`}
                    />
                    <span
                        className={`text-xs ${
                            route().current("wallet")
                                ? "text-primary"
                                : "text-base-content"
                        }`}
                    >
                        Wallet
                    </span>
                </Link>

                <Link
                    href={route("transactions")}
                    className={`flex flex-col items-center py-3`}
                >
                    <CreditCardIcon
                        className={`h-7 w-7 ${
                            route().current("transactions")
                                ? "text-primary"
                                : "text-base-content"
                        }`}
                    />
                    <span
                        className={`text-xs ${
                            route().current("transactions")
                                ? "text-primary"
                                : "text-base-content"
                        }`}
                    >
                        History
                    </span>
                </Link>
            </div>
            <div className="lg:hidden py-10"></div>
        </div>
    );
}

function SidebarHeading({ children }) {
    return (
        <h3 className="px-3 mt-5 mb-2 text-xs font-semibold igg-400 uppercase tracking-wider">
            {children}
        </h3>
    );
}

function SidebarLink({
    href,
    method = "get",
    as = "a",
    active = false,
    children,
}) {
    return (
        <li>
            <Link
                href={href}
                method={method}
                as={as}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    active
                        ? "bg-primary-50 text-primary-700"
                        : "igg-700 hover:bg-base-300 hover:igg-900"
                }`}
            >
                {children}
            </Link>
        </li>
    );
}
