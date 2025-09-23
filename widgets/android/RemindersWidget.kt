package com.yourapp.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.yourapp.R
import java.text.SimpleDateFormat
import java.util.*

/**
 * Android Widget for displaying reminders from the main app
 */
class RemindersWidget : AppWidgetProvider() {
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update each widget instance
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val reminders = loadReminders(context)
        
        // Create RemoteViews object
        val views = RemoteViews(context.packageName, R.layout.reminders_widget)
        
        // Set up click intent to open app
        val intent = Intent(context, MainActivity::class.java).apply {
            action = "OPEN_REMINDERS"
            putExtra("screen", "reminders")
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
        
        // Update widget content
        if (reminders.isEmpty()) {
            views.setTextViewText(R.id.widget_title, "All caught up!")
            views.setTextViewText(R.id.widget_subtitle, "No reminders today")
            views.setImageViewResource(R.id.widget_icon, R.drawable.ic_check_circle)
        } else {
            views.setTextViewText(R.id.widget_title, "Reminders")
            views.setTextViewText(
                R.id.widget_subtitle, 
                "${reminders.size} reminder${if (reminders.size != 1) "s" else ""}"
            )
            views.setImageViewResource(R.id.widget_icon, R.drawable.ic_bell)
            
            // Show first reminder
            val firstReminder = reminders.first()
            views.setTextViewText(R.id.reminder_title, firstReminder.title)
            views.setTextViewText(R.id.reminder_time, firstReminder.timeText)
            
            // Set color based on urgency
            val textColor = if (firstReminder.isOverdue) {
                context.getColor(R.color.error_red)
            } else {
                context.getColor(R.color.warning_orange)
            }
            views.setTextColor(R.id.reminder_title, textColor)
        }
        
        // Update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
    
    private fun loadReminders(context: Context): List<ReminderItem> {
        // In a real implementation, this would read from shared preferences or database
        // For now, return sample data
        val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
        
        return listOf(
            ReminderItem(
                id = "1",
                title = "Review project proposal",
                dueDate = Date(),
                timeText = timeFormat.format(Date()),
                isOverdue = false
            ),
            ReminderItem(
                id = "2",
                title = "Team meeting",
                dueDate = Date(System.currentTimeMillis() + 3600000),
                timeText = timeFormat.format(Date(System.currentTimeMillis() + 3600000)),
                isOverdue = false
            )
        )
    }
}

data class ReminderItem(
    val id: String,
    val title: String,
    val dueDate: Date,
    val timeText: String,
    val isOverdue: Boolean
)

// Widget layout would be defined in res/layout/reminders_widget.xml
/*
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="@drawable/widget_background">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <ImageView
            android:id="@+id/widget_icon"
            android:layout_width="24dp"
            android:layout_height="24dp"
            android:src="@drawable/ic_bell"
            android:tint="@color/primary_blue" />

        <TextView
            android:id="@+id/widget_title"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:layout_marginStart="8dp"
            android:text="Reminders"
            android:textSize="16sp"
            android:textStyle="bold"
            android:textColor="@color/text_primary" />

    </LinearLayout>

    <TextView
        android:id="@+id/widget_subtitle"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="4dp"
        android:text="2 reminders"
        android:textSize="12sp"
        android:textColor="@color/text_secondary" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="12dp"
        android:orientation="vertical">

        <TextView
            android:id="@+id/reminder_title"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Review project proposal"
            android:textSize="14sp"
            android:textStyle="bold"
            android:maxLines="1"
            android:ellipsize="end" />

        <TextView
            android:id="@+id/reminder_time"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="2dp"
            android:text="2:00 PM"
            android:textSize="12sp"
            android:textColor="@color/text_secondary" />

    </LinearLayout>

</LinearLayout>
*/