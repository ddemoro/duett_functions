import * as functions from "firebase-functions";
import {Pair} from "./types";
import pushNotifications from "./push_notifications";
import dbUtils from "./utils/db_utils";
import textUtils from "./utils/text_utils";

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
    const firstName = textUtils.getFirstName(profile1.fullName);

    await pushNotifications.notifyPartner(otherUID, "Duett Match Alert", firstName+" picked a match for your Duett date. Let me know if you two are on the same page.", newPair.id );
  }
  return Promise.resolve();
});
