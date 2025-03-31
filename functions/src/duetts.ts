import * as functions from "firebase-functions";
import {ChatMessage, Nudge} from "./types";
import pushNotifications from "./push_notifications";
import dbUtils from "./utils/db_utils";
const FieldValue = require("firebase-admin").firestore.FieldValue;


exports.duettAdded = functions.firestore.document("duetts/{uid}").onCreate(async (snap, context) => {
  return Promise.resolve();
});

exports.messageCreated = functions.firestore.document("messages/{uid}").onCreate(async (snap, context) => {
  const message = Object.assign({id: snap.id}, snap.data() as ChatMessage);

  const from = message.fromID;
  const duettID = message.duettID;

  const duett = await dbUtils.getDuett(duettID);
  for (const uid of duett.members) {
    if (uid != from) {
      await pushNotifications.sendDuettMessageNotification(uid, message.firstName, message.text, duettID);
    }
  }


  return Promise.resolve();
});

exports.nudgeCreated = functions.firestore.document("nudges/{uid}").onCreate(async (snap, context) => {
  const nudge = Object.assign({id: snap.id}, snap.data() as Nudge);

  const fromUID = nudge.fromUID!;
  const duettID = nudge.duettID!;
  const toUID = nudge.uid!;
  const fromProfile = await dbUtils.getProfile(fromUID);
  const toProfile = await dbUtils.getProfile(toUID);


  const message = "Hey " + toProfile.firstName + ", it's " + fromProfile.firstName + "! See if my match has any friends you might like.";

  // Find the possibleMatch
  const possibleMatch = await dbUtils.getPossibleMatchFromUID(duettID, toUID);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await pushNotifications.sendPossibleMatchNotification(toUID, "Join our Duett", message, possibleMatch.id!);


  const match = await dbUtils.getMatch(duettID);
  const uid1 = match.matched[0];
  const uid2 = match.matched[1];
  await pushNotifications.sendDuettMessageNotification(uid1 == fromUID ? uid2 : uid1, "Nudge Sent", fromProfile.firstName + " sent a nudge to their friend " + toProfile.firstName, duettID);


  await snap.ref.update({
    creationDate: FieldValue.serverTimestamp(),
  });
  return Promise.resolve();
});
