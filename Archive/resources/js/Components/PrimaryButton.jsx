export default function PrimaryButton({ className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            className={
                `btn btn-primary ${
                    disabled && 'op'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}