/* eslint-disable require-jsdoc,@typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment */
import * as functions from "firebase-functions";
import {
  Choice,
  Friend,
  Like,
  Match,
  Pair,
  Person,
  Player,
  PossibleMatch,
  Profile,
} from "./types";
import dbUtils from "./utils/db_utils";
import textUtils from "./utils/text_utils";
import pushNotifications from "./push_notifications";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FieldValue = require("firebase-admin").firestore.FieldValue;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");


exports.matchAdded = functions.firestore.document("matches/{uid}").onCreate(async (snap, context) => {
  return Promise.resolve();
});

exports.matchUpdated = functions.firestore.document("matches/{uid}").onUpdate(async (change, context) => {
  const newMatch = Object.assign({id: change.after.id}, change.after.data() as Match);
  console.log("Match updated: " + newMatch.id);
  return Promise.resolve();
});

interface SmallProfile {
    id: string;
    firstName: string;
    age: any;
    latitude: number;
    longitude: number;
    gender: string;
    datingType: string;
    height: number;
    ethnicity: string;
    children: string;
    hometown: string;
    work: string;
    jobTitle: string;
    school: string;
    education: string;
    religion: string;
    politics: string;
    drinks: string;
    smoke: string;
    weed: string;
    drugs: string;
    about: string;
    qualities: string;
    memorableMoments: string;
}

exports.createProfileText = functions.https.onRequest(async (req, res) => {
  // const profile = await dbUtils.getProfile("0chklRlWnWhlSOR6Z1GrsPAIzDA2");
  // console.log(profile);

  const querySnapshot = await firestore.collection("profiles").where("configured", "==", true).get();
  const profiles: Profile[] = [];
  for (const document of querySnapshot.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    profiles.push(profile);
  }


  const json = [];


  // @ts-ignore
  for (const person of profiles) {
    try {
      const profile: SmallProfile = {
        id: person.id,
        about: person.about,
        age: calculateAge(person.birthday),
        gender: person.gender,
        children: person.children,
        latitude: person.living.latitude,
        longitude: person.living.longitude,
        datingType: person.datingType,
        drinks: person.drinks.data,
        drugs: person.drugs.data,
        smoke: person.smoke.data,
        education: person.education.data,
        firstName: person.firstName,
        ethnicity: person.ethnicity,
        height: person.height,
        hometown: person.hometown.data,
        jobTitle: person.jobTitle.data,
        memorableMoments: person.memorableMoments,
        politics: person.politics.data,
        qualities: person.qualities,
        religion: person.religion.data,
        school: person.school.data,
        weed: person.weed.data,
        work: person.work.data,

      };
      json.push(profile);
    } catch (e) {/* empty */
    }
  }

  function calculateAge(birthDate: any) {
    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  const file = fs.createWriteStream("dating.json");
  file.write("[");
  json.forEach((user) => {
    file.write(JSON.stringify(user) + ",\n");
  });
  file.write("]");

  file.end();
  res.sendStatus(200);
});

exports.possibleMatchUpdated = functions.firestore.document("possibleMatches/{uid}").onUpdate(async (change, context) => {
  const newPM = Object.assign({id: change.after.id}, change.after.data() as PossibleMatch);
  // const oldPM = Object.assign({id: change.before.id}, change.before.data() as PossibleMatch);


  const pms: PossibleMatch[] = [];

  // Go through all the other possible matches to see if they are completed.
  // If so, set Match completed to true
  let allMatchesCompleted = true;
  const querySnapshot = await firestore.collection("possibleMatches").where("matchID", "==", newPM.matchID).get();
  for (const document of querySnapshot.docs) {
    const possibleMatch = Object.assign({id: document.id}, document.data() as PossibleMatch);
    if (!possibleMatch.completed) {
      allMatchesCompleted = false;
    }
    pms.push(possibleMatch);
  }

  if (allMatchesCompleted) {
    await firestore.collection("matches").doc(newPM.matchID).update({completed: true});
  }

  // Make pairs when possible
  for (const pm of pms) {
    await checkForPair(pm, pms);
  }


  return Promise.resolve();
});

async function likeMe(myProfileID: string, theirProfileID: string, possibleMatches: PossibleMatch[]) {
  for (const possibleMatch of possibleMatches) {
    if (possibleMatch.uid === theirProfileID) {
      for (const choice of possibleMatch.choices) {
        if (choice.uid === myProfileID) {
          return choice.liked;
        }
      }
    }
  }

  return false;
}

async function checkForPair(possibleMatch: PossibleMatch, possibleMatches: PossibleMatch[]) {
  for (const choice of possibleMatch.choices) {
    if (choice.liked) {
      const doTheyLikeMe = await likeMe(possibleMatch.uid, choice.uid, possibleMatches);
      if (doTheyLikeMe) {
        const profile = await dbUtils.getProfile(possibleMatch.uid);

        const playerOne: Player = {
          avatarURL: profile.media[0].url,
          firstName: profile.firstName,
          uid: profile.id,
          matchMakerAvatarURL: possibleMatch.friend.avatarURL,
          matchMakerName: possibleMatch.friend.firstName,
          matchMakerID: possibleMatch.friend.profileID,
        };

        const playerTwo: Player = {
          avatarURL: choice.avatarURL,
          firstName: choice.firstName,
          uid: choice.uid,
          matchMakerAvatarURL: possibleMatch.match.avatarURL,
          matchMakerName: possibleMatch.match.firstName,
          matchMakerID: possibleMatch.match.profileID,
        };

        const pair: Pair = {
          matchID: possibleMatch.matchID,
          creationDate: FieldValue.serverTimestamp(),
          approved: [],
          rejected: [],
          players: [playerOne, playerTwo],
          playerIds: [playerOne.uid, playerTwo.uid],
          matchMakerIds: [playerOne.matchMakerID, playerTwo.matchMakerID],
        };

        // Let's make sure it's not a duplicate. I don't need to be perfect here.
        const querySnapshot = await firestore.collection("pairs").where("matchID", "==", possibleMatch.matchID).get();
        let exists = false;
        for (const document of querySnapshot.docs) {
          const p = Object.assign({id: document.id}, document.data() as Pair);
          const players = p.players;
          const profile1 = players[0].uid;
          const profile2 = players[1].uid;
          if (pair.playerIds.includes(profile1) && pair.playerIds.includes(profile2)) {
            exists = true;
          }
        }

        // WE HAVE A PAIR
        if (!exists) {
          const docRef = await firestore.collection("pairs").add(pair);
          const pairID = docRef.id;

          // Add this to match Array
          const matchID = pair.matchID;
          const match = await dbUtils.getMatch(matchID);
          const pairIds = match.pairIds ?? [];
          pairIds.push(pairID);
          await firestore.collection("matches").doc(matchID).update({pairIds: pairIds});
        }
      }
    }
  }
}


exports.testLike = functions.https.onRequest(async (req, res) => {
  // eslint-disable-next-line max-len
  const like = {
    profileID: "0chklRlWnWhlSOR6Z1GrsPAIzDA2",
    likedProfileID: "wYJZChrOo83bLVn659Vh",
  };

  await firestore.collection("likes").add(like);
  res.sendStatus(200);
});

exports.testPairing = functions.https.onRequest(async (req, res) => {
  const querySnapshot = await firestore.collection("possibleMatches").get();
  for (const document of querySnapshot.docs) {
    const possibleMatch = Object.assign({id: document.id}, document.data() as PossibleMatch);
    for (const choice of possibleMatch.choices) {
      choice.liked = true;
      choice.rejected = false;
    }
    possibleMatch.completed = true;
    // Update the document in Firestore with the modified data
    await firestore.collection("possibleMatches").doc(document.id).update(possibleMatch);
  }


  res.sendStatus(200);
});


exports.upgradeProfile = functions.https.onRequest(async (req, res) => {
  const querySnapshot = await firestore.collection("profiles").get();
  for (const document of querySnapshot.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    const fullName = "";
    const firstName = "";
    const indexOfSpace = fullName.indexOf(" ");
    const lastName = fullName.substring(indexOfSpace + 1);
    await firestore.collection("profiles").doc(profile.id).update({firstName: firstName, lastName: lastName});
  }


  res.sendStatus(200);
});

function delay(ms: number | undefined) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

exports.everyoneLikesEveryone = functions.runWith({
  memory: "4GB",
  timeoutSeconds: 540,
}).https.onRequest(async (req, res) => {
  const querySnapshot = await firestore.collection("possibleMatches").get();
  for (const document of querySnapshot.docs) {
    const possibleMatch = Object.assign({id: document.id}, document.data() as PossibleMatch);
    const choices = possibleMatch.choices;
    for (const choice of choices) {
      choice.liked = true;
      await firestore.collection("possibleMatches").doc(possibleMatch.id).update(possibleMatch);
      await delay(2000);
    }
  }

  res.sendStatus(200);
});

exports.testPairCreation = functions.https.onRequest(async (req, res) => {
  const matchID = "zuBAN2Xg5SSHThqNvTrd";
  const pms: PossibleMatch[] = [];

  let allMatchesCompleted = true;
  const querySnapshot = await firestore.collection("possibleMatches").where("matchID", "==", matchID).get();
  for (const document of querySnapshot.docs) {
    const possibleMatch = Object.assign({id: document.id}, document.data() as PossibleMatch);
    if (!possibleMatch.completed) {
      allMatchesCompleted = false;
    }

    pms.push(possibleMatch);
  }

  if (allMatchesCompleted) {
    for (const pm of pms) {
      await checkForPair(pm, pms);
    }
    await firestore.collection("matches").doc(matchID).update({completed: true});
  }

  res.sendStatus(200);
});

exports.possibleMatchAdded = functions.firestore.document("possibleMatches/{uid}").onCreate(async (snap, context) => {
  const pm = Object.assign({id: snap.id}, snap.data() as PossibleMatch);
  const match = await dbUtils.getMatch(pm.matchID);
  const uid = pm.uid;

  const yourFriendsName = pm.friend.firstName;
  let theirFriendsName;
  const people: Person[] = match.profiles;
  if (people[0].profileID !== pm.friend.profileID) {
    theirFriendsName = people[0].firstName;
  } else {
    theirFriendsName = people[1].firstName;
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
    firstName: p1.firstName,
    living: p1.living.city + "," + p1.living.state,
    age: textUtils.calculateAge(p1.birthday.toDate()),
    profileID: p1.id,
  };

  const personTwo: Person = {
    avatarURL: p2.avatarURL,
    firstName: p2.firstName,
    living: p2.living.city + "," + p2.living.state,
    age: textUtils.calculateAge(p2.birthday.toDate()),
    profileID: p2.id,
  };


  const match: Match = {
    matched: [like.profileID, like.likedProfileID],
    creationDate: FieldValue.serverTimestamp(),
    profiles: [personOne, personTwo],
    pairIds: [],
    approvedPairs: [],
    rejectedPairs: [],
    completed: false,
  };

  const docRef = await firestore.collection("matches").add(match);
  match.id = docRef.id;


  // Create Possible Match
  await startMatching(match);

  return Promise.resolve();
});


// eslint-disable-next-line require-jsdoc
async function convertToChoices(friends: Friend[]) {
  const choices: any[] = [];
  for (const friend of friends) {
    const snapshot = await firestore.collection("profiles").doc(friend.uid).get();
    const profile = Object.assign({id: snapshot.id}, snapshot.data() as Profile);

    const choice: Choice = {
      uid: friend.uid,
      firstName: profile.firstName,
      avatarURL: profile.media[0].url,
      liked: false,
      rejected: false,
    };
    choices.push(choice);
  }


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

  const friends1 = await dbUtils.getFriends(profile1.id, true);
  const friends2 = await dbUtils.getFriends(profile2.id, true);
  for (const friend of friends1) {
    const possibleMatch: PossibleMatch = {
      matchID: match.id!,
      creationDate: FieldValue.serverTimestamp(),
      friend: person1,
      match: person2,
      choices: await convertToChoices(friends2),
      uid: friend.uid,
      completed: false,
    };

    await firestore.collection("possibleMatches").add(possibleMatch);
  }

  for (const friend of friends2) {
    const possibleMatch: PossibleMatch = {
      matchID: match.id!,
      creationDate: FieldValue.serverTimestamp(),
      friend: person2,
      match: person1,
      choices: await convertToChoices(friends1),
      uid: friend.uid,
      completed: false,
    };

    await firestore.collection("possibleMatches").add(possibleMatch);
  }
}

// @ts-ignore
exports.generateText = functions.https.onRequest(async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {Configuration, OpenAIApi} = require("openai");
  const configuration = new Configuration({
    apiKey: "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",
  });
  const openai = new OpenAIApi(configuration);


  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003", // Specify the model
      prompt: "Who are the 49ers?", // Text prompt from the client
      max_tokens: 150, // Maximum number of tokens to generate
    });

    return {response: response.data.choices[0].text};
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError("internal", "OpenAI request failed");
  }
});
