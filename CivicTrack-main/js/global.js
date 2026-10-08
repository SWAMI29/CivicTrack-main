

// Delegated click handler for buttons with data-action attributes
document.addEventListener('click', function(e) {
    const btn = e.target.closest && e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    try {
        if (action && typeof window[action] === 'function') {
            window[action](e, btn);
        } else {
            console.warn('No handler for data-action:', action);
        }
    } catch (err) {
        console.error('Error executing action', action, err);
    }
});

// Load static sample data for development
loadStaticSampleData();

// Expose simple helper globally
window.getCurrentPage = getCurrentPage;
window.loadStaticSampleData = loadStaticSampleData;
// CivicTrack - Global JavaScript Utilities

// Global variables
let currentUser = null;
let allIssues = [];
let userLocation = null;
const APP_CONFIG = {
    MAX_DISTANCE_KM: 20,
    MIN_DISTANCE_KM: 5,
    NOTIFICATION_TIMEOUT: 5000
};
// Helper: determine current page by body[data-page] or filename
function getCurrentPage() {
    try {
        const body = document.body;
        if (body && body.dataset && body.dataset.page) return body.dataset.page;
        const path = window.location.pathname.split('/').pop() || '';
        return path.split('.')[0] || '';
    } catch (e) {
        return '';
    }
}

// Load static sample data for development (admin dashboard / issues)
// Only populate if no issues exist in localStorage
function loadStaticSampleData() {
    try {
        const existing = localStorage.getItem('civictrack_issues');
        if (existing) {
            window.allIssues = JSON.parse(existing);
            return;
        }
        const sample = [
            {
                id: 'iss-001',
                title: 'Pothole on Main Street',
                category: 'Road',
                description: 'Large pothole near the bus stop causing traffic issues.',
                location: { lat: 40.7128, lng: -74.0060 },
                status: 'Open',
                urgency: 'Medium',
                upvotes: 12,
                createdAt: new Date().toISOString()
            },
            {
                id: 'iss-002',
                title: 'Streetlight not working',
                category: 'Lighting',
                description: 'Multiple streetlights are off along 4th avenue.',
                location: { lat: 40.7138, lng: -74.0010 },
                status: 'In Progress',
                urgency: 'Low',
                upvotes: 5,
                createdAt: new Date().toISOString()
            }
        ];
        window.allIssues = sample;
        localStorage.setItem('civictrack_issues', JSON.stringify(sample));
    } catch (e) {
        console.error('Failed to load static sample data', e);
    }
}


// Theme Management
class ThemeManager {
    static init() {
        const savedTheme = localStorage.getItem('civictrack_theme') || 'light';
        this.setTheme(savedTheme);
        
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
    }
    
    static setTheme(theme) {
        document.body.className = `${theme}-mode`;
        localStorage.setItem('civictrack_theme', theme);
        
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    static toggleTheme() {
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
}

// Notification System
class NotificationSystem {
    static show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed notification-toast`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas ${this.getIcon(type)} me-2"></i>
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
        
        // Save to notification history
        this.saveToHistory(message, type);
    }
    
    static getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            danger: 'fa-exclamation-triangle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }
    
    static saveToHistory(message, type) {
        const notifications = JSON.parse(localStorage.getItem('civictrack_notifications') || '[]');
        notifications.unshift({
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // Keep only last 50 notifications
        if (notifications.length > 50) {
            notifications.splice(50);
        }
        
        localStorage.setItem('civictrack_notifications', JSON.stringify(notifications));
        this.updateNotificationBadge();
    }
    
    static updateNotificationBadge() {
        const notifications = JSON.parse(localStorage.getItem('civictrack_notifications') || '[]');
        const unreadCount = notifications.filter(n => !n.read).length;
        
        // Update badge in navbar if exists
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline' : 'none';
        }
    }
}

// User Location Management
class LocationManager {
    static async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    localStorage.setItem('user_location', JSON.stringify(location));
                    resolve(location);
                },
                error => {
                    console.error('Geolocation error:', error);
                    // Fallback to default location (Springfield, IL)
                    const defaultLocation = { lat: 39.7817, lng: -89.6501, accuracy: 10000 };
                    localStorage.setItem('user_location', JSON.stringify(defaultLocation));
                    resolve(defaultLocation);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 600000 // 10 minutes
                }
            );
        });
    }
    
    static getSavedLocation() {
        const saved = localStorage.getItem('user_location');
        return saved ? JSON.parse(saved) : null;
    }
    
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c;
    }
    
    static deg2rad(deg) {
        return deg * (Math.PI/180);
    }
    
    static filterIssuesByDistance(issues, maxDistance = 20) {
        const userLoc = this.getSavedLocation();
        if (!userLoc) return issues;
        
        return issues.filter(issue => {
            if (!issue.location?.lat || !issue.location?.lng) return true;
            const distance = this.calculateDistance(
                userLoc.lat, userLoc.lng,
                issue.location.lat, issue.location.lng
            );
            issue.distance = distance;
            return distance <= maxDistance;
        });
    }
}

// Data Export Utility
class DataExporter {
    static exportUserData() {
        const user = JSON.parse(localStorage.getItem('civictrack_user') || '{}');
        const userIssues = allIssues.filter(issue => issue.reporterId === user.id);
        const userReports = JSON.parse(localStorage.getItem('user_reports') || '[]');
        
        const exportData = {
            userProfile: user,
            reportedIssues: userIssues,
            activityHistory: userReports,
            exportDate: new Date().toISOString()
        };
        
        this.downloadJSON(exportData, `civictrack_data_${user.username}_${Date.now()}.json`);
    }
    
    static exportIssue(issue) {
        this.downloadJSON(issue, `issue_${issue.id}_${Date.now()}.json`);
    }
    
    static downloadJSON(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        NotificationSystem.show('Data exported successfully!', 'success');
    }
}

// Utility Functions
class Utilities {
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    static validatePassword(password) {
        return password.length >= 8 && /[0-9]/.test(password) && /[a-zA-Z]/.test(password);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    ThemeManager.init();
    
    // Load current user
    const savedUser = localStorage.getItem('civictrack_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserDisplay();
    }
    
    // Load issues
    const savedIssues = localStorage.getItem('civictrack_issues');
    if (savedIssues) {
        allIssues = JSON.parse(savedIssues);
    }
    
    // Update notification badge
    NotificationSystem.updateNotificationBadge();
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Global functions
function updateUserDisplay() {
    const userElements = document.querySelectorAll('#currentUser, #currentAdmin');
    userElements.forEach(element => {
        if (element && currentUser) {
            element.textContent = currentUser.username;
        }
    });
}

function showAlert(message, type = 'info') {
    NotificationSystem.show(message, type);
}

// Make classes globally available
window.ThemeManager = ThemeManager;
window.NotificationSystem = NotificationSystem;
window.LocationManager = LocationManager;
window.DataExporter = DataExporter;
window.Utilities = Utilities;