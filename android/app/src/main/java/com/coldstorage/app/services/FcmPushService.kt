package com.coldstorage.app.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
// import com.google.firebase.messaging.FirebaseMessagingService
// import com.google.firebase.messaging.RemoteMessage
import com.coldstorage.app.MainActivity
import com.coldstorage.app.R

// Mocking the FCM Service subclass for scaffolding purposes
// In a real application, this would extend FirebaseMessagingService()
class FcmPushService {

    companion object {
        fun triggerTestNotification(context: Context, title: String, message: String) {
            val service = FcmPushService()
            service.sendNotification(context, title, message)
        }
    }

    /*
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        val title = remoteMessage.notification?.title ?: "New Alert"
        val body = remoteMessage.notification?.body ?: "Please check the dashboard."
        
        sendNotification(title, body)
    }

    override fun onNewToken(token: String) {
        // Send this token to the FastAPI backend so this device can receive targeted notifications
        sendTokenToServer(token)
    }
    */

    private fun sendTokenToServer(token: String) {
        // Implementation pointing to ApiClient.apiService.registerPushToken(token)
    }

        notificationManager.notify(System.currentTimeMillis().toInt(), notificationBuilder.build())
    }
}
