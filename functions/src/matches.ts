/* eslint-disable require-jsdoc */
import * as functions from "firebase-functions";
import {Choice, DuettPair, Friend, Like, Match, Pair, Person, Player, PossibleMatch, Profile, Team} from "./types";
import dbUtils from "./utils/db_utils";
import textUtils from "./utils/text_utils";
import pushNotifications from "./push_notifications";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FieldValue = require("firebase-admin").firestore.FieldValue;

exports.matchAdded = functions.firestore.document("matches/{uid}").onCreate(async (snap, context) => {
  return Promise.resolve();
});

exports.matchUpdated = functions.firestore.document("matches/{uid}").onUpdate(async (change, context) => {
  const newMatch = Object.assign({id: change.after.id}, change.after.data() as Match);
  console.log("Match updated: " + newMatch.id);
  return Promise.resolve();
});

exports.possibleMatchUpdated = functions.firestore.document("possibleMatches/{uid}").onUpdate(async (change, context) => {
  const newPM = Object.assign({id: change.after.id}, change.after.data() as PossibleMatch);
  const oldPM = Object.assign({id: change.before.id}, change.before.data() as PossibleMatch);

  const newCompleted = newPM.completed ?? false;
  const oldCompleted = oldPM.completed ?? false;

  if (newCompleted && !oldCompleted) {
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
      for (const pm of pms) {
        await checkForPair(pm, pms);
      }
      await firestore.collection("matches").doc(newPM.matchID).update({completed: true});
    }
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
        console.log(profile.avatarURL);
        const teamOne: Team = {
          avatarURL: profile.media[0].url,
          fullName: profile.fullName,
          profileID: profile.id,
          teamLeaderAvatarURL: possibleMatch.friend.avatarURL,
          teamLeaderName: possibleMatch.friend.fullName,
          teamLeaderID: possibleMatch.friend.profileID,
        };

        const teamTwo: Team = {
          avatarURL: choice.avatarURL,
          fullName: choice.fullName,
          profileID: choice.uid,
          teamLeaderAvatarURL: possibleMatch.match.avatarURL,
          teamLeaderName: possibleMatch.match.fullName,
          teamLeaderID: possibleMatch.match.profileID,
        };

        const pair: Pair = {
          matchID: possibleMatch.matchID,
          creationDate: Date(),
          approved: [],
          rejected: [],
          teams: [teamOne, teamTwo],
          teamIds: [teamOne.profileID, teamTwo.profileID],
        };

        // Let's make sure it's not a duplicate. I don't need to be perfect here.
        const querySnapshot = await firestore.collection("pairs").where("matchID", "==", possibleMatch.matchID).get();
        let exists = false;
        for (const document of querySnapshot.docs) {
          const p = Object.assign({id: document.id}, document.data() as Pair);
          const teams = p.teams;
          const profile1 = teams[0].profileID;
          const profile2 = teams[1].profileID;
          if (pair.teamIds.includes(profile1) && pair.teamIds.includes(profile2)) {
            exists = true;
          }
        }

        // WE HAVE A PAIR
        if (!exists) {
          await firestore.collection("pairs").add(pair);
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
    age: textUtils.calculateAge(p1.birthday.toDate()),
    profileID: p1.id,
  };

  const personTwo: Person = {
    avatarURL: p2.avatarURL,
    fullName: p2.fullName,
    living: p2.living.city + "," + p2.living.state,
    age: textUtils.calculateAge(p2.birthday.toDate()),
    profileID: p2.id,
  };


  const match: Match = {
    matched: [like.profileID, like.likedProfileID],
    creationDate: FieldValue.serverTimestamp(),
    profiles: [personOne, personTwo],
    completed: false,
  };

  const docRef = await firestore.collection("matches").add(match);
  match.id = docRef.id;


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

  await testCreation(match);

  const person1 = match.profiles[0];
  const profile1 = await dbUtils.getProfile(person1.profileID);

  const person2 = match.profiles[1];
  const profile2 = await dbUtils.getProfile(person2.profileID);


  for (const friend of profile1.friends) {
    const possibleMatch: PossibleMatch = {
      matchID: match.id!,
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
      matchID: match.id!,
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

// eslint-disable-next-line valid-jsdoc
async function testCreation(match: Match) {
  const profiles = match.profiles;

  if (profiles.length !== 2) {
    throw new Error("Expected exactly 2 profiles");
  }

  const person1 = match.profiles[0];
  const profile1 = await dbUtils.getProfile(person1.profileID);

  const person2 = match.profiles[1];
  const profile2 = await dbUtils.getProfile(person2.profileID);

  for (const friend of profile1.friends) {
    const player1 = await createPlayer(profile1, friend);

    for (const f2 of profile2.friends) {
      const player2 = await createPlayer(profile2, f2);

      const duettPair: DuettPair = {
        creationDate: FieldValue.serverTimestamp(),
        likes: [],
        rejects: [],
        matchId: match.id!,
        mmApproved: [],
        mmRejected: [],
        players: [player1, player2],
      };

      await firestore.collection("duettPair").add(duettPair);
    }
  }
}

async function createPlayer(profile: Profile, friend: Friend) {
  const friendProfile = await dbUtils.getProfile(friend.uid);

  const player: Player = {
    avatarURL: friendProfile.media[0].url,
    fullName: friendProfile.fullName,
    age: textUtils.calculateAge(friendProfile.birthday.toDate()),
    uid: friendProfile.id,
    location: friendProfile.living.city + "," + friendProfile.living.state,
    mmAvatarURL: profile.media[0].url,
    mmFullName: profile.fullName,
    mmUID: profile.id,
  };

  return player;
}
