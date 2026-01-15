import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    CreditCardIcon,
    PhoneIcon,
    TvIcon,
    LightBulbIcon,
    WalletIcon,
    UserGroupIcon,
    Cog6ToothIcon,
    ChartBarIcon,
    ArrowLeftOnRectangleIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Authenticated from './AuthenticatedLayout';
export default function AndroidLayout({ user, header, children }) {
    const [showingNavigationDrawer, setShowingNavigationDrawer] = useState(false);
    const { auth } = usePage().props;

    // return (
    //     <div className="min-h-screen ">
    //         {/* Android Status Bar */}
    //         {/* <div className="android-status-bar"></div> */}

    //         {/* App Bar */}
    //         <div className="android-app-bar p-2 px-4 z-[30]">
    //             <div className="p-4 bg-base-300 rounded-2xl shadow w-full flex items-center ">
    //                 <button
    //                     onClick={() => setShowingNavigationDrawer(true)}
    //                     className="mr-4 "
    //                 >
    //                     <Bars3Icon className="h-7 w-7" />
    //                 </button>

    //                 <div className="flex-1">
    //                     <ApplicationLogo className="h-8 w-auto fill-current " />
    //                 </div>

    //                 <div className="flex items-center ms-auto">
    //                     <span className="text-sm  mr-2">
    //                         ₦{auth.user.wallet_balance}
    //                     </span>
    //                 </div>
    //             </div>
    //         </div>

    //         {/* Navigation Drawer */}
    //         <div className={`android-drawer z-[80] ${showingNavigationDrawer ? 'translate-x-0' : '-translate-x-full'}`}>
    //             <div className="p-4 bg-primary text-primary-content">
    //                 <div className="flex justify-between items-center">
    //                     <ApplicationLogo className="h-8 w-auto fill-current text-primary-content" />
    //                     <button
    //                         onClick={() => setShowingNavigationDrawer(false)}
    //                         className="text-primary-content"
    //                     >
    //                         <XMarkIcon className="h-7 w-7" />
    //                     </button>
    //                 </div>
    //                 <div className="mt-4">
    //                     <div className="font-medium text-lg">{auth.user.name}</div>
    //                     <div className="text-sm opacity-80">{auth.user.email}</div>
    //                     <div className="text-sm opacity-80 mt-1">
    //                         Wallet: ₦{auth.user.wallet_balance}
    //                     </div>
    //                 </div>
    //             </div>

    //             <div className="p-4">
    //                 <ul className="menu w-full">
    //                     <DrawerLink href={route('dashboard')} active={route().current('dashboard')}>
    //                         <HomeIcon className="h-5 w-5 mr-2" />
    //                         Dashboard
    //                     </DrawerLink>

    //                     <DrawerLink href={route('airtime')} active={route().current('airtime')}>
    //                         <PhoneIcon className="h-5 w-5 mr-2" />
    //                         Buy Airtime
    //                     </DrawerLink>
    //                     <DrawerLink href={route('data')} active={route().current('data')}>
    //                         <PhoneIcon className="h-5 w-5 mr-2" />
    //                         Buy Data
    //                     </DrawerLink>
    //                     <DrawerLink href={route('cable')} active={route().current('cable')}>
    //                         <TvIcon className="h-5 w-5 mr-2" />
    //                         Cable Subscription
    //                     </DrawerLink>
    //                     <DrawerLink href={route('electricity')} active={route().current('electricity')}>
    //                         <LightBulbIcon className="h-5 w-5 mr-2" />
    //                         Electricity Bill
    //                     </DrawerLink>
    //                     <DrawerLink href={route('wallet')} active={route().current('wallet')}>
    //                         <WalletIcon className="h-5 w-5 mr-2" />
    //                         Wallet
    //                     </DrawerLink>
    //                     <DrawerLink href={route('transactions')} active={route().current('transactions')}>
    //                         <CreditCardIcon className="h-5 w-5 mr-2" />
    //                         Transactions
    //                     </DrawerLink>

    //                     <DrawerLink href={route('profile.edit')} active={route().current('profile.edit')}>
    //                         <UserIcon className="h-5 w-5 mr-2" />
    //                         Profile
    //                     </DrawerLink>

    //                     <DrawerLink href={route('pin.edit')} active={route().current('pin.edit')}>
    //                         <CreditCardIcon className="h-5 w-5 mr-2" />
    //                         Change PIN
    //                     </DrawerLink>

    //                     <DrawerLink href={route('logout')} method="post" as="button">
    //                         <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
    //                         Logout
    //                     </DrawerLink>
    //                 </ul>
    //             </div>
    //         </div>

    //         {/* Overlay for drawer */}
    //         {showingNavigationDrawer && (
    //             <div
    //                 className="fixed inset-0 bg-black/50 blur-3xl z-[50]"
    //                 onClick={() => setShowingNavigationDrawer(false)}
    //             ></div>
    //         )}

    //         {/* Main Content */}
    //         <div className="android-screen">
    //             {/* {header && (
    //                 <header className="bg-base-100 shadow mb-4">
    //                     <div className="max-w-7xl mx-auto py-4 px-4">{header}</div>
    //                 </header>
    //             )} */}

    //             <main className="max-w-7xl mx-auto px-4 pb-16 mt-12 overflow-x-auto">{children}</main>
    //         </div>

    //         {/* Android Navigation Bar - 5 links for users */}
    //         <div className="android-nav-bar lg:hidden ">
    //             <Link href={route('dashboard')} className="flex flex-col items-center py-3">
    //                 <HomeIcon className={`h-7 w-7 ${route().current('dashboard') ? 'text-primary' : 'text-base-content'}`} />
    //                 <span className={`text-xs ${route().current('dashboard') ? 'text-primary' : 'text-base-content'}`}>Home</span>
    //             </Link>

    //             <Link href={route('airtime')} className="flex flex-col items-center py-3">
    //                 <PhoneIcon className={`h-7 w-7 ${route().current('airtime') ? 'text-primary' : 'text-base-content'}`} />
    //                 <span className={`text-xs ${route().current('airtime') ? 'text-primary' : 'text-base-content'}`}>Airtime</span>
    //             </Link>

    //             <Link href={route('data')} className="flex flex-col items-center py-3">
    //                 <PhoneIcon className={`h-7 w-7 ${route().current('data') ? 'text-primary' : 'text-base-content'}`} />
    //                 <span className={`text-xs ${route().current('data') ? 'text-primary' : 'text-base-content'}`}>Data</span>
    //             </Link>

    //             <Link href={route('wallet')} className="flex flex-col items-center py-3">
    //                 <WalletIcon className={`h-7 w-7 ${route().current('wallet') ? 'text-primary' : 'text-base-content'}`} />
    //                 <span className={`text-xs ${route().current('wallet') ? 'text-primary' : 'text-base-content'}`}>Wallet</span>
    //             </Link>

    //             <Link href={route('transactions')} className="flex flex-col items-center py-3">
    //                 <CreditCardIcon className={`h-7 w-7 ${route().current('transactions') ? 'text-primary' : 'text-base-content'}`} />
    //                 <span className={`text-xs ${route().current('transactions') ? 'text-primary' : 'text-base-content'}`}>History</span>
    //             </Link>
    //         </div>
    //     </div>
    // );
    return <Authenticated user={user} header={header}>
        {children}
    </Authenticated>
}

function DrawerLink({ href, method = 'get', as = 'a', active = false, children }) {
    return (
        <li>
            <Link
                href={href}
                method={method}
                as={as}
                className={`flex items-center p-2 rounded-lg android-ripple ${active ? 'bg-primary/10 text-primary' : 'text-base-content hover:bg-base-200'
                    }`}
            >
                {children}
            </Link>
        </li>
    );
}