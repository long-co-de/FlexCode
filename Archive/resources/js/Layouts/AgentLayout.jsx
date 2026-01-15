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
} from "@heroicons/react/24/outline";
import Notiflix from "notiflix";

export default function AgentLayout({ user, header, children }) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const [theme, setTheme] = useState(
        localStorage.getItem("theme") ?? "light"
    );
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
    return (
        <div className="min-h-screen bg-base-100">
            <nav className="bg-base-100 border-b border-base-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="shrink-0 flex items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                                <NavLink
                                    href={route("agent.dashboard")}
                                    active={route().current("agent.dashboard")}
                                >
                                    <HomeIcon className="w-5 h-5 mr-1" />
                                    Dashboard
                                </NavLink>
                                <NavLink
                                    href={route("agent.transactions")}
                                    active={route().current(
                                        "agent.transactions"
                                    )}
                                >
                                    <CreditCardIcon className="w-5 h-5 mr-1" />
                                    Transactions
                                </NavLink>
                                <NavLink
                                    href={route("agent.messages")}
                                    active={route().current("agent.messages")}
                                >
                                    <ChatBubbleLeftRightIcon className="w-5 h-5 mr-1" />
                                    Messages
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:flex sm:items-center sm:ml-6">
                            <div className="ml-3 relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md igg-500 bg-base-100 hover:igg-700 focus:outline-none transition ease-in-out duration-150"
                                            >
                                                {user.name}

                                                <svg
                                                    className="ml-2 -mr-0.5 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route("profile.edit")}
                                        >
                                            <UserIcon className="w-5 h-5 mr-2" />
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("logout")}
                                            method="post"
                                            as="button"
                                        >
                                            <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-mr-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState
                                    )
                                }
                                className="inline-flex items-center justify-center p-2 rounded-md igg-400 hover:igg-500 hover:bg-base-100 focus:outline-none focus:bg-base-100 focus:igg-500 transition duration-150 ease-in-out"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? "inline-flex"
                                                : "hidden"
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? "inline-flex"
                                                : "hidden"
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? "block" : "hidden") +
                        " sm:hidden"
                    }
                >
                    <div className="pt-2 pb-3 space-y-1">
                        <ResponsiveNavLink
                            href={route("agent.dashboard")}
                            active={route().current("agent.dashboard")}
                        >
                            <HomeIcon className="w-5 h-5 mr-1" />
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("agent.transactions")}
                            active={route().current("agent.transactions")}
                        >
                            <CreditCardIcon className="w-5 h-5 mr-1" />
                            Transactions
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("agent.messages")}
                            active={route().current("agent.messages")}
                        >
                            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-1" />
                            Messages
                        </ResponsiveNavLink>
                    </div>

                    <div className="pt-4 pb-1 border-t border-base-200">
                        <div className="px-4">
                            <div className="font-medium igg-800">
                                {user.name}
                            </div>
                            <div className="font-medium text-sm igg-500">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route("profile.edit")}>
                                <UserIcon className="w-5 h-5 mr-1" />
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route("logout")}
                                as="button"
                            >
                                <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-1" />
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-base-100 shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
