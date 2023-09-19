import * as functions from "firebase-functions";
import {Choice, Friend, Like, Match, Person, PossibleMatch, Profile} from "./types";
import dbUtils from "./utils/db_utils";
import textUtils from "./utils/text_utils";
import pushNotifications from "./push_notifications";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FieldValue = require("firebase-admin").firestore.FieldValue;


exports.testLike = functions.https.onRequest(async (req, res) => {
  // eslint-disable-next-line max-len
  const like = {
    profileID: "JjxxN53UP7dm9N8PmhxHy9Fa2IX2",
    likedProfileID: "wYJZChrOo83bLVn659Vh",
  };

  await firestore.collection("likes").add(like);
  res.sendStatus(200);
});

exports.possibleMatchAdded = functions.firestore.document("possibleMatches/{uid}").onCreate(async (snap, context) => {
  const pm = Object.assign({id: snap.id}, snap.data() as PossibleMatch);
  const match = await dbUtils.getMatch(pm.matchID);
  const uid = pm.uid;

  const yourFriendsName = textUtils.getFirstName(pm.friend.fullName);
  let theirFriendsName;
  const people: Person[] = match.profiles;
  if (people[0].profileID !== pm.friend.profileID) {
    theirFriendsName = textUtils.getFirstName(people[0].fullName);
  } else {
    theirFriendsName = textUtils.getFirstName(people[1].fullName);
  }

  const title = "Duett Possible Match Alert";
  const message = yourFriendsName + " matched with " + theirFriendsName + "! Check out which one of her friends you may like.";


  await pushNotifications.notifyTargets(uid, title, message, pm.id);

  return Promise.resolve();
});

exports.likeAdded = functions.firestore.document("likes/{uid}").onCreate(async (snap, context) => {
  const like = Object.assign({id: snap.id}, snap.data() as Like);

  // Update Like
  await snap.ref.update({
    creationDate: FieldValue.serverTimestamp(),
  });

  // We are going have the logic to see if we should make a match here but for now.
  // Let's just make a match
  const profileOne = await firestore.collection("profiles").doc(like.profileID).get();
  const profileTwo = await firestore.collection("profiles").doc(like.likedProfileID).get();

  const p1 = Object.assign({id: profileOne.id}, profileOne.data() as Profile);
  const p2 = Object.assign({id: profileTwo.id}, profileTwo.data() as Profile);


  const personOne: Person = {
    avatarURL: p1.media[0].url,
    fullName: p1.fullName,
    living: p1.living.city + "," + p1.living.state,
    age: calculateAge(p1.birthday.toDate()),
    profileID: p1.id,
  };

  const personTwo: Person = {
    avatarURL: p2.avatarURL,
    fullName: p2.fullName,
    living: p2.living.city + "," + p2.living.state,
    age: calculateAge(p2.birthday.toDate()),
    profileID: p2.id,
  };


  const match: Match = {
    id: "",
    matched: [like.profileID, like.likedProfileID],
    creationDate: FieldValue.serverTimestamp(),
    profiles: [personOne, personTwo],
  };

  const docRef = await firestore.collection("matches").add(match);
  const docId = docRef.id;
  match.id = docId;


  // Create Possible Match
  await startMatching(match);

  return Promise.resolve();
});


// eslint-disable-next-line require-jsdoc
function convertToChoices(friends: Friend[]) {
  const choices: any[] = [];
  friends.forEach((friend) => {
    const choice: Choice = {
      uid: friend.uid,
      fullName: friend.contactName,
      avatarURL: friend.avatarURL,
      liked: false,
      rejected: false,
    };
    choices.push(choice);
  });


  return choices;
}

// eslint-disable-next-line valid-jsdoc
/** Creates a <code>possbileMatch</code> **/
async function startMatching(match: Match) {
  const profiles = match.profiles;

  if (profiles.length !== 2) {
    throw new Error("Expected exactly 2 profiles");
  }

  const person1 = match.profiles[0];
  const profile1 = await dbUtils.getProfile(person1.profileID);

  const person2 = match.profiles[1];
  const profile2 = await dbUtils.getProfile(person2.profileID);


  for (const friend of profile1.friends) {
    const possibleMatch: PossibleMatch = {
      matchID: match.id,
      creationDate: FieldValue.serverTimestamp(),
      friend: person1,
      match: person2,
      choices: convertToChoices(profile2.friends),
      uid: friend.uid,
      completed: false,
    };

    await firestore.collection("possibleMatches").add(possibleMatch);
  }

  for (const friend of profile2.friends) {
    const possibleMatch: PossibleMatch = {
      matchID: match.id,
      creationDate: FieldValue.serverTimestamp(),
      friend: person2,
      match: person1,
      choices: convertToChoices(profile1.friends),
      uid: friend.uid,
      completed: false,
    };

    await firestore.collection("possibleMatches").add(possibleMatch);
  }
}


// eslint-disable-next-line require-jsdoc
function calculateAge(birthdayDate: { getFullYear: () => number; getMonth: () => number; getDate: () => number; }) {
  const today = new Date();
  let age = today.getFullYear() - birthdayDate.getFullYear();
  const monthDiff = today.getMonth() - birthdayDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdayDate.getDate())) {
    age--;
  }

  return age;
}
