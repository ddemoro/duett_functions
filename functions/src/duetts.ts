import * as functions from "firebase-functions";
import { ChatMessage, Nudge } from "./types";
import pushNotifications from "./push_notifications";
import dbUtils from "./utils/db_utils";
import { firestore } from "firebase-admin";

const FieldValue = firestore.FieldValue;


/**
 * Triggered when a new chat group (duett) is created
 * Currently not performing any actions, placeholder for future functionality
 */
exports.duettAdded = functions.firestore.document("duetts/{duettId}").onCreate(async (snapshot, context) => {
  return Promise.resolve();
});

/**
 * Sends notifications to all members of a duett when a new message is created
 * Skips sending notification to the message sender
 */
exports.messageCreated = functions.firestore.document("messages/{messageId}").onCreate(async (snapshot, context) => {
  const message = Object.assign({ id: snapshot.id }, snapshot.data() as ChatMessage);

  const senderUserId = message.fromID;
  const duettId = message.duettID;

  const duett = await dbUtils.getDuett(duettId);
  for (const memberId of duett.members) {
    if (memberId !== senderUserId) {
      await pushNotifications.sendDuettMessageNotification(
        memberId,
        message.firstName,
        message.text,
        duettId
      );
    }
  }

  return Promise.resolve();
});

/**
 * Handles when a user nudges their friend to join a duett chat
 * Sends notifications to both the friend and the other match participant
 */
exports.nudgeCreated = functions.firestore.document("nudges/{nudgeId}").onCreate(async (snapshot, context) => {
  const nudge = Object.assign({ id: snapshot.id }, snapshot.data() as Nudge);

  // Safely handle required fields with fallbacks instead of non-null assertions
  const senderUserId = nudge.fromUID || "";
  const duettId = nudge.duettID || "";
  const receiverUserId = nudge.uid || "";
  
  // Early return if missing critical data
  if (!senderUserId || !duettId || !receiverUserId) {
    console.error("Nudge missing required fields", { nudgeId: snapshot.id });
    return Promise.resolve();
  }
  
  const senderProfile = await dbUtils.getProfile(senderUserId);
  const receiverProfile = await dbUtils.getProfile(receiverUserId);

  // Notification message for the receiver using template literals
  const notificationMessage = `Hey ${receiverProfile.firstName}, it's ${senderProfile.firstName}! See if my match has any friends you might like.`;

  // Find the possibleMatch for this friend
  const possibleMatch = await dbUtils.getPossibleMatchFromUID(duettId, receiverUserId);
  
  // Check if possibleMatch exists and has an ID before sending notification
  if (possibleMatch && possibleMatch.id) {
    await pushNotifications.sendPossibleMatchNotification(
      receiverUserId,
      "Join our Flocc",
      notificationMessage,
      possibleMatch.id
    );
  }

  // Notify the other match participant
  const match = await dbUtils.getMatch(duettId);
  const [firstMatchedUser, secondMatchedUser] = match.matched;
  const otherMatchedUser = firstMatchedUser === senderUserId ? secondMatchedUser : firstMatchedUser;
  
  // Create notification message using template literals
  const matchNotificationMessage = `${senderProfile.firstName} sent a nudge to their friend ${receiverProfile.firstName}`;
  
  await pushNotifications.sendDuettMessageNotification(
    otherMatchedUser,
    "Nudge Sent",
    matchNotificationMessage,
    duettId
  );

  // Update the creation timestamp
  await snapshot.ref.update({
    creationDate: FieldValue.serverTimestamp(),
  });
  
  return Promise.resolve();
});
