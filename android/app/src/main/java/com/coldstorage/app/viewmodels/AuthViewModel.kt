package com.coldstorage.app.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.coldstorage.app.api.ApiClient
import com.coldstorage.app.data.AuthManager
import com.coldstorage.app.models.LoginRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    object Authenticated : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthViewModel(private val authManager: AuthManager) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(
        if (authManager.isAuthenticated()) AuthState.Authenticated else AuthState.Idle
    )
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val response = ApiClient.apiService.login(LoginRequest(email, password))
                if (response.isSuccessful && response.body() != null) {
                    val token = response.body()!!.access_token
                    authManager.saveToken(token)
                    _authState.value = AuthState.Authenticated
                } else {
                    _authState.value = AuthState.Error(
                        if (response.code() == 403) "MFA Required/Access Denied" else "Invalid Credentials"
                    )
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.localizedMessage ?: "Network error occurred")
            }
        }
    }

    fun logout() {
        authManager.clearAuth()
        _authState.value = AuthState.Idle
    }
}
