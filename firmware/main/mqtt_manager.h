#ifndef MQTT_MANAGER_H
#define MQTT_MANAGER_H

#include <stddef.h>
#include <stdint.h>
#include "esp_err.h"
#include "sensors.h"

class MqttManager {
public:
    MqttManager();
    void init();
    void publishTelemetry(const SensorData& data);
    void publishLwt();
    
private:
    static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data);
    void handleIncomingCommand(const char* topic, const char* payload, int len);
    
    // Abstracted handle for the ESP MQTT Client
    void* clientHandle;
};

#endif // MQTT_MANAGER_H
