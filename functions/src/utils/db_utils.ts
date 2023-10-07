import {DuettChat, Match, Profile} from "../types";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();


// eslint-disable-next-line require-jsdoc
async function getProfile(uid: string) {
  const snapshot = await firestore.collection("profiles").doc(uid).get();
  const document = snapshot.data();
  if (!document) {
    throw new Error("Profile not found: " + uid);
  } else {
    return Object.assign({id: uid}, document as Profile);
  }
}

// eslint-disable-next-line require-jsdoc
async function getMatch(id: string) {
  const snapshot = await firestore.collection("matches").doc(id).get();
  const document = snapshot.data();
  if (!document) {
    throw new Error("Match not found: " + id);
  } else {
    return Object.assign({id: id}, document as Match);
  }
}

// eslint-disable-next-line require-jsdoc
async function getDuett(matchID: string) {
  const querySnapshot = await firestore.collection("duetts").where("matchID", "==", matchID).limit(1).get();
  if (!querySnapshot.empty) {
    const document = querySnapshot.docs[0].data();
    if (!document) {
      throw new Error("Match not found: " + matchID);
    } else {
      return Object.assign({id: document.id}, document as DuettChat);
    }
  } else {
    throw new Error("Duett not found from Match: " + matchID);
  }
}

const dbUtils = {
  getProfile,
  getMatch,
  getDuett,
};

export default dbUtils;
