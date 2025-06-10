import * as functions from "firebase-functions";
import { ChatMessage, Friend, Like, Profile } from "./types";
import dbUtils from "./utils/db_utils";
import pushNotifications from "./push_notifications";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");

const firestore = admin.firestore();

// Helper function to create a delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Checks each profile for friends and sends a nudge notification if they have none.
 */
exports.checkFriends = functions.https.onRequest(async (req, res) => {
  const querySnapshot = await firestore.collection("profiles").get();
  for (const document of querySnapshot.docs) {
    const profile = Object.assign(
      { id: document.id },
      document.data() as Profile
    );
    const id = document.id;
    const querySnapshot = await firestore
      .collection("friends")
      .where("uid", "==", id)
      .get();

    let hasFriends = false;
    for (const document of querySnapshot.docs) {
      const friend = Object.assign(
        { id: document.id },
        document.data() as Friend
      );
      if (friend.accepted) {
        hasFriends = true;
        break;
      }
    }
    await firestore
      .collection("profiles")
      .doc(profile.id)
      .update({ friends: hasFriends });

    if (!hasFriends) {
      // eslint-disable-next-line max-len
      await pushNotifications.sendPushNotification(
        profile.id,
        "Duett Update",
        "We are testing the final features of Duett. Now it's time to test matching and creating a Duett. We noticed your friends have not accepted your invite. Send them a nudge."
      );
    }
  }

  res.sendStatus(200);
});

/**
 * Clears various Firestore collections (profiles likedBy, matches, possibleMatches, etc.).
 * WARNING: This is a destructive operation.
 */
exports.clearProfiles = functions
  .runWith({
    memory: "4GB",
    timeoutSeconds: 540,
  })
  .https.onRequest(async (req, res) => {
    const batch = firestore.batch();
    const BATCH_SIZE = 500;
    let batchCount = 0;

    // Helper function to commit batch when needed
    const commitBatch = async () => {
      if (batchCount > 0) {
        await batch.commit();
        batchCount = 0;
      }
    };

    // Update profiles in batches
    const profilesSnapshot = await firestore.collection("profiles").get();
    for (const document of profilesSnapshot.docs) {
      batch.update(document.ref, { likedBy: [] });
      batchCount++;
      if (batchCount >= BATCH_SIZE) {
        await commitBatch();
      }
    }
    await commitBatch();

    // Delete collections in parallel batches
    const collections = [
      "matches",
      "possibleMatches",
      "likes",
      "pairs",
      "notifications",
      "messages",
      "duetts",
      "nudges"
    ];

    await Promise.all(
      collections.map(async (collectionName) => {
        const collectionRef = firestore.collection(collectionName);
        const snapshot = await collectionRef.get();
        
        // Process deletions in batches
        const batches = [];
        let currentBatch = firestore.batch();
        let currentBatchCount = 0;
        
        for (const doc of snapshot.docs) {
          currentBatch.delete(doc.ref);
          currentBatchCount++;
          
          if (currentBatchCount >= BATCH_SIZE) {
            batches.push(currentBatch.commit());
            currentBatch = firestore.batch();
            currentBatchCount = 0;
          }
        }
        
        if (currentBatchCount > 0) {
          batches.push(currentBatch.commit());
        }
        
        await Promise.all(batches);
      })
    );

    res.sendStatus(200);
  });

/**
 * Tests sending a specific "like" push notification using hardcoded IDs.
 */
exports.testSpecificLikeNotification = functions.https.onRequest(
  async (req, res) => {
    // const profile = await dbUtils.getProfile("tI6XNS1oLtWt4WjwkdiliJos3f72");
    await pushNotifications.sendLikeNotification(
      "tI6XNS1oLtWt4WjwkdiliJos3f72",
      "Duett",
      "We have a match!",
      "vBOiXFUkuIwHnPQJnABI"
    );

    res.sendStatus(200);
  }
);

/**
 * Creates two "like" documents between hardcoded profile IDs with a delay.
 * Intended for testing match creation logic triggered by mutual likes.
 */
exports.createMatch = functions.https.onRequest(async (req, res) => {
  const like: Like = {
    likedProfileID: "s5C7M8CvapbCttHWtRDeWl403fS2",
    profileID: "bxLjcxVZzlexU040cKCnh5xROLq1",
    creationDate: Date.now(),
  };

  await firestore.collection("likes").add(like);

  // Add 5 second delay
  await sleep(5000);

  const like2: Like = {
    likedProfileID: "bxLjcxVZzlexU040cKCnh5xROLq1",
    profileID: "s5C7M8CvapbCttHWtRDeWl403fS2",
    creationDate: Date.now(),
  };

  await firestore.collection("likes").add(like2);

  res.sendStatus(200);
});

/**
 * Fetches and returns the accepted friends for a hardcoded profile ID.
 */
exports.getFriends = functions.https.onRequest(async (req, res) => {
  const friends1 = await dbUtils.getFriends(
    "JT1DZIGN6KZaZ4QQKfe8mmVstlq1",
    true,
    true
  );

  res.send(friends1).status(200);
});

/**
 * Tests updating the completion status for a player within a Duett chat message.
 * Uses a hardcoded possibleMatch ID to find the relevant chat.
 */
exports.testUpdatePlayerCompletionStatus = functions.https.onRequest(
  async (req, res) => {
    const pm = await dbUtils.getPossibleMatch("tI7SdJWi6e8W9BHRCSZZ");

    const completedUID = pm.uid;
    const matchID = pm.matchID;

    // Fond the Chat Message with "players" as type and duettID is the matchID
    const snapshot = await firestore
      .collection("messages")
      .where("duettID", "==", matchID)
      .get();
    for (const document of snapshot.docs) {
      const chatMessage = Object.assign(
        { id: document.id },
        document.data() as ChatMessage
      );
      if (chatMessage.type == "players") {
        const players = chatMessage.players!;
        for (const player of players) {
          console.log("Completed UID:" + pm.uid + " and " + player.uid);
          if (player.uid == completedUID) {
            player.completed = true;
            console.log("YES");
          }
        }
      }

      await firestore
        .collection("messages")
        .doc(document.id)
        .update({ players: chatMessage.players });
    }

    res.sendStatus(200);
  }
);

/**
 * Makes all profiles of the opposite gender "like" a specific hardcoded profile.
 */
exports.everyoneLikesYou = functions.https.onRequest(async (req, res) => {
  const profileID = "tI6XNS1oLtWt4WjwkdiliJos3f72";
  const profile = await dbUtils.getProfile(profileID);
  const lookFor = profile.gender == "Man" ? "Woman" : "Man";
  const query = await firestore
    .collection("profiles")
    .where("gender", "==", lookFor)
    .get();
  for (const document of query.docs) {
    const p = Object.assign({ id: document.id }, document.data() as Profile);
    const id = document.id;
    const like: Like = {
      likedProfileID: profileID,
      profileID: id,
      creationDate: Date.now(),
    };

    console.log(p.firstName + " " + like);
    await firestore.collection("likes").add(like);
  }

  res.sendStatus(200);
});

/**
 * Sets all choices to 'liked = true' for all possible matches associated with a hardcoded match ID.
 */
exports.testSetAllPossibleMatchChoicesToLiked = functions.https.onRequest(
  async (req, res) => {
    const match = await dbUtils.getMatch("KvcikxPMJHWxsj3PaDJz");

    // Have all the possible matches like each other
    const pms = await dbUtils.getPossibleMatches(match.id);
    for (const possibleMatch of pms) {
      for (const choice of possibleMatch.choices) {
        choice.liked = true;
      }
      await firestore
        .collection("possibleMatches")
        .doc(possibleMatch.id)
        .update({ choices: possibleMatch.choices });
    }

    res.sendStatus(200);
  }
);

/**
 * Approves the first pair found for a hardcoded match ID by adding both matchmakers to the 'approved' array.
 * This simulates the conditions for creating a Duett.
 */
exports.testApproveFirstPairForMatch = functions.https.onRequest(
  async (req, res) => {
    const match = await dbUtils.getMatch("KvcikxPMJHWxsj3PaDJz");

    // Have all the possible matches like each other
    const pairs = await dbUtils.getPairs(match.id);
    for (const pair of pairs) {
      const matchMakers = pair.matchMakerIds;
      const app = [];
      app.push(matchMakers[0]);
      await firestore
        .collection("pairs")
        .doc(pair.id)
        .update({ approved: app });
      app.push(matchMakers[1]);
      await firestore
        .collection("pairs")
        .doc(pair.id)
        .update({ approved: app });
      break;
    }

    // A Duett Should be created at this point
    res.sendStatus(200);
  }
);

/**
 * Tests sending a generic push notification to a hardcoded profile ID.
 */
exports.testGenericPushNotification = functions.https.onRequest(
  async (req, res) => {
    const profileID = "q8Dbzvfs1XWd8Hxz0dHs";

    await pushNotifications.sendPushNotification(profileID, "Test", "test");

    res.sendStatus(200);
  }
);

/**
 * Finds profiles based on an array of email addresses
 */
exports.findProfilesByEmails = functions.https.onRequest(async (req, res) => {
  // Clean and standardize email addresses
  const emails = [
    "alikorn.4@gmail.com",
    "allie.freedberg@gmail.com",
    "hello@annayang.design",
    "arielsnyc@yahoo.com",
    "arleigh@collxab.com",
    "blakegitler@gmail.com",
    "bobbyshove@gmail.com",
    "brian.sudolsky@gmail.com",
    "brooke@ivler.com",
    "carolineagase@gmail.com", // Fixed comma typo
    "cartermjones@gmail.com",
    "caseygrafstein@gmail.com",
    "daverose22@gmail.com",
    "davidrenbaum@gmail.com",
    "greg.maczka@gmail.com",
    "info@jakerosenentertainment.com",
    "jamieschoolfield@gmail.com",
    "jnuremberg@gmail.com",
    "jenbari76@yahoo.com",
    "jacqsspo@gmail.com",
    "jillarnoldpallad@gmail.com",
    "jmreif00@gmail.com",
    "lainne@bondsagency.com",
    "landonhovey@gmail.com",
    "sawyer.luke10@gmail.com",
    "marcsnyder@me.com",
    "mlrockstar@gmail.com",
    "mylesrosenstein@gmail.com",
    "noahrabino2002@gmail.com",
    "olivia.g.611@gmail.com",
    "rosatellib@gmail.com",
    "ruby@th3rdorder.com",
    "sgrenbaum23@gmail.com",
    "sarahfzurell@gmail.com",
    "stefaniegrife@yahoo.com",
    "beccamolly2@aol.com",
    "stephen.wechsler@yahoo.com",
    "srenbaum@yahoo.com",
    "sydney@sydneylewis.com",
    "sydneylerman7@gmail.com",
    "tamarasteinc@gmail.com",
    "tess@tmcreativeconsulting.com",
    "wendigrossman@iheartmedia.com",
    "wab2001@gmail.com",
    "jonathan.d.reisman@gmail.com", // Fixed space typo
  ].map((email) => email.toLowerCase().trim());

  const results = [];
  const notFound = new Set(emails);
  const profileMap = new Map();

  // Batch query all profiles at once using 'in' operator (limited to 10 at a time)
  const emailChunks = [];
  const CHUNK_SIZE = 10;
  for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
    emailChunks.push(emails.slice(i, i + CHUNK_SIZE));
  }

  // Query profiles in parallel chunks
  const profileQueries = emailChunks.map(chunk =>
    firestore
      .collection("profiles")
      .where("emailAddress", "in", chunk)
      .get()
  );

  const profileSnapshots = await Promise.all(profileQueries);
  
  // Collect all profiles
  for (const snapshot of profileSnapshots) {
    for (const doc of snapshot.docs) {
      const profile = Object.assign({ id: doc.id }, doc.data() as Profile);
      profileMap.set(profile.id, profile);
      notFound.delete(profile.emailAddress.toLowerCase().trim());
    }
  }

  // Batch query friends for all profiles at once
  const profileIds = Array.from(profileMap.keys());
  const friendsMap = new Map();

  if (profileIds.length > 0) {
    // Query friends in chunks
    const friendChunks = [];
    for (let i = 0; i < profileIds.length; i += CHUNK_SIZE) {
      friendChunks.push(profileIds.slice(i, i + CHUNK_SIZE));
    }

    const friendQueries = friendChunks.map(chunk =>
      firestore
        .collection("friends")
        .where("uid", "in", chunk)
        .get()
    );

    const friendSnapshots = await Promise.all(friendQueries);

    // Process friend counts
    for (const snapshot of friendSnapshots) {
      for (const doc of snapshot.docs) {
        const friend = Object.assign({ id: doc.id }, doc.data() as Friend);
        if (friend.accepted) {
          const count = friendsMap.get(friend.uid) || 0;
          friendsMap.set(friend.uid, count + 1);
        }
      }
    }
  }

  // Combine results
  for (const [profileId, profile] of profileMap) {
    const acceptedFriendCount = friendsMap.get(profileId) || 0;
    results.push({
      ...profile,
      hasFriends: acceptedFriendCount > 0,
    });
  }

  // Return the results
  res.json({
    totalEmails: emails.length,
    found: results.length,
    notFound: Array.from(notFound).length,
    profiles: results,
    missingEmails: Array.from(notFound),
  }).status(200);
});

exports.addFriendPairing = functions.https.onRequest(async (req, res) => {
  const uid = "k3PvjohECcZkdqexL5ReYaxCIhN2";
  const friendUID = "s5C7M8CvapbCttHWtRDeWl403fS2";

  // Retrieve the friend's profile from the uid
  const friendProfile = await dbUtils.getProfile(friendUID);

  // Use data from the profile to populate the Friend object
  const friend: Friend = {
    uid: uid,
    friendUID: friendUID,
    fullName: friendProfile.firstName,
    phone: friendProfile.phoneNumber,
    accepted: false,
    avatarURL: friendProfile.media && friendProfile.media.length > 0
      ? friendProfile.media[0].url
      : friendProfile.avatarURL,
    creationDate: Date.now(),
    isStarter: true,
    inviteCode: "MANUAL_ADD",
  };

  // Add the friend to Firestore
  await firestore.collection("friends").add(friend);

  res.status(200).send({
    message: "Friend pairing added successfully",
    friend: friend,
  });
});

/**
 * Validates all friends by checking if their associated profiles exist.
 * Identifies orphaned friend records where the profile no longer exists.
 */
exports.validateFriends = functions.https.onRequest(async (req, res) => {
  const results = {
    total: 0,
    valid: 0,
    orphaned: [] as Array<{
      friendId: string;
      uid: string | null;
      friendUID: string | null;
      fullName: string;
    }>,
    invalidUIDs: [] as Array<{
      friendId: string;
      reason: string;
    }>,
  };

  // Get all friends from the database
  const friendsSnapshot = await firestore.collection("friends").get();
  results.total = friendsSnapshot.size;

  // Collect all unique UIDs from friends
  const uidsToCheck = new Set<string>();
  const friendsByUid = new Map<string, Array<any>>();

  for (const document of friendsSnapshot.docs) {
    const friend = Object.assign({ id: document.id }, document.data() as Friend);

    // Validate that uid is not empty, null, or undefined
    if (!friend.uid) {
      results.invalidUIDs.push({
        friendId: friend.id,
        reason: "Missing or empty uid",
      });
      continue;
    }

    uidsToCheck.add(friend.uid);
    if (!friendsByUid.has(friend.uid)) {
      friendsByUid.set(friend.uid, []);
    }
    friendsByUid.get(friend.uid)!.push({ doc: document, friend });
  }

  // Batch check profile existence
  const uidArray = Array.from(uidsToCheck);
  const existingProfiles = new Set<string>();
  
  // Check profiles in chunks of 10 (Firestore 'in' query limit)
  const CHUNK_SIZE = 10;
  for (let i = 0; i < uidArray.length; i += CHUNK_SIZE) {
    const chunk = uidArray.slice(i, i + CHUNK_SIZE);
    const profilesSnapshot = await firestore
      .collection("profiles")
      .where(admin.firestore.FieldPath.documentId(), "in", chunk)
      .get();
    
    profilesSnapshot.docs.forEach(doc => existingProfiles.add(doc.id));
  }

  // Process results and batch delete orphaned records
  const batch = firestore.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500;

  for (const [uid, friendDocs] of friendsByUid) {
    if (!existingProfiles.has(uid)) {
      // Profile doesn't exist - these are orphaned friend records
      for (const { doc, friend } of friendDocs) {
        results.orphaned.push({
          friendId: friend.id,
          uid: friend.uid,
          friendUID: friend.friendUID || null,
          fullName: friend.fullName || "Unknown",
        });

        batch.delete(doc.ref);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          batchCount = 0;
        }
      }
    } else {
      results.valid += friendDocs.length;
    }
  }

  // Commit any remaining deletions
  if (batchCount > 0) {
    await batch.commit();
  }

  // Return the results showing orphaned records
  res.json({
    message: `Validated ${results.total} friend records. Found ${results.orphaned.length} orphaned records. Found ${results.invalidUIDs.length} records with invalid UIDs.`,
    results: results,
  }).status(200);
});

/**
 * Checks all profiles and determines if they have any accepted friends.
 * Returns detailed information about profiles with and without accepted friends.
 */
exports.checkProfilesWithAcceptedFriends = functions.https.onRequest(async (req, res) => {
  const results = {
    totalProfiles: 0,
    profilesWithFriends: [] as Array<{
      profileId: string,
      firstName: string,
      friendCount: number
    }>,
    profilesWithoutFriends: [] as Array<{
      profileId: string,
      firstName: string
    }>,
  };

  // Get all profiles from the database
  const profilesSnapshot = await firestore.collection("profiles").get();
  results.totalProfiles = profilesSnapshot.size;

  // Create a map to store profiles
  const profilesMap = new Map();
  const profileIds = [];

  for (const document of profilesSnapshot.docs) {
    const profile = Object.assign({ id: document.id }, document.data() as Profile);
    profilesMap.set(profile.id, profile);
    profileIds.push(profile.id);
  }

  // Batch query all friends for all profiles
  const friendCountMap = new Map();
  
  // Query friends in chunks
  const CHUNK_SIZE = 10;
  for (let i = 0; i < profileIds.length; i += CHUNK_SIZE) {
    const chunk = profileIds.slice(i, i + CHUNK_SIZE);
    const friendsSnapshot = await firestore
      .collection("friends")
      .where("uid", "in", chunk)
      .get();

    // Count accepted friends per profile
    for (const doc of friendsSnapshot.docs) {
      const friend = Object.assign({ id: doc.id }, doc.data() as Friend);
      if (friend.accepted) {
        const count = friendCountMap.get(friend.uid) || 0;
        friendCountMap.set(friend.uid, count + 1);
      }
    }
  }

  // Batch update profiles and collect results
  const batch = firestore.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500;

  for (const [profileId, profile] of profilesMap) {
    const acceptedFriendCount = friendCountMap.get(profileId) || 0;
    const hasFriends = acceptedFriendCount > 0;

    // Update profile
    batch.update(firestore.collection("profiles").doc(profileId), {
      friends: hasFriends,
    });
    batchCount++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batchCount = 0;
    }

    // Collect results
    if (acceptedFriendCount > 0) {
      results.profilesWithFriends.push({
        profileId: profile.id,
        firstName: profile.firstName || "Unknown",
        friendCount: acceptedFriendCount,
      });
    } else {
      results.profilesWithoutFriends.push({
        profileId: profile.id,
        firstName: profile.firstName || "Unknown",
      });
    }
  }

  // Commit any remaining updates
  if (batchCount > 0) {
    await batch.commit();
  }

  // Return the results
  res.json({
    totalProfiles: results.totalProfiles,
    profilesWithFriends: {
      count: results.profilesWithFriends.length,
      profiles: results.profilesWithFriends,
    },
    profilesWithoutFriends: {
      count: results.profilesWithoutFriends.length,
      profiles: results.profilesWithoutFriends,
    },
  }).status(200);
});
