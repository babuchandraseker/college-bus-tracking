/* =====================================================
   MAPBOX CONFIG
===================================================== */

mapboxgl.accessToken = "pk.eyJ1IjoiYy12aXNobnUiLCJhIjoiY21sMTVnNmxxMDNmcjNrcXRhY3NkY29zcCJ9.hJ5TA_zQGwlGbLGmtg5TGw"

const API_BASE_URL = "http://127.0.0.1:5000/api/bus/1/location";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [80.2707, 13.0827], // lng, lat
  zoom: 13
});

/* =====================================================
   PICKUPS
===================================================== */

const pickups = [
  [80.2707, 13.0827],
  [80.27897, 13.0658],
  [80.2824, 13.0475],
  [80.2650, 13.0350]
];

/* =====================================================
   GET ROAD ROUTE
===================================================== */

async function getRoadRoute(start, end) {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${start[0]},${start[1]};${end[0]},${end[1]}` +
    `?geometries=geojson&access_token=${mapboxgl.accessToken}`;

  const res = await fetch(url);
  const data = await res.json();
  return data.routes[0].geometry.coordinates;
}

/* =====================================================
   BUILD FULL ROUTE
===================================================== */

async function buildFullRoute() {
  let fullRoute = [];
  for (let i = 0; i < pickups.length - 1; i++) {
    const segment = await getRoadRoute(pickups[i], pickups[i + 1]);
    fullRoute.push(...segment);
  }
  return fullRoute;
}

/* =====================================================
   DRAW ROUTE
===================================================== */

function drawRoute(coords) {
  map.addSource("route", {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coords
      }
    }
  });

  map.addLayer({
    id: "route-line",
    type: "line",
    source: "route",
    paint: {
      "line-color": "#EC4899",
      "line-width": 4
    }
  });
}

/* =====================================================
   BUS MARKER
===================================================== */

const busMarker = new mapboxgl.Marker({ color: "#EC4899" });

/* =====================================================
   UPDATE BUS (BACKEND SYNC)
===================================================== */

async function updateBus(route) {
  const res = await fetch(API_BASE_URL);
  const data = await res.json();

  const segmentSize = Math.floor(route.length / (pickups.length - 1));
  const index =
    data.currentStopIndex * segmentSize +
    Math.floor(data.progress * segmentSize);

  busMarker.setLngLat(route[Math.min(index, route.length - 1)]);
}

/* =====================================================
   INIT
===================================================== */

map.on("load", async () => {
  const route = await buildFullRoute();
  drawRoute(route);
  busMarker.setLngLat(route[0]).addTo(map);
  setInterval(() => updateBus(route), 200);
});
