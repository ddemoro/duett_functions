# Duett Development Guide

## Commands
```bash
flutter run              # Run app
flutter test            # Run tests
flutter format lib/     # Format code
flutter analyze         # Analyze code
flutter build apk       # Build Android
flutter build ios       # Build iOS
```

## Overview
Duett is a Flutter dating app with friend-based matchmaking using Firebase backend.

## Project Structure
- `lib/auth/` - Authentication & onboarding
- `lib/chat/` - Messaging & group chats (Floccs)
- `lib/feed/` - Match browsing
- `lib/info/` - User profiles
- `lib/matches/` - Match management
- `lib/utils/` - DB, storage, image utilities
- `lib/types.dart` - Data models
- `lib/navigation.dart` - Main app navigation

## Tech Stack
- **Frontend**: Flutter/Dart
- **Backend**: Firebase (Auth, Firestore, Storage, FCM)
- **State**: Globals.dart + StreamBuilder patterns

## Code Style
- Strong typing (no `var` when type is known)
- camelCase methods, PascalCase classes
- 2-space indentation
- One widget per file
- Add comments for clarity
- Keep code short and concise

## Git Commits
Create descriptive, concise commit messages