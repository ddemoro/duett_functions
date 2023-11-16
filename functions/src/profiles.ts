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

exports.friendUpdated = functions.firestore.document("friends/{uid}").onUpdate(async (change, context) => {
  const newFriend = Object.assign({id: change.after.id}, change.after.data() as Friend);
  const oldFriend = Object.assign({id: change.before.id}, change.before.data() as Friend);

  if (newFriend.acceptedInvite && !oldFriend.acceptedInvite) {
    // They just entered the code and accepted.
    // Notify the OWNER

    const ownerProfile = await dbUtils.getProfile(newFriend.friendUID);
    await pushNotifications.sendPushNotification(ownerProfile.id, "New Friend Added", newFriend.fullName + " has joined your team!");
  }

  return Promise.resolve();
});


exports.addSuggestions = functions.https.onRequest(async (req, res) => {
  // eslint-disable-next-line max-len
  const suggestions = ["0chklRlWnWhlSOR6Z1GrsPAIzDA2", "CHYFDBgzNyDVRS2UCdsy", "JjxxN53UP7dm9N8PmhxHy9Fa2IX2", "tkxSZsDmbawx33mbKA6O", "eMkeuPFEJipt4z8FtlBE", "2B7ej5ApDkdSFKaEeZl8", "Xl6fFCSwNrNZRqPwL2y9", "5OFGObt5cXiWhLlgKsXB", "y62XZAw2rkKefwmIqjRU"];

  await firestore.collection("suggestions").doc("4AaGDGFKg7c9KHpzu5pG402nfQz1").set({profiles: suggestions});
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


exports.setGuyFriends = functions.https.onRequest(async (req, res) => {
  const derekProfile = await dbUtils.getProfile("0chklRlWnWhlSOR6Z1GrsPAIzDA2");
  const brettProfile = await dbUtils.getProfile("JjxxN53UP7dm9N8PmhxHy9Fa2IX2");
  const erickProfile = await dbUtils.getProfile("NV4cvofidmO9G9FJfmzIZPnjJqp2");
  const richardProfile = await dbUtils.getProfile("5OFGObt5cXiWhLlgKsXB");

  const profiles = [derekProfile, erickProfile, brettProfile, richardProfile];
  profiles.forEach((profile) => {
    const profilesToUse = getRandomProfilesWithExclusion(profiles, profile);
    for (const p of profilesToUse) {
      const imageURL = p.media.length > 0 ? p.media[0].url : p.avatarURL;
      const friend: Friend = {
        "acceptedInvite": true,
        "creationDate": Date.now(),
        "friendUID": profile.id,
        "uid": p.id,
        "phone": p.phoneNumber,
        "avatarURL": imageURL,
        "fullName": p.firstName,
        "starter": true,
        "inviteCode": "123",
      };
      firestore.collection("friends").add(friend);
    }
  });

  res.sendStatus(200);
});

exports.setGirlFriends = functions.https.onRequest(async (req, res) => {
  const allisonProfile = await dbUtils.getProfile("4AaGDGFKg7c9KHpzu5pG402nfQz1");
  const ariaProfile = await dbUtils.getProfile("6xS0eag96xugl4FHEJ5p");
  const carolineProfile = await dbUtils.getProfile("vBOiXFUkuIwHnPQJnABI");
  const elenaProfile = await dbUtils.getProfile("hlx1y3vcFAEXmlPNCN1I");
  const isabellaProfile = await dbUtils.getProfile("k4hEHG5sByAlzgRjv9WP");
  const jennyProfile = await dbUtils.getProfile("jgHPInuBrxhrfyLoAFR7");
  const karenProfile = await dbUtils.getProfile("BUXqnW0rHGVCOHnJUlPQ");

  const oliviaProfile = await dbUtils.getProfile("H3armOl5GWMLGRcA2ReV");
  const rubyProfile = await dbUtils.getProfile("dMl2DWKhjAPAHtj6cgm7RhHfBvu1");
  const shannonProfile = await dbUtils.getProfile("4AaGDGFKg7c9KHpzu5pG402nfQz1");
  const tinaProfile = await dbUtils.getProfile("wYJZChrOo83bLVn659Vh");


  const profiles = [allisonProfile, ariaProfile, carolineProfile, elenaProfile, isabellaProfile, jennyProfile, karenProfile, oliviaProfile, rubyProfile, shannonProfile, tinaProfile];
  profiles.forEach((profile) => {
    const profilesToUse = getRandomProfilesWithExclusion(profiles, profile);
    for (const p of profilesToUse) {
      const imageURL = p.media.length > 0 ? p.media[0].url : p.avatarURL;
      const friend: Friend = {
        "acceptedInvite": true,
        "creationDate": Date.now(),
        "friendUID": profile.id,
        "uid": p.id,
        "phone": p.phoneNumber,
        "avatarURL": imageURL,
        "fullName": p.firstName,
        "starter": true,
        "inviteCode": "123",
      };
      firestore.collection("friends").add(friend);
    }
  });


  res.sendStatus(200);
});

// eslint-disable-next-line require-jsdoc
function getRandomProfilesWithExclusion(arr: Profile[], excludeProfile: Profile): Profile[] {
  if (arr.length <= 3) {
    // If the array has 3 or fewer profiles, return the original array.
    return arr;
  }

  const randomProfiles: Profile[] = [];
  const copyArr = [...arr]; // Create a copy of the input array to avoid modifying the original.

  // Find the index of the profile to be excluded
  const excludeIndex = copyArr.findIndex((profile) => profile === excludeProfile);

  if (excludeIndex !== -1) {
    copyArr.splice(excludeIndex, 1); // Remove the excluded profile from the copy array.
  }

  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * copyArr.length);
    const randomProfile = copyArr.splice(randomIndex, 1)[0]; // Remove and get the random profile.
    randomProfiles.push(randomProfile);
  }

  return randomProfiles;
}
