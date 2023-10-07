import * as functions from "firebase-functions";
import {DuettChat} from "./types";
import pushNotifications from "./push_notifications";
import dbUtils from "./utils/db_utils";


exports.duettAdded = functions.firestore.document("duetts/{uid}").onCreate(async (snap, context) => {
  // Notify MatchMakers
  const duett = Object.assign({id: snap.id}, snap.data() as DuettChat);
  const profile1 = await dbUtils.getProfile(duett.matchMakers[0]);
  const profile2 = await dbUtils.getProfile(duett.matchMakers[1]);

  await pushNotifications.sendPushNotification(profile1.id, "Duett Created", profile2.firstName+" agreed with your friend match. You've all been placed in a group chat.");
  await pushNotifications.sendPushNotification(profile2.id, "Duett Created", profile1.firstName+" agreed with your friend match. You've all been placed in a group chat.");

  // Not notify the friends
  for (const profileID of duett.members) {
    // Only notify the pairs
    if (!duett.matchMakers.includes(profileID)) {
      await pushNotifications.sendPushNotification(profile1.id, "Duett Created", "Looks like "+profile1.firstName+" and "+profile2.lastName+" feel you would be perfect for a Duett");
    }
  }

  return Promise.resolve();
});
