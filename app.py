from flask import Flask, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

# =====================================
# PICKUP CONFIG
# =====================================

TOTAL_STOPS = 4  # Pickup 1 → 4

# =====================================
# BUS STATE
# =====================================

bus_state = {
    "current_stop": 0,
    "progress": 0.0,
    "speed_kmph": 30,
    "last_update": time.time()
}

# =====================================
# API ENDPOINT
# =====================================

@app.route("/api/bus/1/location", methods=["GET"])
def get_bus_location():
    now = time.time()
    delta = now - bus_state["last_update"]
    bus_state["last_update"] = now

    # Progress increment (controls speed visually)
    bus_state["progress"] += delta * 0.05

    if bus_state["progress"] >= 1:
        bus_state["progress"] = 0
        bus_state["current_stop"] += 1

        # Loop back after last pickup
        if bus_state["current_stop"] >= TOTAL_STOPS - 1:
            bus_state["current_stop"] = 0

    return jsonify({
        "route": 1,
        "currentStopIndex": bus_state["current_stop"],
        "nextStopIndex": bus_state["current_stop"] + 1,
        "progress": round(bus_state["progress"], 3),
        "speed": bus_state["speed_kmph"],
        "timestamp": time.time()
    })

# =====================================
# RUN SERVER
# =====================================

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
