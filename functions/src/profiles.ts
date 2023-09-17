import * as functions from "firebase-functions";
import {Profile} from "./types";
import pushNotifications from "./push_notifications";

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


exports.getProfiles = functions.https.onRequest(async (req, res) => {
  const profile = {
    phoneNumber: "+15552348765",
    creationDate: {
      _seconds: 1692638646,
      _nanoseconds: 405000000,
    },
    configured: true,
    fullName: "Tina Turaut",
    emailAddress: "tina.turaut@example.com",
    receiveMarketingMaterial: true,
    living: {
      city: "New York",
      latitude: 40.7128,
      state: "NY",
      longitude: -74.0060,
    },
    gender: "Woman",
    datingType: "Man",
    height: 165,
    ethnicity: "Caucasian",
    children: "No children",
    hometown: {
      hometown: "Nashville, TN",
      visible: true,
    },
    jobTitle: {
      visible: true,
      data: "Head of Marketing",
    },
    school: {
      visible: true,
      data: "University of Arizon",
    },
    work: {
      visible: true,
      data: "Apple Inc.",
    },
    education: {
      visible: true,
      data: "Ph.D. in Mind Reading",
    },
    religion: {
      visible: true,
      data: "Atheist",
    },
    politics: {
      visible: true,
      data: "Independent",
    },
    drinks: {
      visible: true,
      data: "Socially",
    },
    smoke: {
      visible: true,
      data: "No",
    },
    weed: {
      visible: true,
      data: "No",
    },
    drugs: {
      visible: true,
      data: "No",
    },
    privacyAccepted: true,
    media: [
      {
        image: true,
        url:
                    "https://images.unsplash.com/photo-1582639590011-f5a8416d1101?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1949&q=80",
      },
      {
        image: true,
        url:
                    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1888&q=80",
      },
      {
        image: true,
        url:
                    "https://images.unsplash.com/photo-1616840420121-7ad8ed885f11?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1760&q=80",
      },
      {
        image: true,
        url:
                    "https://images.unsplash.com/photo-1609132718484-cc90df3417f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
      },
      {
        image: true,
        url:
                    "https://images.unsplash.com/flagged/photo-1556151994-b611e5ab3675?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1760&q=80",
      },
    ],
    about: "Adventure-seeking coffee lover with a passion for 80s vinyl, always up for a spontaneous road trip or deep conversation under the stars.",
    qualities: "Empathetic listener, fiercely loyal, and an endless optimist who finds joy in the little things and believes in serendipity.",
    birthday: {
      _seconds: 724992000,
      _nanoseconds: 0,
    },
    memorableMoments: "Once danced under the Northern Lights in Iceland, shared laughs with monks in Bhutan, and spontaneously sang karaoke with locals in a Tokyo alleyway.",
    friends: [
      {
        uid: null,
        address: null,
        phoneNumber: "555-345-6789",
        avatarURL:
                    "https://images.unsplash.com/photo-1540875716262-8c2b2c4c00ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
        websiteURL: null,
        contactName: "Ava Wilson",
        businessName: "",
        shippingAddress: null,
        id: null,
        email: "ava@example.com",
      },
      {
        uid: null,
        address: null,
        phoneNumber: "555-456-7890",
        avatarURL:
                    "https://images.unsplash.com/photo-1521038199265-bc482db0f923?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
        websiteURL: null,
        contactName: "Mia Rodriguez",
        businessName: "",
        shippingAddress: null,
        id: null,
        email: "mia@example.com",
      },
    ],
    benchedFriends: [
      {
        uid: null,
        address: null,
        phoneNumber: "555-345-6789",
        avatarURL:
                    "https://images.unsplash.com/photo-1540875716262-8c2b2c4c00ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
        websiteURL: null,
        contactName: "Ava Wilson",
        businessName: "",
        shippingAddress: null,
        id: null,
        email: "ava@example.com",
      },
      {
        uid: null,
        address: null,
        phoneNumber: "555-456-7890",
        avatarURL:
                    "https://images.unsplash.com/photo-1521038199265-bc482db0f923?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
        websiteURL: null,
        contactName: "Mia Rodriguez",
        businessName: "",
        shippingAddress: null,
        id: null,
        email: "mia@example.com",
      },
    ],
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    avatarURL:
            "https://images.unsplash.com/photo-1578220438799-c0ba9b9d78a4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1886&q=80",
  };


  try {
    // Parse the JSON array string into a JavaScript array

    await firestore.collection("profiles").add(profile);
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }


  res.sendStatus(200);
});
