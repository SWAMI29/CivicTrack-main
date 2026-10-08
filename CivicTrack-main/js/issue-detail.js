// Issue Detail Page Functionality
class IssueDetailManager {
    static init() {
        this.loadIssueDetail();
        this.setupEventListeners();
    }
    
    static loadIssueDetail() {
        const urlParams = new URLSearchParams(window.location.search);
        const issueId = urlParams.get('id');
        
        if (!issueId) {
            window.location.href = 'home.html';
            return;
        }
        
        currentIssue = allIssues.find(issue => issue.id === issueId);
        if (!currentIssue) {
            NotificationSystem.show('Issue not found', 'danger');
            window.location.href = 'home.html';
            return;
        }
        
        this.populateIssueDetails(currentIssue);
        this.updateUserDisplay();
        
        // Show admin controls if user is admin
        if (currentUser && currentUser.role === 'Admin') {
            const adminControls = document.getElementById('adminControls');
            if (adminControls) {
                adminControls.classList.remove('d-none');
            }
        }
        
        // Load similar issues
        this.loadSimilarIssues();
        
        // Load comments
        this.loadComments();
    }
    
    static populateIssueDetails(issue) {
        // Update basic info
        document.getElementById('issueId').textContent = `#${issue.id}`;
        document.getElementById('issueTitle').textContent = issue.title;
        document.getElementById('issueCategory').textContent = issue.category;
        document.getElementById('issuePriority').textContent = issue.urgency;
        document.getElementById('issueUrgency').textContent = issue.urgency;
        document.getElementById('issueReporter').textContent = issue.reporter;
        document.getElementById('issueLocation').textContent = issue.location;
        document.getElementById('issueDescription').textContent = issue.description;
        document.getElementById('issueDate').textContent = Utilities.formatDate(issue.date);
        document.getElementById('issueUpdated').textContent = Utilities.formatDate(issue.date);
        document.getElementById('issueFlags').textContent = issue.flags || 0;
        document.getElementById('upvoteCount').textContent = issue.upvotes || 0;
        
        // Update status badge
        const statusElement = document.getElementById('issueStatus');
        if (statusElement) {
            statusElement.textContent = issue.status;
            statusElement.className = `badge ${this.getStatusBadgeClass(issue.status)} fs-6`;
        }
        
        // Update priority badge
        const priorityElement = document.getElementById('issuePriority');
        if (priorityElement) {
            priorityElement.className = `badge ${this.getPriorityBadgeClass(issue.urgency)}`;
        }
        
        // Update urgency badge
        const urgencyElement = document.getElementById('issueUrgency');
        if (urgencyElement) {
            urgencyElement.className = `badge ${this.getPriorityBadgeClass(issue.urgency)} fs-6`;
        }
        
        // Update images
        this.populateImages(issue);
        
        // Update additional fields
        this.populateAdditionalFields(issue);
        
        // Update contact info if available
        this.populateContactInfo(issue);
        
        // Update admin form if present
        const adminStatus = document.getElementById('adminStatus');
        const adminPriority = document.getElementById('adminPriority');
        if (adminStatus) adminStatus.value = issue.status;
        if (adminPriority) adminPriority.value = issue.urgency;
        
        // Calculate and display distance
        this.displayDistance(issue);
        
        // Check if user has upvoted
        this.checkUserUpvote(issue);
    }
    
    static populateImages(issue) {
        const mainImage = document.getElementById('issueImage');
        const thumbnailsContainer = document.getElementById('imageThumbnails');
        
        if (issue.images && issue.images.length > 0) {
            mainImage.src = issue.images[0].data;
            mainImage.alt = issue.title;
            
            // Create thumbnails
            thumbnailsContainer.innerHTML = '';
            issue.images.forEach((image, index) => {
                const thumb = document.createElement('img');
                thumb.src = image.data;
                thumb.alt = `Thumbnail ${index + 1}`;
                thumb.className = 'image-thumbnail';
                if (index === 0) thumb.classList.add('active');
                thumb.onclick = () => this.switchImage(image.data, thumb);
                thumbnailsContainer.appendChild(thumb);
            });
        } else if (issue.image) {
            mainImage.src = issue.image;
            mainImage.alt = issue.title;
        }
    }
    
    static populateAdditionalFields(issue) {
        // First observed date
        if (issue.firstObserved) {
            document.getElementById('issueFirstObserved').textContent = 
                new Date(issue.firstObserved).toLocaleDateString();
        }
        
        // Recurring issue
        if (issue.recurring) {
            document.getElementById('issueRecurring').textContent = issue.recurring;
        }
        
        // Landmark
        if (issue.specificLocation?.landmark) {
            document.getElementById('issueLandmark').textContent = issue.specificLocation.landmark;
        }
        
        // Ward/Zone
        if (issue.specificLocation?.ward) {
            document.getElementById('issueWard').textContent = issue.specificLocation.ward;
        }
        
        // Traffic impact
        if (issue.trafficImpact) {
            document.getElementById('issueTraffic').textContent = issue.trafficImpact;
        }
        
        // Safety hazard
        if (issue.safetyHazard) {
            document.getElementById('safetyHazardItem').style.display = 'block';
        }
        
        // Suggestions
        if (issue.suggestions) {
            document.getElementById('suggestionsSection').style.display = 'block';
            document.getElementById('issueSuggestions').textContent = issue.suggestions;
        }
        
        // Video evidence
        if (issue.videoUrl) {
            document.getElementById('videoSection').style.display = 'block';
            document.getElementById('videoLink').href = issue.videoUrl;
        }
    }
    
    static populateContactInfo(issue) {
        if (issue.contact && !issue.reporter.includes('Anonymous')) {
            document.getElementById('contactName').textContent = issue.contact.name;
            document.getElementById('contactEmail').href = `mailto:${issue.contact.email}`;
            document.getElementById('contactEmail').textContent = issue.contact.email;
            document.getElementById('contactPhone').href = `tel:${issue.contact.phone}`;
            document.getElementById('contactPhone').textContent = issue.contact.phone;
            
            // Notification preferences
            if (issue.notificationPreferences) {
                const prefs = [];
                if (issue.notificationPreferences.email) prefs.push('Email');
                if (issue.notificationPreferences.sms) prefs.push('SMS');
                document.getElementById('notificationPrefs').textContent = prefs.join(', ');
            }
        } else {
            document.getElementById('contactCard').style.display = 'none';
        }
    }
    
    static displayDistance(issue) {
        const userLocation = LocationManager.getSavedLocation();
        if (userLocation && issue.location?.lat && issue.location?.lng) {
            const distance = LocationManager.calculateDistance(
                userLocation.lat, userLocation.lng,
                issue.location.lat, issue.location.lng
            );
            document.getElementById('issueDistance').textContent = `${distance.toFixed(1)} km`;
        } else {
            document.getElementById('issueDistance').textContent = 'Unknown';
        }
    }
    
    static checkUserUpvote(issue) {
        // In a real app, you would check if the current user has upvoted this issue
        const upvoteBtn = document.getElementById('upvoteBtn');
        if (upvoteBtn) {
            // For demo, we'll just show the button as active if upvotes > 0
            if (issue.upvotes > 0) {
                upvoteBtn.classList.add('upvoted');
                upvoteBtn.innerHTML = '<i class="fas fa-arrow-up"></i> Upvoted';
            }
        }
    }
    
    static switchImage(imageSrc, thumbnail) {
        document.getElementById('issueImage').src = imageSrc;
        
        // Update active thumbnail
        document.querySelectorAll('.image-thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });
        thumbnail.classList.add('active');
    }
    
    static setupEventListeners() {
        // Admin update form
        const adminUpdateForm = document.getElementById('adminUpdateForm');
        if (adminUpdateForm) {
            adminUpdateForm.addEventListener('submit', this.handleAdminUpdate.bind(this));
        }
        
        // Image click to open modal
        const mainImage = document.getElementById('issueImage');
        if (mainImage) {
            mainImage.addEventListener('click', () => {
                const modal = new bootstrap.Modal(document.getElementById('imageModal'));
                document.getElementById('modalImage').src = mainImage.src;
                modal.show();
            });
        }
    }
    
    static handleAdminUpdate(e) {
        e.preventDefault();
        
        if (!currentIssue) return;
        
        const formData = new FormData(e.target);
        const newStatus = formData.get('status');
        const newPriority = formData.get('priority');
        const note = formData.get('note');
        
        currentIssue.status = newStatus;
        currentIssue.urgency = newPriority;
        
        // Add to status history
        this.addStatusHistory(newStatus, note);
        
        this.populateIssueDetails(currentIssue);
        
        NotificationSystem.show(`Issue updated to ${newStatus} with ${newPriority} priority`, 'success');
    }
    
    static addStatusHistory(status, note = '') {
        const timeline = document.getElementById('statusTimeline');
        if (!timeline) return;
        
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.innerHTML = `
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <h6>Status Updated to ${status}</h6>
                ${note ? `<p class="text-muted mb-1">${note}</p>` : ''}
                <small class="text-muted">${new Date().toLocaleString()}</small>
            </div>
        `;
        
        timeline.appendChild(timelineItem);
    }
    
    static loadSimilarIssues() {
        if (!currentIssue) return;
        
        const similarIssues = allIssues.filter(issue => 
            issue.id !== currentIssue.id && 
            issue.category === currentIssue.category &&
            issue.status !== 'Resolved'
        ).slice(0, 3); // Show max 3 similar issues
        
        const container = document.getElementById('similarIssues');
        if (!container) return;
        
        if (similarIssues.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No similar issues found</p>';
            return;
        }
        
        container.innerHTML = similarIssues.map(issue => `
            <div class="similar-issue" onclick="viewIssueDetail('${issue.id}')">
                <h6 class="mb-1">${issue.title}</h6>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge ${this.getStatusBadgeClass(issue.status)}">${issue.status}</span>
                    <small class="text-muted">${Utilities.formatDate(issue.date)}</small>
                </div>
            </div>
        `).join('');
    }
    
    static loadComments() {
        // In a real app, you would load comments from a database
        // For demo, we'll create some sample comments
        const comments = [
            {
                id: 1,
                user: 'Community Member',
                text: 'I\'ve seen this issue too. It\'s been getting worse over time.',
                time: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            },
            {
                id: 2,
                user: 'Local Resident',
                text: 'Thanks for reporting this! I hope it gets fixed soon.',
                time: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
            }
        ];
        
        const container = document.getElementById('commentsList');
        if (!container) return;
        
        container.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-user">${comment.user}</span>
                    <span class="comment-time">${Utilities.formatDate(comment.time)}</span>
                </div>
                <p class="mb-0">${comment.text}</p>
            </div>
        `).join('');
    }
    
    static getStatusBadgeClass(status) {
        switch (status) {
            case 'Resolved': return 'bg-success';
            case 'In Progress': return 'bg-warning';
            case 'Under Review': return 'bg-info';
            case 'Reported': return 'bg-secondary';
            default: return 'bg-secondary';
        }
    }
    
    static getPriorityBadgeClass(priority) {
        switch (priority) {
            case 'Critical': return 'bg-danger';
            case 'High': return 'bg-warning';
            case 'Medium': return 'bg-info';
            case 'Low': return 'bg-secondary';
            default: return 'bg-secondary';
        }
    }
}

// Global functions
function upvoteIssue(issueId) {
    if (!currentUser) {
        NotificationSystem.show('Please login to upvote issues', 'warning');
        return;
    }
    
    const issue = allIssues.find(i => i.id === issueId);
    if (issue) {
        issue.upvotes = (issue.upvotes || 0) + 1;
        
        // Update priority based on upvotes
        if (issue.upvotes >= 20) issue.urgency = 'Critical';
        else if (issue.upvotes >= 10) issue.urgency = 'High';
        else if (issue.upvotes >= 5) issue.urgency = 'Medium';
        
        localStorage.setItem('civictrack_issues', JSON.stringify(allIssues));
        
        // Update UI
        document.getElementById('upvoteCount').textContent = issue.upvotes;
        document.getElementById('upvoteBtn').classList.add('upvoted');
        document.getElementById('upvoteBtn').innerHTML = '<i class="fas fa-arrow-up"></i> Upvoted';
        
        NotificationSystem.show('Issue upvoted! Thank you for your contribution.', 'success');
        
        // Log activity
        if (typeof ProfileManager !== 'undefined') {
            ProfileManager.logActivity('upvoted_issue', `Upvoted issue: ${issue.title}`);
        }
    }
}

function flagIssue() {
    if (!currentUser) {
        NotificationSystem.show('Please login to flag issues', 'warning');
        return;
    }
    
    if (currentIssue) {
        currentIssue.flags = (currentIssue.flags || 0) + 1;
        localStorage.setItem('civictrack_issues', JSON.stringify(allIssues));
        
        document.getElementById('issueFlags').textContent = currentIssue.flags;
        NotificationSystem.show('Issue flagged for admin review', 'warning');
    }
}

function deleteIssue() {
    if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
        return;
    }
    
    if (currentIssue) {
        const index = allIssues.findIndex(i => i.id === currentIssue.id);
        if (index > -1) {
            allIssues.splice(index, 1);
            localStorage.setItem('civictrack_issues', JSON.stringify(allIssues));
            
            NotificationSystem.show('Issue deleted successfully', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        }
    }
}

function shareIssue() {
    const issueUrl = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: currentIssue.title,
            text: currentIssue.description,
            url: issueUrl
        }).then(() => {
            NotificationSystem.show('Issue shared successfully', 'success');
        }).catch(() => {
            this.fallbackShare(issueUrl);
        });
    } else {
        this.fallbackShare(issueUrl);
    }
}

function fallbackShare(url) {
    navigator.clipboard.writeText(url).then(() => {
        NotificationSystem.show('Issue link copied to clipboard', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        NotificationSystem.show('Issue link copied to clipboard', 'success');
    });
}

function viewOnMap() {
    if (currentIssue && currentIssue.location?.lat && currentIssue.location?.lng) {
        const mapUrl = `https://www.google.com/maps?q=${currentIssue.location.lat},${currentIssue.location.lng}`;
        window.open(mapUrl, '_blank');
    } else {
        NotificationSystem.show('Location data not available for this issue', 'warning');
    }
}

function downloadIssueReport() {
    if (currentIssue) {
        DataExporter.exportIssue(currentIssue);
    }
}

function addComment() {
    const commentText = document.getElementById('commentText').value.trim();
    if (!commentText) {
        NotificationSystem.show('Please enter a comment', 'warning');
        return;
    }
    
    if (!currentUser) {
        NotificationSystem.show('Please login to add comments', 'warning');
        return;
    }
    
    // In a real app, you would save the comment to a database
    NotificationSystem.show('Comment added successfully', 'success');
    document.getElementById('commentText').value = '';
    
    // Reload comments (in a real app, this would be handled by the backend)
    IssueDetailManager.loadComments();
}

// Initialize issue detail manager when page loads
document.addEventListener('DOMContentLoaded', function() {
    IssueDetailManager.init();
});

// Make IssueDetailManager globally available
window.IssueDetailManager = IssueDetailManager;