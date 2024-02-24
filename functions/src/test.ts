import * as functions from "firebase-functions";
import {Friend, Like, Profile} from "./types";
import dbUtils from "./utils/db_utils";
import pushNotifications from "./push_notifications";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();

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
      await pushNotifications.sendPushNotification(profile.id, "Duett Update", "We are testing the final features of Duett. Now it’s time to test matching and creating a Duett. We noticed your friends have not accepted your invite. Send them a nudge.");
    }
  }

  res.sendStatus(200);
});

exports.clearProfiles = functions.https.onRequest(async (req, res) => {
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


  res.sendStatus(200);
});

exports.testPushNotifications = functions.https.onRequest(async (req, res) => {
  // const profile = await dbUtils.getProfile("tI6XNS1oLtWt4WjwkdiliJos3f72");
  await pushNotifications.sendLikeNotification("tI6XNS1oLtWt4WjwkdiliJos3f72", "Duett", "We have a match!", "vBOiXFUkuIwHnPQJnABI");

  res.sendStatus(200);
});

exports.createLike = functions.https.onRequest(async (req, res) => {
  const like: Like = {
    likedProfileID: "bxLjcxVZzlexU040cKCnh5xROLq1",
    profileID: "y3XQv3a1xcNZlAStearXWmxXhyK2",
    creationDate: Date.now(),
  };

  await firestore.collection("likes").add(like);

  res.sendStatus(200);
});

exports.everyoneLikesYou = functions.https.onRequest(async (req, res) => {
  const profileID = "wRpwOZ7Ju9aB2KHiQsRX5rQQuFA2";
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

exports.matchingOne = functions.https.onRequest(async (req, res) => {
  const match = await dbUtils.getMatch("XkoZvatQ0e5pQbrI749Y");


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

exports.approveOnePair = functions.https.onRequest(async (req, res) => {
  const match = await dbUtils.getMatch("XkoZvatQ0e5pQbrI749Y");

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

exports.testPushNotifications = functions.https.onRequest(async (req, res) => {
  const profileID = "q8Dbzvfs1XWd8Hxz0dHs";

  await pushNotifications.sendPushNotification(profileID, "Test", "test");

  res.sendStatus(200);
});
