# Duett

Duett is a friend-based matchmaking app that transforms the dating experience by eliminating awkward solo dates. Connect through your friends and enjoy meaningful relationships.

## Features

- **Friend-Based Matchmaking:** Let your friends help find your perfect match
- **Group Chat System:** Engage in "Floccs" with matched pairs  
- **Rich Media Sharing:** Share photos and videos with potential matches
- **Second-Degree Connections:** Discover friends of friends
- **Real-Time Notifications:** Stay updated on matches and messages

## Getting Started

### Prerequisites

- Flutter SDK (latest stable version)
- Dart SDK
- Android Studio or Xcode for mobile deployment
- Firebase project setup

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/duett.git
   cd duett
   ```

2. Install dependencies:
   ```
   flutter pub get
   ```

3. Connect your Firebase project:
   - Update `firebase_options.dart` with your Firebase configuration
   - Ensure Firebase services (Auth, Firestore, Storage, Messaging) are enabled

4. Run the app:
   ```
   flutter run
   ```

## Development Commands

- Run app: `flutter run`
- Run tests: `flutter test`
- Run single test: `flutter test test/widget_test.dart`
- Format code: `flutter format lib/`
- Analyze code: `flutter analyze`
- Build APK: `flutter build apk`
- Build iOS: `flutter build ios`
- Generate launcher icons: `flutter pub run flutter_launcher_icons`

## Project Structure

- **lib/auth/**: Authentication screens and flows
- **lib/chat/**: Chat functionality (messages, chat rooms, duetts, floccs)
- **lib/feed/**: Feed screens for browsing matches and interactions
- **lib/info/**: User profile information and editing
- **lib/matches/**: Match management screens and functionalities
- **lib/utils/**: Utility classes for database, storage, images, etc.
- **lib/videos/**: Video recording and playback functionality
- **assets/**: App images, icons, and fonts

## Core Components

1. **Data Models** (`lib/types.dart`):
   - User profiles, matches, chat rooms, etc.

2. **Firebase Integration** (`lib/utils/db_utils.dart`):
   - Authentication, database operations, storage, messaging

3. **State Management**:
   - Global app state via `globals.dart`
   - Real-time data with Firebase

4. **UI Components**:
   - Consistent styling and theming
   - Reusable UI elements

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## Code Style Guidelines

- Use camelCase for variables/methods, PascalCase for classes/widgets
- Apply strong typing (avoid `var` when type is known)
- Extract reusable widgets into separate components
- Follow feature-based organization
- Use meaningful naming

## License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.