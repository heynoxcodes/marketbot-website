// Clear all unwanted announcement banners and localStorage
(function() {
    'use strict';
    
    // Clear all announcement-related localStorage
    localStorage.removeItem('marketbot_global_announcements');
    localStorage.removeItem('marketbot_announcements');
    
    // Remove any existing banners
    const selectors = [
        '#marketbot-announcement-banner',
        '.announcement-banner',
        '.announcement-banner-container',
        '[id*="announcement"]',
        '[class*="announcement"]'
    ];
    
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            element.remove();
        });
    });
    
    // Remove body classes
    document.body.classList.remove('has-announcement-banner');
    
    // Reset navbar positioning
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.marginTop = '0';
        navbar.classList.remove('has-announcement-banner');
    }
    
    console.log('Cleared all unwanted notification banners');
})();