package com.coldstorage.app.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.coldstorage.app.api.ApiClient
import com.coldstorage.app.models.Alert
import com.coldstorage.app.models.Device
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class DashboardState {
    object Loading : DashboardState()
    data class Success(val devices: List<Device>, val activeAlerts: List<Alert>) : DashboardState()
    data class Error(val message: String) : DashboardState()
}

class DashboardViewModel : ViewModel() {

    private val _uiState = MutableStateFlow<DashboardState>(DashboardState.Loading)
    val uiState: StateFlow<DashboardState> = _uiState.asStateFlow()

    fun fetchData() {
        viewModelScope.launch {
            _uiState.value = DashboardState.Loading
            try {
                // Fetch devices and active alerts concurrently
                val devicesResponse = ApiClient.apiService.getDevices()
                val alertsResponse = ApiClient.apiService.getAlerts(unresolvedOnly = true)

                if (devicesResponse.isSuccessful && alertsResponse.isSuccessful) {
                    val devices = devicesResponse.body() ?: emptyList()
                    val alerts = alertsResponse.body() ?: emptyList()
                    _uiState.value = DashboardState.Success(devices, alerts)
                } else {
                    _uiState.value = DashboardState.Error("Failed to load dashboard data. Code: ${devicesResponse.code()}")
                }
            } catch (e: Exception) {
                _uiState.value = DashboardState.Error(e.localizedMessage ?: "Network error fetching dashboard")
            }
        }
    }
}
