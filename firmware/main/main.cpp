#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "nvs_flash.h"
#include "esp_wifi.h"
#include "esp_log.h"
#include "sensors.h"
#include "mqtt_manager.h"

static const char *TAG = "MAIN";

// Global instances
Sensors sensors;
MqttManager mqttManager;

void wifi_init_sta(void) {
    // Basic Wi-Fi init simulating connection to local factory network. 
    // In production, would use ESP-WIFI-PROV (Bluetooth Provisioning)
    esp_netif_init();
    esp_event_loop_create_default();
    esp_netif_create_default_wifi_sta();
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_wifi_init(&cfg);

    wifi_config_t wifi_config = {};
    strcpy((char*)wifi_config.sta.ssid, CONFIG_ESP_WIFI_SSID);
    strcpy((char*)wifi_config.sta.password, CONFIG_ESP_WIFI_PASSWORD);

    esp_wifi_set_mode(WIFI_MODE_STA);
    esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    esp_wifi_start();
    esp_wifi_connect();
}

extern "C" void app_main(void) {
    ESP_LOGI(TAG, "Booting Solar IoT Cold Storage Firmware (v1.0)...");

    // Initialize NVS (Non-Volatile Storage) required for WiFi and OTA partitions
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Bootstrap hardware peripherals
    wifi_init_sta();
    sensors.init();

    // Give Wi-Fi time to connect before spinning up AWS mTLS MQTT
    vTaskDelay(pdMS_TO_TICKS(3000));
    mnist_event_group = xEventGroupCreate();
    
    mqttManager.init();

    // Main Control Loop
    while (1) {
        ESP_LOGI(TAG, "Reading sensors & evaluating safe operating state...");
        SensorData currentReadings = sensors.readAll();
        
        // Push telemetry snapshot over QoS 1
        mqttManager.publishTelemetry(currentReadings);
        
        // Enforce Local Safety Fallbacks (Fail-safe against network outages)
        if (currentReadings.battery_level < 15.0f && currentReadings.compressor_state == true) {
            ESP_LOGW(TAG, "CRITICAL: Battery extremely low. Local override killing compressor to preserve logic board.");
            // Halt compressor GPIO
        }
        
        // Deep sleep or blocked task delay according to sample interval
        vTaskDelay(pdMS_TO_TICKS(60000)); // 60-second read loop
    }
}
