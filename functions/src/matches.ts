/* eslint-disable require-jsdoc,@typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment */
import * as functions from "firebase-functions";
import {
  ChatMessage,
  Choice, DuettChat,
  Friend,
  Like,
  Match, Notification,
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
  const match = Object.assign({id: snap.id}, snap.data() as Match);
  const uid1 = match.matched[0];
  const uid2 = match.matched[1];

  await pushNotifications.sendMatchCreatedNotification(uid1, "You have a Match!", "You have matched up with " + match.profiles[1].firstName + ". Let's get a Duett going.", match.id);
  await pushNotifications.sendMatchCreatedNotification(uid2, "You have a Match!", "You have matched up with " + match.profiles[0].firstName + ". Let's get a Duett going.", match.id);


  const notification: Notification = {
    creationDate: FieldValue.serverTimestamp(),
    matchID: match.id,
    text: match.profiles[1].firstName + " and you have been matched up.",
    images: [match.profiles[0].avatarURL, match.profiles[1].avatarURL],
    uid: uid1,
    read: false,
  };

  const notification2: Notification = {
    creationDate: FieldValue.serverTimestamp(),
    matchID: match.id,
    text: "Matched Alert! You and " + match.profiles[0].firstName + " have been matched up.",
    images: [match.profiles[1].avatarURL, match.profiles[0].avatarURL],
    uid: uid2,
    read: false,
  };

  await firestore.collection("notifications").add(notification);
  await firestore.collection("notifications").add(notification2);

  const profile1 = await dbUtils.getProfile(uid1);
  const profile2 = await dbUtils.getProfile(uid2);
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
    matchID: match.id,
    players: [player1, player2],
    playerIds: [player1.uid, player2.uid],
    matchMakerIds: [],
    rejected: [],
    approved: [],
    creationDate: Date(),
  };

  const duettChat: DuettChat = {
    matchID: match.id,
    creationDate: FieldValue.serverTimestamp(),
    matchMakers: [uid1, uid2],
    pairs: [matchMakers],
    members: [uid1, uid2],
  };

  await firestore.collection("duetts").doc(match.id).set(duettChat);

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
  const oldPM = Object.assign({id: change.before.id}, change.before.data() as PossibleMatch);
  if (newPM.completed && !oldPM.completed) {
    const completedUID = newPM.uid;
    const matchID = newPM.matchID;

    // Fond the Chat Message with "players" as type and duettID is the matchID
    const snapshot = await firestore.collection("messages").where("duettID", "==", matchID).get();
    for (const document of snapshot.docs) {
      const chatMessage = Object.assign({id: document.id}, document.data() as ChatMessage);
      if (chatMessage.type == "players") {
        const players = chatMessage.players!;
        for (const player of players) {
          if (player.uid == completedUID) {
            player.completed = true;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
            // @ts-ignore
            const infoMessage: ChatMessage = {
              creationDate: FieldValue.serverTimestamp(),
              duettID: chatMessage.duettID,
              read: false,
              text: player.firstName+" has selected their possible matches.",
              type: "info",
            };

            await firestore.collection("messages").add(infoMessage);
          }
        }
      }

      await firestore.collection("messages").doc(document.id).update({players: chatMessage.players});
    }
  }


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

        const ids = await compareAndOrderStrings(pair.playerIds[0], pair.playerIds[1]);
        const pairID = pair.matchID + "-" + ids[0] + "-" + ids[1];


        try {
          await dbUtils.getPair(pairID);
        } catch (e) {
          await firestore.collection("pairs").doc(pairID).set(pair);

          // Add this to match Array
          const matchID = pair.matchID;
          const match = await dbUtils.getMatch(matchID);
          const pairIds = match.pairIds ?? [];
          if (!pairIds.includes(pairID)) {
            pairIds.push(pairID);
            await firestore.collection("matches").doc(matchID).update({pairIds: pairIds});
          }
        }
      }
    }
  }
}

async function compareAndOrderStrings(str1: string, str2: string) {
  // Use localeCompare for accurate string comparison across locales
  const comparisonResult = str1.localeCompare(str2);

  if (comparisonResult < 0) {
    // str1 is less than str2
    return [str1, str2];
  } else if (comparisonResult > 0) {
    // str1 is greater than str2
    return [str2, str1];
  } else {
    // Strings are equal
    return [str1, str2]; // Or return [str2, str1], as they are equivalent
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


// Removes the matches and the likedBy
exports.clearProfiles = functions.https.onRequest(async (req, res) => {
  const querySnapshot = await firestore.collection("profiles").get();
  for (const document of querySnapshot.docs) {
    await firestore.collection("profiles").doc(document.id).update({
      likedBy: [],

    });
  }

  const matchesQuerySnapshot = await firestore.collection("matches").get();
  for (const document of matchesQuerySnapshot.docs) {
    await document.ref.delete();
  }

  const possibleMatchesSnapshot = await firestore.collection("possibleMatches").get();
  for (const document of possibleMatchesSnapshot.docs) {
    await document.ref.delete();
  }

  const likesSnapshot = await firestore.collection("likes").get();
  for (const document of likesSnapshot.docs) {
    await document.ref.delete();
  }

  const pairsSnapshot = await firestore.collection("pairs").get();
  for (const document of pairsSnapshot.docs) {
    await document.ref.delete();
  }

  const notificationsSnapshot = await firestore.collection("notifications").get();
  for (const document of notificationsSnapshot.docs) {
    await document.ref.delete();
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
  const message = yourFriendsName + " matched with " + theirFriendsName + "! Check out which one of their friends you may like.";


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

  const profileOne = await dbUtils.getProfile(like.profileID);
  const profileTwo = await dbUtils.getProfile(like.likedProfileID);


  if (profileTwo.likedBy.includes(profileOne.id)) {
    return Promise.resolve();
  }

  // Add that they were liked by p1
  const likedBy = profileTwo.likedBy ?? [];
  likedBy.push(profileOne.id);
  await firestore.collection("profiles").doc(profileTwo.id).update({likedBy: likedBy});

  // Check if they now both like each other
  if (profileOne.likedBy.includes(profileTwo.id) && profileTwo.likedBy.includes(profileOne.id)) {
    const personOne: Person = {
      avatarURL: profileOne.media[0].url,
      firstName: profileOne.firstName,
      living: profileOne.living.city + "," + profileOne.living.state,
      age: textUtils.calculateAge(profileOne.birthday.toDate()),
      profileID: profileOne.id,
    };

    const personTwo: Person = {
      avatarURL: profileTwo.media[0].url,
      firstName: profileTwo.firstName,
      living: profileTwo.living.city + "," + profileTwo.living.state,
      age: textUtils.calculateAge(profileTwo.birthday.toDate()),
      profileID: profileTwo.id,
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
  } else {
    await pushNotifications.sendPushNotification("tI6XNS1oLtWt4WjwkdiliJos3f72", "Matches Happening", profileOne.firstName + " liked " + profileTwo.firstName);
    /*
        await pushNotifications.sendLikeNotification(profileTwo.id, "Duett", profileOne.firstName + " just liked you! Act fast to see if they're a match.", profileOne.id);

        // Create notification
        const notification: Notification = {
          creationDate: FieldValue.serverTimestamp(),
          likedByUID: profileOne.id,
          text: profileOne.firstName + " just liked you! Act fast to see if they're a match.",
          images: [profileOne.media[0].url],
          uid: profileTwo.id,
          read: false,
        };
        await firestore.collection("notifications").add(notification);

         */
  }


  return Promise.resolve();
});


// eslint-disable-next-line require-jsdoc
async function convertToChoices(friends: Friend[]) {
  const choices: any[] = [];
  for (const friend of friends) {
    const snapshot = await firestore.collection("profiles").doc(friend.friendUID).get();
    const profile = Object.assign({id: snapshot.id}, snapshot.data() as Profile);

    const choice: Choice = {
      uid: friend.friendUID,
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

  if (friends1.length == 0 || friends2.length == 0) {
    console.log("No friends to match with");
    return;
  }

  for (const friend of friends1) {
    const possibleMatch: PossibleMatch = {
      matchID: match.id!,
      creationDate: FieldValue.serverTimestamp(),
      friend: person1,
      match: person2,
      choices: await convertToChoices(friends2),
      uid: friend.friendUID,
      completed: false,
    };

    const images = [];
    for (const choice of possibleMatch.choices) {
      images.push(choice.avatarURL);
    }

    const ref = await firestore.collection("possibleMatches").add(possibleMatch);

    const notification: Notification = {
      creationDate: FieldValue.serverTimestamp(),
      possibleMatchID: ref.id,
      text: profile1.firstName + " matched up with " + profile2.firstName + ". See if you like any of their friends.",
      images: images,
      uid: friend.friendUID,
      read: false,
    };

    await firestore.collection("notifications").add(notification);
  }

  for (const friend of friends2) {
    const possibleMatch: PossibleMatch = {
      matchID: match.id!,
      creationDate: FieldValue.serverTimestamp(),
      friend: person2,
      match: person1,
      choices: await convertToChoices(friends1),
      uid: friend.friendUID,
      completed: false,
    };

    const images = [];
    for (const choice of possibleMatch.choices) {
      images.push(choice.avatarURL);
    }

    const ref = await firestore.collection("possibleMatches").add(possibleMatch);

    const notification: Notification = {
      creationDate: FieldValue.serverTimestamp(),
      possibleMatchID: ref.id,
      text: profile2.firstName + " matched up with " + profile1.firstName + ". See if you like any of their friends.",
      images: images,
      uid: friend.friendUID,
      read: false,
    };

    await firestore.collection("notifications").add(notification);
  }
}

// @ts-ignore
exports.matchMeUp = functions.runWith({
  timeoutSeconds: 300,
  memory: "2GB",
}).https.onRequest(async (req, res) => {
  const profile = await dbUtils.getProfile("0chklRlWnWhlSOR6Z1GrsPAIzDA2");


  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const OpenAI = require("openai");
  const openai = new OpenAI({
    organization: "org-NBbRZYbyGkOuvHrABmlrUZYe",
    apiKey: "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",
  });

  // Create thread
  const thread = await openai.beta.threads.create({
    messages: [
      {
        "role": "user",
        // eslint-disable-next-line max-len
        "content": "Give me a minimum of 5 results of people who match the gender " + profile.datingType + " and who you think match up with my profile which is in JSON structure. The results must include their id and firstName and be in json format. Do not be verbose or include anything other than the JSON in the results. Here is my profile in json: " + JSON.stringify(profile),
      },
    ],
  });


  // Run thread with assistant
  const run = await openai.beta.threads.runs.create(
    thread.id,
    {assistant_id: "asst_WZg4DoXe1CQ0nmhcPlrykmPJ"}
  );

  // Retrieve
  // Run thread with assistant
  let runStatus = await openai.beta.threads.runs.retrieve(
    thread.id,
    run.id
  );

  // Polling mechanism to see if runStatus is completed
  // This should be made more robust.
  while (runStatus.status !== "completed") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  }

  // @ts-ignore
  const messages = await openai.beta.threads.messages.list(thread.id);


  // Find the last message for the current run
  const lastMessageForRun = messages.data
    .filter(
      (message: { run_id: any; role: string; }) => message.run_id === run.id && message.role === "assistant"
    )
    .pop();

  // If an assistant message is found, console.log() it
  if (lastMessageForRun) {
    const text = lastMessageForRun.content[0].text.value;
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant designed to output JSON.",
        },
        {role: "user", content: "Take the following text and only give me back json: " + text},
      ],
      model: "gpt-3.5-turbo-1106",
      response_format: {type: "json_object"},
    });
    console.log(completion.choices[0].message.content);
  }


  res.sendStatus(200);
});


// @ts-ignore
exports.grammarlyTest = functions.runWith({
  timeoutSeconds: 300,
  memory: "2GB",
}).https.onRequest(async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const OpenAI = require("openai");
  const openai = new OpenAI({
    organization: "org-NBbRZYbyGkOuvHrABmlrUZYe",
    apiKey: "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",
  });

  // Create thread
  const thread = await openai.beta.threads.create({
    messages: [
      {
        "role": "user",
        // eslint-disable-next-line max-len
        "content": "Give the URL to a POC where we used time savings as a success metric",
        "file_ids": ["file-fXhNb1fLSun2Owe8fXklsiY2", "file-uCx71ZipRxb4qAhdApTj6fOM"],

      },
    ],
  });


  // Run thread with assistant
  const run = await openai.beta.threads.runs.create(
    thread.id,
    {assistant_id: "asst_JiWlO0C9iHRM7zzEHrYNNa0G"}
  );

  // Retrieve
  // Run thread with assistant
  let runStatus = await openai.beta.threads.runs.retrieve(
    thread.id,
    run.id
  );

  // Polling mechanism to see if runStatus is completed
  // This should be made more robust.
  while (runStatus.status !== "completed") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  }

  // @ts-ignore
  const messages = await openai.beta.threads.messages.list(thread.id);


  // Find the last message for the current run
  const lastMessageForRun = messages.data
    .filter(
      (message: { run_id: any; role: string; }) => message.run_id === run.id && message.role === "assistant"
    )
    .pop();

  // If an assistant message is found, console.log() it
  if (lastMessageForRun) {
    const text = lastMessageForRun.content[0].text.value;
    console.log(text);
  }


  res.sendStatus(200);
});
