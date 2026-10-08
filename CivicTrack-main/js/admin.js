// Enhanced Admin Management System
class AdminManager {
    static init() {
        this.loadAdminDashboard();
        this.setupEventListeners();
        this.setupAdminControls();
        this.updateAdminStats();
    }
    
    static loadAdminDashboard() {
        this.loadAdminIssuesTable();
        this.updateUserDisplay();
    }
    
    static setupEventListeners() {
        // Bulk actions form
        const bulkForm = document.getElementById('bulkForm');
        if (bulkForm) {
            bulkForm.addEventListener('submit', this.handleBulkActions.bind(this));
        }
        
        // Admin search
        const adminSearchInput = document.getElementById('adminSearchInput');
        if (adminSearchInput) {
            adminSearchInput.addEventListener('input', 
                Utilities.debounce(this.handleAdminSearch.bind(this), 300)
            );
        }
        
        // Status update modal
        const statusForm = document.getElementById('statusForm');
        if (statusForm) {
            statusForm.addEventListener('submit', this.handleStatusUpdate.bind(this));
        }
    }
    
    static setupAdminControls() {
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const checkboxes = document.querySelectorAll('.issue-checkbox');
                checkboxes.forEach(cb => cb.checked = this.checked);
                AdminManager.updateBulkButton();
            });
        }
        
        // Bulk action dropdown
        const bulkAction = document.getElementById('bulkAction');
        if (bulkAction) {
            bulkAction.addEventListener('change', this.updateBulkButton.bind(this));
        }
        
        this.updateBulkButton();
    }
    
    static updateAdminStats() {
        const totalIssues = document.getElementById('totalIssues');
        const pendingIssues = document.getElementById('pendingIssues');
        const inProgressIssues = document.getElementById('inProgressIssues');
        const resolvedIssues = document.getElementById('resolvedIssues');
        
        if (totalIssues) totalIssues.textContent = allIssues.length;
        if (pendingIssues) pendingIssues.textContent = allIssues.filter(i => i.status === 'Reported').length;
        if (inProgressIssues) inProgressIssues.textContent = allIssues.filter(i => i.status === 'In Progress').length;
        if (resolvedIssues) resolvedIssues.textContent = allIssues.filter(i => i.status === 'Resolved').length;
    }
    
    static loadAdminIssuesTable() {
        const tableBody = document.getElementById('issuesTableBody');
        const noIssuesDiv = document.getElementById('no-admin-issues');
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (allIssues.length === 0) {
            noIssuesDiv?.classList.remove('d-none');
            return;
        }
        
        noIssuesDiv?.classList.add('d-none');
        
        allIssues.forEach(issue => {
            const row = this.createAdminTableRow(issue);
            tableBody.appendChild(row);
        });
        
        this.setupTableControls();
    }
    
    static createAdminTableRow(issue) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-issue-id', issue.id);
        
        const statusBadgeClass = this.getStatusBadgeClass(issue.status);
        const priorityBadgeClass = this.getPriorityBadgeClass(issue.urgency);
        
        tr.innerHTML = `
            <td>
                <input type="checkbox" name="issue_ids" value="${issue.id}" class="form-check-input issue-checkbox">
            </td>
            <td>
                <a href="issue_detail.html?id=${issue.id}" class="text-decoration-none fw-bold">
                    #${String(issue.id).padStart(3, '0')}
                </a>
            </td>
            <td>
                <div class="issue-title fw-semibold">
                    ${issue.title.length > 30 ? issue.title.substring(0, 30) + '...' : issue.title}
                </div>
                <small class="text-muted">
                    ${issue.location ? `<i class="fas fa-map-marker-alt"></i> ${issue.location}` : ''}
                    ${issue.images?.length ? '<i class="fas fa-image ms-2"></i>' : ''}
                </small>
            </td>
            <td>
                <span class="badge bg-secondary">${issue.category}</span>
            </td>
            <td>
                <span class="badge ${statusBadgeClass}">${issue.status}</span>
            </td>
            <td>
                <span class="badge ${priorityBadgeClass}">
                    ${issue.urgency} 
                    ${issue.upvotes > 0 ? `<i class="fas fa-fire ms-1"></i> ${issue.upvotes}` : ''}
                </span>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    ${issue.reporter === 'Anonymous' ? 
                        '<i class="fas fa-user-secret me-1"></i> Anonymous' : 
                        issue.reporter
                    }
                    ${issue.safetyHazard ? '<i class="fas fa-exclamation-triangle text-danger ms-1"></i>' : ''}
                </div>
            </td>
            <td>
                <small>${Utilities.formatDate(issue.date)}</small>
            </td>
            <td>
                ${issue.flags > 0 ? 
                    `<span class="badge bg-danger"><i class="fas fa-flag"></i> ${issue.flags}</span>` : 
                    '<span class="text-muted">0</span>'
                }
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary" 
                            onclick="AdminManager.quickStatusUpdate('${issue.id}')"
                            data-bs-toggle="tooltip" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-outline-info"
                            onclick="AdminManager.viewIssueDetails('${issue.id}')"
                            data-bs-toggle="tooltip" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-warning" 
                            onclick="AdminManager.flagIssue('${issue.id}')"
                            data-bs-toggle="tooltip" title="Flag Issue">
                        <i class="fas fa-flag"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger" 
                            onclick="AdminManager.deleteIssue('${issue.id}')"
                            data-bs-toggle="tooltip" title="Delete Issue">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button type="button" class="btn btn-outline-success" 
                            onclick="AdminManager.downloadIssue('${issue.id}')"
                            data-bs-toggle="tooltip" title="Download Report">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </td>
        `;
        
        return tr;
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
    
    static setupTableControls() {
        document.querySelectorAll('.issue-checkbox').forEach(cb => {
            cb.addEventListener('change', this.updateBulkButton.bind(this));
        });
    }
    
    static updateBulkButton() {
        const selected = document.querySelectorAll('.issue-checkbox:checked').length;
        const bulkSubmit = document.getElementById('bulkSubmit');
        const bulkAction = document.getElementById('bulkAction');
        
        if (bulkSubmit && bulkAction) {
            bulkSubmit.disabled = selected === 0 || bulkAction.value === '';
            
            if (selected > 0) {
                bulkSubmit.innerHTML = `Apply to ${selected} Selected`;
            } else {
                bulkSubmit.innerHTML = 'Apply to Selected';
            }
        }
    }
    
    static handleBulkActions(e) {
        e.preventDefault();
        
        const selected = Array.from(document.querySelectorAll('.issue-checkbox:checked'))
            .map(cb => cb.value);
        const action = document.getElementById('bulkAction')?.value;
        
        if (selected.length === 0) {
            NotificationSystem.show('No issues selected', 'warning');
            return;
        }
        
        if (!action) {
            NotificationSystem.show('Please select an action', 'warning');
            return;
        }
        
        const actionText = document.getElementById('bulkAction')?.selectedOptions[0]?.text;
        if (!confirm(`Are you sure you want to ${actionText?.toLowerCase()} ${selected.length} issue(s)?`)) {
            return;
        }
        
        // Apply action to selected issues
        selected.forEach(issueId => {
            const issue = allIssues.find(i => i.id === issueId);
            if (issue) {
                switch (action) {
                    case 'mark_in_progress':
                        issue.status = 'In Progress';
                        this.logIssueAction(issueId, 'status_update', 'Marked as In Progress');
                        break;
                    case 'mark_resolved':
                        issue.status = 'Resolved';
                        issue.resolvedDate = new Date().toISOString();
                        this.logIssueAction(issueId, 'status_update', 'Marked as Resolved');
                        break;
                    case 'delete':
                        const index = allIssues.findIndex(i => i.id === issueId);
                        if (index > -1) {
                            allIssues.splice(index, 1);
                            this.logIssueAction(issueId, 'deleted', 'Issue deleted');
                        }
                        break;
                }
            }
        });
        
        // Refresh displays
        localStorage.setItem('civictrack_issues', JSON.stringify(allIssues));
        this.loadAdminIssuesTable();
        this.updateAdminStats();
        
        NotificationSystem.show(`${actionText} applied to ${selected.length} issue(s)`, 'success');
    }
    
    static handleAdminSearch(e) {
        const query = e.target.value.toLowerCase();
        
        const filtered = allIssues.filter(issue => 
            issue.title.toLowerCase().includes(query) ||
            issue.description.toLowerCase().includes(query) ||
            issue.location.toLowerCase().includes(query) ||
            issue.reporter.toLowerCase().includes(query) ||
            issue.category.toLowerCase().includes(query)
        );
        
        this.renderFilteredIssues(filtered);
    }
    
    static renderFilteredIssues(issues) {
        const tableBody = document.getElementById('issuesTableBody');
        const noIssuesDiv = document.getElementById('no-admin-issues');
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (issues.length === 0) {
            noIssuesDiv?.classList.remove('d-none');
            return;
        }
        
        noIssuesDiv?.classList.add('d-none');
        
        issues.forEach(issue => {
            const row = this.createAdminTableRow(issue);
            tableBody.appendChild(row);
        });
    }
    
    static quickStatusUpdate(issueId) {
        const issue = allIssues.find(i => i.id === issueId);
        if (!issue) return;
        
        const modalIssueId = document.getElementById('modalIssueId');
        const modalStatus = document.getElementById('modalStatus');
        
        if (modalIssueId) modalIssueId.value = issueId;
        if (modalStatus) modalStatus.value = issue.status;
        
        const modal = new bootstrap.Modal(document.getElementById('statusModal'));
        modal.show();
    }
    
    static handleStatusUpdate(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const issueId = document.getElementById('modalIssueId')?.value;
        const newStatus = formData.get('status');
        const note = formData.get('note');
        
        const issue = allIssues.find(i => i.id === issueId);
        if (issue) {
            const oldStatus = issue.status;
            issue.status = newStatus;
            
            if (newStatus === 'Resolved') {
                issue.resolvedDate = new Date().toISOString();
            }
            
            // Log the status change
            this.logIssueAction(issueId, 'status_update', 
                `Status changed from ${oldStatus} to ${newStatus}${note ? `: ${note}` : ''}`);
            
            // Refresh displays
            localStorage.setItem('civictrack_issues', JSON.stringify(allIssues));
            this.loadAdminIssuesTable();
            this.updateAdminStats();
            
            NotificationSystem.show(`Issue #${String(issueId).padStart(3, '0')} status updated to ${newStatus}`, 'success');
            
            // Send notification to reporter if not anonymous
            if (issue.reporterId && issue.contact?.email) {
                this.sendStatusUpdateNotification(issue, oldStatus, newStatus);
            }
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('statusModal'));
        modal.hide();
    }
    
    static sendStatusUpdateNotification(issue, oldStatus, newStatus) {
        const notification = {
            type: 'status_update',
            issueId: issue.id,
            issueTitle: issue.title,
            oldStatus,
            newStatus,
            timestamp: new Date().toISOString()
        };
        
        NotificationSystem.saveToHistory(
            `Status update for "${issue.title}": ${oldStatus} → ${newStatus}`,
            'info'
        );
        
        // In a real app, you would send email/SMS here
        console.log('Would send notification:', notification);
    }
    
    static viewIssueDetails(issueId) {
        window.location.href = `issue_detail.html?id=${issueId}`;
    }
    
    static flagIssue(issueId) {
        const issue = allIssues.find(i => i.id === issueId);
        if (issue) {
            issue.flags = (issue.flags || 0) + 1;
            localStorage.setItem('civictrack_issues', JSON.stringify(allIssues));
            this.loadAdminIssuesTable();
            
            this.logIssueAction(issueId, 'flagged', 'Issue flagged for review');
            NotificationSystem.show('Issue flagged for review', 'warning');
        }
    }
    
    static deleteIssue(issueId) {
        if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
            return;
        }
        
        const index = allIssues.findIndex(i => i.id === issueId);
        if (index > -1) {
            allIssues.splice(index, 1);
            localStorage.setItem('civictrack_issues', JSON.stringify(allIssues));
            
            this.loadAdminIssuesTable();
            this.updateAdminStats();
            
            this.logIssueAction(issueId, 'deleted', 'Issue permanently deleted');
            NotificationSystem.show('Issue deleted successfully', 'success');
        }
    }
    
    static downloadIssue(issueId) {
        const issue = allIssues.find(i => i.id === issueId);
        if (issue) {
            DataExporter.exportIssue(issue);
            this.logIssueAction(issueId, 'downloaded', 'Issue report downloaded');
        }
    }
    
    static logIssueAction(issueId, action, description) {
        const adminActions = JSON.parse(localStorage.getItem('admin_actions') || '[]');
        adminActions.push({
            id: Utilities.generateId(),
            adminId: currentUser?.id,
            adminName: currentUser?.username,
            issueId,
            action,
            description,
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('admin_actions', JSON.stringify(adminActions));
    }
    
    static refreshData() {
        // Reload from localStorage
        const savedIssues = localStorage.getItem('civictrack_issues');
        if (savedIssues) {
            allIssues = JSON.parse(savedIssues);
        }
        
        this.loadAdminIssuesTable();
        this.updateAdminStats();
        
        NotificationSystem.show('Data refreshed successfully', 'info');
    }
}

// Initialize admin manager when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'Admin') {
        window.location.href = 'index.html';
        return;
    }
    
    AdminManager.init();
});

// Global functions for admin actions
window.refreshData = AdminManager.refreshData.bind(AdminManager);

// Make AdminManager globally available
window.AdminManager = AdminManager;