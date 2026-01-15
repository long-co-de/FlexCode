import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export default function BottomDrawerModal({
    children,
    show = false,
    closeable = true,
    onClose = () => {},
}) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    return (
        <Transition appear show={show} as={Fragment}>
            <Dialog
                as="div"
                id="bottom-drawer-modal"
                className="fixed inset-0 z-50 overflow-hidden"
                onClose={close}
            >
                <div className="min-h-screen">
                    {/* Backdrop */}
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Dialog.Overlay className="fixed inset-0 bg-base-200 mm--500 bg-opacity-75 transition-opacity" />
                    </Transition.Child>

                    {/* Bottom Drawer */}
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 translate-y-full"
                        enterTo="opacity-100 translate-y-0"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-full"
                    >
                        <div className="fixed inset-x-0 bottom-0 w-full transform transition-all">
                            <div className="bg-base-100 -ws rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                                {/* Drawer handle */}
                                <div className="w-12 h-1.5 bg-base-200 mm--300 rounded-full mx-auto my-3"></div>
                                
                                {/* Content */}
                                <div className="px-4 py-5 sm:p-6">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}