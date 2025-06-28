# Firestore Collection Relationships in Duett

## Overview
This document maps out the relationships between Firestore collections in the Duett dating app, which uses a friend-based matchmaking system.

## Collections

### 1. **profiles**
**Purpose**: Stores user profile information
**Key Fields**:
- Document ID: User's Firebase Auth UID
- `firstName`: User's first name
- `emailAddress`: User's email
- `phoneNumber`: User's phone number
- `birthday`: User's date of birth
- `gender`: User's gender
- `datingType`: Gender preference for dating
- `living`: Location object with city, state, latitude, longitude
- `media`: Array of profile photos/videos
- `likedBy`: Array of UIDs who have liked this profile
- `configured`: Boolean indicating if profile setup is complete
- `friends`: Boolean indicating if user has friends feature enabled

### 2. **matches**
**Purpose**: Represents a matching session between two matchmakers
**Key Fields**:
- Document ID: Auto-generated match ID
- `matched`: Array of two UIDs (the matchmakers)
- `profiles`: Array of profile summaries for the matchmakers
- `pairIds`: Array of pair document IDs created in this match
- `approvedPairs`: Array of approved pair IDs
- `rejectedPairs`: Array of rejected pair IDs
- `completed`: Boolean indicating if match session is complete
- `creationDate`: Timestamp of match creation

### 3. **duetts**
**Purpose**: Represents a group chat (Flocc) for a match session
**Key Fields**:
- Document ID: Same as the match ID
- `matchID`: Reference to the match document
- `matchMakers`: Array of matchmaker UIDs
- `members`: Array of all member UIDs (matchmakers + paired users)
- `pairs`: Array of pair objects with player details
- `enabled`: Boolean indicating if chat is active
- `creationDate`: Timestamp

### 4. **friends**
**Purpose**: Manages friend relationships and invitations
**Key Fields**:
- Document ID: Auto-generated
- `uid`: User who sent/owns the friend request
- `friendUID`: UID of the friend (null if pending)
- `fullName`: Name of the user
- `phone`: Phone number
- `inviteCode`: Unique invite code
- `accepted`: Boolean indicating if friendship is accepted
- `isStarter`: Boolean indicating who initiated
- `avatarURL`: Profile picture URL

### 5. **pairs**
**Purpose**: Represents a potential couple pairing suggested by matchmakers
**Key Fields**:
- Document ID: Format: `{matchID}-{player1UID}-{player2UID}`
- `matchID`: Reference to parent match
- `playerIds`: Array of two UIDs being paired
- `players`: Array of player objects with details
- `matchMakerIds`: Array of matchmaker UIDs who created this pair
- `approved`: Array of UIDs who approved this pair
- `rejected`: Array of UIDs who rejected this pair
- `creationDate`: Timestamp

### 6. **likes**
**Purpose**: Records when one user likes another user's profile
**Key Fields**:
- Document ID: Auto-generated
- `profileID`: UID of user who liked
- `likedProfileID`: UID of user who was liked
- `likedByName`: Name of user who liked
- `likedName`: Name of user who was liked
- `creationDate`: Timestamp

### 7. **possibleMatches**
**Purpose**: Tracks potential matches shown to users during friend-matchmaking
**Key Fields**:
- Document ID: Auto-generated
- `matchID`: Reference to parent match
- `uid`: User making choices
- `friend`: Friend profile summary (co-matchmaker)
- `match`: Match profile summary (person being matched)
- `matchmakers`: Array of matchmaker UIDs
- `choices`: Array of potential matches with liked/rejected status
- `completed`: Boolean indicating if all choices made

### 8. **messages**
**Purpose**: Chat messages within duetts (Floccs)
**Key Fields**:
- Document ID: Auto-generated
- `duettID`: Reference to parent duett/match
- `fromID`: UID of message sender
- `firstName`: Sender's first name
- `avatarURL`: Sender's profile picture
- `text`: Message content
- `imageURL`: Optional image attachment
- `creationDate`: Timestamp (milliseconds)
- `read`: Read status

## Key Relationships

### User Flow
1. **User Registration**: Creates document in `profiles` collection
2. **Friend Connections**: Creates documents in `friends` collection
3. **Match Creation**: When two friends decide to match, creates:
   - Document in `matches` collection
   - Document in `duetts` collection (same ID)
   - Documents in `possibleMatches` for each matchmaker
4. **Pair Creation**: When matchmakers select people for each other:
   - Creates/updates `pairs` documents
   - Updates `pairs` array in `duetts`
   - Updates `pairIds` in `matches`
5. **Liking**: Creates documents in `likes` collection and updates `likedBy` in profiles
6. **Messaging**: Creates documents in `messages` collection linked to duett

### ID Relationships
- `profiles` document ID = User's Firebase Auth UID
- `matches` document ID = `duetts` document ID (1:1 relationship)
- `pairs` document ID includes match ID and both player UIDs
- `possibleMatches` links to match ID and contains user choices
- `messages` link to duett ID for chat grouping

### Data Flow
1. **Profile → Likes**: When user A likes user B, creates like document and adds A's UID to B's `likedBy` array
2. **Friends → Matches**: Accepted friends can create matches together
3. **Matches → Pairs**: Matchmakers create pairs within a match session
4. **Pairs → Duetts**: Approved pairs update the duett's member list and enable chat
5. **Duetts → Messages**: All messages reference their parent duett for grouping

## Key Patterns
- UIDs are used consistently across collections for user references
- Match IDs link matches, duetts, pairs, and possibleMatches
- Profile summaries (firstName, avatarURL, etc.) are denormalized for performance
- Timestamps use Firestore Timestamp type except messages (uses milliseconds)
- Arrays track relationships (likedBy, matched, members, etc.)