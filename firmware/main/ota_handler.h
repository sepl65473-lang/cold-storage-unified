#ifndef OTA_HANDLER_H
#define OTA_HANDLER_H

#include "esp_err.h"

class OtaHandler {
public:
    OtaHandler();
    
    // Parses the OTA MQTT payload, verifies SHA256, and downloads from AWS S3 pre-signed URL
    esp_err_t performUpdate(const char* s3_url, const char* expected_sha256);
};

#endif // OTA_HANDLER_H
