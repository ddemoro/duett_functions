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
    const querySnapshot = await firestore.collection("profiles").get();
    for (const document of querySnapshot.docs) {
      await firestore.collection("profiles").doc(document.id).update({
        likedBy: [],
      });
    }

    const matchesQuerySnapshot = await firestore.collection("matches").get();
    for (const document of matchesQuerySnapshot.docs) {
      await document.ref.delete();
    }

    const possibleMatchesSnapshot = await firestore
      .collection("possibleMatches")
      .get();
    for (const document of possibleMatchesSnapshot.docs) {
      await document.ref.delete();
    }

    const likesSnapshot = await firestore.collection("likes").get();
    for (const document of likesSnapshot.docs) {
      await document.ref.delete();
    }

    const pairsSnapshot = await firestore.collection("pairs").get();
    for (const document of pairsSnapshot.docs) {
      await document.ref.delete();
    }

    const notificationsSnapshot = await firestore
      .collection("notifications")
      .get();
    for (const document of notificationsSnapshot.docs) {
      await document.ref.delete();
    }

    const messagesSnapshot = await firestore.collection("messages").get();
    for (const document of messagesSnapshot.docs) {
      await document.ref.delete();
    }

    const duettsSnapshot = await firestore.collection("duetts").get();
    for (const document of duettsSnapshot.docs) {
      await document.ref.delete();
    }

    const nudgesSnapshot = await firestore.collection("nudges").get();
    for (const document of nudgesSnapshot.docs) {
      await document.ref.delete();
    }

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
  const notFound = [];

  // Query Firestore for each email
  for (const email of emails) {
    const querySnapshot = await firestore
      .collection("profiles")
      .where("emailAddress", "==", email)
      .get();

    if (querySnapshot.empty) {
      notFound.push(email);
      continue;
    }

    for (const doc of querySnapshot.docs) {
      const profile = Object.assign({ id: doc.id }, doc.data() as Profile);

      // Check if profile has friends
      const friendsSnapshot = await firestore
        .collection("friends")
        .where("uid", "==", profile.id)
        .get();

      // Count accepted friends
      let acceptedFriendCount = 0;
      for (const friendDoc of friendsSnapshot.docs) {
        const friend = Object.assign({ id: friendDoc.id }, friendDoc.data() as Friend);
        if (friend.accepted) {
          acceptedFriendCount++;
        }
      }

      // Add hasFriends property to profile
      results.push({
        ...profile,
        hasFriends: acceptedFriendCount > 0,
      });
    }
  }

  // Return the results
  res.json({
    totalEmails: emails.length,
    found: results.length,
    notFound: notFound.length,
    profiles: results,
    missingEmails: notFound,
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

    // Check if profile exists for the friend's uid
    const profileSnapshot = await firestore.collection("profiles").doc(friend.uid).get();

    if (!profileSnapshot.exists) {
      // Profile doesn't exist - this is an orphaned friend record
      results.orphaned.push({
        friendId: friend.id,
        uid: friend.uid,
        friendUID: friend.friendUID || null,
        fullName: friend.fullName || "Unknown",
      });

      // Optionally delete the orphaned record
      await document.ref.delete();
    } else {
      results.valid++;
    }
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

  for (const document of profilesSnapshot.docs) {
    const profile = Object.assign({ id: document.id }, document.data() as Profile);

    // Query friends for this profile
    const friendsSnapshot = await firestore
      .collection("friends")
      .where("uid", "==", profile.id)
      .get();

    // Count accepted friends
    let acceptedFriendCount = 0;
    for (const friendDoc of friendsSnapshot.docs) {
      const friend = Object.assign({ id: friendDoc.id }, friendDoc.data() as Friend);
      if (friend.accepted) {
        acceptedFriendCount++;
      }
    }
    const hasFriends = acceptedFriendCount > 0;
    // Update the profile with the hasFriends property
    await firestore.collection("profiles").doc(profile.id).update({
      friends: hasFriends,
    });

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

/**
 * Unmatches two users by removing all traces of their match from the database.
 * This includes removing likes, pairs, messages, possibleMatches, and updating relevant collections.
 */
exports.unmatch = functions.https.onRequest(async (req, res) => {
  const uid1 = "2qwsnxwu3nd7vJHM94F1QHrZs2T2";
  const uid2 = "bxLjcxVZzlexU040cKCnh5xROLq1";


  if (!uid1 || !uid2) {
    res.status(400).json({ error: "Both uid1 and uid2 are required" });
    return;
  }

  const results = {
    deletedLikes: 0,
    updatedProfiles: 0,
    deletedPairs: 0,
    updatedDuetts: 0,
    deletedMatches: 0,
    deletedMessages: 0,
    deletedPossibleMatches: 0,
  };

  try {
    // 1. Delete likes between the two users
    const likesQuery1 = await firestore
      .collection("likes")
      .where("profileID", "==", uid1)
      .where("likedProfileID", "==", uid2)
      .get();

    const likesQuery2 = await firestore
      .collection("likes")
      .where("profileID", "==", uid2)
      .where("likedProfileID", "==", uid1)
      .get();

    for (const doc of likesQuery1.docs) {
      await doc.ref.delete();
      results.deletedLikes++;
    }

    for (const doc of likesQuery2.docs) {
      await doc.ref.delete();
      results.deletedLikes++;
    }

    // 2. Update profiles to remove from likedBy arrays
    const profile1Doc = firestore.collection("profiles").doc(uid1);
    const profile2Doc = firestore.collection("profiles").doc(uid2);

    const profile1 = await profile1Doc.get();
    const profile2 = await profile2Doc.get();

    if (profile1.exists) {
      const likedBy1 = profile1.data()!.likedBy || [];
      const updatedLikedBy1 = likedBy1.filter((id: string) => id !== uid2);
      await profile1Doc.update({ likedBy: updatedLikedBy1 });
      results.updatedProfiles++;
    }

    if (profile2.exists) {
      const likedBy2 = profile2.data()!.likedBy || [];
      const updatedLikedBy2 = likedBy2.filter((id: string) => id !== uid1);
      await profile2Doc.update({ likedBy: updatedLikedBy2 });
      results.updatedProfiles++;
    }

    // 3. Find and delete pairs containing both users
    const pairsQuery = await firestore.collection("pairs").get();

    for (const doc of pairsQuery.docs) {
      const pair = doc.data();
      const playerIds = pair.playerIds || [];

      if (playerIds.includes(uid1) && playerIds.includes(uid2)) {
        const matchId = pair.matchID;
        const pairId = doc.id;

        // Delete the pair document
        await doc.ref.delete();
        results.deletedPairs++;

        // 4. Update the associated duett
        const duettDoc = firestore.collection("duetts").doc(matchId);
        const duett = await duettDoc.get();

        if (duett.exists) {
          const duettData = duett.data()!;
          const updatedMembers = (duettData.members || []).filter(
            (id: string) => id !== uid1 && id !== uid2
          );
          const updatedPairs = (duettData.pairs || []).filter(
            (p: any) => !(p.playerIds && p.playerIds.includes(uid1) && p.playerIds.includes(uid2))
          );

          await duettDoc.update({
            members: updatedMembers,
            pairs: updatedPairs,
          });
          results.updatedDuetts++;
        }

        // 5. Update the associated match
        const matchDoc = firestore.collection("matches").doc(matchId);
        const match = await matchDoc.get();

        if (match.exists) {
          const matchData = match.data()!;
          const updatedPairIds = (matchData.pairIds || []).filter(
            (id: string) => id !== pairId
          );
          const updatedApprovedPairs = (matchData.approvedPairs || []).filter(
            (id: string) => id !== pairId
          );
          const updatedRejectedPairs = (matchData.rejectedPairs || []).filter(
            (id: string) => id !== pairId
          );

          await matchDoc.update({
            pairIds: updatedPairIds,
            approvedPairs: updatedApprovedPairs,
            rejectedPairs: updatedRejectedPairs,
          });
        }

        // 6. Optionally delete messages between the two users in this duett
        const messagesQuery = await firestore
          .collection("messages")
          .where("duettID", "==", matchId)
          .get();

        for (const msgDoc of messagesQuery.docs) {
          const message = msgDoc.data();
          if (message.fromID === uid1 || message.fromID === uid2) {
            await msgDoc.ref.delete();
            results.deletedMessages++;
          }
        }
      }
    }

    // 7. Delete possibleMatches where matchmakers contains both users
    const possibleMatchesQuery = await firestore
      .collection("possibleMatches")
      .where("matchmakers", "array-contains", uid1)
      .get();

    for (const doc of possibleMatchesQuery.docs) {
      const matchmakers = doc.data().matchmakers || [];
      if (matchmakers.includes(uid2)) {
        await doc.ref.delete();
        results.deletedPossibleMatches++;
      }
    }

    // 8. Find and delete the match document containing both users
    const matchesQuery = await firestore.collection("matches").get();

    for (const doc of matchesQuery.docs) {
      const matchData = doc.data();
      const matched = matchData.matched || [];

      // Check if both users are in the matched array
      if (matched.includes(uid1) && matched.includes(uid2)) {
        // Delete the match document
        await doc.ref.delete();
        results.deletedMatches++;

        // Also delete the associated duett if it exists
        const duettDoc = await firestore.collection("duetts").doc(doc.id).get();
        if (duettDoc.exists) {
          await duettDoc.ref.delete();
          results.updatedDuetts++;
        }
      }
    }

    res.json({
      success: true,
      message: `Successfully unmatched ${uid1} and ${uid2}`,
      results: results,
    }).status(200);

  } catch (error) {
    console.error("Error unmatching users:", error);
    res.status(500).json({
      error: "Failed to unmatch users",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
