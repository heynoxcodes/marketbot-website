// Global announcement system with backend storage
class GlobalAnnouncementSystem {
    constructor() {
        this.baseUrl = 'https://getmarketbot.store/admin/announcements.json';
        this.fallbackKey = 'marketbot_announcements_global';
        this.adminKey = 'marketbot_admin_2025';
        this.init();
    }

    async init() {
        await this.loadAndDisplayAnnouncements();
        
        // Check for updates every 30 seconds
        setInterval(() => {
            this.loadAndDisplayAnnouncements();
        }, 30000);
    }

    async loadAndDisplayAnnouncements() {
        try {
            const announcements = await this.fetchAnnouncements();
            this.displayAnnouncements(announcements);
        } catch (error) {
            console.warn('Failed to load global announcements, using fallback:', error);
            this.loadFallbackAnnouncements();
        }
    }

    async fetchAnnouncements() {
        try {
            // Primary: Use localStorage for reliable storage
            const stored = localStorage.getItem('marketbot_global_announcements');
            if (stored) {
                const announcements = JSON.parse(stored);
                return this.filterExpiredAnnouncements(announcements);
            }
            
            // Fallback: Try external source
            const response = await fetch(this.baseUrl + '?t=' + Date.now(), {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                const announcements = await response.json();
                const filtered = this.filterExpiredAnnouncements(announcements);
                // Store locally for future use
                localStorage.setItem('marketbot_global_announcements', JSON.stringify(filtered));
                return filtered;
            }
        } catch (error) {
            console.warn('Failed to fetch announcements:', error);
        }

        return [];
    }

    filterExpiredAnnouncements(announcements) {
        const now = new Date();
        return announcements.filter(ann => new Date(ann.expiresAt) > now);
    }

    async createAnnouncement(text, type, author, duration) {
        // Use true global storage if available
        if (window.trueGlobalStorage) {
            const announcement = await window.trueGlobalStorage.createAnnouncement(text, type, author, duration);
            await this.loadAndDisplayAnnouncements();
            return announcement;
        }
        
        // Fallback to enhanced localStorage
        this.createFallbackAnnouncement(text, type, author, duration);
        await this.loadAndDisplayAnnouncements();
    }

    async deleteAnnouncement(id) {
        // Use true global storage if available
        if (window.trueGlobalStorage) {
            await window.trueGlobalStorage.deleteAnnouncement(id);
            await this.loadAndDisplayAnnouncements();
            return;
        }

        // Fallback to localStorage
        this.deleteFallbackAnnouncement(id);
        await this.loadAndDisplayAnnouncements();
    }

    createFallbackAnnouncement(text, type, author, duration) {
        const announcements = this.getFallbackAnnouncements();
        
        // Check for existing announcement by author
        const existingIndex = announcements.findIndex(ann => ann.author === author);
        if (existingIndex !== -1) {
            throw new Error('You already have an active announcement. Please remove it first.');
        }

        const announcement = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            text: text,
            type: type,
            author: author,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
        };

        announcements.push(announcement);
        localStorage.setItem(this.fallbackKey, JSON.stringify(announcements));
        this.loadFallbackAnnouncements();
    }

    deleteFallbackAnnouncement(id) {
        let announcements = this.getFallbackAnnouncements();
        announcements = announcements.filter(ann => ann.id !== id);
        localStorage.setItem(this.fallbackKey, JSON.stringify(announcements));
        this.loadFallbackAnnouncements();
    }

    getFallbackAnnouncements() {
        const stored = localStorage.getItem(this.fallbackKey);
        const announcements = stored ? JSON.parse(stored) : [];
        return this.filterExpiredAnnouncements(announcements);
    }

    loadFallbackAnnouncements() {
        const announcements = this.getFallbackAnnouncements();
        const now = new Date();
        
        // Filter expired announcements
        const activeAnnouncements = announcements.filter(ann => new Date(ann.expiresAt) > now);
        
        // Save cleaned list
        localStorage.setItem(this.fallbackKey, JSON.stringify(activeAnnouncements));
        
        this.displayAnnouncements(activeAnnouncements);
    }

    displayAnnouncements(announcements) {
        // Remove existing banners
        const existingBanners = document.querySelectorAll('.announcement-banner');
        existingBanners.forEach(banner => banner.remove());

        if (announcements.length === 0) {
            this.adjustNavbarPosition(false);
            return;
        }

        // Create banner container
        const bannerContainer = document.createElement('div');
        bannerContainer.className = 'announcement-banner-container';
        
        announcements.forEach(announcement => {
            const banner = this.createBannerElement(announcement);
            bannerContainer.appendChild(banner);
        });

        // Insert at top of body
        document.body.insertBefore(bannerContainer, document.body.firstChild);
        
        // Adjust navbar position
        this.adjustNavbarPosition(true);
    }

    createBannerElement(announcement) {
        const banner = document.createElement('div');
        banner.className = `announcement-banner announcement-${announcement.type}`;
        
        const icon = announcement.type === 'warning' ? '⚠️' : 'ℹ️';
        
        banner.innerHTML = `
            <div class="announcement-content">
                <span class="announcement-icon">${icon}</span>
                <span class="announcement-text">${announcement.text}</span>
                <span class="announcement-author">— ${announcement.author}</span>
            </div>
        `;

        return banner;
    }

    adjustNavbarPosition(hasAnnouncements) {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (hasAnnouncements) {
                const bannerHeight = document.querySelector('.announcement-banner-container')?.offsetHeight || 0;
                navbar.style.marginTop = bannerHeight + 'px';
            } else {
                navbar.style.marginTop = '0';
            }
        }
    }
}

// Global styles for announcements
const announcementStyles = `
.announcement-banner-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: inherit;
}

.announcement-banner {
    padding: 12px 20px;
    text-align: center;
    font-weight: 500;
    animation: slideDown 0.3s ease-out;
    border-bottom: 1px solid rgba(255,255,255,0.2);
}

.announcement-banner.announcement-warning {
    background-color: #f44336;
    color: white;
}

.announcement-banner.announcement-info {
    background-color: #2196f3;
    color: white;
}

.announcement-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
}

.announcement-icon {
    font-size: 16px;
}

.announcement-text {
    flex: 1;
    min-width: 200px;
}

.announcement-author {
    opacity: 0.9;
    font-style: italic;
    font-size: 0.9em;
}

@keyframes slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@media (max-width: 768px) {
    .announcement-banner {
        padding: 10px 15px;
        font-size: 14px;
    }
    
    .announcement-content {
        flex-direction: column;
        gap: 5px;
    }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = announcementStyles;
document.head.appendChild(styleSheet);

// Initialize global announcement system
const globalAnnouncements = new GlobalAnnouncementSystem();

// Export for admin dashboard
window.GlobalAnnouncementSystem = GlobalAnnouncementSystem;
window.globalAnnouncements = globalAnnouncements;