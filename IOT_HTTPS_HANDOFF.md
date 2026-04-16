# 🛰️ IoT Engineering Handoff: HTTPS Data Ingestion

This document provides the technical specification for pushing real-time telemetry data from IoT devices/machines to the SEPL Cloud Platform via HTTPS.

---

## 🔗 Endpoint Details

- **URL (Secure)**: `https://portal.smaatechengineering.com/api/v1/readings/ingest`
- **URL (HTTP - Legacy/Low-Power)**: `http://portal.smaatechengineering.com/api/v1/readings/ingest`
- **Method**: `POST`
- **Content-Type**: `application/json`

## 🔐 Authentication
All requests MUST include a security token in the request headers to be accepted by the server.

- **Header Name**: `X-API-KEY`
- **Header Value**: `dev_iot_token_123` *(Contact administrator for production keys)*

---

The following fields are supported. `device_id` is mandatory.

> [!CAUTION]
> **DEVICE_ID ERROR (404 Not Found)**: 
> You MUST use a real Device ID from the Admin Panel. Using a placeholder or dummy UUID will result in a `404 Not Found` error.

| Field | Type | Description |
| :--- | :--- | :--- |
| `device_id` | `UUID` | **Mandatory.** The unique ID of the machine/device. |
| `temperature` | `float` | Temperature in Celsius (°C). |
| `humidity` | `float` | Relative Humidity percentage (%). |
| `battery_level` | `float` | Battery percentage (0-100). |
| `solar_power_watts` | `float` | Current solar power generation in Watts. |
| `compressor_state` | `boolean` | `true` if Compressor is ON, `false` if OFF. |
| `door_state` | `boolean` | `true` if Door is OPEN, `false` if CLOSED. |
| `cooling_cycle_duration` | `int` | Duration of the last cooling cycle in seconds. |
| `time` | `ISO8601` | *Optional.* Timestamp. If omitted, server uses current time. |

### Sample Payload
```json
{
  "device_id": "550e8400-e29b-41d4-a716-446655440000",
  "temperature": -4.2,
  "humidity": 62.5,
  "battery_level": 88.0,
  "solar_power_watts": 145.2,
  "compressor_state": true,
  "door_state": false,
  "cooling_cycle_duration": 450
}
```

---

## 💻 Testing Examples

### 1. Using cURL (Command Line)
```bash
curl -X POST "https://portal.smaatechengineering.com/api/v1/readings/ingest" \
     -H "Content-Type: application/json" \
     -H "X-API-KEY: dev_iot_token_123" \
     -d '{
       "device_id": "YOUR_DEVICE_UUID_HERE",
       "temperature": -2.5,
       "humidity": 60.0
     }'
```

### 2. Using Python
```python
import requests

url = "https://portal.smaatechengineering.com/api/v1/readings/ingest"
headers = {
    "X-API-KEY": "dev_iot_token_123",
    "Content-Type": "application/json"
}
data = {
    "device_id": "YOUR_DEVICE_UUID_HERE",
    "temperature": -3.1,
    "humidity": 58.2,
    "compressor_state": True
}

response = requests.post(url, json=data, headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
```

---

## 🚦 Server Responses

- **`201 Created`**: Data successfully saved to the platform.
- **`403 Forbidden`**: Invalid or missing `X-API-KEY`.
- **`404 Not Found`**: The `device_id` provided is not registered in the system.
- **`422 Unprocessable Entity`**: Invalid JSON format or missing required fields.

---

## 🛠️ Arduino / ESP32 Test Code   
Wah! Bahut badhiya. Agar aap khud test chip (ESP32 ya Arduino) par kaam kar rahe hain, toh main aapko ek ready-made code (Sketch) bana kar deta hoon.

Aapko bas ye code copy karke apne Arduino IDE mein paste karna hai aur Upload karna hai.

Aapko kya karna hai (Steps):
Niche diye gaye code ko copy karein.
Code mein jahan YOUR_WIFI_NAME aur YOUR_WIFI_PASSWORD likha hai, wahan apne WiFi ki details dalein.
Chip ko laptop se connect karein aur Upload button dabayein.

If you are using an ESP32 or ESP8266 chip to push data, you can use the following code for testing. It sends random temperature and humidity data every 10 seconds.

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// 1. Set your WiFi credentials here
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// 2. Server & Device Details
const char* serverUrl = "https://portal.smaatechengineering.com/api/v1/readings/ingest";
const char* apiKey = "dev_iot_token_123";
const char* deviceId = "d1e2b3c4-a5b6-4c7d-8e9f-0a1b2c3d4e5f"; // Real Test Machine ID

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-KEY", apiKey);

    // Generate random test data
    float temp = random(-100, 50) / 10.0;    // Random temp between -10.0 and 5.0
    float humidity = random(400, 800) / 10.0; // Random humidity between 40.0 and 80.0

    // Construct JSON Payload
    String jsonPayload = "{\"device_id\":\"" + String(deviceId) + "\",";
    jsonPayload += "\"temperature\":" + String(temp) + ",";
    jsonPayload += "\"humidity\":" + String(humidity) + ",";
    jsonPayload += "\"compressor_state\":true}";

    Serial.print("Pushing data... ");
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("Success! Response Code: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error! Code: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }
  delay(10000); // Wait 10 seconds before next push
}
```

ska result kahan dikhega?
Arduino IDE Serial Monitor: Upload ke baad Serial Monitor (Ctrl+Shift+M) kholein, wahan aapko Success! Response Code: 201 dikhega.
Admin Panel: Apna Admin Panel dashboard kholein, wahan aap dekhenge ki Temperature aur Charts har 10 second mein apne aap change ho rahe hain!
Jo image aapne bheji hai (sketch_apr12b.ino), usme ye pura code paste kar dijiye.