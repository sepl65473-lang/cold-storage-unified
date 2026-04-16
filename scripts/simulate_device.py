import paho.mqtt.client as mqtt
import json
import time
import random
import uuid
import argparse
from datetime import datetime, timezone

# Global state for simulation
state = {
    "compressor_on": True,
    "door_open": False,
    "target_temp": -2.0
}

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker!")
        # Subscribe to command topic
        topic = f"coldstorage/{userdata['org_id']}/{userdata['device_id']}/commands"
        client.subscribe(topic)
        print(f"Subscribed to commands: {topic}")
    else:
        print(f"Failed to connect, return code {rc}\n")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        cmd_type = payload.get("type")
        print(f"\n[COMMAND RECEIVED] {cmd_type}: {payload}")
        
        if cmd_type == "toggle_cooling":
            state["compressor_on"] = not state["compressor_on"]
            print(f"Cooling Toggled. New state: {'ON' if state['compressor_on'] else 'OFF'}")
        elif cmd_type == "reboot":
            print("System Rebooting...")
            time.sleep(2)
            print("System Online.")
        elif cmd_type == "sync_telemetry":
             print("Manual sync triggered.")
             # Logic to send immediate update could go here
             
    except Exception as e:
        print(f"Error processing command: {e}")

def simulate_data(org_id, device_id):
    userdata = {"org_id": org_id, "device_id": device_id}
    client = mqtt.Client(userdata=userdata)
    client.on_connect = on_connect
    client.on_message = on_message
    
    telemetry_topic = f"coldstorage/{org_id}/{device_id}/telemetry"
    
    try:
        client.connect("localhost", 1883, 60)
        client.loop_start()
        
        print(f"Starting simulation for device: {device_id}")
        
        while True:
            # Simple physics simulation
            current_temp = state["target_temp"] + random.uniform(-0.5, 0.5)
            if not state["compressor_on"]:
                 current_temp += 2.0 # Heat up if off
            
            payload = {
                "device_id": device_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "temperature": round(current_temp, 2),
                "humidity": round(random.uniform(60.0, 70.0), 2),
                "battery_level": round(random.uniform(85.0, 90.0), 2),
                "solar_power_watts": round(random.uniform(150.0, 250.0), 2),
                "location_lat": round(28.7041 + random.uniform(-0.001, 0.001), 6), # Jitter around Delhi
                "location_lng": round(77.1025 + random.uniform(-0.001, 0.001), 6),
                "compressor_state": state["compressor_on"], # Proper boolean
                "door_state": state["door_open"],          # Proper boolean
                "cooling_cycle_duration": random.randint(30, 50)
            }
            
            client.publish(telemetry_topic, json.dumps(payload))
            print(f"Published Telemetry: Temp={payload['temperature']}°C, Compressor={'ON' if payload['compressor_state'] else 'OFF'}", end='\r')
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\nSimulation stopped.")
    except Exception as e:
        print(f"\nError: {e}")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate Solar Cold Storage Device Telemetry")
    parser.add_argument("--org_id", required=True, help="The UUID of the organization")
    parser.add_argument("--device_id", required=True, help="The UUID of the device to simulate")
    args = parser.parse_args()
    
    simulate_data(args.org_id, args.device_id)
