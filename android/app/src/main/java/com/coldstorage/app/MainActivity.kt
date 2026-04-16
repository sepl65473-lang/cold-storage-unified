package com.coldstorage.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.coldstorage.app.data.AuthManager
import com.coldstorage.app.ui.DashboardScreen
import com.coldstorage.app.ui.DeviceDetailScreen
import com.coldstorage.app.ui.LoginScreen
import com.coldstorage.app.viewmodels.AuthViewModel
import com.coldstorage.app.viewmodels.DashboardViewModel

class MainActivity : ComponentActivity() {

    private lateinit var authManager: AuthManager
    private lateinit var authViewModel: AuthViewModel
    private lateinit var dashboardViewModel: DashboardViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize dependencies
        authManager = AuthManager(applicationContext)
        authViewModel = AuthViewModel(authManager)
        dashboardViewModel = DashboardViewModel()

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ColdStorageApp(authManager, authViewModel, dashboardViewModel)
                }
            }
        }
    }
}

@Composable
fun ColdStorageApp(
    authManager: AuthManager,
    authViewModel: AuthViewModel,
    dashboardViewModel: DashboardViewModel
) {
    val navController = rememberNavController()
    val startDestination = if (authManager.isAuthenticated()) "dashboard" else "login"

    NavHost(navController = navController, startDestination = startDestination) {
        composable("login") {
            LoginScreen(
                authViewModel = authViewModel,
                onNavigateHome = {
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        composable("dashboard") {
            DashboardScreen(
                dashboardViewModel = dashboardViewModel,
                onNavigateDeviceDetail = { deviceId ->
                    navController.navigate("deviceDetail/$deviceId")
                },
                onLogout = {
                    authViewModel.logout()
                    navController.navigate("login") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }
        composable("deviceDetail/{deviceId}") { backStackEntry ->
            val deviceId = backStackEntry.arguments?.getString("deviceId") ?: ""
            DeviceDetailScreen(
                deviceId = deviceId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
