package com.coldstorage.app.models

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val access_token: String,
    val token_type: String
)

data class User(
    val id: String,
    val email: String,
    val role: String,
    val organization_id: String,
    val mfa_enabled: Boolean
)

data class Device(
    val id: String,
    val organization_id: String,
    val name: String,
    val status: String,
    val firmware_version: String?,
    val last_seen: String?,
    val location_lat: Double?,
    val location_lng: Double?,
    val location_label: String?,
    val thing_name: String?,
    val is_active: Boolean,
    val created_at: String
)

data class Alert(
    val id: String,
    val device_id: String,
    val organization_id: String,
    val type: String,
    val severity: String,
    val message: String,
    val is_resolved: Boolean,
    val resolved_at: String?,
    val created_at: String
)

data class ResolveAlertRequest(
    val resolved: Boolean
)

data class SensorReading(
    val time: String,
    val device_id: String,
    val temperature: Double?,
    val humidity: Double?,
    val battery_level: Double?,
    val solar_power_watts: Double?,
    val compressor_state: Boolean?,
    val door_state: Boolean?,
    val cooling_cycle_duration: Int?
)
