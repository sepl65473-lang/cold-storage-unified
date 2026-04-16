idf_component_register(
    SRCS "main.cpp"
         "sensors.cpp"
         "mqtt_manager.cpp"
         "ota_handler.cpp"
    INCLUDE_DIRS "."
    REQUIRES nvs_flash mqtt esp_http_client esp_https_ota app_update
)
