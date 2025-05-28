import * as functions from "firebase-functions";
import { ChatMessage, Nudge, DuettChat } from "./types";
import pushNotifications from "./push_notifications";
import dbUtils from "./utils/db_utils";
import { firestore } from "firebase-admin";

const FieldValue = firestore.FieldValue;
const db = firestore();


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

/**
 * Cron job that runs daily at 2 AM to enable duetts older than 14 days
 * For duetts that were created but never enabled (matchmakers didn't cooperate)
 */
exports.enableOldDuetts = functions.pubsub.schedule("0 2 * * *")
  .timeZone("America/New_York")
  .onRun(async (context) => {
    console.log("Starting daily job to enable old duetts");

    try {
      // Calculate the date 14 days ago
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      // Query for duetts that are:
      // 1. Older than 14 days
      // 2. Not enabled
      const duettsSnapshot = await db.collection("duetts")
        .where("enabled", "==", false)
        .where("creationDate", "<", fourteenDaysAgo)
        .get();

      console.log(`Found ${duettsSnapshot.size} duetts to enable`);

      // Process each duett
      const updatePromises = [];
      const notificationPromises = [];

      for (const doc of duettsSnapshot.docs) {
        const duett = doc.data() as DuettChat;
        const duettId = doc.id;

        console.log(`Processing duett ${duettId}`);

        // Update the duett to enabled
        updatePromises.push(
          doc.ref.update({ enabled: true })
        );

        // Send notifications to all matchmakers
        if (duett.matchMakers && duett.matchMakers.length > 0) {
          for (const matchMakerId of duett.matchMakers) {
            console.log(`Sending notification to matchmaker ${matchMakerId}`);

            notificationPromises.push(
              pushNotifications.sendDuettMessageNotification(
                matchMakerId,
                "Flocc Unlocked",
                "Your friends never cooperated but you two are free to choose your own destiny.",
                duettId
              ).catch((error) => {
                console.error(`Failed to send notification to ${matchMakerId}:`, error);
              })
            );
          }
        } else {
          console.warn(`Duett ${duettId} has no matchMakers array`);
        }
      }

      // Execute all updates and notifications
      await Promise.all([...updatePromises, ...notificationPromises]);

      console.log(`Successfully enabled ${duettsSnapshot.size} old duetts`);

    } catch (error) {
      console.error("Error in enableOldDuetts cron job:", error);
      throw error; // Re-throw to ensure Cloud Functions logs the error
    }

    return null;
  });
