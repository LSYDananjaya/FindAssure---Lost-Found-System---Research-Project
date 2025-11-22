# Flutter Lost & Found App

Mobile application for the AI-Driven Lost & Found Verification System - Founder Flow.

## Overview

This Flutter app enables users who find lost items to:
1. Report the found item with category and description
2. Generate AI-powered verification questions
3. Select relevant questions they can answer
4. Provide answers to help verify the true owner
5. Save everything to the backend system

## Features

- 📱 Clean, intuitive mobile UI
- 🤖 AI-generated verification questions
- ✅ Interactive question selection
- 📝 Multi-step form workflow
- 🔄 Real-time API integration
- ✨ Material Design 3 theming

## Prerequisites

- Flutter SDK (3.0.0 or higher)
- Dart SDK (3.0.0 or higher)
- Android Studio / VS Code with Flutter extensions
- Running backend service (ai-question-service)

## Installation

1. **Navigate to the app directory:**
   ```bash
   cd mobile/flutter_app
   ```

2. **Install dependencies:**
   ```bash
   flutter pub get
   ```

3. **Configure API endpoint:**
   
   Edit `lib/services/api_service.dart` and update the base URL:
   ```dart
   static const String baseUrl = 'http://YOUR_BACKEND_IP:3000';
   ```
   
   **For Android Emulator:** Use `http://10.0.2.2:3000`
   **For iOS Simulator:** Use `http://localhost:3000`
   **For Physical Device:** Use your computer's IP address

## Running the App

**Check connected devices:**
```bash
flutter devices
```

**Run on connected device:**
```bash
flutter run
```

**Run on specific device:**
```bash
flutter run -d <device_id>
```

**Run in debug mode:**
```bash
flutter run --debug
```

**Run in release mode:**
```bash
flutter run --release
```

## App Structure

```
lib/
├── main.dart                           # App entry point
├── models/
│   ├── question.dart                   # Question data model
│   └── item.dart                       # Item data model
├── services/
│   └── api_service.dart                # HTTP API client
└── screens/
    ├── add_item_screen.dart            # Screen 1: Input item details
    ├── select_questions_screen.dart    # Screen 2: Select questions
    ├── answer_questions_screen.dart    # Screen 3: Answer questions
    └── item_success_screen.dart        # Screen 4: Success confirmation
```

## User Flow

### 1. Add Item Screen
- User inputs their ID
- Selects item category from dropdown
- Enters detailed item description
- Clicks "Generate Verification Questions"
- App calls `/api/questions/generate` endpoint

### 2. Select Questions Screen
- Displays 8-10 AI-generated questions
- User selects questions they can answer using checkboxes
- Shows count of selected questions
- Validates at least one question is selected
- Navigates to answer screen

### 3. Answer Questions Screen
- Shows selected questions in numbered cards
- User provides text answers for each question
- Validates all answers are filled
- Clicks "Save Item" button
- App calls `/api/items/create` endpoint

### 4. Item Success Screen
- Displays success confirmation
- Shows generated Item ID (can be copied)
- Displays item details summary
- Provides information about next steps
- Options to report another item or return home

## API Integration

The app communicates with the backend service through these endpoints:

### Generate Questions
```dart
Future<List<String>> generateQuestions({
  required String category,
  required String description,
})
```

### Create Item
```dart
Future<Item> createItem(Item item)
```

### Get Item by ID
```dart
Future<Item> getItemById(int itemId)
```

### Health Check
```dart
Future<bool> checkHealth()
```

## Models

### Question Model
```dart
class Question {
  final String text;
  bool isSelected;
  String answer;
}
```

### Item Model
```dart
class Item {
  final int? id;
  final String category;
  final String description;
  final String founderId;
  final List<Question> questions;
  final DateTime? createdAt;
}
```

## Configuration

### Network Permissions

**Android:** Already configured in generated files

**iOS:** Add to `ios/Runner/Info.plist`:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### Supported Platforms

- ✅ Android (5.0+)
- ✅ iOS (11.0+)
- ⚠️ Web (requires CORS configuration on backend)

## Troubleshooting

### Cannot connect to backend

**Issue:** App shows connection errors

**Solutions:**
1. Ensure backend service is running on port 3000
2. Check `baseUrl` in `api_service.dart`
3. For Android emulator, use `10.0.2.2` instead of `localhost`
4. For physical devices, ensure device and computer are on same network
5. Check firewall settings

### Questions not generating

**Issue:** "Failed to generate questions" error

**Solutions:**
1. Verify Claude API key is configured in backend `.env`
2. Check backend logs for API errors
3. Ensure description is at least 10 characters
4. Verify network connectivity

### Build errors

**Issue:** Flutter build fails

**Solutions:**
```bash
# Clean build
flutter clean

# Get dependencies
flutter pub get

# Rebuild
flutter run
```

## Testing

### Manual Testing Flow

1. Launch app
2. Enter test founder ID: `founder_test_123`
3. Select category: `Electronics`
4. Enter description: `Black iPhone 13 Pro with blue protective case, minor scratches on bottom left corner of screen`
5. Click "Generate Verification Questions"
6. Select 3-4 questions from the generated list
7. Click "Continue to Answer"
8. Fill in all answer fields with test data
9. Click "Save Item"
10. Verify success screen shows item ID
11. Copy item ID and verify in backend using API

### API Testing

Test the backend connection:
```bash
# From app directory
flutter run --dart-define=API_URL=http://your-backend:3000
```

## Building for Production

### Android APK
```bash
flutter build apk --release
```

### Android App Bundle
```bash
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

Built files will be in:
- Android: `build/app/outputs/`
- iOS: `build/ios/iphoneos/`

## Dependencies

```yaml
dependencies:
  flutter: sdk
  http: ^1.1.0          # HTTP client for API calls
  provider: ^6.1.1      # State management (if needed)
  cupertino_icons: ^1.0.6  # iOS-style icons
```

## Future Enhancements

Phase 2+ features:
- 📸 Image upload for item photos
- 🔍 Search for reported items
- 📊 Dashboard for founder's items
- 🔔 Push notifications for matches
- 👤 User authentication
- 🗺️ Location tracking
- 💬 In-app messaging

## Contributing

This is Phase 1 of the mobile app focusing on the Founder Flow. Future phases will add claim verification, item matching, and more features.

## License

MIT

---

## Quick Start Commands

```bash
# Setup
cd mobile/flutter_app
flutter pub get

# Run
flutter run

# Build
flutter build apk --release
```

## Support

For backend setup, see: `services/ai-question-service/README.md`

For API documentation, visit: `http://localhost:3000/` when backend is running
