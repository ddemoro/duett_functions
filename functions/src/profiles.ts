import * as functions from "firebase-functions";
import {Friend, Profile} from "./types";
import pushNotifications from "./push_notifications";
import dbUtils from "./utils/db_utils";
import textUtils from "./utils/text_utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FieldValue = require("firebase-admin").firestore.FieldValue;


exports.profileAdded = functions.firestore.document("profiles/{uid}").onCreate(async (snap, context) => {
  const profile = Object.assign({id: snap.id}, snap.data() as Profile);
  console.log(profile);

  // Save Profile
  await snap.ref.update({
    creationDate: FieldValue.serverTimestamp(),
  });


  return Promise.resolve();
});

exports.profileUpdated = functions.firestore.document("profiles/{uid}").onUpdate(async (change, context) => {
  const updateProfile = Object.assign({id: change.after.id}, change.after.data() as Profile);
  const oldProfile = Object.assign({id: change.before.id}, change.before.data() as Profile);

  // Handle when first name is update
  if (updateProfile.firstName !== oldProfile.firstName) {
    // Generate invite code
    const inviteCode = textUtils.generateUniqueCode(updateProfile.firstName);
    await firestore.collection("profiles").doc(updateProfile.id).update({inviteCode: inviteCode});
  }

  return Promise.resolve();
});

exports.addSuggestions = functions.https.onRequest(async (req, res) => {
  // eslint-disable-next-line max-len
  const suggestions = ["6xS0eag96xugl4FHEJ5p", "vBOiXFUkuIwHnPQJnABI", "hlx1y3vcFAEXmlPNCN1I", "k4hEHG5sByAlzgRjv9WP", "jgHPInuBrxhrfyLoAFR7", "BUXqnW0rHGVCOHnJUlPQ", "H3armOl5GWMLGRcA2ReV", "wYJZChrOo83bLVn659Vh"];

  await firestore.collection("suggestions").doc("JjxxN53UP7dm9N8PmhxHy9Fa2IX2").set({profiles: suggestions});
  res.sendStatus(200);
});

exports.test = functions.https.onRequest(async (req, res) => {
  const profile = await firestore.collection("profiles").doc("0chklRlWnWhlSOR6Z1GrsPAIzDA2").get();
  const p = Object.assign({id: profile.id}, profile.data() as Profile);
  const birthdayDate = p.birthday.toDate();
  const today = new Date();
  let age = today.getFullYear() - birthdayDate.getFullYear();
  const monthDiff = today.getMonth() - birthdayDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdayDate.getDate())) {
    age--;
  }
  console.log("Age: " + age);

  await pushNotifications.sendPushNotification(profile.id, "Duett Possible Match Alert", "Pete matched with Janice! Check out which one of her friends you may like.");

  res.sendStatus(200);
});

exports.checkProfiles = functions.https.onRequest(async (req, res) => {
  const snapshot = await firestore.collection("profiles").get();
  for (const document of snapshot.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    const inviteCode = textUtils.generateUniqueCode(profile.firstName);
    await firestore.collection("profiles").doc(profile.id).update({inviteCode: inviteCode});
  }

  res.sendStatus(200);
});

exports.getProfiles = functions.https.onRequest(async (req, res) => {
  res.sendStatus(200);
});

exports.createFriends = functions.https.onRequest(async (req, res) => {
  const snapshot = await firestore.collection("profiles").get();
  for (const document of snapshot.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    await addFriends(profile);
  }

  res.sendStatus(200);
});

exports.setFriends = functions.https.onRequest(async (req, res) => {
  const derekProfile = await dbUtils.getProfile("0chklRlWnWhlSOR6Z1GrsPAIzDA2");
  const brettProfile = await dbUtils.getProfile("JjxxN53UP7dm9N8PmhxHy9Fa2IX2");
  const erickProfile = await dbUtils.getProfile("NV4cvofidmO9G9FJfmzIZPnjJqp2");
  const richardProfile = await dbUtils.getProfile("5OFGObt5cXiWhLlgKsXB");

  const profiles = [erickProfile, derekProfile, richardProfile];
  const friends: Friend[] = [];
  profiles.forEach((profile) => {
    const f: Friend = {
      "uid": profile.id,
      "phoneNumber": profile.phoneNumber,
      "avatarURL": profile.media[0].url,
      "contactName": profile.firstName + " " + profile.lastName,
      "businessName": "",
      "email": profile.emailAddress,
    };
    friends.push(f);
  });

  await firestore.collection("profiles").doc(brettProfile.id).update({friends: friends});
  res.sendStatus(200);
});

// eslint-disable-next-line require-jsdoc
async function addFriends(profile: Profile) {
  const profiles = [];
  const snapshot = await firestore.collection("profiles").get();
  for (const document of snapshot.docs) {
    const p = Object.assign({id: document.id}, document.data() as Profile);
    if (p.id !== profile.id && p.gender == profile.gender) {
      profiles.push(p);
    }
  }

  // Randomly sort profiles
  profiles.sort(() => 0.5 - Math.random());
  const friends: Friend[] = [];
  const friendProfiles: Profile[] = profiles.slice(0, 3);
  friendProfiles.forEach((friend) => {
    const f: Friend = {
      "uid": friend.id,
      "phoneNumber": "555-321-1234",
      "avatarURL": friend.avatarURL,
      "contactName": friend.firstName + " " + friend.lastName,
      "businessName": "",
      "email": friend.emailAddress,
    };
    friends.push(f);
  });

  const bench: Friend[] = [];
  const benchedProfiles = profiles.slice(4, 6);
  benchedProfiles.forEach((friend) => {
    const f: Friend = {
      "uid": friend.id,
      "phoneNumber": "555-321-1234",
      "avatarURL": friend.avatarURL,
      "contactName": friend.firstName + " " + friend.lastName,
      "businessName": "",
      "email": friend.emailAddress,
    };
    bench.push(f);
  });

  await firestore.collection("profiles").doc(profile.id).update({friends: friends, benchedFriends: bench});
}
