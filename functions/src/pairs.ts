import * as functions from "firebase-functions";
import {DuettChat, Pair} from "./types";
import pushNotifications from "./push_notifications";
import dbUtils from "./utils/db_utils";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FieldValue = require("firebase-admin").firestore.FieldValue;

exports.pairAdded = functions.firestore.document("pairs/{uid}").onCreate(async (snap, context) => {
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
      duettChat = await dbUtils.getDuett(newPair.id);
    } catch (e) {
      console.log(e);
    }

    if (!duettChat) {
      const duettChat: DuettChat = {
        matchID: newPair.matchID,
        creationDate: FieldValue.serverTimestamp(),
        matchMakers: newPair.matchMakerIds,
        pairs: [newPair],
        members: [newPair.matchMakerIds[0], newPair.matchMakerIds[1], newPair.players[0].uid, newPair.players[1].uid],
      };

      await firestore.collection("duetts").add(duettChat);
    } else {
      // Update
      duettChat.members.push(newPair.players[0].uid, newPair.players[1].uid);
      await firestore.collection("duetts").add(duettChat);
    }
  }
  return Promise.resolve();
});
