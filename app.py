from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import time
import math

app = Flask(__name__)
CORS(app)

# ===============================
# ROUTE 1 PICKUPS
# ===============================
ROUTE_1_STOPS = [
    {"lat": 13.0827, "lng": 80.2707},  # Pickup 1
    {"lat": 13.0658, "lng": 80.27897},  # Pickup 2
    {"lat": 13.0475, "lng": 80.2824},  # Pickup 3
    {"lat": 13.0350, "lng": 80.5000}   # Pickup 4
]

# ===============================
# BUS STATE (PERSISTENT)
# ===============================
bus_state = {
    "current_stop": 0,
    "progress": 0.0,
    "speed_kmph": 30,        # Bus speed
    "last_update": time.time()
}

# ===============================
# DISTANCE CALCULATION (KM)
# ===============================
def haversine_km(a, b):
    R = 6371
    dlat = math.radians(b["lat"] - a["lat"])
    dlng = math.radians(b["lng"] - a["lng"])

    sa = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(a["lat"]))
        * math.cos(math.radians(b["lat"]))
        * math.sin(dlng / 2) ** 2
    )
    return 2 * R * math.atan2(math.sqrt(sa), math.sqrt(1 - sa))


# ===============================
# API ENDPOINT
# ===============================
@app.route("/api/bus/1/location", methods=["GET"])
def get_bus_location():
    now = time.time()
    delta_seconds = now - bus_state["last_update"]
    bus_state["last_update"] = now

    current = ROUTE_1_STOPS[bus_state["current_stop"]]
    next_stop = ROUTE_1_STOPS[bus_state["current_stop"] + 1]

    # Distance between pickups
    segment_distance = haversine_km(current, next_stop)

    # Distance covered in this time slice
    distance_covered = (bus_state["speed_kmph"] / 3600) * delta_seconds

    # Convert to progress (0 → 1)
    progress_increment = distance_covered / segment_distance
    bus_state["progress"] += progress_increment

    # Reached next pickup
    if bus_state["progress"] >= 1:
        bus_state["progress"] = 0
        bus_state["current_stop"] += 1

        # Loop back after last pickup
        if bus_state["current_stop"] >= len(ROUTE_1_STOPS) - 1:
            bus_state["current_stop"] = 0

    return jsonify({
        "route": 1,
        "currentStopIndex": bus_state["current_stop"],
        "nextStopIndex": bus_state["current_stop"] + 1,
        "progress": round(bus_state["progress"], 4),
        "speed": bus_state["speed_kmph"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })


# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
