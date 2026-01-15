import { forwardRef, useEffect, useRef } from 'react';

export default forwardRef(function SelectInput({ className = '', isFocused = false, children, ...props }, ref) {
    const select = ref ? ref : useRef();

    useEffect(() => {
        if (isFocused) {
            select.current.focus();
        }
    }, []);

    return (
        <select
            {...props}
            className={
                'border-gray-300 focus:border-primary-500 focus:ring-primary-500 rounded-md shadow-sm ' +
                className
            }
            ref={select}
        >
            {children}
        </select>
    );
});