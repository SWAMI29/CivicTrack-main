// Community Management System
class CommunityManager {
    static init() {
        this.loadCommunityPosts();
        this.setupEventListeners();
        this.updateCommunityStats();
        this.loadTopContributors();
    }
    
    static setupEventListeners() {
        const postForm = document.getElementById('postForm');
        if (postForm) {
            postForm.addEventListener('submit', this.handlePostSubmission.bind(this));
        }
    }
    
    static handlePostSubmission(e) {
        e.preventDefault();
        
        if (!currentUser) {
            NotificationSystem.show('Please login to post', 'warning');
            return;
        }
        
        const content = document.getElementById('postContent').value.trim();
        const imageInput = document.getElementById('postImage');
        
        if (!content && !imageInput.files[0]) {
            NotificationSystem.show('Please add some content or image to your post', 'warning');
            return;
        }
        
        const postData = {
            id: Utilities.generateId(),
            userId: currentUser.id,
            userName: `${currentUser.firstName} ${currentUser.lastName}`,
            userAvatar: currentUser.avatar,
            content: content,
            image: null,
            location: document.getElementById('postLocation').style.display === 'block' ? 
                     document.getElementById('locationText').textContent : null,
            timestamp: new Date().toISOString(),
            likes: 0,
            comments: [],
            userRole: currentUser.role
        };
        
        // Handle image upload
        if (imageInput.files[0]) {
            this.handleImageUpload(imageInput.files[0]).then(imageUrl => {
                postData.image = imageUrl;
                this.savePost(postData);
            }).catch(error => {
                console.error('Image upload failed:', error);
                this.savePost(postData);
            });
        } else {
            this.savePost(postData);
        }
    }
    
    static handleImageUpload(file) {
        return new Promise((resolve, reject) => {
            // In a real app, this would upload to a server
            // For demo, we'll create a local URL
            const reader = new FileReader();
            reader.onload = (e) => {
                // Store image in localStorage (not ideal for production)
                const imageId = Utilities.generateId();
                localStorage.setItem(`post_image_${imageId}`, e.target.result);
                resolve(`local://post_image_${imageId}`);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    static savePost(postData) {
        const posts = JSON.parse(localStorage.getItem('community_posts') || '[]');
        posts.unshift(postData);
        localStorage.setItem('community_posts', JSON.stringify(posts));
        
        // Reset form
        document.getElementById('postForm').reset();
        document.getElementById('imagePreviewContainer').style.display = 'none';
        document.getElementById('postLocation').style.display = 'none';
        
        // Reload posts
        this.loadCommunityPosts();
        this.updateCommunityStats();
        
        NotificationSystem.show('Post shared successfully!', 'success');
        
        // Log activity
        if (typeof ProfileManager !== 'undefined') {
            ProfileManager.logActivity('created_post', 'Shared a post in community');
        }
    }
    
    static loadCommunityPosts() {
        const posts = JSON.parse(localStorage.getItem('community_posts') || '[]');
        const container = document.getElementById('communityPosts');
        
        if (!container) return;
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="card shadow-lg">
                    <div class="card-body text-center py-5">
                        <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                        <h4>No Posts Yet</h4>
                        <p class="text-muted">Be the first to share something with your community!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="card shadow-lg mb-4 community-post" data-post-id="${post.id}">
                <div class="card-body">
                    <!-- Post Header -->
                    <div class="d-flex align-items-center mb-3">
                        <img src="${post.userAvatar}" alt="${post.userName}" 
                             class="rounded-circle me-3" width="40" height="40">
                        <div class="flex-grow-1">
                            <h6 class="mb-0">${post.userName}</h6>
                            <small class="text-muted">
                                ${Utilities.formatDate(post.timestamp)}
                                ${post.userRole === 'Admin' ? '<span class="badge bg-primary ms-1">Admin</span>' : ''}
                                ${post.location ? `<br><i class="fas fa-map-marker-alt"></i> ${post.location}` : ''}
                            </small>
                        </div>
                        ${post.userId === currentUser?.id ? `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary" type="button" 
                                        data-bs-toggle="dropdown">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="CommunityManager.editPost('${post.id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </a></li>
                                    <li><a class="dropdown-item text-danger" href="#" onclick="CommunityManager.deletePost('${post.id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </a></li>
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Post Content -->
                    ${post.content ? `<p class="mb-3">${this.escapeHtml(post.content)}</p>` : ''}
                    
                    <!-- Post Image -->
                    ${post.image ? `
                        <div class="post-image mb-3">
                            <img src="${this.getImageUrl(post.image)}" alt="Post image" class="img-fluid rounded">
                        </div>
                    ` : ''}
                    
                    <!-- Post Actions -->
                    <div class="d-flex justify-content-between align-items-center border-top pt-3">
                        <button class="btn btn-sm btn-outline-primary" onclick="CommunityManager.likePost('${post.id}')">
                            <i class="fas fa-thumbs-up"></i> Like (${post.likes || 0})
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="CommunityManager.toggleComments('${post.id}')">
                            <i class="fas fa-comment"></i> Comment (${post.comments?.length || 0})
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="CommunityManager.sharePost('${post.id}')">
                            <i class="fas fa-share"></i> Share
                        </button>
                    </div>
                    
                    <!-- Comments Section -->
                    <div class="comments-section mt-3" id="comments-${post.id}" style="display: none;">
                        <div class="comment-form mb-3">
                            <div class="input-group">
                                <input type="text" class="form-control" id="comment-${post.id}" 
                                       placeholder="Write a comment...">
                                <button class="btn btn-primary" onclick="CommunityManager.addComment('${post.id}')">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                        <div class="comments-list" id="comments-list-${post.id}">
                            ${this.renderComments(post.comments)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    static getImageUrl(imageRef) {
        if (imageRef.startsWith('local://')) {
            return localStorage.getItem(imageRef.replace('local://', 'post_image_')) || '';
        }
        return imageRef;
    }
    
    static renderComments(comments) {
        if (!comments || comments.length === 0) {
            return '<p class="text-muted text-center">No comments yet</p>';
        }
        
        return comments.map(comment => `
            <div class="comment-item mb-2 p-2 bg-light rounded">
                <div class="d-flex align-items-start">
                    <img src="${comment.userAvatar}" alt="${comment.userName}" 
                         class="rounded-circle me-2" width="30" height="30">
                    <div class="flex-grow-1">
                        <strong class="d-block">${comment.userName}</strong>
                        <p class="mb-1 small">${this.escapeHtml(comment.content)}</p>
                        <small class="text-muted">${Utilities.formatDate(comment.timestamp)}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    static likePost(postId) {
        if (!currentUser) {
            NotificationSystem.show('Please login to like posts', 'warning');
            return;
        }
        
        const posts = JSON.parse(localStorage.getItem('community_posts') || '[]');
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex > -1) {
            posts[postIndex].likes = (posts[postIndex].likes || 0) + 1;
            localStorage.setItem('community_posts', JSON.stringify(posts));
            this.loadCommunityPosts();
            
            NotificationSystem.show('Post liked!', 'success');
        }
    }
    
    static addComment(postId) {
        if (!currentUser) {
            NotificationSystem.show('Please login to comment', 'warning');
            return;
        }
        
        const commentInput = document.getElementById(`comment-${postId}`);
        const content = commentInput.value.trim();
        
        if (!content) {
            NotificationSystem.show('Please enter a comment', 'warning');
            return;
        }
        
        const posts = JSON.parse(localStorage.getItem('community_posts') || '[]');
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex > -1) {
            const comment = {
                id: Utilities.generateId(),
                userId: currentUser.id,
                userName: `${currentUser.firstName} ${currentUser.lastName}`,
                userAvatar: currentUser.avatar,
                content: content,
                timestamp: new Date().toISOString()
            };
            
            if (!posts[postIndex].comments) {
                posts[postIndex].comments = [];
            }
            
            posts[postIndex].comments.push(comment);
            localStorage.setItem('community_posts', JSON.stringify(posts));
            
            // Clear input and refresh comments
            commentInput.value = '';
            this.loadCommunityPosts();
            this.toggleComments(postId); // Keep comments open
            
            NotificationSystem.show('Comment added!', 'success');
        }
    }
    
    static toggleComments(postId) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (commentsSection) {
            commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    static sharePost(postId) {
        NotificationSystem.show('Post shared! (Share functionality would be implemented in production)', 'info');
    }
    
    static deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }
        
        const posts = JSON.parse(localStorage.getItem('community_posts') || '[]');
        const filteredPosts = posts.filter(p => p.id !== postId);
        localStorage.setItem('community_posts', JSON.stringify(filteredPosts));
        
        this.loadCommunityPosts();
        this.updateCommunityStats();
        
        NotificationSystem.show('Post deleted successfully', 'success');
    }
    
    static editPost(postId) {
        const posts = JSON.parse(localStorage.getItem('community_posts') || '[]');
        const post = posts.find(p => p.id === postId);
        
        if (post) {
            document.getElementById('postContent').value = post.content;
            document.getElementById('postForm').scrollIntoView({ behavior: 'smooth' });
            this.deletePost(postId); // Delete old post (simplified editing)
        }
    }
    
    static updateCommunityStats() {
        const posts = JSON.parse(localStorage.getItem('community_posts') || '[]');
        const users = JSON.parse(localStorage.getItem('civictrack_users') || '[]');
        const activeUsers = users.filter(u => u.isActive);
        
        // Calculate resolved issues this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const resolvedThisWeek = allIssues.filter(issue => 
            issue.status === 'Resolved' && new Date(issue.resolvedDate || issue.date) > oneWeekAgo
        ).length;
        
        document.getElementById('totalMembers').textContent = activeUsers.length;
        document.getElementById('totalPosts').textContent = posts.length;
        document.getElementById('resolvedThisWeek').textContent = resolvedThisWeek;
    }
    
    static loadTopContributors() {
        const users = JSON.parse(localStorage.getItem('civictrack_users') || '[]');
        const issues = JSON.parse(localStorage.getItem('civictrack_issues') || []);
        
        // Calculate contribution scores
        const contributors = users.map(user => {
            const userIssues = issues.filter(issue => issue.reporterId === user.id);
            const userPosts = JSON.parse(localStorage.getItem('community_posts') || [])
                .filter(post => post.userId === user.id);
            
            const score = userIssues.length * 2 + userPosts.length;
            
            return {
                ...user,
                score,
                issuesCount: userIssues.length,
                postsCount: userPosts.length
            };
        }).sort((a, b) => b.score - a.score).slice(0, 5);
        
        const container = document.getElementById('topContributors');
        if (!container) return;
        
        container.innerHTML = contributors.map((user, index) => `
            <div class="contributor-item d-flex align-items-center mb-3">
                <div class="position-relative">
                    <img src="${user.avatar}" alt="${user.firstName}" 
                         class="rounded-circle me-3" width="40" height="40">
                    ${index < 3 ? `<span class="position-absolute top-0 start-100 translate-middle badge bg-warning">
                        ${index + 1}
                    </span>` : ''}
                </div>
                <div class="flex-grow-1">
                    <strong class="d-block">${user.firstName} ${user.lastName}</strong>
                    <small class="text-muted">
                        ${user.issuesCount} reports • ${user.postsCount} posts
                    </small>
                </div>
            </div>
        `).join('');
        
        if (contributors.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No contributors yet</p>';
        }
    }
    
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Image preview function
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    const container = document.getElementById('imagePreviewContainer');
    
    if (file && preview && container) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            container.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function removeImage() {
    document.getElementById('postImage').value = '';
    document.getElementById('imagePreviewContainer').style.display = 'none';
}

async function addLocationToPost() {
    try {
        const location = await LocationManager.getUserLocation();
        const locationText = `Near ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
        
        document.getElementById('locationText').textContent = locationText;
        document.getElementById('postLocation').style.display = 'block';
        
        NotificationSystem.show('Location added to post', 'success');
    } catch (error) {
        NotificationSystem.show('Could not get location', 'warning');
    }
}

// Initialize community when page loads
document.addEventListener('DOMContentLoaded', function() {
    CommunityManager.init();
});

// Make CommunityManager globally available
window.CommunityManager = CommunityManager;