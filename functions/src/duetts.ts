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
  // Get the current timestamp in milliseconds
  const now = Date.now();

  // Calculate the timestamp two years ago
  const oneYearAgoMS = now - 2 * 365 * 24 * 60 * 60 * 1000;


  // Send welcome message
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
  // @ts-ignore
  const welcomeMessage: ChatMessage = {
    creationDate: oneYearAgoMS,
    // eslint-disable-next-line max-len
    text: "Congrats on your match! 🎉 Now let's keep the fun going – your friends have been invited to join the matching and unlock the full Duett experience to start planning together.",
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
    creationDate: now - 1 * 365 * 24 * 60 * 60 * 1000,
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
