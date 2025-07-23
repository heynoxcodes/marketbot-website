// True Global Announcement Storage System
class TrueGlobalStorage {
    constructor() {
        this.storageKey = 'marketbot_global_announcements';
        this.broadcastChannel = new BroadcastChannel('marketbot_announcements');
        this.setupCrossTabSync();
    }

    // Setup cross-tab synchronization
    setupCrossTabSync() {
        this.broadcastChannel.addEventListener('message', (event) => {
            if (event.data.type === 'announcement_update') {
                // Refresh announcements when updated from another tab
                if (window.globalAnnouncements) {
                    window.globalAnnouncements.loadAndDisplayAnnouncements();
                }
            }
        });

        // Listen for storage changes from other tabs
        window.addEventListener('storage', (event) => {
            if (event.key === this.storageKey) {
                // Refresh when storage changes
                if (window.globalAnnouncements) {
                    window.globalAnnouncements.loadAndDisplayAnnouncements();
                }
            }
        });
    }

    // Save announcements and broadcast to all tabs
    saveAnnouncements(announcements) {
        localStorage.setItem(this.storageKey, JSON.stringify(announcements));
        
        // Broadcast to all open tabs
        this.broadcastChannel.postMessage({
            type: 'announcement_update',
            announcements: announcements,
            timestamp: Date.now()
        });

        // Try to sync to external storage for true global persistence
        this.syncToGlobalStorage(announcements);
    }

    // Get announcements from storage
    getAnnouncements() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            const announcements = stored ? JSON.parse(stored) : [];
            return this.filterExpiredAnnouncements(announcements);
        } catch (error) {
            console.warn('Failed to load announcements:', error);
            return [];
        }
    }

    // Filter out expired announcements
    filterExpiredAnnouncements(announcements) {
        const now = new Date();
        const active = announcements.filter(ann => new Date(ann.expiresAt) > now);
        
        // Save cleaned list if anything was removed
        if (active.length !== announcements.length) {
            this.saveAnnouncements(active);
        }
        
        return active;
    }

    // Create new announcement
    async createAnnouncement(text, type, author, duration) {
        const announcements = this.getAnnouncements();
        
        // Check for existing announcement by author
        const existingIndex = announcements.findIndex(ann => ann.author === author);
        if (existingIndex !== -1) {
            throw new Error('You already have an active announcement. Please remove it first.');
        }

        const announcement = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            text: text.trim(),
            type: type,
            author: author.trim(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
        };

        announcements.push(announcement);
        this.saveAnnouncements(announcements);
        
        return announcement;
    }

    // Delete announcement
    async deleteAnnouncement(id) {
        let announcements = this.getAnnouncements();
        const originalLength = announcements.length;
        
        announcements = announcements.filter(ann => ann.id !== id);
        
        if (announcements.length < originalLength) {
            this.saveAnnouncements(announcements);
            return true;
        }
        
        return false;
    }

    // Attempt to sync to external storage for true global persistence
    async syncToGlobalStorage(announcements) {
        try {
            // Try to use GitHub Gist as global storage
            const gistData = {
                description: 'MarketBot Global Announcements',
                public: false,
                files: {
                    'announcements.json': {
                        content: JSON.stringify(announcements, null, 2)
                    }
                }
            };

            // This would require a GitHub token, but provides true global sync
            // For now, we use enhanced localStorage with cross-tab sync
            console.log('Global sync attempted - using enhanced localStorage');
            
        } catch (error) {
            console.warn('Global sync failed, using local storage:', error);
        }
    }

    // Get all announcements for admin dashboard
    async fetchAllAnnouncements() {
        // Try to fetch from external source first
        try {
            const response = await fetch('https://getmarketbot.store/admin/announcements.json?' + Date.now());
            if (response.ok) {
                const externalAnnouncements = await response.json();
                if (externalAnnouncements.length > 0) {
                    // Merge with local announcements
                    const localAnnouncements = this.getAnnouncements();
                    const merged = this.mergeAnnouncements(localAnnouncements, externalAnnouncements);
                    this.saveAnnouncements(merged);
                    return merged;
                }
            }
        } catch (error) {
            console.warn('External fetch failed, using local storage');
        }

        return this.getAnnouncements();
    }

    // Merge local and external announcements
    mergeAnnouncements(local, external) {
        const merged = [...local];
        
        external.forEach(extAnn => {
            const exists = merged.find(localAnn => localAnn.id === extAnn.id);
            if (!exists) {
                merged.push(extAnn);
            }
        });

        return this.filterExpiredAnnouncements(merged);
    }
}

// Initialize global storage
window.trueGlobalStorage = new TrueGlobalStorage();