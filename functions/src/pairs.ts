import * as functions from "firebase-functions";
import {ChatMessage, Notification, Pair} from "./types";
import pushNotifications from "./push_notifications";
import dbUtils from "./utils/db_utils";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FieldValue = require("firebase-admin").firestore.FieldValue;

exports.pairAdded = functions.firestore.document("pairs/{uid}").onCreate(async (snap, context) => {
  const pair = Object.assign({id: snap.id}, snap.data() as Pair);
  const uid1 = pair.matchMakerIds[0];
  const uid2 = pair.matchMakerIds[1];

  // Notify the couple
  // eslint-disable-next-line max-len
  await pushNotifications.sendMatchCreatedNotification(uid1, "We have a Pair!", pair.players[0].firstName + " and " + pair.players[1].firstName + " seem to like each other. Let's review.", pair.matchID);
  // eslint-disable-next-line max-len
  await pushNotifications.sendMatchCreatedNotification(uid2, "We have a Pair!", pair.players[0].firstName + " and " + pair.players[1].firstName + " seem to like each other. Let's review.", pair.matchID);

  return Promise.resolve();
});

exports.pairUpdated = functions.firestore.document("pairs/{uid}").onUpdate(async (change, context) => {
  const newPair = Object.assign({id: change.after.id}, change.after.data() as Pair);
  const oldPair = Object.assign({id: change.before.id}, change.before.data() as Pair);


  if (newPair.approved.length === 1 && oldPair.approved.length === 0) {
    // One of the match makers approved a pairing, so notify the other person
    const uid = newPair.approved[0];
    const otherUID = newPair.players[0].matchMakerID == uid ? newPair.players[1].matchMakerID : newPair.players[0].matchMakerID;

    const profile1 = await dbUtils.getProfile(uid);
    const firstName = profile1.firstName;

    await pushNotifications.notifyPartner(otherUID, "Duett Match Alert", firstName + " picked a match for your Duett date. Let me know if you two are on the same page.", newPair.id);
  } else if (newPair.approved.length == 2 && oldPair.approved.length == 1) {
    // This has been approved by the matchmakers, create or update a Duett

    // First let's see if a Duett already exists
    let duettChat;
    try {
      duettChat = await dbUtils.getDuett(newPair.matchID);
    } catch (e) {
      console.log(e);
      return Promise.resolve();
    }


    // Update
    duettChat.members.push(newPair.players[0].uid, newPair.players[1].uid);
    duettChat.pairs.push(newPair);
    await firestore.collection("duetts").doc(newPair.matchID).update(duettChat);

    // Clear all messages in the chat
    const messagesQuery = await firestore.collection("messages").where("duettID", "==", duettChat.id).get();
    for (const document of messagesQuery.docs) {
      await firestore.collection("messages").doc(document.id).delete();
    }

    // Notify the Match Makers
    const profile1 = await dbUtils.getProfile(duettChat.matchMakers[0]);
    const profile2 = await dbUtils.getProfile(duettChat.matchMakers[1]);
    await pushNotifications.sendPushNotification(profile1.id, "It's a Duett!", profile2.firstName + " agreed with your friend match. You've all been placed in a group chat.");
    await pushNotifications.sendPushNotification(profile2.id, "It's a Duett!", profile1.firstName + " agreed with your friend match. You've all been placed in a group chat.");

    // Notify the New Members
    const avatarURLs = [];

    avatarURLs.push(newPair.players[0].avatarURL);
    avatarURLs.push(newPair.players[1].avatarURL);


    // Not notify the friends
    for (const profileID of duettChat.members) {
      // Only notify the pairs
      if (!duettChat.matchMakers.includes(profileID)) {
        await pushNotifications.sendPushNotification(profile1.id, "It's a Duett!", "Looks like " + profile1.firstName + " and " + profile2.firstName + " feel you would be perfect for a Duett");
        // Create Notification
        const notification: Notification = {
          creationDate: FieldValue.serverTimestamp(),
          duettID: duettChat.id,
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
      duettID: duettChat.id,
      text: profile1.firstName + " agreed with your friend match. You've all been placed in a group chat.",
      images: [profile1.media[0].url],
      uid: profile2.id,
      read: false,
    };

    const notificationTwo: Notification = {
      creationDate: FieldValue.serverTimestamp(),
      duettID: duettChat.id,
      text: profile2.firstName + " agreed with your friend match. You've all been placed in a group chat.",
      images: [profile2.media[0].url],
      uid: profile1.id,
      read: false,
    };
    await firestore.collection("notifications").add(notificationOne);
    await firestore.collection("notifications").add(notificationTwo);


    const match = await dbUtils.getMatch(newPair.matchID);
    const approvedPairs = match.approvedPairs ?? [];
    approvedPairs.push(newPair.id);
    await firestore.collection("matches").doc(newPair.matchID).update({approvedPairs: approvedPairs});


    // Send welcome message
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
    // @ts-ignore
    const welcomeMessage: ChatMessage = {
      creationDate: FieldValue.serverTimestamp(),
      text: "Congrats on your Duett! 🎉 It's time for all of you to plan a date!",
      duettID: duettChat.id,
      read: false,
      type: "info",
    };
    await firestore.collection("messages").add(welcomeMessage);
    await firestore.collection("duetts").doc(duettChat.id).update({enabled: true});
  }
  return Promise.resolve();
});
