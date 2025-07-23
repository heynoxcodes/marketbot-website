// Global Announcement Banner System for MarketBot
(function() {
    'use strict';
    
    function createAnnouncementBanner() {
        // Get active announcements
        const announcements = JSON.parse(localStorage.getItem('marketbot_announcements') || '[]');
        const now = new Date();
        
        // Filter for active, non-expired announcements
        const activeAnnouncements = announcements.filter(ann => {
            return ann.active && new Date(ann.expiresAt) > now;
        });
        
        if (activeAnnouncements.length === 0) {
            return;
        }
        
        // Get the most recent announcement
        const announcement = activeAnnouncements[activeAnnouncements.length - 1];
        
        // Create banner HTML
        const bannerHTML = `
            <div id="marketbot-announcement-banner" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 10000;
                background-color: ${announcement.type === 'warning' ? '#f44336' : '#2196f3'};
                color: white;
                padding: 12px 20px;
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.4;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                animation: slideDown 0.3s ease-out;
            ">
                <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 10px;">
                    <span style="font-size: 16px;">${announcement.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                    <span style="flex: 1; min-width: 200px;">${announcement.text}</span>
                    <small style="opacity: 0.9; font-size: 12px;">— ${announcement.author}</small>
                </div>
            </div>
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from {
                    transform: translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            body.has-announcement-banner {
                padding-top: 60px !important;
            }
            
            .navbar.has-announcement-banner {
                top: 60px !important;
            }
        `;
        document.head.appendChild(style);
        
        // Insert banner at the top of the page
        document.body.insertAdjacentHTML('afterbegin', bannerHTML);
        
        // Adjust body and navbar positioning
        document.body.classList.add('has-announcement-banner');
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.add('has-announcement-banner');
        }
        
        // Auto-remove expired announcements
        setTimeout(() => {
            checkAndRemoveExpiredAnnouncements();
        }, 60000); // Check every minute
    }
    
    function checkAndRemoveExpiredAnnouncements() {
        const announcements = JSON.parse(localStorage.getItem('marketbot_announcements') || '[]');
        const now = new Date();
        
        // Filter out expired announcements
        const validAnnouncements = announcements.filter(ann => {
            return new Date(ann.expiresAt) > now;
        });
        
        // Update localStorage if any were removed
        if (validAnnouncements.length !== announcements.length) {
            localStorage.setItem('marketbot_announcements', JSON.stringify(validAnnouncements));
            
            // Refresh the page to remove the banner if no active announcements remain
            const activeAnnouncements = validAnnouncements.filter(ann => ann.active);
            if (activeAnnouncements.length === 0) {
                const banner = document.getElementById('marketbot-announcement-banner');
                if (banner) {
                    banner.style.animation = 'slideUp 0.3s ease-out';
                    setTimeout(() => {
                        banner.remove();
                        document.body.classList.remove('has-announcement-banner');
                        const navbar = document.querySelector('.navbar');
                        if (navbar) {
                            navbar.classList.remove('has-announcement-banner');
                        }
                    }, 300);
                }
            }
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createAnnouncementBanner);
    } else {
        createAnnouncementBanner();
    }
    
    // Check for new announcements every 30 seconds
    setInterval(() => {
        const currentBanner = document.getElementById('marketbot-announcement-banner');
        const announcements = JSON.parse(localStorage.getItem('marketbot_announcements') || '[]');
        const activeAnnouncements = announcements.filter(ann => {
            return ann.active && new Date(ann.expiresAt) > new Date();
        });
        
        // If there's a new announcement and no current banner, create one
        if (activeAnnouncements.length > 0 && !currentBanner) {
            createAnnouncementBanner();
        }
        
        checkAndRemoveExpiredAnnouncements();
    }, 30000);
    
})();