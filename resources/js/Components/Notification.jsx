import { useEffect } from 'react';
import Notiflix from 'notiflix';

// Initialize Notiflix with custom settings
Notiflix.Notify.init({
    position: 'right-top',
    width: '320px',
    distance: '10px',
    opacity: 1,
    borderRadius: '5px',
    rtl: false,
    timeout: 3000,
    messageMaxLength: 110,
    backOverlay: false,
    backOverlayColor: 'rgba(0,0,0,0.5)',
    plainText: true,
    showOnlyTheLastOne: false,
    clickToClose: true,
    pauseOnHover: true,
    ID: 'NotiflixNotify',
    className: 'notiflix-notify',
    zindex: 4001,
    fontFamily: 'Quicksand',
    fontSize: '14px',
    cssAnimation: true,
    cssAnimationDuration: 400,
    cssAnimationStyle: 'fade',
    closeButton: false,
    useIcon: true,
    useFontAwesome: false,
    fontAwesomeIconStyle: 'basic',
    fontAwesomeIconSize: '34px',
    success: {
        background: '#32c682',
        textColor: '#fff',
        childClassName: 'notiflix-notify-success',
        notiflixIconColor: 'rgba(0,0,0,0.2)',
        fontAwesomeClassName: 'fas fa-check-circle',
        fontAwesomeIconColor: 'rgba(0,0,0,0.2)',
        backOverlayColor: 'rgba(50,198,130,0.2)',
    },
    failure: {
        background: '#ff5549',
        textColor: '#fff',
        childClassName: 'notiflix-notify-failure',
        notiflixIconColor: 'rgba(0,0,0,0.2)',
        fontAwesomeClassName: 'fas fa-times-circle',
        fontAwesomeIconColor: 'rgba(0,0,0,0.2)',
        backOverlayColor: 'rgba(255,85,73,0.2)',
    },
    warning: {
        background: '#eebf31',
        textColor: '#fff',
        childClassName: 'notiflix-notify-warning',
        notiflixIconColor: 'rgba(0,0,0,0.2)',
        fontAwesomeClassName: 'fas fa-exclamation-circle',
        fontAwesomeIconColor: 'rgba(0,0,0,0.2)',
        backOverlayColor: 'rgba(238,191,49,0.2)',
    },
    info: {
        background: '#26c0d3',
        textColor: '#fff',
        childClassName: 'notiflix-notify-info',
        notiflixIconColor: 'rgba(0,0,0,0.2)',
        fontAwesomeClassName: 'fas fa-info-circle',
        fontAwesomeIconColor: 'rgba(0,0,0,0.2)',
        backOverlayColor: 'rgba(38,192,211,0.2)',
    },
});

// Initialize Notiflix Confirm with custom settings
Notiflix.Confirm.init({
    className: 'notiflix-confirm',
    width: '320px',
    zindex: 4003,
    position: 'center',
    distance: '10px',
    backgroundColor: '#f8f8f8',
    borderRadius: '5px',
    backOverlay: true,
    backOverlayColor: 'rgba(0,0,0,0.5)',
    rtl: false,
    fontFamily: 'Quicksand',
    cssAnimation: true,
    cssAnimationDuration: 300,
    cssAnimationStyle: 'fade',
    plainText: true,
    titleColor: '#32c682',
    titleFontSize: '16px',
    titleMaxLength: 34,
    messageColor: '#1e1e1e',
    messageFontSize: '14px',
    messageMaxLength: 110,
    buttonsFontSize: '15px',
    buttonsMaxLength: 34,
    okButtonColor: '#f8f8f8',
    okButtonBackground: '#32c682',
    cancelButtonColor: '#f8f8f8',
    cancelButtonBackground: '#ff5549',
});

// Initialize Notiflix Loading with custom settings
Notiflix.Loading.init({
    className: 'notiflix-loading',
    zindex: 4000,
    backgroundColor: 'rgba(0,0,0,0.8)',
    rtl: false,
    fontFamily: 'Quicksand',
    cssAnimation: true,
    cssAnimationDuration: 400,
    clickToClose: false,
    customSvgUrl: null,
    customSvgCode: null,
    svgSize: '80px',
    svgColor: '#32c682',
    messageID: 'NotiflixLoadingMessage',
    messageFontSize: '15px',
    messageMaxLength: 34,
    messageColor: '#dcdcdc',
});

// Initialize Notiflix Block with custom settings
Notiflix.Block.init({
    querySelectorLimit: 200,
    className: 'notiflix-block',
    position: 'absolute',
    zindex: 1000,
    backgroundColor: 'rgba(255,255,255,0.9)',
    rtl: false,
    fontFamily: 'Quicksand',
    cssAnimation: true,
    cssAnimationDuration: 300,
    svgSize: '45px',
    svgColor: '#383838',
    messageFontSize: '14px',
    messageMaxLength: 34,
    messageColor: '#383838',
});

// Export notification functions for easy use throughout the app
export const notify = {
    success: (message) => Notiflix.Notify.success(message),
    error: (message) => Notiflix.Notify.failure(message),
    warning: (message) => Notiflix.Notify.warning(message),
    info: (message) => Notiflix.Notify.info(message),
    confirm: (title, message, okText, cancelText, okCallback, cancelCallback) => {
        Notiflix.Confirm.show(
            title,
            message,
            okText || 'Yes',
            cancelText || 'No',
            okCallback,
            cancelCallback
        );
    },
    loading: {
        standard: (message) => Notiflix.Loading.standard(message || 'Loading...'),
        hourglass: (message) => Notiflix.Loading.hourglass(message || 'Loading...'),
        circle: (message) => Notiflix.Loading.circle(message || 'Loading...'),
        arrows: (message) => Notiflix.Loading.arrows(message || 'Loading...'),
        dots: (message) => Notiflix.Loading.dots(message || 'Loading...'),
        pulse: (message) => Notiflix.Loading.pulse(message || 'Loading...'),
        custom: (message) => Notiflix.Loading.custom(message || 'Loading...'),
        remove: () => Notiflix.Loading.remove(),
    },
    block: {
        standard: (selector, message) => Notiflix.Block.standard(selector, message || 'Loading...'),
        hourglass: (selector, message) => Notiflix.Block.hourglass(selector, message || 'Loading...'),
        circle: (selector, message) => Notiflix.Block.circle(selector, message || 'Loading...'),
        arrows: (selector, message) => Notiflix.Block.arrows(selector, message || 'Loading...'),
        dots: (selector, message) => Notiflix.Block.dots(selector, message || 'Loading...'),
        pulse: (selector, message) => Notiflix.Block.pulse(selector, message || 'Loading...'),
        remove: (selector) => Notiflix.Block.remove(selector),
    },
};

// Notification component to handle flash messages from Laravel
export default function Notification({ flash }) {
    useEffect(() => {
        // Handle flash messages from Laravel
        if (flash.success) {
            notify.success(flash.success);
        }
        
        if (flash.error) {
            notify.error(flash.error);
        }
        
        if (flash.warning) {
            notify.warning(flash.warning);
        }
        
        if (flash.info) {
            notify.info(flash.info);
        }
    }, [flash]);

    return null; // This component doesn't render anything
}