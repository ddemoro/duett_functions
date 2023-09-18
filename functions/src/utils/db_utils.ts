import {Match, Profile} from "../types";

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

const dbUtils = {
  getProfile,
  getMatch,
};

export default dbUtils;
