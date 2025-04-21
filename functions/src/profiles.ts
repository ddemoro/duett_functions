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

exports.reset = functions.https.onRequest(async (req, res) => {
  const profiles = await firestore.collection("profiles").get();
  for (const document of profiles.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    await firestore.collection("profiles").doc(profile.id).update({configured: false});
  }
  res.sendStatus(200);
});


exports.profileAdded = functions.firestore.document("profiles/{uid}").onCreate(async (snap, context) => {
  const profiles = await firestore.collection("profiles").get();
  const size = profiles.size + 250;

  // Save Profile
  await snap.ref.update({
    creationDate: FieldValue.serverTimestamp(),
    configured: false,
    friends: false,
    likedBy: [],
    lineNumber: size,
  });


  return Promise.resolve();
});

exports.profileDeleted = functions.firestore.document("profiles/{uid}").onDelete(async (snap, context) => {
  const profile = Object.assign({id: snap.id}, snap.data() as Profile);
  const uid = profile.id;

  // Get friends where uid matches the deleted profile
  const friendsSnapshot = await firestore.collection("friends").where("uid", "==", uid).get();
  
  // Delete all friend objects where uid matches the deleted profile
  const friendDeletePromises = friendsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    return firestore.collection("friends").doc(doc.id).delete();
  });
  
  // Get all likes where profileID matches the deleted profile
  const likesSnapshot1 = await firestore.collection("likes").where("profileID", "==", uid).get();
  
  // Get all likes where likedProfileID matches the deleted profile
  const likesSnapshot2 = await firestore.collection("likes").where("likedProfileID", "==", uid).get();
  
  // Delete all likes related to the deleted profile
  const likeDeletePromises1 = likesSnapshot1.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    return firestore.collection("likes").doc(doc.id).delete();
  });
  
  const likeDeletePromises2 = likesSnapshot2.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    return firestore.collection("likes").doc(doc.id).delete();
  });
  
  // Get all messages sent by the deleted profile
  const messagesSnapshot = await firestore.collection("messages").where("fromID", "==", uid).get();
  
  // Delete all messages sent by the deleted profile
  const messageDeletePromises = messagesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    return firestore.collection("messages").doc(doc.id).delete();
  });
  
  // Wait for all deletions to complete
  await Promise.all([...friendDeletePromises, ...likeDeletePromises1, ...likeDeletePromises2, ...messageDeletePromises]);
});

exports.profileUpdated = functions.firestore.document("profiles/{uid}").onUpdate(async (change, context) => {
  const newProfile = Object.assign({id: change.after.id}, change.after.data() as Profile);
  const oldProfile = Object.assign({id: change.before.id}, change.before.data() as Profile);

  if (newProfile.configured && !oldProfile.configured) {
    const gender = newProfile.gender;
    if (gender == "Man") {
      const women = await dbUtils.getProfilesFromGender("Woman");
      for (const woman of women) {
        const message = newProfile.firstName + " has just joined Duett. Take a look to see if there is some interest here.";
        await pushNotifications.sendLikeNotification(woman.id, "New to Duett", message, newProfile.id);
      }
    } else if (gender == "Woman") {
      const men = await dbUtils.getProfilesFromGender("Man");
      for (const man of men) {
        const message = newProfile.firstName + " has just joined Duett. Take a look to see if there is some interest here.";
        await pushNotifications.sendLikeNotification(man.id, "New to Duett", message, newProfile.id);
      }
    }

    // Take a look if people invited them as friends. If so, do the following:
    // 1. Map their friendUID to the Friend Object
    // 2. Send them a Push Notification
    const phoneNumber = cleanPhoneNumber(newProfile.phoneNumber);
    const querySnapshot = await firestore.collection("friends").where("accepted", "==", false).get();
    for (const document of querySnapshot.docs) {
      const friend = Object.assign({id: document.id}, document.data() as Friend);
      const friendPhoneNumber = cleanPhoneNumber(friend.phone);
      if (phoneNumber == friendPhoneNumber) {
        // Add the friendUID
        const avatarURL = newProfile.media[0].url;

        await firestore.collection("friends").doc(friend.id).update({
          friendUID: newProfile.id,
          avatarURL: avatarURL,
        });

        // Notify the Friend
        await pushNotifications.sendFriendRequestNotification(newProfile.id, friend.id, "Friend Request", friend.fullName + " is inviting you to join their dating team.");
      }
    }
  }


  return Promise.resolve();
});

exports.sendPushMessage = functions.https.onRequest(async (req, res) => {
  const snapshot = await firestore.collection("profiles").get();
  for (const document of snapshot.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    if (profile.gender == "Woman") {
      // eslint-disable-next-line max-len
      await pushNotifications.sendPushNotification(profile.id, "It's all about Friends!", "Don't forget that the best Duett experience happens with your friends. So grab your girls and make sure that they are signed up! ");
    } else {
      // eslint-disable-next-line max-len
      await pushNotifications.sendPushNotification(profile.id, "It's all about Friends!", "Don't forget that the best Duett experience happens with your friends. So grab your buddies and make sure that they are signed up! ");
    }
  }
  res.sendStatus(200);
});


exports.addSuggestions = functions.https.onRequest(async (req, res) => {
  // eslint-disable-next-line max-len
  const suggestions = ["0chklRlWnWhlSOR6Z1GrsPAIzDA2", "CHYFDBgzNyDVRS2UCdsy", "JjxxN53UP7dm9N8PmhxHy9Fa2IX2", "tkxSZsDmbawx33mbKA6O", "eMkeuPFEJipt4z8FtlBE", "2B7ej5ApDkdSFKaEeZl8", "Xl6fFCSwNrNZRqPwL2y9", "5OFGObt5cXiWhLlgKsXB", "y62XZAw2rkKefwmIqjRU"];

  await firestore.collection("suggestions").doc("4AaGDGFKg7c9KHpzu5pG402nfQz1").set({profiles: suggestions});
  res.sendStatus(200);
});

exports.test = functions.https.onRequest(async (req, res) => {
  const profileDoc = await firestore.collection("profiles").doc("tI6XNS1oLtWt4WjwkdiliJos3f72").get();
  const profileData = Object.assign({id: profileDoc.id}, profileDoc.data() as Profile);
  console.log("TEST");
  const birthdayDate = profileData.birthday.toDate();
  const today = new Date();
  const age = today.getFullYear() - birthdayDate.getFullYear() - ((today.getMonth() < birthdayDate.getMonth() || (today.getMonth() === birthdayDate.getMonth() && today.getDate() < birthdayDate.getDate())) ? 1 : 0);
  console.log(`Age: ${age}`); 

  await pushNotifications.sendPushNotification(profileDoc.id, "Duett Possible Match Alert", "Pete matched with Janice! Check out which one of her friends you may like.");

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


exports.setGuyFriends = functions.https.onRequest(async (req, res) => {
  const derekProfile = await dbUtils.getProfile("tI6XNS1oLtWt4WjwkdiliJos3f72");
  const brettProfile = await dbUtils.getProfile("M0PRW3sb1tQljjyH878sFlDmSC63");
  const erickProfile = await dbUtils.getProfile("bxLjcxVZzlexU040cKCnh5xROLq1");
  const richardProfile = await dbUtils.getProfile("5OFGObt5cXiWhLlgKsXB");

  const profiles = [derekProfile, erickProfile, brettProfile, richardProfile];
  profiles.forEach((profile) => {
    const profilesToUse = getRandomProfilesWithExclusion(profiles, profile);
    for (const p of profilesToUse) {
      const imageURL = p.media.length > 0 ? p.media[0].url : p.avatarURL;
      const friend: Friend = {
        "accepted": true,
        "creationDate": Date.now(),
        "friendUID": p.id,
        "uid": profile.id,
        "phone": p.phoneNumber,
        "avatarURL": imageURL,
        "fullName": p.firstName,
        "isStarter": true,
        "inviteCode": "AUTO_GENERATED",
      };
      firestore.collection("friends").add(friend);
    }
  });

  res.sendStatus(200);
});

exports.setGirlFriends = functions.https.onRequest(async (req, res) => {
  const ariaProfile = await dbUtils.getProfile("6xS0eag96xugl4FHEJ5p");
  const carolineProfile = await dbUtils.getProfile("vBOiXFUkuIwHnPQJnABI");
  const elenaProfile = await dbUtils.getProfile("hlx1y3vcFAEXmlPNCN1I");
  const isabellaProfile = await dbUtils.getProfile("k4hEHG5sByAlzgRjv9WP");
  const jennyProfile = await dbUtils.getProfile("jgHPInuBrxhrfyLoAFR7");
  const karenProfile = await dbUtils.getProfile("BUXqnW0rHGVCOHnJUlPQ");
  const oliviaProfile = await dbUtils.getProfile("H3armOl5GWMLGRcA2ReV");
  const tinaProfile = await dbUtils.getProfile("wYJZChrOo83bLVn659Vh");


  const profiles = [ariaProfile, carolineProfile, elenaProfile, isabellaProfile, jennyProfile, karenProfile, oliviaProfile, tinaProfile];
  profiles.forEach((profile) => {
    const profilesToUse = getRandomProfilesWithExclusion(profiles, profile);
    for (const p of profilesToUse) {
      const imageURL = p.media.length > 0 ? p.media[0].url : p.avatarURL;
      const friend: Friend = {
        "accepted": true,
        "creationDate": Date.now(),
        "friendUID": p.id,
        "uid": profile.id,
        "phone": p.phoneNumber,
        "avatarURL": imageURL,
        "fullName": p.firstName,
        "isStarter": true,
        "inviteCode": "AUTO_GENERATED",
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

// eslint-disable-next-line require-jsdoc
function cleanPhoneNumber(phoneNumber: string) {
  // Remove all non-numeric characters
  phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

  // Remove leading +1
  if (phoneNumber.startsWith("+1")) {
    phoneNumber = phoneNumber.substring(2);
  }

  // Remove leading +1
  if (phoneNumber.startsWith("1")) {
    phoneNumber = phoneNumber.substring(1);
  }

  // Check if the phone number is 10 digits long
  if (phoneNumber.length !== 10) {
    return phoneNumber;
  }

  return phoneNumber;
}

exports.update = functions.https.onRequest(async (req, res) => {
  const querySnapshot = await firestore.collection("profiles").orderBy("creationDate").get();
  let counter = 250;
  for (const document of querySnapshot.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    await firestore.collection("profiles").doc(profile.id).update({lineNumber: counter});
    counter++;
  }

  res.sendStatus(200); 
});

exports.makeConfigured = functions.https.onRequest(async (req, res) => {
  const querySnapshot = await firestore.collection("profiles").orderBy("creationDate").get();
 
  for (const document of querySnapshot.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    if(profile.friends) {
      await firestore.collection("profiles").doc(profile.id).update({configured:true});
    }
  }

  res.sendStatus(200);
});

exports.exportProfilesToJson = functions.https.onRequest(async (req, res) => {
  try {
    // Get all profiles from Firestore
    const querySnapshot = await firestore.collection("profiles").get();
    const profiles = querySnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      return Object.assign({id: doc.id}, doc.data() as Profile);
    });

    // Generate summary statistics
    const totalProfiles = profiles.length;
    
    // Location summary
    const locationSummary: Record<string, number> = {};
    profiles.forEach((profile: Profile) => {
      if (profile.living && profile.living.city) {
        const location = `${profile.living.city}, ${profile.living.state || ''}`.trim();
        locationSummary[location] = (locationSummary[location] || 0) + 1;
      }
    });

    // Gender summary
    const genderSummary: Record<string, number> = {};
    profiles.forEach((profile: Profile) => {
      if (profile.gender) {
        genderSummary[profile.gender] = (genderSummary[profile.gender] || 0) + 1;
      }
    });

    // Dating preference summary
    const datingPreferenceSummary: Record<string, number> = {};
    profiles.forEach((profile: Profile) => {
      if (profile.datingType) {
        datingPreferenceSummary[profile.datingType] = (datingPreferenceSummary[profile.datingType] || 0) + 1;
      }
    });

    // Create the result object with profiles and summary
    const result = {
      profiles: profiles,
      summary: {
        totalProfiles,
        locationSummary: Object.entries(locationSummary)
          .sort((a, b) => b[1] - a[1])
          .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
        genderSummary,
        datingPreferenceSummary
      }
    };

    // Create a JSON string from the result object
    const jsonData = JSON.stringify(result, null, 2);

    // Set up the response headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=profiles.json');
    
    // Send the JSON data as the response
    res.send(jsonData);
    
    console.log(`Successfully exported ${profiles.length} profiles to JSON with summary statistics`);
  } catch (error: unknown) {
    console.error("Error exporting profiles to JSON:", error);
    res.status(500).send(`Error exporting profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});


