#include "sensors.h"
#include <math.h>
#include "esp_system.h"
#include "esp_timer.h"

Sensors::Sensors() {
    simTemperature = -5.0f; // Target frozen
    simBattery = 100.0f;
    simCompressor = false;
}

void Sensors::init() {
    // Initialize GPIOs for DS18B20/DHT22 here
}

SensorData Sensors::readAll() {
    SensorData data;
    
    // Simulate real-world physics drift
    int rand_val = esp_random();
    float drift = ((rand_val % 100) / 100.0f) - 0.5f; 
    
    simTemperature += drift * 0.2f; // Drift +-0.1 degree
    
    // Simple compressor thermostat logic mapping
    if (simTemperature > 2.0f) simCompressor = true;
    if (simTemperature < -8.0f) simCompressor = false;
    
    if (simCompressor) {
        simTemperature -= 0.5f; // Cool down
        simBattery -= 0.1f;    // Use lots of battery
    } else {
        simBattery -= 0.01f;   // Base load
    }
    
    // Reboot to 100% just for simulation purposes
    if (simBattery < 1.0f) simBattery = 100.0f; 

    data.temperature = simTemperature;
    data.humidity = 45.0f + (drift * 5.0f);
    data.battery_level = simBattery;
    data.solar_power_watts = (simBattery < 90.0f) ? 250.0f : 10.0f;
    data.compressor_state = simCompressor;
    data.door_state = (rand_val % 1000) < 5; // 0.5% chance door is open randomly
    data.cooling_cycle_duration = simCompressor ? 120 : 0;
    
    return data;
}
