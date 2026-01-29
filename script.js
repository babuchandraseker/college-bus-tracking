const API_BASE_URL = "http://127.0.0.1:5000/api/bus";

/* =========================
   MAP INITIALIZATION
========================= */

const map = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    dragging: true
}).setView([13.0827, 80.2707], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

/* =========================
   ROUTE COLORS
========================= */

const routeColors = {
    1: '#EC4899'
};

/* =========================
   ROUTE STOPS (PICKUPS)
========================= */

const routeStops = {
    1: [
        { name: "Pickup 1", lat: 13.0827, lng: 80.2707 },
        { name: "Pickup 2", lat: 13.0658, lng: 80.2497 },
        { name: "Pickup 3", lat: 13.0475, lng: 80.28679 },
        { name: "Pickup 4", lat: 13.0350, lng: 80.2650 }
    ]
};

/* =========================
   ROUTE PATH (POLYLINE)
========================= */

const routePaths = {
    1: routeStops[1].map(p => [p.lat, p.lng])
};

/* =========================
   CUSTOM BUS ICON
========================= */

const createBusIcon = (color) => L.divIcon({
    className: 'custom-marker',
    html: `
        <div class="bus-marker" style="background:${color}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <rect x="4" y="7" width="16" height="10" rx="2"/>
                <circle cx="9" cy="18" r="1"/>
                <circle cx="15" cy="18" r="1"/>
            </svg>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

/* =========================
   STATE
========================= */

const state = {
    busMarker: null,
    routeLine: null
};

/* =========================
   INITIALIZE MAP ELEMENTS
========================= */

function initMapElements() {
    // Route line
    state.routeLine = L.polyline(routePaths[1], {
        color: routeColors[1],
        weight: 4,
        opacity: 0.7
    }).addTo(map);

    // Bus marker (start at pickup 1)
    const start = routeStops[1][0];
    state.busMarker = L.marker([start.lat, start.lng], {
        icon: createBusIcon(routeColors[1])
    }).addTo(map);
}

/* =========================
   GEO HELPERS
========================= */

// Distance between 2 lat/lng points (km)
function distanceKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;

    const sa = Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * Math.PI / 180) *
        Math.cos(b.lat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
}

// Interpolate position
function interpolate(a, b, t) {
    return {
        lat: a.lat + (b.lat - a.lat) * t,
        lng: a.lng + (b.lng - a.lng) * t
    };
}

// ETA formatter
function formatETA(hours) {
    const totalSeconds = Math.max(0, Math.floor(hours * 3600));
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min} min ${sec} sec`;
}

/* =========================
   FETCH + MOVE BUS
========================= */

async function updateBusPosition() {
    try {
        const res = await fetch(`${API_BASE_URL}/1/location`);
        const data = await res.json();

        const stops = routeStops[1];
        const start = stops[data.currentStopIndex];
        const end = stops[data.nextStopIndex];

        // Move bus step-by-step
        const pos = interpolate(start, end, data.progress);
        state.busMarker.setLatLng([pos.lat, pos.lng]);

        // Distance + ETA
        const totalDist = distanceKm(start, end);
        const remainingDist = totalDist * (1 - data.progress);
        const etaHours = remainingDist / data.speed;

        state.busMarker.bindPopup(`
            <b>Bus 1</b><br>
            Route 1<br>
            From: ${start.name}<br>
            To: ${end.name}<br>
            Speed: ${data.speed} km/h<br>
            ETA: ${formatETA(etaHours)}
        `);
    } catch (e) {
        console.error("Bus update failed:", e);
    }
}

/* =========================
   INIT
========================= */

function init() {
    initMapElements();
    updateBusPosition();
}

document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();

/* =========================
   REAL-TIME LOOP
========================= */

setInterval(updateBusPosition, 200);
