import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            screens: {
                'xs': '475px',
                ...defaultTheme.screens,
            },
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            // colors: {
            //     primary: {
            //         50: '#f0f9ff',
            //         100: '#e0f2fe',
            //         200: '#bae6fd',
            //         300: '#7dd3fc',
            //         400: '#38bdf8',
            //         500: '#0ea5e9',
            //         600: '#0284c7',
            //         700: '#0369a1',
            //         800: '#075985',
            //         900: '#0c4a6e',
            //         950: '#082f49',
            //     },
            // },
        },
    },

    plugins: [forms, daisyui],

    daisyui: {
        themes: [
            'light','dark',
            {
                light: {
                    ...require('daisyui/src/theming/themes')['light'],
                    primary: 'rgb(37 70 168)', // You are overriding primary for the light theme
                    secondary: '#0c4a6e',
                    accent: '#7dd3fc',
                    neutral: '#2a323c',
                    'base-100': '#ffffff',
                    'base-200': '#f1f1f1',
                    'base-300': '#f3fbff',
                },
                dark: {
                    ...require('daisyui/src/theming/themes')['dark'],
                    primary: 'rgb(37 70 168)', // You are overriding primary for the dark theme
                    secondary: '#0c4a6e',
                    accent: '#7dd3fc',
                    neutral: '#2a323c',
                    'base-100': '#1f2937',
                    'base-200': '#111827',
                    'base-300': '#0f172a',
                },
            },
        ],
    },
};
