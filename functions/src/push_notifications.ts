import {Profile} from "./types";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();


// eslint-disable-next-line require-jsdoc
async function sendPushNotificationWithImage(uid: string, title: string, body: string, imageURL: string) {
  const profileRef = await firestore.collection("profiles").doc(uid).get();
  const profile = profileRef.data();
  if (profile === null || profile === undefined) {
    return;
  }

  const profileO = Object.assign({id: uid}, profile as Profile);
  const pushToken = profileO.fcmToken;
  if (!pushToken) {
    console.log("There are no fcm tokens for " + uid);
    return Promise.resolve();
  }


  const message = {
    notification: {
      title: title,
      body: body,
      image: imageURL,
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
      fcm_options: {
        image: imageURL,
      },
    },
    data: {
      "click_action": "FLUTTER_NOTIFICATION_CLICK",
      "uid": uid,
    },
    token: pushToken,
  };

  await admin.messaging().send(message)
    .then((response: string) => {
      // Response is a message ID string.
      console.log("Sent push notification");
    })
    .catch((error: any) => {
      console.log("Error sending message to  ");
    });


  return Promise.resolve();
}

// eslint-disable-next-line require-jsdoc
async function sendMatchCreatedNotification(uid: string, title: string, body: string, matchID:string) {
  const profileRef = await firestore.collection("profiles").doc(uid).get();
  const profile = profileRef.data();
  if (profile === null || profile === undefined) {
    return;
  }

  const profileO = Object.assign({id: uid}, profile as Profile);
  const pushToken = profileO.fcmToken;
  if (!pushToken) {
    console.log("There are no fcm tokens for " + uid);
    return Promise.resolve();
  }


  const message = {
    notification: {
      title: title,
      body: body,
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
    data: {
      "click_action": "FLUTTER_NOTIFICATION_CLICK",
      "uid": uid,
      "matchID": matchID,
    },
    token: pushToken,
  };

  await admin.messaging().send(message)
    .then((response: string) => {
      // Response is a message ID string.
      console.log("Sent push notification");
    })
    .catch((error: any) => {
      console.log("Error sending message - " + error);
    });
  return Promise.resolve();
}

// eslint-disable-next-line require-jsdoc
async function sendLikeNotification(uid: string, title: string, body: string, likedByUID:string) {
  const profileRef = await firestore.collection("profiles").doc(uid).get();
  const profile = profileRef.data();
  if (profile === null || profile === undefined) {
    return;
  }

  const profileO = Object.assign({id: uid}, profile as Profile);
  const pushToken = profileO.fcmToken;
  if (!pushToken) {
    console.log("There are no fcm tokens for " + uid);
    return Promise.resolve();
  }


  const message = {
    notification: {
      title: title,
      body: body,
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
    data: {
      "click_action": "FLUTTER_NOTIFICATION_CLICK",
      "uid": uid,
      "likedByUID": likedByUID,
    },
    token: pushToken,
  };

  await admin.messaging().send(message)
    .then((response: string) => {
      // Response is a message ID string.
      console.log("Sent push notification");
    })
    .catch((error: any) => {
      console.log("Error sending message - " + error);
    });
  return Promise.resolve();
}

// eslint-disable-next-line require-jsdoc
async function sendPushNotification(uid: string, title: string, body: string) {
  const profileRef = await firestore.collection("profiles").doc(uid).get();
  const profile = profileRef.data();
  if (profile === null || profile === undefined) {
    return;
  }

  const profileO = Object.assign({id: uid}, profile as Profile);
  const pushToken = profileO.fcmToken;
  if (!pushToken) {
    console.log("There are no fcm tokens for " + uid);
    return Promise.resolve();
  }


  const message = {
    notification: {
      title: title,
      body: body,
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
    data: {
      "click_action": "FLUTTER_NOTIFICATION_CLICK",
      "uid": uid,
    },
    token: pushToken,
  };

  await admin.messaging().send(message)
    .then((response: string) => {
      // Response is a message ID string.
      console.log("Sent push notification");
    })
    .catch((error: any) => {
      console.log("Error sending message - " + error);
    });
  return Promise.resolve();
}

// eslint-disable-next-line require-jsdoc
async function notifyTargets(uid: string, title: string, body: string, possibleMatchID:string) {
  const profileRef = await firestore.collection("profiles").doc(uid).get();
  const profile = profileRef.data();
  if (profile === null || profile === undefined) {
    return;
  }

  const profileO = Object.assign({id: uid}, profile as Profile);
  const pushToken = profileO.fcmToken;
  if (!pushToken) {
    console.log("There are no fcm tokens for " + uid);
    return Promise.resolve();
  }


  const message = {
    notification: {
      title: title,
      body: body,
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
    data: {
      "click_action": "FLUTTER_NOTIFICATION_CLICK",
      "uid": uid,
      "possibleMatchID": possibleMatchID,
    },
    token: pushToken,
  };

  await admin.messaging().send(message)
    .then((response: string) => {
      // Response is a message ID string.
      console.log("Sent push notification");
    })
    .catch((error: any) => {
      console.log("Error sending message - " + error);
    });
  return Promise.resolve();
}

// eslint-disable-next-line require-jsdoc
async function sendDuettMessageNotification(uid: string, title: string, body: string, duettID:string) {
  const profileRef = await firestore.collection("profiles").doc(uid).get();
  const profile = profileRef.data();
  if (profile === null || profile === undefined) {
    return;
  }

  const profileO = Object.assign({id: uid}, profile as Profile);
  const pushToken = profileO.fcmToken;
  if (!pushToken) {
    console.log("There are no fcm tokens for " + uid);
    return Promise.resolve();
  }


  const message = {
    notification: {
      title: title,
      body: body,
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
    data: {
      "click_action": "FLUTTER_NOTIFICATION_CLICK",
      "uid": uid,
      "duettID": duettID,
    },
    token: pushToken,
  };

  await admin.messaging().send(message)
    .then((response: string) => {
      // Response is a message ID string.
      console.log("Sent push notification");
    })
    .catch((error: any) => {
      console.log("Error sending message - " + error);
    });
  return Promise.resolve();
}

// eslint-disable-next-line require-jsdoc
async function notifyPartner(uid: string, title: string, body: string, pairID:string) {
  const profileRef = await firestore.collection("profiles").doc(uid).get();
  const profile = profileRef.data();
  if (profile === null || profile === undefined) {
    return;
  }

  const profileO = Object.assign({id: uid}, profile as Profile);
  const pushToken = profileO.fcmToken;
  if (!pushToken) {
    console.log("There are no fcm tokens for " + uid);
    return Promise.resolve();
  }


  const message = {
    notification: {
      title: title,
      body: body,
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
    data: {
      "click_action": "FLUTTER_NOTIFICATION_CLICK",
      "uid": uid,
      "pairID": pairID,
    },
    token: pushToken,
  };

  await admin.messaging().send(message)
    .then((response: string) => {
      // Response is a message ID string.
      console.log("Sent push notification");
    })
    .catch((error: any) => {
      console.log("Error sending message - " + error);
    });
  return Promise.resolve();
}


const pushNotifications = {
  sendPushNotification,
  sendPushNotificationWithImage,
  sendMatchCreatedNotification,
  notifyTargets,
  notifyPartner,
  sendDuettMessageNotification,
  sendLikeNotification,
};

export default pushNotifications;
