// Profile Management System
class ProfileManager {
    static init() {
        this.loadProfileData();
        this.setupEventListeners();
        this.loadActivityHistory();
        this.updateProfileStats();
    }
    
    static loadProfileData() {
        if (!currentUser) {
            window.location.href = 'index.html';
            return;
        }
        this.updateProfileDisplay();
    }
    
    static updateProfileDisplay() {
        // Personal Information
        document.getElementById('profileName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        document.getElementById('profileRole').textContent = currentUser.role;
        document.getElementById('infoFullName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        document.getElementById('infoEmail').textContent = currentUser.email;
        document.getElementById('infoPhone').textContent = currentUser.phone;
        document.getElementById('infoGender').textContent = currentUser.gender;
        document.getElementById('infoDob').textContent = new Date(currentUser.dateOfBirth).toLocaleDateString();
        document.getElementById('infoAddress').textContent = currentUser.address;
        document.getElementById('infoJoinDate').textContent = new Date(currentUser.joinDate).toLocaleDateString();
        
        // Nav user name
        const navUser = document.getElementById('currentUser');
        if (navUser) {
            navUser.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        }
        
        // Profile image
        const profileImage = document.getElementById('profileImage');
        if (profileImage && currentUser.avatar) {
            profileImage.src = currentUser.avatar;
        }
        
        // Designation for admins
        const designationItem = document.getElementById('designationItem');
        const infoDesignation = document.getElementById('infoDesignation');
        if (currentUser.role === 'Admin' && currentUser.designation) {
            designationItem.style.display = 'block';
            infoDesignation.textContent = currentUser.designation;
        } else {
            designationItem.style.display = 'none';
        }
    }
    
    static setupEventListeners() {
        const editForm = document.getElementById('editProfileForm');
        if (editForm) {
            editForm.addEventListener('submit', this.handleProfileUpdate.bind(this));
        }
        
        const downloadBtn = document.getElementById('downloadData');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.downloadUserData.bind(this)();
            });
        }
    }
    
    static editProfile() {
        // Clear previous errors
        const errorDiv = document.querySelector('#editProfileForm .alert-danger');
        if (errorDiv) errorDiv.remove();
        
        // Populate edit form
        document.getElementById('editFirstName').value = currentUser.firstName;
        document.getElementById('editLastName').value = currentUser.lastName;
        document.getElementById('editEmail').value = currentUser.email;
        document.getElementById('editPhone').value = currentUser.phone;
        document.getElementById('editAddress').value = currentUser.address;
        document.getElementById('editGender').value = currentUser.gender;
        document.getElementById('editDob').value = currentUser.dateOfBirth.split('T')[0];
        
        // Admin designation
        const designationField = document.getElementById('editDesignationField');
        const editDesignation = document.getElementById('editDesignation');
        if (currentUser.role === 'Admin') {
            designationField.classList.remove('d-none');
            editDesignation.value = currentUser.designation || '';
        } else {
            designationField.classList.add('d-none');
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        modal.show();
    }
    
    static handleProfileUpdate(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const updatedData = {
            firstName: formData.get('editFirstName'),
            lastName: formData.get('editLastName'),
            email: formData.get('editEmail'),
            phone: formData.get('editPhone'),
            address: formData.get('editAddress'),
            gender: formData.get('editGender'),
            dateOfBirth: formData.get('editDob'),
            designation: formData.get('editDesignation') || ''
        };
        
        // Validation
        const errors = this.validateProfileData(updatedData);
        if (errors.length > 0) {
            const errorHtml = errors.join('<br>');
            this.showNotification(errorHtml, 'danger');
            return;
        }
        
        // Update
        this.updateUserProfile(updatedData);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        modal.hide();
        
        this.showNotification('Profile updated successfully!', 'success');
    }
    
    static validateProfileData(data) {
        const errors = [];
        
        if (!data.email || !this.validateEmail(data.email)) {
            errors.push('Please enter a valid email address');
        }
        
        const phoneDigits = (data.phone || '').replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            errors.push('Please enter a valid phone number (at least 10 digits)');
        }
        
        // Email unique check
        const users = JSON.parse(localStorage.getItem('civictrack_users') || '[]');
        const emailExists = users.find(u => u.email === data.email && u.id !== currentUser.id);
        if (emailExists) {
            errors.push('Email already registered by another user');
        }
        
        return errors;
    }
    
    static validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    static showNotification(message, type) {
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.show) {
            NotificationSystem.show(message, type);
        } else {
            // Fallback alert
            alert(message);
        }
    }
    
    static updateUserProfile(updatedData) {
        // Update session
        Object.assign(currentUser, updatedData);
        localStorage.setItem('civictrack_user', JSON.stringify(currentUser));
        
        // Update users DB
        const users = JSON.parse(localStorage.getItem('civictrack_users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex > -1) {
            Object.assign(users[userIndex], updatedData);
            localStorage.setItem('civictrack_users', JSON.stringify(users));
        }
        
        // Refresh
        this.updateProfileDisplay();
        this.updateProfileStats(); // Refresh stats
        this.logActivity('updated_profile', 'Profile information updated');
    }
    
    // ... (changeAvatar, downloadUserData unchanged)
    
    static changeAvatar() {
        const avatars = [
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        ];
        
        const profileImage = document.getElementById('profileImage');
        const currentAvatar = profileImage.src;
        const currentIndex = avatars.indexOf(currentAvatar);
        const nextIndex = (currentIndex + 1) % avatars.length;
        
        currentUser.avatar = avatars[nextIndex];
        profileImage.src = avatars[nextIndex];
        this.updateUserProfile({ avatar: avatars[nextIndex] });
        
        this.showNotification('Profile picture updated!', 'success');
    }
    
    static downloadUserData() {
        if (typeof DataExporter !== 'undefined') {
            DataExporter.exportUserData();
        } else {
            this.showNotification('Download feature coming soon!', 'info');
        }
        this.logActivity('downloaded_data', 'Downloaded personal data export');
    }
    
    static updateProfileStats() {
        // **FIX: Load allIssues**
        const allIssues = JSON.parse(localStorage.getItem('civictrack_issues') || '[]');
        const userIssues = allIssues.filter(issue => issue.reporterId === currentUser.id);
        
        // **FIX: User upvotes only**
        const userUpvotes = userIssues.reduce((total, issue) => total + (issue.upvotes || 0), 0);
        const resolvedIssues = userIssues.filter(issue => issue.status === 'Resolved').length;
        
        document.getElementById('reportsCount').textContent = userIssues.length;
        document.getElementById('upvotesCount').textContent = userUpvotes;
        document.getElementById('resolvedCount').textContent = resolvedIssues;
    }
    
    static loadActivityHistory() {
        const activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
        const userActivities = activities.filter(activity => activity.userId === currentUser.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
        
        const timeline = document.getElementById('activityTimeline');
        if (!timeline) return;
        
        timeline.innerHTML = userActivities.map(activity => `
            <div class="activity-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${activity.action.replace('_', ' ').toUpperCase()}</strong>
                        <p class="mb-1">${activity.description}</p>
                    </div>
                    <small class="activity-time">${this.formatDate(activity.timestamp)}</small>
                </div>
            </div>
        `).join('') || `
            <div class="text-center py-4">
                <i class="fas fa-history fa-2x text-muted mb-3"></i>
                <p class="text-muted">No recent activity</p>
            </div>
        `;
    }
    
    static formatDate(isoString) {
        return new Date(isoString).toLocaleString();
    }
    
    static logActivity(action, description) {
        let activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
        activities.unshift({  // Newest first
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            userId: currentUser.id,
            action,
            description,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('user_activities', JSON.stringify(activities.slice(0, 100))); // Limit size
        this.loadActivityHistory();
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => ProfileManager.init());

// Globals
window.editProfile = ProfileManager.editProfile.bind(ProfileManager);
window.changeAvatar = ProfileManager.changeAvatar.bind(ProfileManager);
window.downloadUserData = ProfileManager.downloadUserData.bind(ProfileManager);