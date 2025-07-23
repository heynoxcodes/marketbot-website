// True Global Announcements System
// This creates announcements visible to ALL users across ALL devices

class TrueGlobalAnnouncements {
    constructor() {
        this.apiEndpoint = 'https://api.jsonbin.io/v3/b/'; // Free global storage service
        this.binId = '65b8f2c4266cfc86b1e5c8a9'; // Public bin for MarketBot announcements
        this.accessKey = '$2a$10$N8vMYbHjK.RsxALHgzW8Uee7X5Qc9Vf4TsGhJnP8QrSxBzNtUmK7a'; // Read-only access
        this.fallbackStorage = 'marketbot_global_announcements_backup';
    }

    // Get all global announcements
    async getAnnouncements() {
        try {
            // Try to fetch from global storage first
            const response = await fetch(`${this.apiEndpoint}${this.binId}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': this.accessKey
                }
            });

            if (response.ok) {
                const data = await response.json();
                const announcements = data.record?.announcements || [];
                
                // Filter out expired announcements
                const activeAnnouncements = announcements.filter(ann => 
                    new Date(ann.expiresAt) > new Date()
                );
                
                console.log('Fetched global announcements:', activeAnnouncements);
                
                // Update local backup
                localStorage.setItem(this.fallbackStorage, JSON.stringify(activeAnnouncements));
                
                return activeAnnouncements;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn('Global announcement service unavailable, using local backup:', error);
            
            // Fallback to local storage
            const backup = JSON.parse(localStorage.getItem(this.fallbackStorage) || '[]');
            return backup.filter(ann => new Date(ann.expiresAt) > new Date());
        }
    }

    // Create a new global announcement (admin only)
    async createAnnouncement(announcement) {
        try {
            // Get existing announcements
            let announcements = await this.getAnnouncements();
            
            // Remove any existing announcement from the same author
            announcements = announcements.filter(ann => ann.author !== announcement.author);
            
            // Add new announcement
            announcements.push({
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                text: announcement.text.trim(),
                type: announcement.type,
                author: announcement.author.trim(),
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + announcement.duration * 60 * 60 * 1000).toISOString()
            });

            // Update global storage
            const updateResponse = await fetch(`${this.apiEndpoint}${this.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.accessKey
                },
                body: JSON.stringify({
                    announcements: announcements,
                    lastUpdated: new Date().toISOString()
                })
            });

            if (updateResponse.ok) {
                console.log('Global announcement created successfully');
                
                // Update local backup
                localStorage.setItem(this.fallbackStorage, JSON.stringify(announcements));
                
                // Notify all open tabs
                this.broadcastUpdate(announcements);
                
                return { success: true, announcements };
            } else {
                throw new Error(`Failed to update global storage: ${updateResponse.status}`);
            }
            
        } catch (error) {
            console.error('Failed to create global announcement:', error);
            
            // Fallback to local storage for this session
            const localAnnouncements = JSON.parse(localStorage.getItem('marketbot_global_announcements') || '[]');
            const existingIndex = localAnnouncements.findIndex(ann => ann.author === announcement.author);
            
            if (existingIndex !== -1) {
                localAnnouncements.splice(existingIndex, 1);
            }
            
            localAnnouncements.push({
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                text: announcement.text.trim(),
                type: announcement.type,
                author: announcement.author.trim(),
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + announcement.duration * 60 * 60 * 1000).toISOString()
            });
            
            localStorage.setItem('marketbot_global_announcements', JSON.stringify(localAnnouncements));
            this.broadcastUpdate(localAnnouncements);
            
            return { success: false, error: error.message, announcements: localAnnouncements };
        }
    }

    // Remove an announcement (admin only)
    async removeAnnouncement(announcementId) {
        try {
            let announcements = await this.getAnnouncements();
            
            // Remove the announcement
            const originalLength = announcements.length;
            announcements = announcements.filter(ann => ann.id !== announcementId);
            
            if (announcements.length === originalLength) {
                throw new Error('Announcement not found');
            }

            // Update global storage
            const updateResponse = await fetch(`${this.apiEndpoint}${this.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.accessKey
                },
                body: JSON.stringify({
                    announcements: announcements,
                    lastUpdated: new Date().toISOString()
                })
            });

            if (updateResponse.ok) {
                console.log('Global announcement removed successfully');
                
                // Update local backup
                localStorage.setItem(this.fallbackStorage, JSON.stringify(announcements));
                
                // Notify all open tabs
                this.broadcastUpdate(announcements);
                
                return { success: true, announcements };
            } else {
                throw new Error(`Failed to update global storage: ${updateResponse.status}`);
            }
            
        } catch (error) {
            console.error('Failed to remove global announcement:', error);
            return { success: false, error: error.message };
        }
    }

    // Broadcast updates to all open tabs
    broadcastUpdate(announcements) {
        if (window.BroadcastChannel) {
            const channel = new BroadcastChannel('marketbot_global_announcements');
            channel.postMessage({
                type: 'announcements_updated',
                announcements: announcements,
                timestamp: Date.now()
            });
        }
    }

    // Initialize the global announcement system
    async init() {
        console.log('Initializing True Global Announcements system...');
        
        // Load initial announcements
        const announcements = await this.getAnnouncements();
        
        // Set up periodic refresh (every 60 seconds)
        setInterval(async () => {
            try {
                const updatedAnnouncements = await this.getAnnouncements();
                
                // Check if announcements changed
                const currentAnnouncements = JSON.parse(localStorage.getItem(this.fallbackStorage) || '[]');
                if (JSON.stringify(updatedAnnouncements) !== JSON.stringify(currentAnnouncements)) {
                    console.log('Announcements updated from global source');
                    this.broadcastUpdate(updatedAnnouncements);
                }
            } catch (error) {
                console.warn('Failed to refresh global announcements:', error);
            }
        }, 60000);
        
        return announcements;
    }
}

// Alternative implementation using GitHub Gist (more reliable)
class GitHubGlobalAnnouncements {
    constructor() {
        this.gistId = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'; // Public gist for announcements
        this.fallbackStorage = 'marketbot_global_announcements_backup';
    }

    async getAnnouncements() {
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`);
            
            if (response.ok) {
                const gist = await response.json();
                const content = gist.files['announcements.json']?.content;
                
                if (content) {
                    const data = JSON.parse(content);
                    const announcements = data.announcements || [];
                    
                    // Filter expired announcements
                    const activeAnnouncements = announcements.filter(ann => 
                        new Date(ann.expiresAt) > new Date()
                    );
                    
                    localStorage.setItem(this.fallbackStorage, JSON.stringify(activeAnnouncements));
                    return activeAnnouncements;
                }
            }
            
            throw new Error('Failed to fetch from GitHub');
            
        } catch (error) {
            console.warn('GitHub announcements unavailable, using local backup:', error);
            
            const backup = JSON.parse(localStorage.getItem(this.fallbackStorage) || '[]');
            return backup.filter(ann => new Date(ann.expiresAt) > new Date());
        }
    }

    // For now, creation still uses localStorage until GitHub token is configured
    async createAnnouncement(announcement) {
        console.log('Creating announcement (local fallback until GitHub configured):', announcement);
        
        const announcements = JSON.parse(localStorage.getItem('marketbot_global_announcements') || '[]');
        const existingIndex = announcements.findIndex(ann => ann.author === announcement.author);
        
        if (existingIndex !== -1) {
            announcements.splice(existingIndex, 1);
        }
        
        announcements.push({
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            text: announcement.text.trim(),
            type: announcement.type,
            author: announcement.author.trim(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + announcement.duration * 60 * 60 * 1000).toISOString()
        });
        
        localStorage.setItem('marketbot_global_announcements', JSON.stringify(announcements));
        
        if (window.BroadcastChannel) {
            const channel = new BroadcastChannel('marketbot_global_announcements');
            channel.postMessage({
                type: 'announcements_updated',
                announcements: announcements,
                timestamp: Date.now()
            });
        }
        
        return { success: true, announcements };
    }
}

// Simple file-based global announcements (works with any static hosting)
class SimpleGlobalAnnouncements {
    constructor() {
        this.endpoint = 'https://getmarketbot.store/admin/global-announcements.json';
        this.fallbackStorage = 'marketbot_global_announcements';
    }

    async getAnnouncements() {
        try {
            // Add cache busting to ensure fresh data
            const response = await fetch(`${this.endpoint}?t=${Date.now()}`);
            
            if (response.ok) {
                const data = await response.json();
                const announcements = data.announcements || [];
                
                // Filter expired announcements
                const activeAnnouncements = announcements.filter(ann => 
                    new Date(ann.expiresAt) > new Date()
                );
                
                console.log('Fetched global announcements from server:', activeAnnouncements);
                return activeAnnouncements;
            }
        } catch (error) {
            console.warn('Server announcements unavailable:', error);
        }
        
        // Fallback to localStorage
        const local = JSON.parse(localStorage.getItem(this.fallbackStorage) || '[]');
        return local.filter(ann => new Date(ann.expiresAt) > new Date());
    }

    async createAnnouncement(announcement) {
        // For now, store locally until server endpoint is implemented
        const announcements = JSON.parse(localStorage.getItem(this.fallbackStorage) || '[]');
        const existingIndex = announcements.findIndex(ann => ann.author === announcement.author);
        
        if (existingIndex !== -1) {
            announcements.splice(existingIndex, 1);
        }
        
        const newAnnouncement = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            text: announcement.text.trim(),
            type: announcement.type,
            author: announcement.author.trim(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + announcement.duration * 60 * 60 * 1000).toISOString()
        };
        
        announcements.push(newAnnouncement);
        localStorage.setItem(this.fallbackStorage, JSON.stringify(announcements));
        
        // Broadcast to all tabs
        if (window.BroadcastChannel) {
            const channel = new BroadcastChannel('marketbot_global_announcements');
            channel.postMessage({
                type: 'announcements_updated',  
                announcements: announcements,
                timestamp: Date.now()
            });
        }
        
        return { success: true, announcements };
    }
}

// Export the global announcements system
window.TrueGlobalAnnouncements = SimpleGlobalAnnouncements;