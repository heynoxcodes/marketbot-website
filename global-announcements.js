// Global announcement system with backend storage
class GlobalAnnouncementSystem {
    constructor() {
        this.baseUrl = 'https://getmarketbot.store/admin/announcements.php';
        this.fallbackKey = 'marketbot_announcements_fallback';
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
        const response = await fetch(this.baseUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    }

    async createAnnouncement(text, type, author, duration) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    type: type,
                    author: author,
                    duration: duration
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create announcement');
            }

            await this.loadAndDisplayAnnouncements();
            return result;
        } catch (error) {
            // Fallback to localStorage
            this.createFallbackAnnouncement(text, type, author, duration);
            throw error;
        }
    }

    async deleteAnnouncement(id) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: id })
            });

            if (!response.ok) {
                throw new Error('Failed to delete announcement');
            }

            await this.loadAndDisplayAnnouncements();
        } catch (error) {
            // Fallback to localStorage
            this.deleteFallbackAnnouncement(id);
            throw error;
        }
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
        return stored ? JSON.parse(stored) : [];
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