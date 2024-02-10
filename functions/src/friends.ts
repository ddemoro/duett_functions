import * as functions from "firebase-functions";
import {Friend, Profile} from "./types";
import dbUtils from "./utils/db_utils";
import pushNotifications from "./push_notifications";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FieldValue = require("firebase-admin").firestore.FieldValue;


exports.test = functions.https.onRequest(async (req, res) => {
  const friendSnapshot = await firestore.collection("friends").doc("wJ0fhjaUktlHkisAJvTh").get();

  const friend = Object.assign({id: friendSnapshot.id}, friendSnapshot.data() as Friend);
  const friendPhoneNumber = cleanPhoneNumber(friend.phone);


  const querySnapshot = await firestore.collection("profiles").get();
  let friendUID;
  let avatarURL = friend.avatarURL;
  for (const document of querySnapshot.docs) {
    const profile = await dbUtils.getProfile(document.id);
    if (profile.phoneNumber) {
      console.log("Have: "+profile.phoneNumber);
      const phone = cleanPhoneNumber(profile.phoneNumber);
      if (friendPhoneNumber === phone) {
        console.log("PHONE: " + friendPhoneNumber + " == " + phone);
        console.log("ID:" + profile.id);
        friendUID = profile.id;
        avatarURL = profile.media[0].url;
      }
    }
  }

  console.log("Friend UID: " + friendUID);
  console.log("Avatar: " + avatarURL);
  // Update Friend with creation Date
  await friendSnapshot.ref.update({
    friendUID: friendUID,
    avatarURL: avatarURL,
  });
  res.sendStatus(200);
});


exports.friendAdded = functions.firestore.document("friends/{uid}").onCreate(async (snap, context) => {
  const friend = Object.assign({id: snap.id}, snap.data() as Friend);
  const friendPhoneNumber = cleanPhoneNumber(friend.phone);


  const querySnapshot = await firestore.collection("profiles").where("configured", "==", true).get();
  let friendUID;
  let avatarURL = friend.avatarURL;
  for (const document of querySnapshot.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    if (profile.phoneNumber) {
      const phone = cleanPhoneNumber(profile.phoneNumber);
      if (friendPhoneNumber === phone) {
        friendUID = profile.id;
        avatarURL = profile.media[0].url;
      }
    }
  }

  // Update Friend with creation Date
  await snap.ref.update({
    creationDate: FieldValue.serverTimestamp(),
    friendUID: friendUID,
    avatarURL: avatarURL,
  });


  return Promise.resolve();
});


exports.friendUpdated = functions.firestore.document("friends/{uid}").onUpdate(async (change, context) => {
  const newFriend = Object.assign({id: change.after.id}, change.after.data() as Friend);
  const oldFriend = Object.assign({id: change.before.id}, change.before.data() as Friend);

  if (newFriend.accepted && !oldFriend.accepted) {
    // They just entered the code and accepted.
    const ownerProfile = await dbUtils.getProfile(newFriend.uid);
    await pushNotifications.sendPushNotification(ownerProfile.id, "New Friend Added", newFriend.fullName + " has accepted your friend request!");

    // Update Profile that they have at least one friend
    await firestore.collection("profiles").doc(newFriend.uid).update({friends: true});

    // Now let's make sure that the friend you invited as a friend object for you
    // but you will be on the bench!
    const friendUID = newFriend.friendUID;

    // Check if a friend object already exists by looking looking for a Friend object that
    // has the uid == friendUID and the friendUID == uid and accepted == false
    const querySnapshot = await firestore.collection("friends").where("friendUID", "==", ownerProfile.id).where("uid", "==", friendUID).get();
    const friends: Friend[] = [];
    for (const document of querySnapshot.docs) {
      const friend = Object.assign({id: document.id}, document.data() as Friend);
      if (!friend.accepted) {
        friends.push(friend);
      }
    }

    if (friends.length == 0) {
      // Create Friend object and add them to the bench
      const newFriend: Friend = {
        uid: friendUID,
        friendUID: ownerProfile.id,
        avatarURL: ownerProfile.media[0].url,
        creationDate: FieldValue.serverTimestamp(),
        isStarter: true,
        accepted: true,
        fullName: ownerProfile.firstName,
        phone: ownerProfile.phoneNumber,
        inviteCode: "AUTO_GENERATED",
      };

      await firestore.collection("friends").add(newFriend);
      // Update Profile that they have at least one friend
      await firestore.collection("profiles").doc(friendUID).update({friends: true});
    } else {
      const f = friends[0];
      f.accepted = true;
      await firestore.collection("friends").doc(f.id).update(newFriend);
      // Update Profile that they have at least one friend
      await firestore.collection("profiles").doc(f.uid).update({friends: true});
    }
  }

  return Promise.resolve();
});

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
