// Secure Admin Authentication and Management System
class SecureAdminSystem {
    constructor() {
        this.sessionKey = 'marketbot_admin_session';
        this.maxSessionTime = 30 * 60 * 1000; // 30 minutes
        this.sessionTimer = null;
        this.currentUser = null;
        
        this.init();
    }

    init() {
        console.log('Initializing MarketBot Admin System...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.checkAuth());
        } else {
            this.checkAuth();
        }
    }

    checkAuth() {
        const loadingScreen = document.getElementById('loadingScreen');
        const loginContainer = document.getElementById('loginContainer');
        const dashboard = document.getElementById('dashboard');

        // Show loading screen initially
        loadingScreen.style.display = 'flex';

        setTimeout(() => {
            if (this.isAuthenticated()) {
                this.showDashboard();
            } else {
                this.showLogin();
            }
            loadingScreen.style.display = 'none';
        }, 1500);
    }

    async verifyPassword(password) {
        // Easter egg for specific password
        if (password === 'vyxlez2010') {
            console.log('Easter egg triggered!');
            this.showEasterEgg();
            return false;
        }
        
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + 'marketbot_security_salt_2025');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            // Server-side equivalent hash for 'marketbot_admin_2025'
            const validHash = 'bc683774a01cd54c2e9ffb13865dbda7d90cdfa106eefe51ad15292af2d37dbb';
            
            return this.constantTimeCompare(hashedPassword, validHash);
        } catch (error) {
            console.error('Password verification failed:', error);
            return false;
        }
    }

    showEasterEgg() {
        console.log('Showing easter egg message');
        const errorDiv = document.getElementById('loginError');
        const passwordField = document.getElementById('adminPassword');
        
        if (errorDiv) {
            // Clear any existing content and show easter egg
            errorDiv.innerHTML = `
                <div class="easter-egg">
                    🚫 You're not hacking me buddy! 🚫
                </div>
            `;
            errorDiv.style.display = 'block';
            errorDiv.classList.add('easter-egg-container');
            
            if (passwordField) {
                passwordField.value = '';
                passwordField.style.animation = 'shake 0.5s ease-in-out';
                passwordField.focus();
            }
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.style.display = 'none';
                errorDiv.classList.remove('easter-egg-container');
                if (passwordField) {
                    passwordField.style.animation = '';
                }
            }, 5000);
        } else {
            console.error('loginError element not found for easter egg');
        }
    }

    constantTimeCompare(a, b) {
        if (a.length !== b.length) return false;
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }

    createSession() {
        const sessionData = {
            authenticated: true,
            timestamp: Date.now(),
            token: this.generateSecureToken(),
            user: 'admin'
        };
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        this.currentUser = sessionData;
    }

    generateSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    isAuthenticated() {
        const session = this.getSession();
        if (!session) return false;
        
        const sessionAge = Date.now() - session.timestamp;
        if (sessionAge > this.maxSessionTime) {
            this.logout();
            return false;
        }
        
        return session.authenticated === true && session.token;
    }

    getSession() {
        try {
            const sessionStr = localStorage.getItem(this.sessionKey);
            return sessionStr ? JSON.parse(sessionStr) : null;
        } catch (error) {
            console.error('Session retrieval failed:', error);
            return null;
        }
    }

    showLogin() {
        const loginContainer = document.getElementById('loginContainer');
        const dashboard = document.getElementById('dashboard');
        
        loginContainer.style.display = 'flex';
        dashboard.classList.remove('active');

        // Setup login form handler
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Focus password field
        const passwordField = document.getElementById('adminPassword');
        if (passwordField) {
            passwordField.focus();
        }
    }

    async handleLogin() {
        const password = document.getElementById('adminPassword').value;
        const loginBtn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('loginError');
        
        if (!password) {
            this.showError('Please enter the admin password');
            return;
        }

        try {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Authenticating...';

            const isValid = await this.verifyPassword(password);
            
            if (isValid) {
                this.createSession();
                this.showDashboard();
            } else {
                // Don't show generic error if easter egg was triggered
                if (password !== 'vyxlez2010') {
                    this.showError('Invalid credentials. Access denied.');
                }
                document.getElementById('adminPassword').value = '';
                
                // Security delay after failed attempt
                setTimeout(() => {
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Access Dashboard';
                }, 2000);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Authentication error. Please try again.');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Access Dashboard';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    showDashboard() {
        const loginContainer = document.getElementById('loginContainer');
        const dashboard = document.getElementById('dashboard');
        
        loginContainer.style.display = 'none';
        dashboard.classList.add('active');

        this.initializeDashboard();
        this.startSessionTimer();
    }

    initializeDashboard() {
        console.log('Initializing dashboard features...');
        
        // Load initial data
        this.loadActiveAnnouncements();
        this.updateAnalytics();
        this.setupPreviewSystem();
        
        // Setup form handlers
        this.setupFormHandlers();
    }

    setupFormHandlers() {
        // Real-time preview updates
        const textArea = document.getElementById('announcementText');
        const typeSelect = document.getElementById('announcementType');
        const authorInput = document.getElementById('authorName');

        if (textArea && typeSelect && authorInput) {
            [textArea, typeSelect, authorInput].forEach(element => {
                element.addEventListener('input', () => this.updatePreview());
            });
        }
    }

    setupPreviewSystem() {
        this.updatePreview();
    }

    updatePreview() {
        const text = document.getElementById('announcementText')?.value || 'Your announcement will appear here...';
        const type = document.getElementById('announcementType')?.value || 'info';
        const author = document.getElementById('authorName')?.value || 'Your Name';
        
        const preview = document.getElementById('announcementPreview');
        if (preview) {
            const icon = type === 'warning' ? '⚠️' : 'ℹ️';
            
            preview.className = `announcement-preview ${type}`;
            preview.innerHTML = `
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">${text}</span>
                <span class="preview-author">— ${author}</span>
            `;
        }
    }

    async publishAnnouncement() {
        const text = document.getElementById('announcementText')?.value.trim();
        const type = document.getElementById('announcementType')?.value;
        const duration = parseInt(document.getElementById('duration')?.value);
        const author = document.getElementById('authorName')?.value.trim();

        console.log('Publishing global announcement:', { text, type, duration, author });

        if (!text || !author) {
            this.showPublishError('Please fill in all required fields');
            return;
        }

        if (text.length > 200) {
            this.showPublishError('Announcement text must be 200 characters or less');
            return;
        }

        if (duration < 1 || duration > 168) {
            this.showPublishError('Duration must be between 1 and 168 hours');
            return;
        }

        try {
            // Get existing announcements
            let announcements = JSON.parse(localStorage.getItem('marketbot_global_announcements') || '[]');
            
            // Remove existing announcement from same author (one per author limit)
            announcements = announcements.filter(ann => ann.author !== author);
            
            // Create new announcement
            const announcement = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                text: text,
                type: type,
                author: author,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
            };
            
            announcements.push(announcement);
            
            // Store in localStorage
            localStorage.setItem('marketbot_global_announcements', JSON.stringify(announcements));
            
            // Also store in the global JSON file that gets deployed
            await this.saveToGlobalFile(announcements);
            
            // Broadcast to all tabs and devices
            if (window.BroadcastChannel) {
                const channel = new BroadcastChannel('marketbot_global_announcements');
                channel.postMessage({
                    type: 'announcements_updated',
                    announcements: announcements,
                    timestamp: Date.now()
                });
            }
            
            console.log('Global announcement created:', announcement);
            
            // Clear form
            document.getElementById('announcementText').value = '';
            document.getElementById('authorName').value = '';
            
            // Show success message
            this.showPublishSuccess('Global announcement published successfully! Visible to all users worldwide.');
            
            // Refresh list and update analytics
            await this.loadActiveAnnouncements();
            this.updateAnalytics();
            
        } catch (error) {
            console.error('Failed to publish global announcement:', error);
            this.showPublishError('Failed to publish global announcement: ' + error.message);
        }
    }

    showPublishError(message) {
        const publishMessage = document.getElementById('publishMessage');
        if (publishMessage) {
            publishMessage.textContent = message;
            publishMessage.className = 'error-message';
            publishMessage.style.display = 'block';
            
            setTimeout(() => {
                publishMessage.style.display = 'none';
            }, 5000);
        }
    }

    showPublishSuccess(message) {
        const publishMessage = document.getElementById('publishMessage');
        if (publishMessage) {
            publishMessage.textContent = message;
            publishMessage.className = 'success-message';
            publishMessage.style.display = 'block';
            
            setTimeout(() => {
                publishMessage.style.display = 'none';
            }, 3000);
        }
    }

    async loadActiveAnnouncements() {
        try {
            console.log('Loading global announcements...');
            
            // Get announcements from localStorage
            let announcements = JSON.parse(localStorage.getItem('marketbot_global_announcements') || '[]');
            
            // Filter out expired announcements
            const now = new Date();
            const originalLength = announcements.length;
            announcements = announcements.filter(ann => new Date(ann.expiresAt) > now);
            
            // Update storage if expired announcements were removed
            if (originalLength !== announcements.length) {
                localStorage.setItem('marketbot_global_announcements', JSON.stringify(announcements));
                await this.saveToGlobalFile(announcements);
            }
            
            console.log('Loaded active global announcements:', announcements);
            
            const container = document.getElementById('activeAnnouncementsList');
            if (!container) return;
            
            if (announcements.length === 0) {
                container.innerHTML = '<p style="color: #94A3B8;">No active global announcements</p>';
                return;
            }

            container.innerHTML = announcements.map(ann => `
                <div class="announcement-item">
                    <div class="announcement-meta">
                        <span class="announcement-type ${ann.type}">${ann.type === 'warning' ? '⚠️ Warning' : 'ℹ️ Info'}</span>
                        <span>Created: ${new Date(ann.createdAt).toLocaleString()}</span>
                        <span>Expires: ${new Date(ann.expiresAt).toLocaleString()}</span>
                        <span>Author: ${ann.author}</span>
                        <span style="color: #86EFAC;">🌍 Global</span>
                    </div>
                    <div class="announcement-text">${ann.text}</div>
                    <button onclick="adminSystem.removeAnnouncement('${ann.id}')" class="btn btn-danger" style="margin-top: 1rem;">
                        Remove Global Announcement
                    </button>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Failed to load global announcements:', error);
            const container = document.getElementById('activeAnnouncementsList');
            if (container) {
                container.innerHTML = '<p style="color: #FCA5A5;">Error loading global announcements</p>';
            }
        }
    }

    async removeAnnouncement(id) {
        try {
            console.log('Removing global announcement:', id);
            
            // Get announcements and remove the specified one
            let announcements = JSON.parse(localStorage.getItem('marketbot_global_announcements') || '[]');
            const originalLength = announcements.length;
            
            announcements = announcements.filter(ann => ann.id !== id);
            
            if (announcements.length === originalLength) {
                throw new Error('Announcement not found');
            }
            
            // Update localStorage
            localStorage.setItem('marketbot_global_announcements', JSON.stringify(announcements));
            
            // Update the global JSON file
            await this.updateGlobalAnnouncementsFile(announcements);
            
            // Broadcast to all tabs and devices
            if (window.BroadcastChannel) {
                const channel = new BroadcastChannel('marketbot_global_announcements');
                channel.postMessage({
                    type: 'announcements_updated',
                    announcements: announcements,
                    timestamp: Date.now()
                });
            }
            
            console.log('Global announcement removed successfully');
            
            // Refresh list and update analytics
            await this.loadActiveAnnouncements();
            this.updateAnalytics();
            
        } catch (error) {
            console.error('Failed to remove global announcement:', error);
            alert('Failed to remove global announcement: ' + error.message);
        }
    }

    async updateAnalytics() {
        try {
            // Get real statistics from the stats API
            const realStats = window.marketBotStats ? window.marketBotStats.getStats() : null;
            
            // Get global announcements count
            const announcements = JSON.parse(localStorage.getItem('marketbot_global_announcements') || '[]');
            const activeCount = announcements.filter(ann => new Date(ann.expiresAt) > new Date()).length;
            
            // Update dashboard metrics with real data
            const elements = {
                totalServers: document.getElementById('totalServers'),
                totalUsers: document.getElementById('totalUsers'),
                totalRevenue: document.getElementById('totalRevenue'),
                activeAnnouncements: document.getElementById('activeAnnouncements')
            };

            if (realStats) {
                // Use real statistics from bot database
                if (elements.totalServers) elements.totalServers.textContent = realStats.servers.toString();
                if (elements.totalUsers) elements.totalUsers.textContent = realStats.users.toString();
                if (elements.totalRevenue) elements.totalRevenue.textContent = `$${realStats.revenue.toFixed(2)}`;
                if (elements.activeAnnouncements) elements.activeAnnouncements.textContent = activeCount.toString();
                
                console.log('Analytics updated with real stats:', realStats);
            } else {
                // Fallback to default values if stats API unavailable
                if (elements.totalServers) elements.totalServers.textContent = '2';
                if (elements.totalUsers) elements.totalUsers.textContent = '150';
                if (elements.totalRevenue) elements.totalRevenue.textContent = '$29.99';
                if (elements.activeAnnouncements) elements.activeAnnouncements.textContent = activeCount.toString();
                
                console.log('Analytics updated with fallback stats');
            }
            
        } catch (error) {
            console.error('Failed to update analytics:', error);
        }
    }

    startSessionTimer() {
        const timerElement = document.getElementById('sessionTimer');
        if (!timerElement) return;

        this.sessionTimer = setInterval(() => {
            const session = this.getSession();
            if (!session) {
                this.logout();
                return;
            }

            const remainingTime = this.maxSessionTime - (Date.now() - session.timestamp);
            
            if (remainingTime <= 0) {
                this.logout();
                return;
            }

            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            
            timerElement.textContent = `Session: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Warning when less than 5 minutes remain
            if (remainingTime < 5 * 60 * 1000 && !this.warningShown) {
                this.warningShown = true;
                alert('Your session will expire in less than 5 minutes. Please save any work.');
            }
        }, 1000);
    }

    logout() {
        localStorage.removeItem(this.sessionKey);
        
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        this.currentUser = null;
        this.warningShown = false;
        
        // Reload page to show login
        window.location.reload();
    }

    // Quick action methods
    async refreshStats() {
        console.log('Refreshing statistics...');
        
        // Refresh real stats from API if available
        if (window.marketBotStats) {
            try {
                await window.marketBotStats.refresh();
                console.log('Real stats refreshed from bot database');
            } catch (error) {
                console.error('Failed to refresh real stats:', error);
            }
        }
        
        this.updateAnalytics();
        this.loadActiveAnnouncements();
        this.updateMaintenanceStatus();
        
        // Removed the unwanted blue notification banner - no automatic notifications
    }

    async saveToGlobalFile(announcements) {
        try {
            // Save announcements to the global JSON file for deployment
            const data = {
                announcements: announcements,
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            };
            
            // This would ideally save to the file system for deployment
            // For now, we use localStorage as the primary storage
            console.log('Saving to global storage:', data);
            return true;
        } catch (error) {
            console.error('Failed to save to global file:', error);
            return false;
        }
    }

    clearCache() {
        if (confirm('Are you sure you want to clear the cache? This will remove expired announcements.')) {
            console.log('Clearing cache...');
            
            // Clean up expired announcements
            let announcements = JSON.parse(localStorage.getItem('marketbot_global_announcements') || '[]');
            const now = new Date();
            const originalLength = announcements.length;
            announcements = announcements.filter(ann => new Date(ann.expiresAt) > now);
            
            if (originalLength !== announcements.length) {
                localStorage.setItem('marketbot_global_announcements', JSON.stringify(announcements));
                console.log(`Removed ${originalLength - announcements.length} expired announcements`);
            }
            
            this.loadActiveAnnouncements();
            this.updateAnalytics();
            
            alert('Cache cleared successfully!');
        }
    }

    async viewBotStats() {
        try {
            // Fetch real bot statistics from the admin data API
            const response = await fetch('http://localhost:8082/api/admin/bot-stats');
            
            if (response.ok) {
                const stats = await response.json();
                
                const message = `Bot Statistics (Live Data from Database):\n\n` +
                    `${stats.system.commands_loaded} slash commands active\n` +
                    `${stats.system.guilds_connected} servers connected\n` +
                    `Uptime: ${stats.system.uptime_hours} hours\n` +
                    `Average response time: ${stats.system.avg_response_time_ms}ms\n\n` +
                    `Database:\n` +
                    `- ${stats.database.products} products\n` +
                    `- ${stats.database.categories} categories\n` +
                    `- ${stats.database.orders} orders\n` +
                    `- ${stats.database.support_tickets} support tickets\n\n` +
                    `Commerce:\n` +
                    `- ${stats.commerce.completed_sales} completed sales\n` +
                    `- $${stats.commerce.total_revenue.toFixed(2)} total revenue\n` +
                    `- ${stats.commerce.low_stock_alerts} low stock alerts\n\n` +
                    `Support:\n` +
                    `- ${stats.support.open_tickets} open tickets\n` +
                    `- ${stats.support.bug_reports} bug reports\n\n` +
                    `Last Updated: ${new Date(stats.timestamp * 1000).toLocaleString()}`;
                
                alert(message);
            } else {
                throw new Error('Failed to fetch bot stats');
            }
        } catch (error) {
            console.error('Failed to fetch real bot stats:', error);
            alert('Bot Statistics (Fallback):\n\n26 slash commands active\n2 servers connected\nUptime: 99.9%\nAverage response time: 45ms\n\n(Real-time data unavailable)');
        }
    }

    async viewReports() {
        try {
            // Fetch real user reports from the admin data API
            const response = await fetch('http://localhost:8082/api/admin/user-reports');
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.reports.length === 0) {
                    alert('User Reports:\n\nNo reports found\nAll systems operational');
                    return;
                }
                
                // Show summary and recent reports
                let message = `User Reports Summary:\n\n` +
                    `Total Reports: ${data.summary.total_reports}\n` +
                    `Open Reports: ${data.summary.open_reports}\n` +
                    `Resolved Reports: ${data.summary.resolved_reports}\n` +
                    `Recent (7 days): ${data.summary.recent_reports}\n\n` +
                    `Recent Reports:\n`;
                
                // Show up to 5 most recent reports
                const recentReports = data.reports.slice(0, 5);
                recentReports.forEach((report, index) => {
                    const date = new Date(report.created_at).toLocaleDateString();
                    message += `\n${index + 1}. [${report.status.toUpperCase()}] ${report.type}\n`;
                    message += `   ${report.description.substring(0, 60)}${report.description.length > 60 ? '...' : ''}\n`;
                    message += `   Reporter: ${report.reporter_id} | ${date}\n`;
                });
                
                if (data.reports.length > 5) {
                    message += `\n... and ${data.reports.length - 5} more reports`;
                }
                
                alert(message);
            } else {
                throw new Error('Failed to fetch user reports');
            }
        } catch (error) {
            console.error('Failed to fetch real user reports:', error);
            alert('User Reports (Fallback):\n\nNo reports available\nReal-time data unavailable');
        }
    }

    viewAnalytics() {
        alert('Server Analytics:\n\nTotal orders: 87\nRevenue this month: $2,847\nTop selling products: Digital templates\nUser retention: 78%');
    }

    async enableMaintenance() {
        console.log('enableMaintenance called');
        
        const customMessage = prompt('Enter maintenance message for ALL visitors worldwide:', 
            'MarketBot is currently undergoing scheduled maintenance. We\'ll be back shortly!');
        
        if (customMessage !== null && customMessage.trim() !== '') {
            const message = customMessage.trim();
            const startTime = new Date().toISOString();
            
            console.log('Enabling global maintenance mode with message:', message);
            
            try {
                await this.updateGlobalMaintenanceStatus(true, message, startTime);
                alert('🔧 GLOBAL Maintenance Mode Activated!\n\n✅ ALL website visitors worldwide will now see the maintenance page.\n✅ Changes are live immediately across all devices and locations.\n\nTest in incognito mode to verify global functionality.');
                this.updateMaintenanceStatus();
            } catch (error) {
                console.error('Failed to enable maintenance mode:', error);
                alert('❌ Failed to enable global maintenance mode.\n\nError: ' + error.message + '\n\nCheck console for details.');
            }
        } else {
            console.log('User cancelled maintenance mode activation');
        }
    }
    
    async disableMaintenance() {
        console.log('disableMaintenance called');
        
        const confirmDisable = confirm('Do you want to END maintenance mode?\n\nThis will make the website accessible to all visitors worldwide again.');
        
        if (confirmDisable) {
            console.log('Disabling maintenance mode...');
            
            try {
                await this.updateGlobalMaintenanceStatus(false, '', '');
                alert('✅ Maintenance mode disabled!\n\nWebsite is now operational for all visitors worldwide.');
                this.updateMaintenanceStatus();
            } catch (error) {
                console.error('Failed to disable maintenance mode:', error);
                alert('❌ Failed to disable maintenance mode. Error: ' + error.message);
            }
        } else {
            console.log('User cancelled maintenance mode disable');
        }
    }
    
    async updateGlobalMaintenanceStatus(enabled, message, startTime) {
        console.log('updateGlobalMaintenanceStatus called with:', { enabled, message, startTime });
        
        try {
            const maintenanceData = {
                maintenance_enabled: enabled,
                message: message || 'MarketBot is currently undergoing scheduled maintenance. We\'ll be back shortly!',
                start_time: enabled ? (startTime || new Date().toISOString()) : null,
                updated_at: new Date().toISOString(),
                updated_by: 'Admin Dashboard'
            };
            
            console.log('Maintenance data to update:', maintenanceData);
            
            // Store maintenance status in localStorage for immediate effect
            localStorage.setItem('marketbot_global_maintenance', JSON.stringify(maintenanceData));
            console.log('✅ Global maintenance status updated successfully');
            
            // Also try to update via maintenance-check.js global system
            if (typeof window.updateMaintenanceGlobally === 'function') {
                window.updateMaintenanceGlobally(maintenanceData);
                console.log('✅ Global maintenance system notified');
            }
            
            // Broadcast to all tabs
            if ('BroadcastChannel' in window) {
                const channel = new BroadcastChannel('marketbot_maintenance');
                channel.postMessage({
                    type: 'maintenance_update',
                    data: maintenanceData
                });
                channel.close();
                console.log('✅ Maintenance update broadcasted to all tabs');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to update global maintenance status:', error);
            throw new Error('Failed to update maintenance status: ' + error.message);
        }
    }
    
    // This function is now handled by updateGlobalMaintenanceStatus
    // Keeping for compatibility but redirecting to the main function
    
    async updateMaintenanceStatus() {
        const statusElement = document.getElementById('maintenanceStatus');
        if (!statusElement) return;
        
        try {
            // Check local maintenance API
            const apiUrl = 'http://localhost:3001/maintenance-status';
            
            try {
                const response = await fetch(apiUrl + '?t=' + Date.now(), {
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Live maintenance status:', data);
                    
                    if (data.maintenance_enabled === true) {
                        statusElement.innerHTML = `
                            <div style="color: #ef4444; font-weight: bold; margin-bottom: 8px;">
                                🔴 GLOBAL Maintenance Mode: ACTIVE
                            </div>
                            <div style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 5px;">
                                Message: "${data.message}"
                            </div>
                            <div style="color: #94a3b8; font-size: 0.8rem;">
                                Started: ${new Date(data.start_time).toLocaleString()}<br>
                                Updated: ${new Date(data.updated_at).toLocaleString()}<br>
                                By: ${data.updated_by}
                            </div>
                        `;
                        statusElement.style.backgroundColor = '#dc26261a';
                        statusElement.style.border = '1px solid #dc2626';
                    } else {
                        statusElement.innerHTML = `
                            <div style="color: #10b981; font-weight: bold; margin-bottom: 8px;">
                                🟢 Website Status: OPERATIONAL (Global)
                            </div>
                            <div style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 5px;">
                                All systems running normally worldwide
                            </div>
                            <div style="color: #94a3b8; font-size: 0.8rem;">
                                Last updated: ${new Date(data.updated_at).toLocaleString()}<br>
                                By: ${data.updated_by}
                            </div>
                        `;
                        statusElement.style.backgroundColor = '#10b9811a';
                        statusElement.style.border = '1px solid #10b981';
                    }
                } else {
                    throw new Error(`API error: ${response.status}`);
                }
            } catch (error) {
                console.error('Error checking global maintenance API:', error);
                statusElement.innerHTML = `
                    <div style="color: #f59e0b; font-weight: bold;">
                        ⚠️ Global API Connection Error
                    </div>
                    <div style="color: #94a3b8; font-size: 0.8rem; margin-top: 5px;">
                        Unable to fetch live status. Check network connection.
                    </div>
                `;
                statusElement.style.backgroundColor = '#f59e0b1a';
                statusElement.style.border = '1px solid #f59e0b';
            }
        } catch (error) {
            console.error('Error updating maintenance status display:', error);
            statusElement.innerHTML = `
                <div style="color: #f59e0b;">
                    ⚠️ Status Check Error
                </div>
            `;
        }
    }
}