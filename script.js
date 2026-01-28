// Initialize map centered on Chennai area
const map = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    dragging: true
}).setView([13.0827, 80.2707], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Route colors matching the design
const routeColors = {
    1: '#EC4899', // Pink
    2: '#A855F7', // Purple
    3: '#6B7280', // Gray
    4: '#F59E0B', // Orange
    5: '#10B981', // Green
    6: '#3B82F6'  // Blue
};

// Custom bus icon creator
const createBusIcon = (color) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="bus-marker" style="background-color: ${color};">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <rect x="4" y="7" width="16" height="10" rx="2"/>
                <circle cx="9" cy="18" r="1"/>
                <circle cx="15" cy="18" r="1"/>
            </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
};

// Sample bus locations across Chennai
const busData = [
    { id: 1, route: 1, lat: 13.0475, lng: 80.2824 },
    { id: 2, route: 2, lat: 13.0569, lng: 80.2425 },
    { id: 3, route: 3, lat: 13.0878, lng: 80.2785 },
    { id: 4, route: 4, lat: 13.0418, lng: 80.2341 },
    { id: 5, route: 5, lat: 13.0122, lng: 80.2329 },
    { id: 6, route: 1, lat: 13.0658, lng: 80.2497 },
    { id: 7, route: 2, lat: 13.0281, lng: 80.2571 },
    { id: 8, route: 5, lat: 13.0195, lng: 80.2644 },
    { id: 9, route: 5, lat: 13.0765, lng: 80.2102 },
    { id: 10, route: 3, lat: 13.1147, lng: 80.2834 }
];

// Route path definitions
const routePaths = {
    1: [
        [13.0827, 80.2707],
        [13.0658, 80.2497],
        [13.0475, 80.2824],
        [13.0350, 80.2650]
    ],
    2: [
        [13.0900, 80.2300],
        [13.0569, 80.2425],
        [13.0281, 80.2571],
        [13.0150, 80.2700]
    ],
    3: [
        [13.1200, 80.2900],
        [13.1147, 80.2834],
        [13.0878, 80.2785],
        [13.0650, 80.2800]
    ],
    4: [
        [13.0827, 80.2300],
        [13.0600, 80.2200],
        [13.0418, 80.2341],
        [13.0200, 80.2500]
    ],
    5: [
        [13.1000, 80.2100],
        [13.0765, 80.2102],
        [13.0500, 80.2200],
        [13.0195, 80.2644],
        [13.0122, 80.2329]
    ],
    6: [
        [13.0500, 80.2900],
        [13.0400, 80.2800],
        [13.0300, 80.2700]
    ]
};

// State management
const state = {
    busMarkers: new Map(),
    routePolylines: new Map(),
    currentFilter: null,
    busLocations: [...busData]
};

// Initialize bus markers
function initializeBusMarkers() {
    state.busLocations.forEach(bus => {
        const color = routeColors[bus.route];
        const marker = L.marker([bus.lat, bus.lng], {
            icon: createBusIcon(color)
        }).addTo(map);
        
        marker.bindPopup(`<b>Bus ${bus.id}</b><br>Route ${bus.route}<br>Status: Active`);
        
        state.busMarkers.set(bus.id, {
            marker: marker,
            route: bus.route,
            data: bus
        });
    });
}

// Initialize route polylines
function initializeRoutePolylines() {
    Object.keys(routePaths).forEach(routeId => {
        const routeNum = parseInt(routeId);
        const polyline = L.polyline(routePaths[routeNum], {
            color: routeColors[routeNum],
            weight: 4,
            opacity: 0.7,
            smoothFactor: 1
        }).addTo(map);
        
        state.routePolylines.set(routeNum, polyline);
    });
}

// Filter buses and routes by route number
function filterByRoute(routeNum) {
    state.currentFilter = routeNum;
    
    // Filter bus markers
    state.busMarkers.forEach((busObj, busId) => {
        if (routeNum === null || busObj.route === routeNum) {
            busObj.marker.addTo(map);
        } else {
            map.removeLayer(busObj.marker);
        }
    });
    
    // Filter route polylines
    state.routePolylines.forEach((polyline, route) => {
        if (routeNum === null || route === routeNum) {
            polyline.addTo(map);
        } else {
            map.removeLayer(polyline);
        }
    });
    
    updateStatsCards();
}

// Update stats cards based on visible buses
function updateStatsCards() {
    let activeBusCount = 0;
    const activeRoutes = new Set();
    
    state.busMarkers.forEach((busObj) => {
        if (state.currentFilter === null || busObj.route === state.currentFilter) {
            activeBusCount++;
            activeRoutes.add(busObj.route);
        }
    });
    
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 2) {
        animateStatNumber(statNumbers[0], activeBusCount);
        animateStatNumber(statNumbers[1], activeRoutes.size);
    }
}

// Animate stat number changes
function animateStatNumber(element, target) {
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;
    
    const duration = 500;
    const steps = 20;
    const increment = (target - current) / steps;
    const stepDuration = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
        step++;
        if (step >= steps) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current + increment * step);
        }
    }, stepDuration);
}

// Route chip click handlers
function setupRouteChips() {
    document.querySelectorAll('.route-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const routeNum = parseInt(this.dataset.route);
            
            // Update active chip
            document.querySelectorAll('.route-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            // Filter map by route
            filterByRoute(routeNum);
        });
    });
}

// Bus item click handlers in sidebar
function setupBusItemClicks() {
    document.querySelectorAll('.bus-item').forEach(item => {
        item.addEventListener('click', function() {
            const busNumber = parseInt(this.dataset.bus);
            
            // Visual feedback in sidebar
            document.querySelectorAll('.bus-item').forEach(i => i.style.background = '');
            this.style.background = 'var(--color-background)';
            
            // Find the first matching bus marker
            let targetBus = null;
            state.busMarkers.forEach((busObj, id) => {
                if (busObj.route === busNumber && !targetBus) {
                    targetBus = busObj;
                }
            });
            
            if (targetBus) {
                // Smooth zoom and pan to bus
                map.flyTo([targetBus.data.lat, targetBus.data.lng], 15, {
                    duration: 1,
                    easeLinearity: 0.25
                });
                
                // Open popup after animation
                setTimeout(() => {
                    targetBus.marker.openPopup();
                }, 1000);
            }
        });
    });
}

// Search functionality
function setupSearch() {
    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        document.querySelectorAll('.bus-item').forEach(item => {
            const busName = item.querySelector('.bus-name').textContent.toLowerCase();
            if (busName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// Refresh button functionality
function setupRefreshButton() {
    const refreshBtn = document.querySelector('.refresh-btn');
    refreshBtn.addEventListener('click', function() {
        // Animate button
        this.style.transition = 'transform 0.5s ease';
        this.style.transform = 'rotate(360deg)';
        
        setTimeout(() => {
            this.style.transform = 'rotate(0deg)';
        }, 500);
        
        // Simulate bus position updates
        refreshBusPositions();
    });
}

// Simulate refreshing bus positions
function refreshBusPositions() {
    state.busLocations.forEach((bus, index) => {
        // Random small movement (max ±0.005 degrees)
        const latChange = (Math.random() - 0.5) * 0.01;
        const lngChange = (Math.random() - 0.5) * 0.01;
        
        bus.lat += latChange;
        bus.lng += lngChange;
        
        // Update marker position
        const busObj = state.busMarkers.get(bus.id);
        if (busObj) {
            busObj.marker.setLatLng([bus.lat, bus.lng]);
            busObj.data = bus;
        }
    });
}

// Route dropdown handler
function setupRouteDropdown() {
    const dropdown = document.querySelector('.route-dropdown');
    dropdown.addEventListener('change', function(e) {
        const selectedValue = e.target.value;
        
        if (selectedValue === 'All Routes') {
            filterByRoute(null);
            document.querySelectorAll('.route-chip').forEach(c => c.classList.remove('active'));
        } else {
            const routeNum = parseInt(selectedValue.replace('Route ', ''));
            filterByRoute(routeNum);
            
            // Update active chip
            document.querySelectorAll('.route-chip').forEach(chip => {
                if (parseInt(chip.dataset.route) === routeNum) {
                    chip.classList.add('active');
                } else {
                    chip.classList.remove('active');
                }
            });
        }
    });
}

// Initial stats animation on load
function animateStatsOnLoad() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const target = parseInt(stat.textContent);
        stat.textContent = '0';
        
        setTimeout(() => {
            animateStatNumber(stat, target);
        }, 300);
    });
}

// Initialize application
function init() {
    initializeBusMarkers();
    initializeRoutePolylines();
    setupRouteChips();
    setupBusItemClicks();
    setupSearch();
    setupRefreshButton();
    setupRouteDropdown();
    updateStatsCards();
}
setTimeout(() => {
        map.invalidateSize();
    }, 300);

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Animate stats on window load
window.addEventListener('load', animateStatsOnLoad);