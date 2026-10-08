// Enhanced Map and Location-based Filtering - FIXED VERSION
class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.userMarker = null;
        this.mapInitialized = false;
    }
    
    async initializeMap(containerId = 'map') {
        console.log('Initializing map...'); // Debug log
        
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.error('Leaflet not loaded. Make sure Leaflet CSS and JS are included.');
            this.showMapFallback(containerId);
            return;
        }
        
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
            console.error('Map container not found:', containerId);
            return;
        }
        
        // Ensure map container has proper dimensions
        mapContainer.style.height = '400px';
        mapContainer.style.width = '100%';
        mapContainer.style.minHeight = '300px';
        
        try {
            // Get user location
            let userLocation = LocationManager.getSavedLocation();
            if (!userLocation) {
                userLocation = await LocationManager.getUserLocation();
            }
            
            console.log('User location:', userLocation); // Debug log
            
            // Initialize map with proper options
            this.map = L.map(containerId, {
                center: [userLocation.lat, userLocation.lng],
                zoom: 13,
                zoomControl: true,
                attributionControl: true,
                scrollWheelZoom: true,
                dragging: true
            });
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18,
                minZoom: 10
            }).addTo(this.map);
            
            // Add user location marker
            this.userMarker = L.marker([userLocation.lat, userLocation.lng])
                .addTo(this.map)
                .bindPopup('<strong>Your Location</strong><br>This is your current position')
                .openPopup();
            
            // Add circle showing 20km radius
            L.circle([userLocation.lat, userLocation.lng], {
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                radius: 20000 // 20km in meters
            }).addTo(this.map).bindPopup('20km radius from your location');
            
            this.mapInitialized = true;
            console.log('Map initialized successfully'); // Debug log
            
            // Trigger map resize to ensure proper rendering
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
            
            return this.map;
            
        } catch (error) {
            console.error('Error initializing map:', error);
            this.showMapFallback(containerId);
        }
    }
    
    showMapFallback(containerId) {
        const mapContainer = document.getElementById(containerId);
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="map-fallback text-center p-4 bg-light rounded">
                    <i class="fas fa-map-marked-alt fa-3x text-muted mb-3"></i>
                    <h5>Map Unavailable</h5>
                    <p class="text-muted">Unable to load the map. This could be due to network issues or browser restrictions.</p>
                    <button class="btn btn-primary btn-sm" onclick="window.mapManager.retryMapInitialization()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }
    
    retryMapInitialization() {
        this.initializeMap('map');
    }
    
    addIssueMarkers(issues) {
        if (!this.map || !this.mapInitialized) {
            console.log('Map not initialized, skipping markers');
            return;
        }
        
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
        
        console.log('Adding markers for', issues.length, 'issues'); // Debug log
        
        issues.forEach(issue => {
            // Generate random coordinates around user location for demo
            const userLocation = LocationManager.getSavedLocation();
            if (userLocation) {
                const lat = userLocation.lat + (Math.random() - 0.5) * 0.05;
                const lng = userLocation.lng + (Math.random() - 0.5) * 0.05;
                
                const markerColor = this.getMarkerColor(issue.status);
                const markerIcon = this.createCustomIcon(markerColor);
                
                const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(this.map);
                
                const popupContent = `
                    <div class="map-popup" style="min-width: 200px;">
                        <h6 class="mb-2">${issue.title}</h6>
                        <p class="mb-1"><strong>Status:</strong> ${issue.status}</p>
                        <p class="mb-1"><strong>Priority:</strong> ${issue.urgency}</p>
                        <p class="mb-2"><strong>Upvotes:</strong> ${issue.upvotes || 0}</p>
                        <button class="btn btn-primary btn-sm w-100" onclick="viewIssueDetail('${issue.id}')">
                            View Details
                        </button>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                this.markers.push(marker);
            }
        });
        
        // Adjust map bounds to show all markers
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }
    
    createCustomIcon(color) {
        return L.divIcon({
            className: `custom-marker ${color}`,
            html: `
                <div class="marker-pin ${color}">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
            `,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });
    }
    
    getMarkerColor(status) {
        const colors = {
            'Resolved': 'green',
            'In Progress': 'orange',
            'Under Review': 'blue',
            'Critical': 'red',
            'High': 'red',
            'Reported': 'gray'
        };
        return colors[status] || 'gray';
    }
    
    updateMapWithFilteredIssues() {
        if (!this.mapInitialized) return;
        
        const filtered = LocationManager.filterIssuesByDistance(allIssues, APP_CONFIG.MAX_DISTANCE_KM);
        this.addIssueMarkers(filtered);
    }
    
    // Force map resize (useful when map container becomes visible after being hidden)
    resizeMap() {
        if (this.map && this.mapInitialized) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 300);
        }
    }
}

// Distance-based issue filtering
function loadLocalIssues() {
    const userLocation = LocationManager.getSavedLocation();
    if (!userLocation) {
        LocationManager.getUserLocation().then(() => {
            loadLocalIssues();
        });
        return [];
    }
    
    const localIssues = LocationManager.filterIssuesByDistance(allIssues, APP_CONFIG.MAX_DISTANCE_KM)
        .filter(issue => issue.distance >= APP_CONFIG.MIN_DISTANCE_KM)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    return localIssues;
}

// Initialize map when on home page
document.addEventListener('DOMContentLoaded', function() {
    if (getCurrentPage() === 'home') {
        window.mapManager = new MapManager();
        
        // Small delay to ensure DOM is fully rendered
        setTimeout(() => {
            window.mapManager.initializeMap().then(() => {
                console.log('Map initialization complete');
                // Load issues after map is ready
                const localIssues = loadLocalIssues();
                window.mapManager.addIssueMarkers(localIssues);
            }).catch(error => {
                console.error('Map initialization failed:', error);
            });
        }, 500);
    }
});

// Make functions globally available
window.MapManager = MapManager;
window.loadLocalIssues = loadLocalIssues;