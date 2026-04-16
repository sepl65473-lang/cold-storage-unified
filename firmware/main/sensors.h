#ifndef SENSORS_H
#define SENSORS_H

#include <stdint.h>
#include <stdbool.h>

typedef struct {
    float temperature;
    float humidity;
    float battery_level;
    float solar_power_watts;
    bool compressor_state;
    bool door_state;
    int cooling_cycle_duration;
} SensorData;

class Sensors {
public:
    Sensors();
    void init();
    SensorData readAll();
    
private:
    // In a real implementation these would be I2C/SPI interfaces to DHT22/BME280 etc.
    float simTemperature;
    float simBattery;
    bool simCompressor;
};

#endif // SENSORS_H
