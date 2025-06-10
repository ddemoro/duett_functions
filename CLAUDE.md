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