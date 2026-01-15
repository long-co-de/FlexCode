import { useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function WalletHistory({ auth, transactions }) {
    useEffect(() => {
        // Redirect to the new transactions page
        router.visit(route('transactions'));
    }, []);

    return null;
}