import paho.mqtt.client as mqtt
import time

def on_message(client, userdata, msg):
    print(f"TOPIC: {msg.topic}")
    print(f"PAYLOAD: {msg.payload.decode()}")

client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
client.on_message = on_message

try:
    print("Connecting to mosquitto...")
    client.connect("mosquitto", 1883, 60)
    client.subscribe("coldstorage/#")
    print("Subscribed to coldstorage/#. Waiting for messages (10s)...")
    client.loop_start()
    time.sleep(10)
    client.loop_stop()
    print("Test finished.")
except Exception as e:
    print(f"Error: {e}")
finally:
    client.disconnect()
