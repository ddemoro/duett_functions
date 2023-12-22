import * as functions from "firebase-functions";
import {Like} from "./types";
import dbUtils from "./utils/db_utils";
import pushNotifications from "./push_notifications";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();

exports.clear = functions.https.onRequest(async (req, res) => {
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


  const like: Like = {
    likedProfileID: "hlx1y3vcFAEXmlPNCN1I",
    profileID: "bxLjcxVZzlexU040cKCnh5xROLq1",
    creationDate: Date.now(),
  };

  await firestore.collection("likes").add(like);

  res.sendStatus(200);
});

exports.matchingOne = functions.https.onRequest(async (req, res) => {
  const match = await dbUtils.getMatch("7ZAghIlNJ5lypuk201TW");


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
  const match = await dbUtils.getMatch("7ZAghIlNJ5lypuk201TW");

  // Have all the possible matches like each other
  const pairs = await dbUtils.getPairs(match.id);
  for (const pair of pairs) {
    const matchMakers = pair.matchMakerIds;
    await firestore.collection("pairs").doc(pair.id).update({approved: matchMakers});
  }

  // A Duett Should be created at this point
  res.sendStatus(200);
});

exports.testPushNotifications = functions.https.onRequest(async (req, res) => {
  const profileID = "q8Dbzvfs1XWd8Hxz0dHs";

  await pushNotifications.sendPushNotification(profileID, "Test", "test");

  res.sendStatus(200);
});
