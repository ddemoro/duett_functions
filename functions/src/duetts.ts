import * as functions from "firebase-functions";
import {ChatMessage, DuettChat, DuettPlayer, Notification, Nudge} from "./types";
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

  await pushNotifications.sendPushNotification(profile1.id, "It's a Duett!", profile2.firstName + " agreed with your friend match. You've all been placed in a group chat.");
  await pushNotifications.sendPushNotification(profile2.id, "It's a Duett!", profile1.firstName + " agreed with your friend match. You've all been placed in a group chat.");

  const avatarURLs = [];
  for (const pair of duett.pairs) {
    avatarURLs.push(pair.players[0].avatarURL);
    avatarURLs.push(pair.players[1].avatarURL);
  }

  // Not notify the friends
  for (const profileID of duett.members) {
    // Only notify the pairs
    if (!duett.matchMakers.includes(profileID)) {
      await pushNotifications.sendPushNotification(profile1.id, "It's a Duett!", "Looks like " + profile1.firstName + " and " + profile2.firstName + " feel you would be perfect for a Duett");
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

  // Send welcome message
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
  // @ts-ignore
  const welcomeMessage: ChatMessage = {
    creationDate: FieldValue.serverTimestamp(),
    text: "Congrats on your match! 🎉 Now let's keep the fun going – your friends have been invited to join the matching and unlock the full Duett experience to start planning together.",
    duettID: duett.id,
    read: false,
    type: "info",
  };
  await firestore.collection("messages").add(welcomeMessage);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
  // @ts-ignore
  const actionMessage: ChatMessage = {
    creationDate: FieldValue.serverTimestamp(),
    text: "Let’s take a look at the players…",
    duettID: duett.id,
    read: false,
    type: "info",
  };
  await firestore.collection("messages").add(actionMessage);


  // Build out friend list
  const players = [];
  const friend1 = await dbUtils.getFriends(profile1.id, true);
  for (const profile1Friend of friend1) {
    const player: DuettPlayer = {
      avatarURL: profile1Friend.avatarURL,
      uid: profile1Friend.friendUID,
      matchMakerID: profile1.id,
      completed: false,
      firstName: profile1Friend.fullName,
    };
    players.push(player);
  }

  const friend2 = await dbUtils.getFriends(profile2.id, true);
  for (const profile2Friend of friend2) {
    const player: DuettPlayer = {
      avatarURL: profile2Friend.avatarURL,
      uid: profile2Friend.friendUID,
      matchMakerID: profile2.id,
      firstName: profile2Friend.fullName,
      completed: false,
    };
    players.push(player);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
  // @ts-ignore
  const playersMessage: ChatMessage = {
    creationDate: FieldValue.serverTimestamp(),
    duettID: duett.id,
    read: false,
    players: players,
    type: "players",
  };

  await firestore.collection("messages").add(playersMessage);

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


  // Check if they are friends
  let areFriends = false;
  const friends = await dbUtils.getFriends(fromUID, true);
  for (const friend of friends) {
    if (friend.friendUID == toUID) {
      areFriends = true;
    }
  }

  let message;
  if (areFriends) {
    message = "Hey " + toProfile.firstName + ", it's " + fromProfile.firstName + "! See if my match has any friends you might like.";
  } else {
    message = "Hi " + toProfile.firstName + ", see if you like any of my friends. -" + fromProfile.firstName;
  }


  await pushNotifications.sendDuettMessageNotification(toUID, "Join our Duett", message, duettID);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
  // @ts-ignore
  const infoMessage: ChatMessage = {
    creationDate: FieldValue.serverTimestamp(),
    duettID: duettID,
    read: false,
    text: fromProfile.firstName+" sent a nudge to "+toProfile.firstName,
    type: "info",
  };

  await firestore.collection("messages").add(infoMessage);

  await snap.ref.update({
    creationDate: FieldValue.serverTimestamp(),
  });
  return Promise.resolve();
});
