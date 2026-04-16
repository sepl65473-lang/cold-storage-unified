package com.coldstorage.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.patrykandpatrick.vico.compose.axis.horizontal.rememberBottomAxis
import com.patrykandpatrick.vico.compose.axis.vertical.rememberStartAxis
import com.patrykandpatrick.vico.compose.chart.Chart
import com.patrykandpatrick.vico.compose.chart.line.lineChart
import com.patrykandpatrick.vico.compose.m3.style.m3ChartStyle
import com.patrykandpatrick.vico.compose.style.ProvideChartStyle
import com.patrykandpatrick.vico.core.entry.entryModelOf
import com.patrykandpatrick.vico.core.entry.FloatEntry

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeviceDetailScreen(deviceId: String, onNavigateBack: () -> Unit) {
    // In a real app this would map from a ViewModel fetching getReadings(deviceId)
    // Here we provide mock data specifically formatting for Vico Charts to demonstrate the UI structure

    val chartEntryModel = entryModelOf(
        4f, 8f, 15f, 16f, 23f, 42f, 2f, 6f, 10f, 14f, 8f, 5f
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Device: $deviceId", fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            ElevatedCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Current Sensors", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Temperature", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("-4.2 °C", fontWeight = FontWeight.Bold)
                    }
                    Divider(Modifier.padding(vertical = 4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Battery", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("86 %", fontWeight = FontWeight.Bold)
                    }
                    Divider(Modifier.padding(vertical = 4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Compressor Status", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("Running", fontWeight = FontWeight.Bold, color = Color(0xFF4CAF50))
                    }
                }
            }

            Text("Temperature History (Last 12 Hours)", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            
            ElevatedCard(modifier = Modifier.fillMaxWidth()) {
                Box(modifier = Modifier.padding(16.dp).fillMaxWidth().height(250.dp)) {
                    ProvideChartStyle(m3ChartStyle(entityColors = listOf(Color(0xFF2196F3)))) {
                        Chart(
                            chart = lineChart(),
                            model = chartEntryModel,
                            startAxis = rememberStartAxis(),
                            bottomAxis = rememberBottomAxis(),
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))
            Button(
                onClick = { /* Call API */ },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                Text("Force Reboot Device")
            }
        }
    }
}
