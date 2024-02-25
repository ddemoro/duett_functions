import {DuettChat, Friend, Match, Pair, PossibleMatch, Profile} from "../types";

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
async function getPair(pairID: string) {
  const snapshot = await firestore.collection("pairs").doc(pairID).get();
  const document = snapshot.data();
  if (!document) {
    throw new Error("Pair not found: " + pairID);
  } else {
    return Object.assign({id: pairID}, document as Pair);
  }
}

// eslint-disable-next-line require-jsdoc
async function getPossibleMatch(possibleMatchID: string) {
  const snapshot = await firestore.collection("possibleMatches").doc(possibleMatchID).get();
  const document = snapshot.data();
  if (!document) {
    throw new Error("Pair not found: " + possibleMatchID);
  } else {
    return Object.assign({id: possibleMatchID}, document as PossibleMatch);
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

// eslint-disable-next-line require-jsdoc
async function getFriend(friendID: string) {
  const snapshot = await firestore.collection("friends").doc(friendID).get();
  const document = snapshot.data();
  if (!document) {
    throw new Error("Pair not found: " + friendID);
  } else {
    return Object.assign({id: friendID}, document as Friend);
  }
}

// eslint-disable-next-line require-jsdoc
async function getFriends(uid: string, starter: boolean) {
  const querySnapshot = await firestore.collection("friends").where("uid", "==", uid).where("isStarter", "==", starter).get();
  const friends: Friend[] = [];
  for (const document of querySnapshot.docs) {
    const friend = Object.assign({id: document.id}, document.data() as Friend);

    // Make sure they are
    if (friend.friendUID) {
      friends.push(friend);
    }
  }

  return friends;
}

// eslint-disable-next-line require-jsdoc
async function getPossibleMatches(matchID: string) {
  const querySnapshot = await firestore.collection("possibleMatches").where("matchID", "==", matchID).get();
  const matches: PossibleMatch[] = [];
  for (const document of querySnapshot.docs) {
    const match = Object.assign({id: document.id}, document.data() as PossibleMatch);
    matches.push(match);
  }

  return matches;
}

// eslint-disable-next-line require-jsdoc
async function getPairs(matchID: string) {
  const querySnapshot = await firestore.collection("pairs").where("matchID", "==", matchID).get();
  const pairs: Pair[] = [];
  for (const document of querySnapshot.docs) {
    const pair = Object.assign({id: document.id}, document.data() as Pair);
    pairs.push(pair);
  }

  return pairs;
}

// eslint-disable-next-line require-jsdoc
async function getProfilesFromGender(gender: string) {
  const querySnapshot = await firestore.collection("profiles").where("gender", "==", gender).get();
  const profiles: Profile[] = [];
  for (const document of querySnapshot.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    profiles.push(profile);
  }

  return profiles;
}

const dbUtils = {
  getProfile,
  getMatch,
  getDuett,
  getFriends,
  getProfilesFromGender,
  getPossibleMatches,
  getPairs,
  getPair,
  getFriend, getPossibleMatch,
};

export default dbUtils;
