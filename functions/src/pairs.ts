import * as functions from "firebase-functions";
import {DuettChat, Pair, Player} from "./types";
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
  await pushNotifications.sendMatchCreatedNotification(uid1, "We have a Pair!", pair.players[0].firstName+" and "+pair.players[1]+" seem to like each other. Let's review.", pair.matchID);
  await pushNotifications.sendMatchCreatedNotification(uid2, "We have a Pair!", pair.players[0].firstName+" and "+pair.players[1]+" seem to like each other. Let's review.", pair.matchID);

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
    }

    if (!duettChat) {
      // Create Pair for matchmakers
      const profile1 = await dbUtils.getProfile(newPair.matchMakerIds[0]);
      const profile2 = await dbUtils.getProfile(newPair.matchMakerIds[1]);
      const player1: Player = {
        avatarURL: profile1.media[0].url,
        uid: profile1.id,
        firstName: profile1.firstName,
        matchMakerID: "",
        matchMakerName: "",
        matchMakerAvatarURL: "",
      };

      const player2: Player = {
        avatarURL: profile2.media[0].url,
        uid: profile2.id,
        firstName: profile2.firstName,
        matchMakerID: "",
        matchMakerName: "",
        matchMakerAvatarURL: "",
      };

      const matchMakers: Pair = {
        matchID: newPair.matchID,
        players: [player1, player2],
        playerIds: [player1.uid, player2.uid],
        matchMakerIds: [],
        rejected: [],
        approved: [],
        creationDate: Date(),
      };


      const duettChat: DuettChat = {
        matchID: newPair.matchID,
        creationDate: FieldValue.serverTimestamp(),
        matchMakers: newPair.matchMakerIds,
        pairs: [matchMakers, newPair],
        members: [newPair.matchMakerIds[0], newPair.matchMakerIds[1], newPair.players[0].uid, newPair.players[1].uid],
      };

      await firestore.collection("duetts").doc(newPair.matchID).set(duettChat);
    } else {
      // Update
      duettChat.members.push(newPair.players[0].uid, newPair.players[1].uid);
      duettChat.pairs.push(newPair);
      await firestore.collection("duetts").doc(newPair.matchID).update(duettChat);
    }
  }
  return Promise.resolve();
});
