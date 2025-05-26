# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Build: `npm run build`
- Build with watch: `npm run build:watch`
- Serve locally: `npm run serve` (runs on port 5001)
- Lint: `npm run lint`
- Deploy: `npm run deploy`
- View logs: `npm run logs`

## Code Style Guidelines
- **TypeScript**: Strong typing with interfaces in `types.ts`
- **Formatting**: 2-space indentation, 200 char line limit, double quotes
- **Naming**: camelCase for functions, PascalCase for interfaces
- **Imports**: Group external/internal, newline after imports
- **Error Handling**: Throw with descriptive messages, use async/await
- **Functions**: Exports follow descriptive naming (e.g., `friendAdded`)
- **Database**: Firebase Firestore used through utility functions
- **Types**: Type inference allowed, explicit return types not required

## Project Structure
- Source in `/src`, compiled output in `/lib`
- Domain-specific modules (duetts, friends, profiles, etc.)
- Utilities in `/utils` directory
- Firebase Functions organized by resource/domain

## File Functions

### Core Files
- **types.ts**: Defines all TypeScript interfaces (Profile, Match, Friend, DuettChat, etc.)
- **index.ts**: Entry point that initializes Firebase Admin SDK and exports all functions

### Domain-Specific Files
- **compressor.ts**: Handles image processing (compression, resizing, WebP conversion)
- **duetts.ts**: Manages chat groups, messaging, and nudge functionality
- **friends.ts**: Handles friend relationships, requests, and status updates
- **matches.ts**: Core matching functionality between users and potential partners
- **pairs.ts**: Manages matchmaking between users' friends
- **profiles.ts**: User profile management, setup, and cleanup
- **push_notifications.ts**: Central system for all notification types
- **test.ts**: Testing endpoints and administrative functions

### Utility Files
- **utils/db_utils.ts**: Database helpers for common queries and operations
- **utils/text_utils.ts**: String processing, code generation, and formatting utilities
- **utils/thumbnails.ts**: Video thumbnail extraction and image processing

## System Architecture
The application is a dating/matchmaking platform where users can:
1. Create profiles and add friends
2. Match with other users
3. Introduce their friends to each other (pairing)
4. Communicate through group chats ("Duetts")

### Database Structure
- **Firestore Collections**: profiles, friends, matches, pairs, duetts, messages, notifications
- **Firebase Storage**: Media files with automatic compression on upload
- **Function Triggers**: Document events (onCreate, onUpdate, onDelete) and HTTP endpoints

### Key Patterns
- Event-driven architecture with Firestore triggers
- Automatic media compression for images (WebP conversion, quality reduction)
- Push notifications integrated throughout for user engagement
- Strong typing with centralized interfaces in types.ts
- Database operations abstracted through utils/db_utils.ts