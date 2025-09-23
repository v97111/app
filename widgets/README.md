# App Widgets Setup Guide

This directory contains the native widget implementations for iOS and Android that display reminders from your app.

## ⚠️ Important Note

**Widgets require a Development Build (EAS Build) and cannot run in Expo Go.**

## iOS Widget Setup

### 1. Create Widget Extension

1. Open your project in Xcode after running `expo run:ios`
2. Add a new target: File → New → Target → Widget Extension
3. Name it "RemindersWidget"
4. Replace the generated code with `ios/RemindersWidget.swift`

### 2. Configure App Groups (for data sharing)

1. In your main app target, go to Signing & Capabilities
2. Add "App Groups" capability
3. Create a group ID like `group.com.yourapp.shared`
4. Add the same App Groups capability to your widget target

### 3. Update Info.plist

Add deep linking support to your main app's Info.plist:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.yourapp.deeplink</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>myapp</string>
        </array>
    </dict>
</array>
```

## Android Widget Setup

### 1. Create Widget Files

1. Create `android/app/src/main/java/com/yourapp/widgets/RemindersWidget.kt`
2. Create widget layout in `android/app/src/main/res/layout/reminders_widget.xml`
3. Create widget info in `android/app/src/main/res/xml/reminders_widget_info.xml`

### 2. Widget Info XML

Create `android/app/src/main/res/xml/reminders_widget_info.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:targetCellWidth="4"
    android:targetCellHeight="2"
    android:updatePeriodMillis="900000"
    android:previewImage="@drawable/widget_preview"
    android:initialLayout="@layout/reminders_widget"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
```

### 3. Register Widget in Manifest

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<receiver android:name=".widgets.RemindersWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data android:name="android.appwidget.provider"
        android:resource="@xml/reminders_widget_info" />
</receiver>
```

## Data Sharing Strategy

### iOS (App Groups)

```swift
// Write data from main app
let sharedDefaults = UserDefaults(suiteName: "group.com.yourapp.shared")
let remindersData = try JSONEncoder().encode(reminders)
sharedDefaults?.set(remindersData, forKey: "reminders")

// Read data in widget
let sharedDefaults = UserDefaults(suiteName: "group.com.yourapp.shared")
if let data = sharedDefaults?.data(forKey: "reminders") {
    let reminders = try JSONDecoder().decode([Reminder].self, from: data)
}
```

### Android (Shared Preferences)

```kotlin
// Write data from main app
val sharedPref = getSharedPreferences("widget_data", Context.MODE_PRIVATE)
val remindersJson = Gson().toJson(reminders)
sharedPref.edit().putString("reminders", remindersJson).apply()

// Read data in widget
val sharedPref = context.getSharedPreferences("widget_data", Context.MODE_PRIVATE)
val remindersJson = sharedPref.getString("reminders", "[]")
val reminders = Gson().fromJson(remindersJson, Array<Reminder>::class.java)
```

## Deep Linking

### iOS

Handle deep links in your app:

```swift
// In AppDelegate or SceneDelegate
func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    if url.scheme == "myapp" && url.host == "reminders" {
        // Navigate to reminders screen
        return true
    }
    return false
}
```

### Android

Handle intents in MainActivity:

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    if (intent.action == "OPEN_REMINDERS") {
        // Navigate to reminders screen
    }
}
```

## Building with Widgets

1. **Create Development Build:**
   ```bash
   eas build --profile development --platform ios
   eas build --profile development --platform android
   ```

2. **Install on Device:**
   ```bash
   eas build:run --profile development --platform ios
   eas build:run --profile development --platform android
   ```

3. **Add Widget:**
   - iOS: Long press home screen → Add Widget → Find your app
   - Android: Long press home screen → Widgets → Find your app widget

## Testing

1. Build and install the development build
2. Add the widget to your home screen
3. Open the main app and create some reminders
4. The widget should update to show the reminders
5. Tap the widget to verify deep linking works

## Production Deployment

When ready for production:

1. Update widget data sharing to use your backend API
2. Add proper error handling and loading states
3. Test on various device sizes and OS versions
4. Submit to app stores with widget screenshots

## Troubleshooting

- **Widget not updating:** Check update intervals and background refresh permissions
- **Deep linking not working:** Verify URL schemes and intent filters
- **Data not syncing:** Ensure app groups (iOS) or shared preferences (Android) are configured correctly
- **Widget crashes:** Check logs and add proper error handling