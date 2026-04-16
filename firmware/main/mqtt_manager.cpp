#include "mqtt_manager.h"
#include "mqtt_client.h"
#include "esp_log.h"
#include <string.h>
#include <stdio.h>

static const char *TAG = "MQTT_MANAGER";

extern const uint8_t root_ca_pem_start[] asm("_binary_root_ca_pem_start");
extern const uint8_t root_ca_pem_end[]   asm("_binary_root_ca_pem_end");
extern const uint8_t device_cert_start[] asm("_binary_device_cert_pem_crt_start");
extern const uint8_t device_cert_end[]   asm("_binary_device_cert_pem_crt_end");
extern const uint8_t private_key_start[] asm("_binary_private_key_pem_key_start");
extern const uint8_t private_key_end[]   asm("_binary_private_key_pem_key_end");

MqttManager::MqttManager() : clientHandle(nullptr) {}

void MqttManager::mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data) {
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)event_data;
    MqttManager *mgr = (MqttManager*)handler_args;
    
    switch ((esp_mqtt_event_id_t)event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "MQTT_EVENT_CONNECTED");
            // Subscribe to OTA topic broadcasted by Celery OTAPublisher
            esp_mqtt_client_subscribe(event->client, "coldstorage/+/+/ota", 1);
            // Subscribe to device-specific remote commands
            esp_mqtt_client_subscribe(event->client, "coldstorage/+/+/command", 1);
            break;
        case MQTT_EVENT_DISCONNECTED:
            ESP_LOGI(TAG, "MQTT_EVENT_DISCONNECTED");
            break;
        case MQTT_EVENT_DATA:
            ESP_LOGI(TAG, "MQTT_EVENT_DATA");
            mgr->handleIncomingCommand(event->topic, event->data, event->data_len);
            break;
        default:
            break;
    }
}

void MqttManager::handleIncomingCommand(const char* topic, const char* payload, int len) {
    if (strstr(topic, "/ota") != nullptr) {
        ESP_LOGI(TAG, "Incoming OTA payload received!");
        // Here we would parse S3 pre-signed URL and SHA256 from JSON payload and trigger ota_handler
    } else if (strstr(topic, "/command") != nullptr) {
        ESP_LOGI(TAG, "Incoming Device Command received!");
        // e.g. toggle compressor overriding thermostat, force reboot
    }
}

void MqttManager::init() {
    esp_mqtt_client_config_t mqtt_cfg = {};
    
    mqtt_cfg.broker.address.uri = CONFIG_MQTT_BROKER_URL;
    mqtt_cfg.credentials.client_id = CONFIG_MQTT_CLIENT_ID;
    
    // AWS IoT Core mTLS certificates (X.509)
    mqtt_cfg.broker.verification.certificate = (const char *)root_ca_pem_start;
    mqtt_cfg.credentials.authentication.certificate = (const char *)device_cert_start;
    mqtt_cfg.credentials.authentication.key = (const char *)private_key_start;

    // LWT Support -> triggers AlertEvaluator backend offline status
    mqtt_cfg.session.last_will.topic = "coldstorage/ORGN/cs_esp32_001/lwt";
    mqtt_cfg.session.last_will.msg = "{\"status\":\"offline\"}";
    mqtt_cfg.session.last_will.msg_len = strlen(mqtt_cfg.session.last_will.msg);
    mqtt_cfg.session.last_will.qos = 1;
    mqtt_cfg.session.last_will.retain = 1;

    esp_mqtt_client_handle_t client = esp_mqtt_client_init(&mqtt_cfg);
    clientHandle = client;
    
    esp_mqtt_client_register_event(client, MQTT_EVENT_ANY, mqtt_event_handler, this);
    esp_mqtt_client_start(client);
}

void MqttManager::publishTelemetry(const SensorData& data) {
    if (clientHandle == nullptr) return;
    
    char jsonPayload[256];
    snprintf(jsonPayload, sizeof(jsonPayload), 
        "{\"temperature\":%.2f,\"humidity\":%.2f,\"battery_level\":%.2f,\"solar_power_watts\":%.2f,\"compressor_state\":%s,\"door_state\":%s,\"cooling_cycle_duration\":%d}",
        data.temperature, data.humidity, data.battery_level, data.solar_power_watts, 
        data.compressor_state ? "true" : "false", 
        data.door_state ? "true" : "false",
        data.cooling_cycle_duration
    );

    // QoS 1 guarantees delivery to AWS IoT (which routes to SQS / Ingest Worker)
    esp_mqtt_client_publish((esp_mqtt_client_handle_t)clientHandle, "coldstorage/ORGN/cs_esp32_001/telemetry", jsonPayload, 0, 1, 0);
}
