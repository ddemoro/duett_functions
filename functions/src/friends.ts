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
  const friendSnapshot = await firestore.collection("friends").where("accepted", "==", false).get();
  for (const document of friendSnapshot.docs) {
    const friend = Object.assign({id: document.id}, document.data() as Friend);
    const friendSnapshot = await firestore.collection("friends").where("uid", "==", friend.friendUID).where("friendUID", "==", friend.uid).get();
    for (const document of friendSnapshot.docs) {
      const otherFriend = Object.assign({id: document.id}, document.data() as Friend);
      if (otherFriend) {
        console.log(friend.id + " and " + otherFriend.id);
      }
    }
  }
  res.sendStatus(200);
});

/**
 * Checks if a user has at least one accepted friend
 * @param {string} uid User ID to check
 * @return {Promise<boolean>} Promise resolving to a boolean indicating if the user has accepted friends
 */
async function hasAcceptedFriends(uid: string): Promise<boolean> {
  const friendsSnapshot = await firestore.collection("friends")
    .where("uid", "==", uid)
    .where("accepted", "==", true)
    .limit(1)
    .get();
  return !friendsSnapshot.empty;
}

/**
 * Updates the 'friends' field in a user's profile based on whether they have accepted friends
 * @param {string} uid User ID whose profile needs to be updated
 * @return {Promise<void>} Promise that resolves when the update is complete
 */
async function updateFriendsStatus(uid: string): Promise<void> {
  const hasFriends = await hasAcceptedFriends(uid);
  await firestore.collection("profiles").doc(uid).update({ friends: hasFriends });
}

exports.friendAdded = functions.firestore.document("friends/{uid}").onCreate(async (snap, context) => {
  const friend = Object.assign({id: snap.id}, snap.data() as Friend);
  const friendPhoneNumber = cleanPhoneNumber(friend.phone);
  const inviter = await dbUtils.getProfile(friend.uid);


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
        console.log("Found Friend UID: " + friendUID);

        if (friendUID && !friend.type) {
          // Notify the Friend
          await pushNotifications.sendFriendRequestNotification(friendUID, friend.id, "Friend Request", inviter.firstName + " is inviting you to join their dating team.");
        }
      }
    }
  }

  // Check to see if their friend invited them. If so, auto-accept
  let accepted = false;
  if (friendUID) {
    const friendSnapshot = await firestore.collection("friends").where("uid", "==", friendUID).where("friendUID", "==", friend.uid).get();
    for (const document of friendSnapshot.docs) {
      const otherFriend = Object.assign({id: document.id}, document.data() as Friend);
      if (otherFriend) {
        accepted = true;

        const profileOfFriend = await dbUtils.getProfile(friend.uid);
        await firestore.collection("friends").doc(otherFriend.id).update({
          accepted: true,
          avatarURL: profileOfFriend.media[0].url,
          friendUID: profileOfFriend.id,
        });
      }
    }
  }

  // Update their line number in their profile
  let lineNumber = inviter.lineNumber;
  if (friend.isStarter) {
    lineNumber = lineNumber - 10;
  } else {
    lineNumber = lineNumber - 5;
  }

  await firestore.collection("profiles").doc(inviter.id).update({lineNumber: lineNumber});
  // Update friends status after adding a friend
  await updateFriendsStatus(inviter.id);


  // Update Friend with creation Date
  await snap.ref.update({
    creationDate: FieldValue.serverTimestamp(),
    friendUID: friendUID,
    avatarURL: avatarURL,
    accepted: accepted,
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

    // Update Profile to reflect their friend status
    await updateFriendsStatus(newFriend.uid);

    // Now let's make sure that the friend you invited as a friend object for you
    // but you will be on the bench!
    const friendUID = newFriend.friendUID;

    // Check if a friend object already exists by looking looking for a Friend object that
    // has the uid == friendUID and the friendUID == uid and accepted == false
    console.log("Looking for friendUID to be " + ownerProfile.id + " and uid to be " + friendUID);
    const querySnapshot = await firestore.collection("friends").where("friendUID", "==", ownerProfile.id).where("uid", "==", friendUID).get();

    const friends: Friend[] = [];
    for (const document of querySnapshot.docs) {
      const friend = Object.assign({id: document.id}, document.data() as Friend);
      friends.push(friend);
    }

    // Check how many starters this person has and enforce 3 if needed
    const friendsSnapshot = await firestore.collection("friends").where("uid", "==", friendUID).where("isStarter", "==", true).get();
    const querySize = friendsSnapshot.size;

    if (friends.length === 0) {
      // Create Friend object and add them to the bench
      const newFriend: Friend = {
        uid: friendUID,
        friendUID: ownerProfile.id,
        avatarURL: ownerProfile.media[0].url,
        creationDate: FieldValue.serverTimestamp(),
        isStarter: querySize < 3,
        accepted: true,
        fullName: ownerProfile.firstName,
        phone: ownerProfile.phoneNumber,
        type: "AUTO_GENERATED",
      };

      await firestore.collection("friends").add(newFriend);
      // Update the friend's profile status
      await updateFriendsStatus(friendUID);
    } else {
      const f = friends[0];
      f.accepted = true;
      await firestore.collection("friends").doc(f.id).update(newFriend);
      // Update the friend's profile status
      await updateFriendsStatus(f.uid);
    }

    // Update their line number in their profile

    let lineNumber = ownerProfile.lineNumber;
    lineNumber += 5;
    await firestore.collection("profiles").doc(ownerProfile.id).update({lineNumber: lineNumber});
  }

  return Promise.resolve();
});

exports.friendDeleted = functions.firestore.document("friends/{uid}").onDelete(async (snap, context) => {
  const friend = Object.assign({id: snap.id}, snap.data() as Friend);
  const uid = friend.uid;
  const friendUID = friend.friendUID;


  const snapshot = await firestore.collection("friends").where("uid", "==", friendUID).where("friendUID", "==", uid).get();

  for (const document of snapshot.docs) {
    await document.ref.delete();
  }

  // Update Profile status for both users
  await updateFriendsStatus(uid);
  if (friendUID) {
    await updateFriendsStatus(friendUID);
  }

  // Update their line number in their profile
  const profile = await dbUtils.getProfile(uid);
  let lineNumber = profile.lineNumber;
  if (friend.isStarter) {
    lineNumber = lineNumber + 10;
  } else {
    lineNumber = lineNumber + 5;
  }

  await firestore.collection("profiles").doc(profile.id).update({lineNumber: lineNumber});

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
