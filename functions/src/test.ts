import * as functions from "firebase-functions";
import {Like} from "./types";
import dbUtils from "./utils/db_utils";
import pushNotifications from "./push_notifications";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();

exports.createLike = functions.https.onRequest(async (req, res) => {
  const like: Like = {
    likedProfileID: "hlx1y3vcFAEXmlPNCN1I",
    profileID: "M0PRW3sb1tQljjyH878sFlDmSC63",
    creationDate: Date.now(),
  };

  await firestore.collection("likes").add(like);

  res.sendStatus(200);
});

exports.matchingOne = functions.https.onRequest(async (req, res) => {
  const match = await dbUtils.getMatch("rZ2VnamNbk3fh9GYzNGM");


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
  const match = await dbUtils.getMatch("rZ2VnamNbk3fh9GYzNGM");

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
