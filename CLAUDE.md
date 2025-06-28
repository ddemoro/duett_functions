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
=======
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Build with watch mode
npm run build:watch

# Run local Firebase emulator
npm run serve

# Deploy to Firebase
npm run deploy

# View Firebase function logs
npm run logs

# Lint the codebase
npm run lint
```

## Architecture

This is a Firebase Functions backend for a social dating/matching application called "Duett" where friends can play matchmaker for each other.

### Core Modules

**Match Flow**:
- `matches.ts`: Core matching logic - handles match creation, user choices (like/pass), and match expiration
- `pairs.ts`: Manages confirmed pairs after both users approve each other
- `duetts.ts`: Chat functionality between matched users

**User Management**:
- `profiles.ts`: User profile lifecycle with onCreate/onDelete triggers
- `friends.ts`: Friend relationships and invitation system
- `push_notifications.ts`: Centralized push notification service

**Media Processing**:
- `compressor.ts`: Image/video compression using Sharp
- `utils/thumbnails.ts`: Thumbnail generation for media files

### Data Models

All TypeScript interfaces are defined in `types.ts`. Key models include:
- `Profile`: User profile data
- `Match`: Matchmaking records between two users
- `Pair`: Confirmed matches
- `Duett`: Chat messages between paired users
- `Friend`: Friend relationships

### Firebase Structure

Functions are exported from `index.ts` and follow these patterns:
- **HTTP Functions**: Direct endpoints (e.g., `createMatch`, `getFriends`)
- **Firestore Triggers**: Document lifecycle hooks (e.g., `onProfileCreate`, `onMatchUpdate`)
- **Scheduled Functions**: Time-based operations (e.g., `checkExpiredMatches`)

### Key Implementation Details

1. **Match Creation**: Requires two friends to collaborate - one creates the match for two other users
2. **Choice Processing**: Users can like/pass on matches, with automatic pair creation on mutual approval
3. **Media Handling**: All uploaded media is compressed and thumbnailed
4. **Push Notifications**: Sent for new matches, messages, and friend invitations
5. **Database Operations**: Use `utils/db_utils.ts` for consistent Firestore interactions
