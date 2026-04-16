package com.coldstorage.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.coldstorage.app.models.Alert
import com.coldstorage.app.models.Device
import com.coldstorage.app.viewmodels.DashboardState
import com.coldstorage.app.viewmodels.DashboardViewModel
import com.coldstorage.app.services.FcmPushService
import androidx.compose.ui.platform.LocalContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    dashboardViewModel: DashboardViewModel,
    onNavigateDeviceDetail: (String) -> Unit,
    onLogout: () -> Unit
) {
    val uiState by dashboardViewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        dashboardViewModel.fetchData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Fleet Dashboard", fontWeight = FontWeight.SemiBold) },
                actions = {
                    IconButton(onClick = { dashboardViewModel.fetchData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh Data")
                    }
                    IconButton(onClick = { 
                        FcmPushService.triggerTestNotification(
                            context, 
                            "⚠️ Mock Alert", 
                            "High temperature detected in Zone A!"
                        )
                    }) {
                        Icon(Icons.Default.Notifications, contentDescription = "Trigger Test Alert")
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Log out")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            when (val state = uiState) {
                is DashboardState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is DashboardState.Error -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = "Error", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(48.dp))
                        Text(state.message, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 16.dp))
                        Button(onClick = { dashboardViewModel.fetchData() }, modifier = Modifier.padding(top = 16.dp)) {
                            Text("Retry")
                        }
                    }
                }
                is DashboardState.Success -> {
                    DashboardContent(state.devices, state.activeAlerts, onNavigateDeviceDetail)
                }
            }
        }
    }
}

@Composable
fun DashboardContent(devices: List<Device>, alerts: List<Alert>, onDeviceClick: (String) -> Unit) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            KPICardsRow(total = devices.size, alerts = alerts.size)
        }

        item {
            Text(
                "Active Alerts",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 8.dp, bottom = 8.dp)
            )
        }

        if (alerts.isEmpty()) {
            item { Text("No active alerts.", color = MaterialTheme.colorScheme.onSurfaceVariant) }
        } else {
            items(alerts) { alert ->
                AlertItem(alert)
            }
        }

        item {
            Text(
                "Device Fleet",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 16.dp, bottom = 8.dp)
            )
        }

        if (devices.isEmpty()) {
            item { Text("No devices found.", color = MaterialTheme.colorScheme.onSurfaceVariant) }
        } else {
            items(devices) { device ->
                DeviceListItem(device, onClick = { onDeviceClick(device.id) })
            }
        }
    }
}

@Composable
fun KPICardsRow(total: Int, alerts: Int) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        ElevatedCard(modifier = Modifier.weight(1f)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Total Devices", style = MaterialTheme.typography.labelMedium)
                Text(total.toString(), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            }
        }
        ElevatedCard(
            modifier = Modifier.weight(1f),
            colors = CardDefaults.elevatedCardColors(
                containerColor = if (alerts > 0) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.surface
            )
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Active Alerts", style = MaterialTheme.typography.labelMedium)
                Text(alerts.toString(), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun AlertItem(alert: Alert) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (alert.severity == "critical") Color(0xFFFFEBEE) else Color(0xFFFFF8E1)
        )
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Alert",
                tint = if (alert.severity == "critical") Color.Red else Color(0xFFFFA000),
                modifier = Modifier.padding(end = 16.dp)
            )
            Column {
                Text(alert.type.uppercase(), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(alert.message, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeviceListItem(device: Device, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(device.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(device.location_label ?: "No location", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Badge(containerColor = if (device.status == "online") Color(0xFF4CAF50) else Color.Gray) {
                Text(device.status.uppercase(), modifier = Modifier.padding(horizontal = 4.dp))
            }
        }
    }
}
