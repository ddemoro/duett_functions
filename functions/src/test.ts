import * as functions from "firebase-functions";
import {ChatMessage, Friend, Like, Profile} from "./types";
import dbUtils from "./utils/db_utils";
import pushNotifications from "./push_notifications";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();

// Helper function to create a delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Checks each profile for friends and sends a nudge notification if they have none.
 */
exports.checkFriends = functions.https.onRequest(async (req, res) => {
  const querySnapshot = await firestore.collection("profiles").get();
  for (const document of querySnapshot.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    const id = document.id;
    const querySnapshot = await firestore.collection("friends").where("uid", "==", id).get();

    let hasFriends = false;
    for (const document of querySnapshot.docs) {
      const friend = Object.assign({id: document.id}, document.data() as Friend);
      if (friend.accepted) {
        hasFriends = true;
        break;
      }
    }
    await firestore.collection("profiles").doc(profile.id).update({friends: hasFriends});

    if (!hasFriends) {
      // eslint-disable-next-line max-len
      await pushNotifications.sendPushNotification(profile.id, "Duett Update", "We are testing the final features of Duett. Now it's time to test matching and creating a Duett. We noticed your friends have not accepted your invite. Send them a nudge.");
    }
  }

  res.sendStatus(200);
});

/**
 * Clears various Firestore collections (profiles likedBy, matches, possibleMatches, etc.).
 * WARNING: This is a destructive operation.
 */
exports.clearProfiles = functions.runWith({
  memory: "4GB",
  timeoutSeconds: 540,
}).https.onRequest(async (req, res) => {
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

  const possibleMatchesSnapshot = await firestore.collection("possibleMatches").get();
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

  const notificationsSnapshot = await firestore.collection("notifications").get();
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
exports.testSpecificLikeNotification = functions.https.onRequest(async (req, res) => {
  // const profile = await dbUtils.getProfile("tI6XNS1oLtWt4WjwkdiliJos3f72");
  await pushNotifications.sendLikeNotification("tI6XNS1oLtWt4WjwkdiliJos3f72", "Duett", "We have a match!", "vBOiXFUkuIwHnPQJnABI");

  res.sendStatus(200);
});

/**
 * Creates two "like" documents between hardcoded profile IDs with a delay.
 * Intended for testing match creation logic triggered by mutual likes.
 */
exports.createMatch = functions.https.onRequest(async (req, res) => {
  const like: Like = {
    likedProfileID: "tI6XNS1oLtWt4WjwkdiliJos3f72",
    profileID: "6xS0eag96xugl4FHEJ5p", 
    creationDate: Date.now(),  
  };

  await firestore.collection("likes").add(like);

  // Add 5 second delay
  await sleep(5000);

  const like2: Like = {
    likedProfileID: "6xS0eag96xugl4FHEJ5p",
    profileID: "tI6XNS1oLtWt4WjwkdiliJos3f72",
    creationDate: Date.now(),
  };

  await firestore.collection("likes").add(like2);  


  res.sendStatus(200);
});

/**
 * Fetches and returns the accepted friends for a hardcoded profile ID.
 */
exports.getFriends = functions.https.onRequest(async (req, res) => {
  const friends1 = await dbUtils.getFriends("bxLjcxVZzlexU040cKCnh5xROLq1", true);
  

  res.send(friends1).status(200)
});

/**
 * Tests updating the completion status for a player within a Duett chat message.
 * Uses a hardcoded possibleMatch ID to find the relevant chat.
 */
exports.testUpdatePlayerCompletionStatus = functions.https.onRequest(async (req, res) => {
  const pm = await dbUtils.getPossibleMatch("tI7SdJWi6e8W9BHRCSZZ");

  const completedUID = pm.uid;
  const matchID = pm.matchID;

  // Fond the Chat Message with "players" as type and duettID is the matchID
  const snapshot = await firestore.collection("messages").where("duettID", "==", matchID).get();
  for (const document of snapshot.docs) {
    const chatMessage = Object.assign({id: document.id}, document.data() as ChatMessage);
    if (chatMessage.type == "players") {
      const players = chatMessage.players!;
      for (const player of players) {
        console.log("Completed UID:"+pm.uid +" and "+player.uid);
        if (player.uid == completedUID) {
          player.completed = true;
          console.log("YES");
        }
      }
    }

    await firestore.collection("messages").doc(document.id).update({players: chatMessage.players});
  }

  res.sendStatus(200);
});

/**
 * Makes all profiles of the opposite gender "like" a specific hardcoded profile.
 */
exports.everyoneLikesYou = functions.https.onRequest(async (req, res) => {
  const profileID = "tI6XNS1oLtWt4WjwkdiliJos3f72";
  const profile = await dbUtils.getProfile(profileID);
  const lookFor = profile.gender == "Man" ? "Woman" : "Man";
  const query = await firestore.collection("profiles").where("gender", "==", lookFor).get();
  for (const document of query.docs) {
    const p = Object.assign({id: document.id}, document.data() as Profile);
    const id = document.id;
    const like: Like = {
      likedProfileID: profileID,
      profileID: id,
      creationDate: Date.now(),
    };

    console.log(p.firstName+" "+like);
    await firestore.collection("likes").add(like);
  }


  res.sendStatus(200);
});

/**
 * Sets all choices to 'liked = true' for all possible matches associated with a hardcoded match ID.
 */
exports.testSetAllPossibleMatchChoicesToLiked = functions.https.onRequest(async (req, res) => {
  const match = await dbUtils.getMatch("KvcikxPMJHWxsj3PaDJz");


  // Have all the possible matches like each other
  const pms = await dbUtils.getPossibleMatches(match.id);
  for (const possibleMatch of pms) {
    for (const choice of possibleMatch.choices) {
      choice.liked = true;
    }
    await firestore.collection("possibleMatches").doc(possibleMatch.id).update({choices: possibleMatch.choices});
  }

  res.sendStatus(200);
});

/**
 * Approves the first pair found for a hardcoded match ID by adding both matchmakers to the 'approved' array.
 * This simulates the conditions for creating a Duett.
 */
exports.testApproveFirstPairForMatch = functions.https.onRequest(async (req, res) => {
  const match = await dbUtils.getMatch("KvcikxPMJHWxsj3PaDJz");

  // Have all the possible matches like each other
  const pairs = await dbUtils.getPairs(match.id);
  for (const pair of pairs) {
    const matchMakers = pair.matchMakerIds;
    const app = [];
    app.push(matchMakers[0]);
    await firestore.collection("pairs").doc(pair.id).update({approved: app});
    app.push(matchMakers[1]);
    await firestore.collection("pairs").doc(pair.id).update({approved: app});
    break;
  }

  // A Duett Should be created at this point
  res.sendStatus(200);
});

/**
 * Tests sending a generic push notification to a hardcoded profile ID.
 */
exports.testGenericPushNotification = functions.https.onRequest(async (req, res) => {
  const profileID = "q8Dbzvfs1XWd8Hxz0dHs";

  await pushNotifications.sendPushNotification(profileID, "Test", "test");

  res.sendStatus(200);
});
