# Text-to-Speech Reminder System

This project now includes a comprehensive text-to-speech system for reminders that automatically speaks reminder messages when they are due.

## Features

### 🎤 Automatic Speech Notifications
- Reminders automatically trigger speech when they are due
- Uses the Web Speech API (built into modern browsers)
- No additional dependencies required
- Works offline

### 🧪 Test Panel
- Access the test panel via the green microphone button in the bottom-right corner
- Test any reminder with speech
- Adjust speech settings (voice, rate, pitch)
- Enable/disable text-to-speech and browser notifications

### ⚙️ Settings
- **Text-to-Speech Toggle**: Enable/disable speech notifications
- **Browser Notifications**: Enable/disable browser notifications
- **Voice Selection**: Choose from available system voices
- **Test Controls**: Test speech functionality and stop ongoing speech

## How It Works

### Automatic Reminder Detection
- The system checks for due reminders every 30 seconds
- A reminder is considered "due" when it's within 1 minute of the scheduled time
- Each reminder can only trigger once per 5-minute window to avoid spam

### Speech Format
Reminders are spoken in this format:
```
"Reminder: [Title] at [Time]. [Description]"
```

Example:
```
"Reminder: Take Morning Medication at 9 AM. Remember to take your blood pressure medication with breakfast."
```

### Time Formatting
- Times are converted to 12-hour format for speech
- "09:00" becomes "9 AM"
- "14:30" becomes "2 30 minutes PM"

## Browser Compatibility

The text-to-speech system uses the Web Speech API, which is supported in:
- ✅ Chrome/Chromium browsers
- ✅ Safari
- ✅ Firefox
- ✅ Edge
- ❌ Internet Explorer (not supported)

## Testing

### Quick Test
1. Click the green microphone button in the bottom-right corner
2. Select any reminder from the list
3. Click "Test" to hear the speech
4. Use "Test Speech" to test basic speech functionality

### Real-time Testing
1. Create a reminder for the current time (within 1 minute)
2. Wait for the automatic speech notification
3. The system will speak the reminder when it's due

## Technical Details

### Services
- `textToSpeech.ts`: Core speech synthesis service
- `reminderNotification.ts`: Automatic reminder checking and triggering
- `ReminderTestPanel.tsx`: UI for testing and configuration

### Speech Properties
- **Rate**: 0.8 (slower for clarity)
- **Pitch**: 1.1 (slightly higher for attention)
- **Volume**: 1.0 (full volume)

### Notification Features
- Browser notifications (if permission granted)
- Speech synthesis
- Console logging for debugging

## Troubleshooting

### No Speech
1. Check if text-to-speech is enabled in the test panel
2. Ensure your browser supports the Web Speech API
3. Check browser console for errors
4. Try the "Test Speech" button

### No Notifications
1. Grant notification permission when prompted
2. Check browser settings for notification permissions
3. Ensure the site is running on HTTPS (required for notifications)

### Voice Issues
1. Different browsers have different voice options
2. Some voices may not be available on all systems
3. Try selecting a different voice in the test panel

## Future Enhancements

- Custom speech patterns
- Multiple language support
- Speech volume control
- Custom reminder sounds
- Integration with external TTS services 