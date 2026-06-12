// ═══════════════════════════════════════════════════════════════════
//  SEPL ColdChain — Dashboard Live Data Push
//  Device: ESP32 + SIM7600 GSM Module
//  Dashboard: portal.smaatechengineering.com/panel/#/dashboard
// ═══════════════════════════════════════════════════════════════════

#define TINY_GSM_MODEM_SIM7600
#include <TinyGsmClient.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

// ─── APN (SIM Card Network) ─────────────────────────────────────────
// Jio:     "jionet"
// Airtel:  "airtelgprs.com"
// BSNL:    "bsnlnet"
// Vi:      "www"
const char APN[]  = "jionet";   // <-- apna SIM ka APN yahan likho
const char USER[] = "";
const char PASS[] = "";

// ─── Backend Server ──────────────────────────────────────────────────
const char SERVER[]   = "portal.smaatechengineering.com";
const char ENDPOINT[] = "/api/v1/readings/ingest";
const int  PORT       = 443;   // HTTPS

// ─── Device & Auth Config ────────────────────────────────────────────
// Yeh Device ID tumhare dashboard mein registered hai
const char DEVICE_ID[] = "c3a1b2d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const char API_KEY[]   = "dev_iot_token_123";

// ─── Hardware Pins (ESP32) ───────────────────────────────────────────
#define MODEM_RX  16   // ESP32 RX ← SIM7600 TX
#define MODEM_TX  17   // ESP32 TX → SIM7600 RX
#define MODEM_PWR 4    // SIM7600 Power Key pin (optional)

// ─── Sensor Pins ─────────────────────────────────────────────────────
#define DOOR_PIN  34   // Door sensor (HIGH = Open, LOW = Closed)
// DHT22 ya DS18B20 use kar rahe ho toh uska library include karo
// Abhi fake sensor values hain — apna sensor code yahan replace karo

// ─── Push Interval ───────────────────────────────────────────────────
const unsigned long PUSH_EVERY_MS = 10000;  // 10 second mein ek baar

// ─────────────────────────────────────────────────────────────────────
HardwareSerial SerialAT(1);
TinyGsm        modem(SerialAT);
TinyGsmClientSecure gsmClient(modem);
HttpClient     http(gsmClient, SERVER, PORT);

unsigned long lastPush = 0;
bool          connected = false;

// ─── Sensor Reading Functions ────────────────────────────────────────
// REPLACE these with your actual sensor library calls

float readTemperature() {
  // Example: DHT22
  // return dht.readTemperature();
  // Example: DS18B20
  // sensors.requestTemperatures();
  // return sensors.getTempCByIndex(0);

  // Placeholder — replace karo apne sensor se:
  return -18.5;
}

float readHumidity() {
  // return dht.readHumidity();

  // Placeholder:
  return 85.2;
}

float readBatteryLevel() {
  // Analog battery voltage divider example:
  // int raw = analogRead(35);
  // float volt = raw * (3.3 / 4095.0) * 2.0;
  // return constrain(map(volt*100, 300, 420, 0, 100), 0, 100);

  return 95.0;  // Placeholder
}

bool readDoorState() {
  return digitalRead(DOOR_PIN) == HIGH;  // HIGH = door open
}

// ─── GSM Connect ─────────────────────────────────────────────────────
bool connectGSM() {
  Serial.println("[GSM] Restarting modem...");
  modem.restart();
  delay(3000);

  Serial.print("[GSM] Waiting for network");
  for (int i = 0; i < 30; i++) {
    if (modem.isNetworkConnected()) { Serial.println(" OK"); break; }
    Serial.print(".");
    delay(1000);
  }

  if (!modem.isNetworkConnected()) {
    Serial.println("[GSM] Network not found!");
    return false;
  }

  Serial.print("[GSM] Connecting GPRS (APN: ");
  Serial.print(APN);
  Serial.print(")...");
  if (!modem.gprsConnect(APN, USER, PASS)) {
    Serial.println(" FAILED");
    return false;
  }
  Serial.println(" OK");
  Serial.print("[GSM] IP: ");
  Serial.println(modem.localIP());
  return true;
}

// ─── Push Data to Dashboard ──────────────────────────────────────────
bool pushData(float temp, float hum, float battery, bool door) {
  // Build JSON body
  StaticJsonDocument<256> doc;
  doc["device_id"]     = DEVICE_ID;
  doc["temperature"]   = temp;
  doc["humidity"]      = hum;
  doc["battery_level"] = battery;
  doc["door_state"]    = door;

  char body[256];
  serializeJson(doc, body);

  Serial.println("[HTTP] Sending data to dashboard...");
  Serial.print("  Body: ");
  Serial.println(body);

  // Set headers
  http.beginRequest();
  http.post(ENDPOINT);
  http.sendHeader("Content-Type", "application/json");
  http.sendHeader("X-API-KEY", API_KEY);
  http.sendHeader("Content-Length", strlen(body));
  http.beginBody();
  http.print(body);
  http.endRequest();

  int statusCode = http.responseStatusCode();
  String response = http.responseBody();

  Serial.print("[HTTP] Status: ");
  Serial.println(statusCode);
  Serial.print("[HTTP] Response: ");
  Serial.println(response);

  return (statusCode == 201 || statusCode == 200);
}

// ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("======================================");
  Serial.println(" SEPL ColdChain — Dashboard Push v1.0");
  Serial.println("======================================");

  pinMode(DOOR_PIN, INPUT_PULLUP);

  // SIM7600 Serial
  SerialAT.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);
  delay(1000);

  // Connect GSM
  connected = connectGSM();
  if (!connected) {
    Serial.println("[ERROR] GSM connection failed. Retrying in loop...");
  }
}

void loop() {
  unsigned long now = millis();

  // Reconnect if disconnected
  if (!connected || !modem.isGprsConnected()) {
    Serial.println("[GSM] Disconnected — reconnecting...");
    connected = connectGSM();
    delay(5000);
    return;
  }

  // Push data every PUSH_EVERY_MS milliseconds
  if (now - lastPush >= PUSH_EVERY_MS) {
    lastPush = now;

    float temp    = readTemperature();
    float hum     = readHumidity();
    float battery = readBatteryLevel();
    bool  door    = readDoorState();

    Serial.println("─────────────────────────────────");
    Serial.print("Temp:     "); Serial.print(temp);    Serial.println(" C");
    Serial.print("Humidity: "); Serial.print(hum);     Serial.println(" %");
    Serial.print("Battery:  "); Serial.print(battery); Serial.println(" %");
    Serial.print("Door:     "); Serial.println(door ? "OPEN" : "CLOSED");

    bool ok = pushData(temp, hum, battery, door);
    if (ok) {
      Serial.println("[OK] Dashboard updated!");
    } else {
      Serial.println("[FAIL] Push failed — will retry next cycle");
      // Force reconnect on next iteration
      connected = false;
    }
  }

  delay(1000);
}
