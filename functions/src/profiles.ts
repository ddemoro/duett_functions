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


exports.setFriends = functions.https.onRequest(async (req, res) => {
  const derekProfile = await dbUtils.getProfile("0chklRlWnWhlSOR6Z1GrsPAIzDA2");
  const brettProfile = await dbUtils.getProfile("JjxxN53UP7dm9N8PmhxHy9Fa2IX2");
  const erickProfile = await dbUtils.getProfile("NV4cvofidmO9G9FJfmzIZPnjJqp2");
  const richardProfile = await dbUtils.getProfile("5OFGObt5cXiWhLlgKsXB");

  const profiles = [erickProfile, brettProfile, richardProfile];
  profiles.forEach((profile) => {
    const friend: Friend = {
      "acceptedInvite": true,
      "creationDate": Date.now(),
      "friendUID": derekProfile.id,
      "uid": profile.id,
      "phone": profile.phoneNumber,
      "avatarURL": profile.media[0].url,
      "fullName": profile.firstName,
      "starter": true,
      "inviteCode": "123",
    };
    firestore.collection("friends").add(friend);
  });


  res.sendStatus(200);
});
