#define TINY_GSM_MODEM_SIM7600
#include <TinyGsmClient.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

// ── Networking Config ────────────────────────────────
const char apn[]      = "airtelgprs.com"; // Change to "jionet" or "internet" as needed
const char gprsUser[] = "";
const char gprsPass[] = "";

const char server[]   = "portal.smaatechengineering.com";
const char resource[] = "/api/v1/readings/batch-ingest";
const int  port       = 80; // 443 for HTTPS if library supports SSL on your module

// ── Device Config ────────────────────────────────────
const char* apiKey    = "dev_iot_token_123";
const char* deviceId  = "d1e2b3c4-a5b6-4c7d-8e9f-0a1b2c3d4e5f"; // USE YOUR REAL ID

// ── Hardware Config ──────────────────────────────────
#define MODEM_TX 17
#define MODEM_RX 16
HardwareSerial SerialAT(1);

TinyGsm modem(SerialAT);
TinyGsmClient client(modem);
HttpClient http(client, server, port);

// ── Batch Configuration ──────────────────────────────
const int BATCH_SIZE = 10;        // Send after 10 readings
const int TICK_INTERVAL = 2000;   // Record every 2 seconds
unsigned long lastTick = 0;

struct Reading {
  float temp;
  float hum;
  unsigned long timestamp;
};

Reading buffer[BATCH_SIZE];
int bufferIndex = 0;

void setup() {
  Serial.begin(115200);
  delay(10);
  
  SerialAT.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);
  
  Serial.println("Starting Modem...");
  modem.restart();
  
  String modemInfo = modem.getModemInfo();
  Serial.print("Modem Info: ");
  Serial.println(modemInfo);

  Serial.println("Connecting to network...");
  if (!modem.waitForNetwork()) {
    Serial.println("Network failed");
    while (true);
  }
  
  Serial.println("Connecting to GPRS...");
  if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
    Serial.println("GPRS failed");
    while (true);
  }
  Serial.println("Ready! Collecting 2s data...");
}

void loop() {
  if (millis() - lastTick >= TICK_INTERVAL) {
    lastTick = millis();
    
    // 1. Record data locally
    float t = random(-50, 20) / 10.0; // Replace with real sensor read
    float h = random(400, 800) / 10.0;
    
    buffer[bufferIndex].temp = t;
    buffer[bufferIndex].hum = h;
    buffer[bufferIndex].timestamp = millis(); 
    bufferIndex++;

    Serial.print("Data Point "); Serial.print(bufferIndex);
    Serial.print("/"); Serial.println(BATCH_SIZE);

    // 2. If buffer full, send batch
    if (bufferIndex >= BATCH_SIZE) {
      sendBatch();
      bufferIndex = 0;
    }
  }
}

void sendBatch() {
  Serial.println("\n>>> PUSHING BATCH TO CLOUD...");

  // Check connection
  if (!modem.isGprsConnected()) {
    Serial.println("Reconnecting GPRS...");
    modem.gprsConnect(apn, gprsUser, gprsPass);
  }

  // Build JSON array
  StaticJsonDocument<2048> doc;
  JsonArray array = doc.to<JsonArray>();

  for (int i = 0; i < BATCH_SIZE; i++) {
    JsonObject obj = array.createNestedObject();
    obj["device_id"] = deviceId;
    obj["temperature"] = buffer[i].temp;
    obj["humidity"] = buffer[i].hum;
    obj["compressor_state"] = true;
    // time can be omitted to use server time, or use a sync'd RTC time
  }

  String jsonBody;
  serializeJson(doc, jsonBody);

  // Send request
  http.beginRequest();
  http.post(resource);
  http.sendHeader("Content-Type", "application/json");
  http.sendHeader("X-API-KEY", apiKey);
  http.sendHeader("Content-Length", jsonBody.length());
  http.beginBody();
  http.print(jsonBody);
  http.endRequest();

  int status = http.responseStatusCode();
  String response = http.responseBody();

  Serial.print("Batch Status: "); Serial.println(status);
  Serial.print("Server Msg: "); Serial.println(response);
  
  if (status == 201) {
    Serial.println("✅ BATCH SUCCESSFUL");
  } else {
    Serial.println("❌ BATCH FAILED - Consider implement SPIFFS backup here");
  }
}
