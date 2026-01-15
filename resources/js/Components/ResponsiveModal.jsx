import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import BottomDrawerModal from '@/Components/BottomDrawerModal';

export default function ResponsiveModal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}) {
    const [isMobile, setIsMobile] = useState(false);

    // Check if the screen is mobile size
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768); // 768px is the standard md breakpoint in Tailwind
        };

        // Initial check
        checkIfMobile();

        // Add event listener for window resize
        window.addEventListener('resize', checkIfMobile);

        // Clean up
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    return isMobile ? (
        <BottomDrawerModal
            show={show}
            closeable={closeable}
            onClose={onClose}
        >
            {children}
        </BottomDrawerModal>
    ) : (
        <Modal
            show={show}
            maxWidth={maxWidth}
            closeable={closeable}
            onClose={onClose}
        >
            {children}
        </Modal>
    );
}