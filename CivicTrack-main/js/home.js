// Home Page Specific Functionality
class HomeManager {
    static init() {
        this.loadLocalIssues();
        this.setupEventListeners();
        this.updateLocationDisplay();
        this.updateQuickStats();
    }

    // ============================================================
    // CivicTrack – Static Demo Data for Home Page
    // ============================================================
// ============================================================
// CivicTrack – Static Demo Data for Home Page
// ============================================================
static loadDemoIssues() {
    if (!localStorage.getItem("civictrack_issues")) {
        const demoIssues = [
            {
                id: "CT-201",
                title: "Broken Streetlight near Central Park",
                category: "Street Lighting",
                status: "Reported",
                urgency: "High",
                location: "Central Avenue, Sector 10",
                date: "2025-10-30",
                reporter: "Anonymous",
                upvotes: 5
            },
            {
                id: "CT-202",
                title: "Potholes on Main Road",
                category: "Roads & Transportation",
                status: "In Progress",
                urgency: "Medium",
                location: "MG Road, Sector 5",
                date: "2025-10-29",
                reporter: "Riya Sharma",
                upvotes: 11
            },
            {
                id: "CT-203",
                title: "Overflowing Garbage Bin",
                category: "Cleanliness & Waste",
                status: "Resolved",
                urgency: "Low",
                location: "Block B Market, Sector 8",
                date: "2025-10-27",
                reporter: "Arjun Mehta",
                upvotes: 18
            },
            {
                id: "CT-204",
                title: "Water Leakage Near School",
                category: "Water & Drainage",
                status: "Under Review",
                urgency: "High",
                location: "Greenfield Public School",
                date: "2025-10-31",
                reporter: "Sneha Verma",
                upvotes: 8
            },
            {
                id: "CT-205",
                title: "Broken Traffic Signal",
                category: "Traffic & Safety",
                status: "Reported",
                urgency: "Critical",
                location: "Ring Road Junction",
                date: "2025-10-30",
                reporter: "Vikas Singh",
                upvotes: 14
            },
            {
                id: "CT-206",
                title: "Uncollected Garbage Bags",
                category: "Cleanliness & Waste",
                status: "In Progress",
                urgency: "Medium",
                location: "Sunrise Colony, Block C",
                date: "2025-10-29",
                reporter: "Rohit Jain",
                upvotes: 9
            },
            {
                id: "CT-207",
                title: "Street Flooding After Rain",
                category: "Water & Drainage",
                status: "Under Review",
                urgency: "High",
                location: "Sector 9 Park Road",
                date: "2025-10-30",
                reporter: "Simran Kaur",
                upvotes: 6
            },
            {
                id: "CT-208",
                title: "Illegal Parking in No-Parking Zone",
                category: "Traffic & Safety",
                status: "Reported",
                urgency: "Medium",
                location: "Main Circle Road",
                date: "2025-10-31",
                reporter: "Manish Gupta",
                upvotes: 7
            },
            {
                id: "CT-209",
                title: "Open Electrical Wires",
                category: "Electrical Safety",
                status: "In Progress",
                urgency: "Critical",
                location: "Near Bus Depot, Sector 7",
                date: "2025-10-28",
                reporter: "Ravi Kumar",
                upvotes: 13
            },
            {
                id: "CT-210",
                title: "Tree Branch Blocking Footpath",
                category: "Public Spaces",
                status: "Resolved",
                urgency: "Low",
                location: "Lotus Avenue, Sector 3",
                date: "2025-10-26",
                reporter: "Priya Nair",
                upvotes: 4
            }
        ];

        localStorage.setItem("civictrack_issues", JSON.stringify(demoIssues));
        console.log("✅ Static civic issues loaded for demo.");
    }
}


    static setupEventListeners() {
        // Filter form
        const filterForm = document.getElementById('filterForm');
        if (filterForm) {
            filterForm.addEventListener('submit', this.handleFilterSubmission.bind(this));
        }

        // View toggle buttons
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', this.handleViewToggle.bind(this));
        });

        // Search input with debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', 
                Utilities.debounce(this.handleSearch.bind(this), 300)
            );
        }

        // Distance range
        const distanceRange = document.getElementById('distanceRange');
        if (distanceRange) {
            distanceRange.addEventListener('input', 
                Utilities.debounce(this.handleDistanceChange.bind(this), 500)
            );
        }
    }

    static handleFilterSubmission(e) {
        e.preventDefault();
        this.applyFilters();
    }

    static applyFilters() {
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
        const urgencyFilter = document.getElementById('urgencyFilter')?.value || 'all';
        const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const maxDistance = document.getElementById('distanceRange')?.value || 20;

        document.getElementById('mapDistance').textContent = maxDistance;

        let filtered = LocationManager.filterIssuesByDistance(allIssues, maxDistance)
            .filter(issue => issue.distance >= 5);

        filtered = filtered.filter(issue => {
            const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
            const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;
            const matchesUrgency = urgencyFilter === 'all' || issue.urgency === urgencyFilter;
            const matchesSearch = !searchQuery || 
                issue.title.toLowerCase().includes(searchQuery) ||
                issue.description.toLowerCase().includes(searchQuery) ||
                issue.location.toLowerCase().includes(searchQuery);

            return matchesStatus && matchesCategory && matchesUrgency && matchesSearch;
        });

        this.renderIssues(filtered);

        if (window.mapManager) {
            window.mapManager.addIssueMarkers(filtered);
        }
    }

    static handleSearch() {
        this.applyFilters();
    }

    static handleDistanceChange() {
        this.applyFilters();
    }

    static renderIssues(issues) {
        const container = document.getElementById('issues-container');
        const issueCount = document.getElementById('issueCount');
        const noIssues = document.getElementById('no-issues');

        if (!container) return;

        container.innerHTML = '';

        if (issues.length === 0) {
            noIssues.style.display = 'block';
            container.style.display = 'none';
            if (issueCount) issueCount.textContent = '0';
            return;
        }

        noIssues.style.display = 'none';
        container.style.display = 'flex';
        if (issueCount) issueCount.textContent = issues.length;

        issues.forEach(issue => {
            const issueCard = this.createIssueCard(issue);
            container.appendChild(issueCard);
        });

        this.updateQuickStats(issues);
    }

    static createIssueCard(issue) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-xl-4 mb-4';

        const statusBadgeClass = this.getStatusBadgeClass(issue.status);
        const priorityBadgeClass = this.getPriorityBadgeClass(issue.urgency);

        col.innerHTML = `
            <div class="card h-100 issue-card shadow-sm" onclick="viewIssueDetail('${issue.id}')">
                <div class="position-relative">
                    <img src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop&crop=center" 
                         class="card-img-top" alt="${issue.title}" style="height: 200px; object-fit: cover;">
                    <div class="issue-upvotes">
                        <i class="fas fa-fire"></i> ${issue.upvotes || 0}
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${issue.title}</h5>
                    <p class="text-muted small mb-1"><i class="fas fa-layer-group"></i> ${issue.category}</p>
                    <p class="text-muted small mb-1"><i class="fas fa-map-marker-alt"></i> ${issue.location}</p>
                    <p class="small mb-2"><i class="fas fa-calendar"></i> ${Utilities.formatDate(issue.date)}</p>
                    <span class="badge ${statusBadgeClass}">${issue.status}</span>
                    <span class="badge ${priorityBadgeClass}">${issue.urgency}</span>
                </div>
            </div>
        `;
        return col;
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

    static async updateLocationDisplay() {
        const locationText = document.getElementById('locationText');
        if (!locationText) return;

        try {
            const location = await LocationManager.getUserLocation();
            locationText.textContent = `Located at ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} - Showing issues within ${APP_CONFIG.MAX_DISTANCE_KM}km`;
        } catch (error) {
            locationText.textContent = 'Location access required to show local issues';
        }
    }

    static updateQuickStats(issues = null) {
        const issuesToUse = issues || LocationManager.filterIssuesByDistance(allIssues, APP_CONFIG.MAX_DISTANCE_KM);

        const localIssuesCount = document.getElementById('localIssuesCount');
        const urgentCount = document.getElementById('urgentCount');
        const resolvedCount = document.getElementById('resolvedCount');

        if (localIssuesCount) localIssuesCount.textContent = issuesToUse.length;
        if (urgentCount) urgentCount.textContent = issuesToUse.filter(issue => 
            issue.urgency === 'Critical' || issue.urgency === 'High'
        ).length;
        if (resolvedCount) resolvedCount.textContent = issuesToUse.filter(issue => 
            issue.status === 'Resolved'
        ).length;
    }

    static loadLocalIssues() {
        this.loadDemoIssues();
        const localIssues = JSON.parse(localStorage.getItem("civictrack_issues")) || [];
        this.renderIssues(localIssues);
    }
}

// Global functions
function resetFilters() {
    document.getElementById('filterForm').reset();
    document.getElementById('distanceValue').textContent = '20km';
    HomeManager.applyFilters();
}

function refreshLocation() {
    LocationManager.getUserLocation().then(() => {
        HomeManager.updateLocationDisplay();
        HomeManager.applyFilters();
        NotificationSystem.show('Location updated successfully', 'success');
    }).catch(() => {
        NotificationSystem.show('Failed to update location', 'danger');
    });
}

function viewIssueDetail(issueId) {
    window.location.href = `issue_detail.html?id=${issueId}`;
}

document.addEventListener('DOMContentLoaded', function() {
    HomeManager.init();
    loadRecentIssuesSection(); // new bottom loader
});

window.HomeManager = HomeManager;

// ============================================================
// CivicTrack – Home Page "Recent Issues" Loader
// ============================================================
function loadRecentIssuesSection() {
  const issueContainer = document.getElementById("recentIssues");
  if (!issueContainer) return;

  const issues = JSON.parse(localStorage.getItem("civictrack_issues") || "[]");

  if (issues.length === 0) {
    issueContainer.innerHTML = `<p class="text-muted text-center mt-4">No issues reported yet.</p>`;
    return;
  }

  issueContainer.innerHTML = issues.map(issue => `
    <div class="col-md-6 col-lg-4 fade-in">
      <div class="card shadow-sm border-0 hover-scale">
        <div class="card-body">
          <div class="d-flex align-items-center mb-2">
            <i class="fas fa-${getIcon(issue.category)} fa-2x text-primary me-2"></i>
            <h5 class="card-title mb-0">${issue.title}</h5>
          </div>
          <p class="text-muted mb-1"><i class="fas fa-layer-group"></i> ${issue.category}</p>
          <p class="text-muted mb-1"><i class="fas fa-map-marker-alt"></i> ${issue.location}</p>
          <p class="small mb-2"><i class="fas fa-calendar"></i> ${Utilities.formatDate(issue.date)}</p>
          <span class="badge bg-${HomeManager.getStatusBadgeClass(issue.status).replace('bg-', '')}">${issue.status}</span>
          <span class="badge bg-${HomeManager.getPriorityBadgeClass(issue.urgency).replace('bg-', '')}">${issue.urgency}</span>
        </div>
      </div>
    </div>
  `).join("");
}

function getIcon(category) {
  switch (category) {
    case "Road Damage": return "road";
    case "Public Lighting": return "lightbulb";
    case "Sanitation": return "trash";
    case "Water & Drainage": return "tint";
    default: return "exclamation-circle";
  }
}
