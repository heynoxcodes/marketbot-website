// Global Maintenance Mode Check System
(function() {
    'use strict';
    
    async function checkMaintenanceMode() {
        // Skip maintenance check for admin pages
        if (window.location.pathname.includes('/admin')) {
            return;
        }
        
        try {
            console.log('Checking maintenance status...');
            
            // First try to check localStorage for admin-set maintenance mode
            const localMaintenanceData = localStorage.getItem('marketbot_global_maintenance_status');
            if (localMaintenanceData) {
                try {
                    const data = JSON.parse(localMaintenanceData);
                    console.log('Local maintenance status found:', data);
                    
                    if (data.maintenance_enabled === true) {
                        console.log('Local maintenance mode is ENABLED - showing maintenance page');
                        showMaintenancePage(data.message, data.start_time);
                        return;
                    }
                } catch (error) {
                    console.warn('Error parsing local maintenance data:', error);
                }
            }
            
            // Check global maintenance API
            try {
                console.log('Checking global maintenance API...');
                const apiUrl = window.location.hostname === 'getmarketbot.store' 
                    ? 'https://marketbot-maintenance-api.replit.app/maintenance-status'
                    : `${window.location.protocol}//${window.location.hostname}:3001/maintenance-status`;
                
                console.log('Checking maintenance API:', apiUrl);
                const response = await fetch(apiUrl + '?t=' + Date.now(), {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Global maintenance status loaded:', data);
                    
                    if (data.maintenance_enabled === true) {
                        console.log('GLOBAL maintenance mode is ENABLED - showing maintenance page');
                        showMaintenancePage(data.message, data.start_time);
                        return;
                    } else {
                        console.log('Global maintenance mode is DISABLED - site operational');
                    }
                } else {
                    console.warn('Could not load global maintenance status:', response.status, response.statusText);
                }
            } catch (error) {
                console.warn('Error checking global maintenance API:', error);
            }
            
            // Fallback: Check the local maintenance status file
            try {
                const response = await fetch('/maintenance-status.json?t=' + Date.now(), {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Local maintenance status loaded:', data);
                    
                    if (data.maintenance_enabled === true) {
                        console.log('Local maintenance mode is ENABLED - showing maintenance page');
                        showMaintenancePage(data.message, data.start_time);
                        return;
                    }
                } else {
                    console.warn('Could not load local maintenance status file:', response.status, response.statusText);
                }
            } catch (error) {
                console.warn('Error checking local maintenance status:', error);
            }
            
            console.log('No maintenance mode active - site is operational');
            
        } catch (error) {
            console.error('Error in maintenance check:', error);
        }
    }
    
    function showMaintenancePage(customMessage, customStartTime) {
        const message = customMessage || 
            'MarketBot is currently undergoing scheduled maintenance. We\'ll be back shortly!';
        const startTime = customStartTime;
        
        document.body.innerHTML = `
            <div style="
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #0F0F23 0%, #1A1A2E 100%);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: white;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
            ">
                <div style="
                    text-align: center;
                    max-width: 600px;
                    padding: 60px 40px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    <div style="
                        width: 80px;
                        height: 80px;
                        margin: 0 auto 30px;
                        background: linear-gradient(135deg, #7C3AED, #A855F7);
                        border-radius: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 36px;
                        animation: pulse 2s infinite;
                    ">🔧</div>
                    
                    <h1 style="
                        font-size: 2.5rem;
                        margin: 0 0 20px;
                        font-weight: 700;
                        background: linear-gradient(135deg, #7C3AED, #A855F7);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    ">Maintenance Mode</h1>
                    
                    <p style="
                        font-size: 1.2rem;
                        margin: 0 0 30px;
                        opacity: 0.9;
                        line-height: 1.6;
                    ">${message}</p>
                    
                    <div style="
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 12px;
                        padding: 20px;
                        margin: 30px 0;
                        border-left: 4px solid #7C3AED;
                    ">
                        <h3 style="margin: 0 0 10px; color: #A855F7;">What's happening?</h3>
                        <p style="margin: 0; opacity: 0.8; font-size: 0.95rem;">
                            We're performing scheduled maintenance to improve your experience. 
                            This usually takes just a few minutes.
                        </p>
                    </div>
                    
                    ${startTime ? `
                        <p style="
                            font-size: 0.9rem;
                            opacity: 0.7;
                            margin: 20px 0 0;
                        ">
                            Maintenance started: ${new Date(startTime).toLocaleString()}
                        </p>
                    ` : ''}
                    
                    <div style="
                        margin-top: 40px;
                        padding-top: 30px;
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                    ">
                        <p style="
                            margin: 0 0 15px;
                            font-size: 0.9rem;
                            opacity: 0.8;
                        ">Need immediate support?</p>
                        
                        <a href="https://discord.gg/6YQqzjvY" style="
                            display: inline-block;
                            background: linear-gradient(135deg, #7C3AED, #A855F7);
                            color: white;
                            text-decoration: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-weight: 600;
                            font-size: 0.9rem;
                            transition: transform 0.2s ease;
                        " onmouseover="this.style.transform='translateY(-2px)'" 
                           onmouseout="this.style.transform='translateY(0)'">
                            💬 Join Discord Support
                        </a>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                body {
                    margin: 0 !important;
                    overflow: hidden;
                }
            </style>
        `;
    }
    
    // Listen for maintenance mode changes
    if (window.BroadcastChannel) {
        const channel = new BroadcastChannel('marketbot_maintenance');
        channel.addEventListener('message', (event) => {
            if (event.data.type === 'maintenance_enabled') {
                if (!window.location.pathname.includes('/admin')) {
                    location.reload();
                }
            } else if (event.data.type === 'maintenance_disabled') {
                if (!window.location.pathname.includes('/admin')) {
                    location.reload();
                }
            }
        });
    }
    
    // Check maintenance mode on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkMaintenanceMode);
    } else {
        checkMaintenanceMode();
    }
})();