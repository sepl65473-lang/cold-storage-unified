package com.coldstorage.app.api

import com.coldstorage.app.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("auth/me")
    suspend fun getCurrentUser(): Response<User>

    @GET("devices")
    suspend fun getDevices(): Response<List<Device>>

    @GET("readings/{device_id}/{timeframe}")
    suspend fun getReadings(
        @Path("device_id") deviceId: String,
        @Path("timeframe") timeframe: String = "raw"
    ): Response<List<SensorReading>>

    @GET("alerts")
    suspend fun getAlerts(
        @Query("unresolved_only") unresolvedOnly: Boolean = true
    ): Response<List<Alert>>

    @PATCH("alerts/{alert_id}/resolve")
    suspend fun resolveAlert(
        @Path("alert_id") alertId: String,
        @Body request: ResolveAlertRequest
    ): Response<Void>
}
