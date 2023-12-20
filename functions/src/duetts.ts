import * as functions from "firebase-functions";
import {ChatMessage, DuettChat, Notification} from "./types";
import pushNotifications from "./push_notifications";
import dbUtils from "./utils/db_utils";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FieldValue = require("firebase-admin").firestore.FieldValue;


exports.duettAdded = functions.firestore.document("duetts/{uid}").onCreate(async (snap, context) => {
  // Notify MatchMakers
  const duett = Object.assign({id: snap.id}, snap.data() as DuettChat);
  const profile1 = await dbUtils.getProfile(duett.matchMakers[0]);
  const profile2 = await dbUtils.getProfile(duett.matchMakers[1]);

  await pushNotifications.sendPushNotification(profile1.id, "Duett Created", profile2.firstName + " agreed with your friend match. You've all been placed in a group chat.");
  await pushNotifications.sendPushNotification(profile2.id, "Duett Created", profile1.firstName + " agreed with your friend match. You've all been placed in a group chat.");

  const avatarURLs = [];
  for (const pair of duett.pairs) {
    avatarURLs.push(pair.players[0].avatarURL);
    avatarURLs.push(pair.players[1].avatarURL);
  }

  // Not notify the friends
  for (const profileID of duett.members) {
    // Only notify the pairs
    if (!duett.matchMakers.includes(profileID)) {
      await pushNotifications.sendPushNotification(profile1.id, "Duett Created", "Looks like " + profile1.firstName + " and " + profile2.firstName + " feel you would be perfect for a Duett");
      // Create Notification
      const notification: Notification = {
        creationDate: FieldValue.serverTimestamp(),
        duettID: duett.id,
        text: profile1.firstName + " and " + profile2.firstName + " agreed you would be perfect for a Duett. You've all been placed in a group chat.",
        images: avatarURLs,
        uid: profileID,
        read: false,
      };
      await firestore.collection("notifications").add(notification);
    }
  }

  // Create Notification
  const notificationOne: Notification = {
    creationDate: FieldValue.serverTimestamp(),
    duettID: duett.id,
    text: profile1.firstName + " agreed with your friend match. You've all been placed in a group chat.",
    images: [profile1.media[0].url],
    uid: profile2.id,
    read: false,
  };

  const notificationTwo: Notification = {
    creationDate: FieldValue.serverTimestamp(),
    duettID: duett.id,
    text: profile2.firstName + " agreed with your friend match. You've all been placed in a group chat.",
    images: [profile2.media[0].url],
    uid: profile1.id,
    read: false,
  };
  await firestore.collection("notifications").add(notificationOne);
  await firestore.collection("notifications").add(notificationTwo);
  return Promise.resolve();
});

exports.messageCreated = functions.firestore.document("messages/{uid}").onCreate(async (snap, context) => {
  const message = Object.assign({id: snap.id}, snap.data() as ChatMessage);
  console.log(message);

  // Update Message
  await snap.ref.update({
    creationDate: FieldValue.serverTimestamp(),
  });

  return Promise.resolve();
});
