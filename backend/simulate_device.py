import paho.mqtt.client as mqtt
import json
import time
import random
import uuid
import argparse
from datetime import datetime, timezone

# Broker configuration
BROKER = "mosquitto"
PORT = 1883

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("Connected to MQTT Broker!")
        # Subscribe to command topics
        topic = f"coldstorage/{userdata['org_id']}/{userdata['device_id']}/commands"
        client.subscribe(topic, qos=1)
        print(f"Subscribed to: {topic}")
    else:
        print(f"Failed to connect, return code {rc}\n")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print(f"\n[COMMAND RECEIVED] {payload['type']} (ID: {payload.get('command_id')})")
        
        # Simulate processing time
        time.sleep(1)
        
        # Send Acknowledgement
        ack_topic = f"coldstorage/{userdata['org_id']}/{userdata['device_id']}/commands/ack"
        ack_payload = {
            "command_id": payload.get("command_id"),
            "status": "success",
            "message": f"Command {payload['type']} executed successfully by device simulator",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        client.publish(ack_topic, json.dumps(ack_payload))
        print(f"Sent Ack to {ack_topic}")
        
    except Exception as e:
        print(f"Error processing command: {e}")

def simulate_data(org_id, device_id):
    # Store IDs in userdata for callbacks
    userdata = {"org_id": org_id, "device_id": device_id}
    client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2, userdata=userdata, protocol=mqtt.MQTTv5)
    client.on_connect = on_connect
    client.on_message = on_message
    
    topic = f"coldstorage/{org_id}/{device_id}/telemetry"
    
    try:
        client.connect(BROKER, PORT, 60)
        client.loop_start()
        
        print(f"Starting simulation for device: {device_id}")
        
        while True:
            # Generate dummy data
            payload = {
                "device_id": device_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "temperature": round(random.uniform(-5.0, 5.0), 2),
                "humidity": round(random.uniform(40.0, 80.0), 2),
                "battery_level": round(random.uniform(70.0, 100.0), 2),
                "solar_power_watts": round(random.uniform(0.0, 300.0), 2),
                "compressor_state": "ON" if random.random() > 0.5 else "OFF",
                "door_state": "CLOSED" if random.random() > 0.1 else "OPEN",
                "cooling_cycle_duration": random.randint(10, 60)
            }
            
            client.publish(topic, json.dumps(payload))
            print(f"Published Telemetry: {payload['temperature']}°C, {payload['battery_level']}%")
            time.sleep(5)  # Send data every 5 seconds
            
    except KeyboardInterrupt:
        print("Simulation stopped.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate Solar Cold Storage Device Telemetry")
    parser.add_argument("--org_id", required=True, help="The UUID of the organization")
    parser.add_argument("--device_id", required=True, help="The UUID of the device to simulate")
    args = parser.parse_args()
    
    simulate_data(args.org_id, args.device_id)
