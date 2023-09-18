import * as functions from "firebase-functions";
import {Friend, Like, Match, Person, PossibleMatch, Profile} from "./types";
import dbUtils from "./utils/db_utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FieldValue = require("firebase-admin").firestore.FieldValue;


exports.testLike = functions.https.onRequest(async (req, res) => {
  // eslint-disable-next-line max-len
  const like = {
    profileID: "0chklRlWnWhlSOR6Z1GrsPAIzDA2",
    likedProfileID: "hlx1y3vcFAEXmlPNCN1I",
  };

  await firestore.collection("likes").add(like);
  res.sendStatus(200);
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
    matched: [like.profileID, like.likedProfileID],
    creationDate: FieldValue.serverTimestamp(),
    profiles: [personOne, personTwo],
  };

  await firestore.collection("matches").add(match);

  // Create Possible Match
  await createPossibleMatch(match);

  return Promise.resolve();
});

// eslint-disable-next-line valid-jsdoc
/** Creates a <code>possbileMatch</code> **/
async function createPossibleMatch(match: Match) {
  const profiles = match.profiles;

  if (profiles.length !== 2) {
    throw new Error("Expected exactly 2 profiles");
  }

  let profileOne;
  let profileTwo;
  let teamOneProfiles: Friend[] = [];
  let teamTwoProfiles: Friend[] = [];

  for (const person of profiles) {
    const uid = person.profileID;

    try {
      const profile = await dbUtils.getProfile(uid);

      if (!profileOne) {
        profileOne = uid;
        teamOneProfiles = profile.friends;
      } else {
        profileTwo = uid;
        teamTwoProfiles = profile.friends;
      }
    } catch (error) {
      console.error(`Failed to fetch profile for UID: ${uid}`, error);
      throw error; // Or handle the error in another way that makes sense for your application
    }
  }

  const possibleMatches: PossibleMatch = {
    profileOne: profileOne as string,
    profileTwo: profileTwo as string,
    teamOneProfiles: teamOneProfiles,
    teamTwoProfiles: teamTwoProfiles,
    creationDate: FieldValue.serverTimestamp(),
  };

  await firestore.collection("possibleMatches").add(possibleMatches);
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
