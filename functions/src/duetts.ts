import * as functions from "firebase-functions";
import {ChatMessage, DuettChat, DuettPlayer, Nudge} from "./types";
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

  // Send welcome message
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
  // @ts-ignore
  const welcomeMessage: ChatMessage = {
    creationDate: FieldValue.serverTimestamp(),
    // eslint-disable-next-line max-len
    text: "Congrats on your match! 🎉 Now let's keep the fun going – your friends have been invited to join the matching and unlock the full Duett experience to start planning together.\n\nLet's take a look at the friends...",
    duettID: duett.id,
    read: false,
    type: "info",
  };
  await firestore.collection("messages").add(welcomeMessage);


  // Build out friend list
  const players = [];
  const friend1 = await dbUtils.getFriends(duett.matchMakers[0], true);
  for (const profile1Friend of friend1) {
    const player: DuettPlayer = {
      avatarURL: profile1Friend.avatarURL,
      uid: profile1Friend.friendUID,
      matchMakerID: duett.matchMakers[0],
      completed: false,
      firstName: profile1Friend.fullName,
    };
    players.push(player);
  }

  const friend2 = await dbUtils.getFriends(duett.matchMakers[1], true);
  for (const profile2Friend of friend2) {
    const player: DuettPlayer = {
      avatarURL: profile2Friend.avatarURL,
      uid: profile2Friend.friendUID,
      matchMakerID: duett.matchMakers[1],
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

  // Find the possibleMatch
  const possibleMatch = await dbUtils.getPossibleMatchFromUID(duettID, toUID);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await pushNotifications.sendPossibleMatchNotification(toUID, "Join our Duett", message, possibleMatch.id!);


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
