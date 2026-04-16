package com.coldstorage.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "offline_cache")

class OfflineCacheManager(private val context: Context) {

    // Keys mapping out to JSON strings of the Cached Api Models
    private val CACHED_DEVICES_KEY = stringPreferencesKey("cached_devices")
    private val CACHED_ALERTS_KEY = stringPreferencesKey("cached_alerts")

    suspend fun saveDevicesCache(devicesJson: String) {
        context.dataStore.edit { preferences ->
            preferences[CACHED_DEVICES_KEY] = devicesJson
        }
    }

    val cachedDevicesFlow: Flow<String?> = context.dataStore.data
        .map { preferences ->
            preferences[CACHED_DEVICES_KEY]
        }

    suspend fun saveAlertsCache(alertsJson: String) {
        context.dataStore.edit { preferences ->
            preferences[CACHED_ALERTS_KEY] = alertsJson
        }
    }

    val cachedAlertsFlow: Flow<String?> = context.dataStore.data
        .map { preferences ->
            preferences[CACHED_ALERTS_KEY]
        }
}
