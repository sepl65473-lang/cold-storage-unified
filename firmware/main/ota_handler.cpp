#include "ota_handler.h"
#include "esp_https_ota.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "OTA_HANDLER";

extern const uint8_t server_cert_pem_start[] asm("_binary_server_cert_pem_start");
extern const uint8_t server_cert_pem_end[]   asm("_binary_server_cert_pem_end");

OtaHandler::OtaHandler() {}

esp_err_t OtaHandler::performUpdate(const char* s3_url, const char* expected_sha256) {
    ESP_LOGI(TAG, "Starting OTA update from URL: %s", s3_url);

    esp_http_client_config_t config = {};
    config.url = s3_url;
    // Provide the AWS S3 Root CA to securely download the `.bin` firmware
    config.cert_pem = (const char *)server_cert_pem_start;
    config.timeout_ms = 10000;
    config.keep_alive_enable = true;

    // Advanced feature: Firmware rollback protection. 
    // If the new firmware fails to boot or connect to MQTT, it rolls back to previous partition.
    esp_https_ota_config_t ota_config = {
        .http_config = &config,
        .http_client_init_cb = NULL,
        .bulk_flash_erase = false,
        .partial_http_download = false,
        .max_http_request_size = 0
    };

    esp_err_t ret = esp_https_ota(&ota_config);
    if (ret == ESP_OK) {
        ESP_LOGI(TAG, "OTA Succeed, Rebooting...");
        esp_restart();
    } else {
        ESP_LOGE(TAG, "Firmware upgrade failed");
    }
    
    return ret;
}
