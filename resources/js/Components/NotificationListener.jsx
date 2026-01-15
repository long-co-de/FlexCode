import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { notify } from './Notification';

export default function NotificationListener() {
    // const { auth } = usePage().props;
    
    // useEffect(() => {
    //     // Only set up listeners if user is authenticated
    //     if (auth && auth.user) {
    //         // Listen for private notifications for the authenticated user
    //         const channel = window.Echo.private(`App.Models.User.${auth.user.id}`);
            
    //         // Listen for transaction notifications
    //         channel.notification('.TransactionNotification', (notification) => {
    //             const { type, message, transaction } = notification;
                
    //             switch (type) {
    //                 case 'success':
    //                     notify.success(message);
    //                     break;
    //                 case 'error':
    //                     notify.error(message);
    //                     break;
    //                 case 'warning':
    //                     notify.warning(message);
    //                     break;
    //                 default:
    //                     notify.info(message);
    //             }
    //         });
            
    //         // Listen for wallet notifications
    //         channel.notification('.WalletNotification', (notification) => {
    //             const { type, message, amount } = notification;
                
    //             switch (type) {
    //                 case 'credit':
    //                     notify.success(`${message} ₦${amount}`);
    //                     break;
    //                 case 'debit':
    //                     notify.info(`${message} ₦${amount}`);
    //                     break;
    //                 default:
    //                     notify.info(message);
    //             }
    //         });
            
    //         // Listen for general notifications
    //         channel.notification('.GeneralNotification', (notification) => {
    //             const { type, message } = notification;
                
    //             switch (type) {
    //                 case 'success':
    //                     notify.success(message);
    //                     break;
    //                 case 'error':
    //                     notify.error(message);
    //                     break;
    //                 case 'warning':
    //                     notify.warning(message);
    //                     break;
    //                 default:
    //                     notify.info(message);
    //             }
    //         });
            
    //         // Clean up listeners when component unmounts
    //         return () => {
    //             channel.stopListening('.TransactionNotification');
    //             channel.stopListening('.WalletNotification');
    //             channel.stopListening('.GeneralNotification');
    //         };
    //     }
    // }, [auth]);
    
    return null; // This component doesn't render anything
}