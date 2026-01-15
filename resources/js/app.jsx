import './bootstrap.js';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import Notification from './Components/Notification';
import NotificationListener from './Components/NotificationListener';

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'VTU App';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Wrap the App component with our notification components
        root.render(
            <>
                <App {...props} />
                <Notification flash={props.flash || {}} />
                <NotificationListener />
            </>  
        );
    },
    progress: {
        color: 'var(--fallback-p,oklch(var(--p)/var(--tw-bg-opacity, 1)))',
        showSpinner:true,

    },
});