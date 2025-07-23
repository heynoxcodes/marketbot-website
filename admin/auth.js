// Secure admin authentication system
class AdminAuth {
    constructor() {
        this.sessionKey = 'marketbot_admin_session';
        this.maxSessionTime = 30 * 60 * 1000; // 30 minutes
        this.authEndpoint = 'https://api.github.com/gists/'; // We'll use GitHub Gists as a secure backend
        this.init();
    }

    init() {
        this.checkExistingSession();
    }

    // Hash the password client-side before sending
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'marketbot_salt_2025');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Verify admin credentials without exposing the actual key
    async verifyCredentials(password) {
        // Easter egg for specific password
        if (password === 'vyxlez2010') {
            this.showEasterEgg();
            return false;
        }
        
        const hashedPassword = await this.hashPassword(password);
        
        // Expected hash for 'marketbot_admin_2025' (computed server-side equivalent)
        const expectedHash = 'bc683774a01cd54c2e9ffb13865dbda7d90cdfa106eefe51ad15292af2d37dbb';
        
        // In a real implementation, this would be verified server-side
        // For now, we use a more complex client-side verification
        const isValid = this.secureCompare(hashedPassword, expectedHash);
        
        if (isValid) {
            this.createSession();
            return true;
        }
        
        return false;
    }

    // Easter egg for special password
    showEasterEgg() {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    border: none;
                    font-weight: 600;
                    animation: shake 0.5s ease-in-out;
                ">
                    🚫 You're not hacking me buddy! 🚫
                </div>
                <style>
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                </style>
            `;
            errorDiv.style.display = 'block';
            
            // Clear the password field
            const passwordField = document.getElementById('adminPassword');
            if (passwordField) {
                passwordField.value = '';
                passwordField.style.animation = 'shake 0.5s ease-in-out';
            }
            
            // Hide after 5 seconds
            setTimeout(() => {
                errorDiv.style.display = 'none';
                if (passwordField) {
                    passwordField.style.animation = '';
                }
            }, 5000);
        }
    }

    // Constant-time string comparison to prevent timing attacks
    secureCompare(a, b) {
        if (a.length !== b.length) return false;
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        
        return result === 0;
    }

    // Create a secure session
    createSession() {
        const sessionData = {
            authenticated: true,
            timestamp: Date.now(),
            token: this.generateSessionToken()
        };
        
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
    }

    // Generate a random session token
    generateSessionToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Check if user has a valid session
    isAuthenticated() {
        const session = this.getSession();
        if (!session) return false;
        
        const now = Date.now();
        const sessionAge = now - session.timestamp;
        
        if (sessionAge > this.maxSessionTime) {
            this.logout();
            return false;
        }
        
        return session.authenticated === true;
    }

    // Get current session data
    getSession() {
        try {
            const sessionStr = localStorage.getItem(this.sessionKey);
            return sessionStr ? JSON.parse(sessionStr) : null;
        } catch (error) {
            return null;
        }
    }

    // Check for existing valid session
    checkExistingSession() {
        if (this.isAuthenticated()) {
            this.showAdminDashboard();
        } else {
            this.showLoginForm();
        }
    }

    // Display login form
    showLoginForm() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-form">
                    <img src="../logo.png" alt="MarketBot" class="login-logo">
                    <h2>Admin Access</h2>
                    <p>Enter admin credentials to access the dashboard</p>
                    
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="adminPassword">Admin Password:</label>
                            <input type="password" id="adminPassword" required autocomplete="off">
                        </div>
                        
                        <button type="submit" class="btn btn-primary">Access Dashboard</button>
                        
                        <div id="loginError" class="error-message" style="display: none;"></div>
                    </form>
                    
                    <div class="login-footer">
                        <p><a href="../">← Back to MarketBot</a></p>
                    </div>
                </div>
            </div>
        `;

        // Add login form styles
        this.addLoginStyles();
        
        // Handle form submission
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    }

    // Handle login attempt
    async handleLogin() {
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('loginError');
        
        if (!password) {
            this.showError('Please enter the admin password');
            return;
        }

        try {
            const isValid = await this.verifyCredentials(password);
            
            if (isValid) {
                // Reload the page to show dashboard
                window.location.reload();
            } else {
                this.showError('Invalid admin credentials');
                document.getElementById('adminPassword').value = '';
            }
        } catch (error) {
            this.showError('Authentication error. Please try again.');
        }
    }

    // Show error message
    showError(message) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    // Show admin dashboard
    showAdminDashboard() {
        // Load the original admin dashboard content
        fetch('dashboard.html')
            .then(response => response.text())
            .then(html => {
                document.body.innerHTML = html;
                this.addDashboardStyles();
                this.initializeDashboard();
            })
            .catch(() => {
                // Fallback to inline dashboard
                this.createInlineDashboard();
            });
    }

    // Add dashboard styles
    addDashboardStyles() {
        const style = document.createElement('style');
        style.textContent = `
            body {
                margin: 0;
                padding: 0;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #0F0F23;
                color: #E2E8F0;
                line-height: 1.6;
            }

            .admin-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
            }

            .admin-header {
                background: #1A1A2E;
                border: 1px solid #2D3748;
                border-radius: 12px;
                padding: 2rem;
                margin-bottom: 2rem;
            }

            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .admin-title {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .admin-logo {
                width: 48px;
                height: 48px;
                border-radius: 8px;
            }

            .admin-title h1 {
                margin: 0;
                color: #FFFFFF;
                font-size: 1.75rem;
                font-weight: 700;
            }

            .logout-btn {
                background: #EF4444;
                color: white;
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .logout-btn:hover {
                background: #DC2626;
                transform: translateY(-2px);
            }

            .dashboard-section {
                background: #1A1A2E;
                border: 1px solid #2D3748;
                border-radius: 16px;
                padding: 2rem;
            }

            .dashboard-section h2 {
                color: #FFFFFF;
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 1rem;
            }

            .section-description {
                color: #94A3B8;
                margin-bottom: 2rem;
            }

            .announcement-form-container {
                background: #16213E;
                border: 1px solid #2D3748;
                border-radius: 12px;
                padding: 2rem;
                margin-bottom: 2rem;
            }

            .announcement-form-container h3 {
                color: #FFFFFF;
                margin-bottom: 1.5rem;
                font-size: 1.25rem;
            }

            .form-group {
                margin-bottom: 1.5rem;
            }

            .form-group label {
                display: block;
                color: #E2E8F0;
                font-weight: 600;
                margin-bottom: 0.5rem;
            }

            .form-group input,
            .form-group textarea,
            .form-group select {
                width: 100%;
                background: #2D3748;
                border: 1px solid #4A5568;
                border-radius: 8px;
                padding: 0.75rem;
                color: #E2E8F0;
                font-size: 1rem;
                transition: border-color 0.3s ease;
            }

            .form-group input:focus,
            .form-group textarea:focus,
            .form-group select:focus {
                outline: none;
                border-color: #7C3AED;
                box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }

            .form-group small {
                color: #94A3B8;
                font-size: 0.875rem;
            }

            .btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-block;
                text-align: center;
            }

            .btn-primary {
                background: linear-gradient(135deg, #7C3AED, #A855F7);
                color: white;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3);
            }

            .preview-section {
                margin: 2rem 0;
            }

            .preview-section h4 {
                color: #E2E8F0;
                margin-bottom: 1rem;
            }

            .announcement-preview {
                padding: 1rem 2rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .announcement-preview.announcement-info {
                background: linear-gradient(135deg, #3B82F6, #1D4ED8);
                color: white;
            }

            .announcement-preview.announcement-warning {
                background: linear-gradient(135deg, #F59E0B, #D97706);
                color: white;
            }

            .success-message {
                background: #059669;
                color: white;
                padding: 1rem;
                border-radius: 8px;
                margin-top: 1rem;
            }

            .active-announcements-container {
                background: #16213E;
                border: 1px solid #2D3748;
                border-radius: 12px;
                padding: 2rem;
            }

            .active-announcements-container h3 {
                color: #FFFFFF;
                margin-bottom: 1.5rem;
            }

            @media (max-width: 768px) {
                .form-row {
                    grid-template-columns: 1fr;
                }
                
                .header-content {
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize dashboard functionality
    initializeDashboard() {
        // Initialize announcement system
        if (typeof window.publishAnnouncement === 'undefined') {
            this.setupAnnouncementSystem();
        }
        
        // Load existing announcements
        this.loadActiveAnnouncements();
        
        // Setup real-time preview
        this.setupPreview();
    }

    // Setup announcement publishing system
    setupAnnouncementSystem() {
        window.publishAnnouncement = async () => {
            const text = document.getElementById('announcementText').value.trim();
            const type = document.getElementById('announcementType').value;
            const duration = parseInt(document.getElementById('duration').value);
            const author = document.getElementById('authorName').value.trim();
            
            if (!text || !author) {
                this.showPublishError('Please fill in all required fields');
                return;
            }
            
            if (text.length > 200) {
                this.showPublishError('Announcement text must be 200 characters or less');
                return;
            }
            
            try {
                // Use the global announcement system
                if (window.globalAnnouncementManager) {
                    await window.globalAnnouncementManager.createAnnouncement(text, type, author, duration);
                }
                
                // Clear form
                document.getElementById('announcementText').value = '';
                document.getElementById('authorName').value = '';
                document.getElementById('announcementType').selectedIndex = 0;
                document.getElementById('duration').value = '24';
                
                // Show success message
                this.showPublishSuccess('Announcement published successfully!');
                
                // Reload active announcements
                this.loadActiveAnnouncements();
                
            } catch (error) {
                this.showPublishError('Failed to publish announcement: ' + error.message);
            }
        };
    }
    
    // Setup real-time preview
    setupPreview() {
        const textInput = document.getElementById('announcementText');
        const typeSelect = document.getElementById('announcementType');
        const authorInput = document.getElementById('authorName');
        const preview = document.getElementById('announcementPreview');
        
        const updatePreview = () => {
            const text = textInput.value.trim() || 'Your announcement will appear here...';
            const type = typeSelect.value;
            const author = authorInput.value.trim() || 'Your Name';
            
            const icon = type === 'warning' ? '⚠️' : 'ℹ️';
            
            preview.className = `announcement-preview announcement-${type}`;
            preview.innerHTML = `
                <div class="announcement-content">
                    <span class="announcement-icon">${icon}</span>
                    <span class="announcement-text">${text}</span>
                    <span class="announcement-author">— ${author}</span>
                </div>
            `;
        };
        
        if (textInput) textInput.addEventListener('input', updatePreview);
        if (typeSelect) typeSelect.addEventListener('change', updatePreview);
        if (authorInput) authorInput.addEventListener('input', updatePreview);
    }
    
    // Load active announcements
    loadActiveAnnouncements() {
        const container = document.getElementById('activeAnnouncementsList');
        if (!container) return;
        
        // Get announcements from localStorage
        const announcements = this.getActiveAnnouncements();
        
        if (announcements.length === 0) {
            container.innerHTML = '<p style="color: #94A3B8;">No active announcements</p>';
            return;
        }
        
        container.innerHTML = announcements.map(announcement => `
            <div style="
                background: #2D3748;
                border: 1px solid #4A5568;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
            ">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div style="color: #E2E8F0; font-weight: 600; margin-bottom: 0.5rem;">
                            ${announcement.type === 'warning' ? '⚠️' : 'ℹ️'} ${announcement.text}
                        </div>
                        <div style="color: #94A3B8; font-size: 0.875rem;">
                            By: ${announcement.author} | 
                            Expires: ${new Date(announcement.expiresAt).toLocaleString()}
                        </div>
                    </div>
                    <button onclick="adminAuth.removeAnnouncement('${announcement.id}')" 
                            style="
                                background: #EF4444;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                padding: 0.5rem;
                                cursor: pointer;
                                font-size: 0.875rem;
                            ">
                        Remove
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Get active announcements
    getActiveAnnouncements() {
        try {
            const stored = localStorage.getItem('marketbot_global_announcements');
            const announcements = stored ? JSON.parse(stored) : [];
            const now = new Date();
            
            return announcements.filter(ann => new Date(ann.expiresAt) > now);
        } catch (error) {
            return [];
        }
    }
    
    // Remove announcement
    removeAnnouncement(id) {
        try {
            let announcements = this.getActiveAnnouncements();
            announcements = announcements.filter(ann => ann.id !== id);
            localStorage.setItem('marketbot_global_announcements', JSON.stringify(announcements));
            this.loadActiveAnnouncements();
            
            // Trigger announcement refresh on all pages
            if (window.globalAnnouncementManager) {
                window.globalAnnouncementManager.loadAndDisplayAnnouncements();
            }
        } catch (error) {
            console.error('Failed to remove announcement:', error);
        }
    }
    
    // Show publish success
    showPublishSuccess(message) {
        const messageDiv = document.getElementById('publishMessage');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.style.display = 'block';
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }
    
    // Show publish error
    showPublishError(message) {
        alert(message); // Simple error display
    }

    // Logout functionality
    logout() {
        localStorage.removeItem(this.sessionKey);
        window.location.reload();
    }

    // Create inline dashboard fallback
    createInlineDashboard() {
        document.body.innerHTML = `
            <div class="admin-container">
                <h1>Admin Dashboard</h1>
                <button onclick="adminAuth.logout()" class="logout-btn">Logout</button>
                <p>Dashboard content failed to load. Please refresh the page.</p>
            </div>
        `;
        this.addDashboardStyles();
    }

    // Add login form styles  
    addLoginStyles() {
        // Styles are already included in index.html
    }
}

// Initialize the admin authentication system
const adminAuth = new AdminAuth();

    // Create inline dashboard if dashboard.html not found
    createInlineDashboard() {
        document.body.innerHTML = `
            <div class="admin-container">
                <header class="admin-header">
                    <h1>MarketBot Admin Dashboard</h1>
                    <button onclick="adminAuth.logout()" class="btn btn-secondary">Logout</button>
                </header>
                
                <div class="dashboard-section">
                    <h2>Global Announcements</h2>
                    <div id="announcementManager">
                        <!-- Announcement management interface will be loaded here -->
                        <p>Loading announcement management...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize announcement system
        setTimeout(() => {
            if (window.globalAnnouncements) {
                this.loadAnnouncementInterface();
            }
        }, 1000);
    }

    // Load announcement management interface
    loadAnnouncementInterface() {
        const container = document.getElementById('announcementManager');
        if (container) {
            container.innerHTML = `
                <div class="announcement-form">
                    <h3>Create New Announcement</h3>
                    <!-- Add your announcement form here -->
                    <p>Announcement system ready.</p>
                </div>
            `;
        }
    }

    // Add login form styles
    addLoginStyles() {
        const styles = `
            <style>
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .login-form {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                }
                
                .login-logo {
                    width: 60px;
                    height: 60px;
                    margin-bottom: 20px;
                    border-radius: 10px;
                }
                
                .login-form h2 {
                    color: #333;
                    margin-bottom: 10px;
                }
                
                .login-form p {
                    color: #666;
                    margin-bottom: 30px;
                }
                
                .form-group {
                    margin-bottom: 20px;
                    text-align: left;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    color: #333;
                    font-weight: 500;
                }
                
                .form-group input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 5px;
                    font-size: 16px;
                    transition: border-color 0.3s;
                    box-sizing: border-box;
                }
                
                .form-group input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                .btn {
                    padding: 12px 30px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                    transition: all 0.3s;
                    width: 100%;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                }
                
                .error-message {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 10px;
                    border-radius: 5px;
                    margin-top: 15px;
                    border: 1px solid #f5c6cb;
                }
                
                .login-footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                }
                
                .login-footer a {
                    color: #667eea;
                    text-decoration: none;
                }
                
                .login-footer a:hover {
                    text-decoration: underline;
                }
                
                .logout-btn {
                    float: right;
                    margin-top: 10px;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // Logout and clear session
    logout() {
        localStorage.removeItem(this.sessionKey);
        window.location.reload();
    }
}

// Initialize admin authentication
const adminAuth = new AdminAuth();