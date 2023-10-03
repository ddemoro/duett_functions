import * as functions from "firebase-functions";
import {Friend, Profile} from "./types";
import pushNotifications from "./push_notifications";
import dbUtils from "./utils/db_utils";

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

exports.checkProfiles = functions.https.onRequest(async (req, res) => {
  const snapshot = await firestore.collection("profiles").get();
  for (const document of snapshot.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    // eslint-disable-next-line no-constant-condition
    if (true) {
      console.log("Empty Friend Set: " + profile.firstName);
      if (profile.gender == "Man") {
        // Add 3 friends
        const friends = [
          {
            "uid": "Xl6fFCSwNrNZRqPwL2y9",
            "address": "123 Main St, NY",
            "phoneNumber": "555-321-1234",
            "avatarURL": "https://images.unsplash.com/photo-1543764477-646365e11da3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFsZSUyMG1vZGVsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
            "websiteURL": null,
            "contactName": "Mike Cunnigham",
            "businessName": "",
            "shippingAddress": "123 Main St, NY",
            "id": "001",
            "email": "robert@example.com",
          },
          {
            "uid": "5OFGObt5cXiWhLlgKsX",
            "address": "123 Main St, NY",
            "phoneNumber": "555-321-1234",
            "avatarURL": "https://images.unsplash.com/photo-1634295889011-439a70d7799b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
            "websiteURL": null,
            "contactName": "Richard Marx",
            "businessName": "",
            "shippingAddress": "123 Main St, NY",
            "id": "001",
            "email": "robert@example.com",
          }, {
            "uid": "tkxSZsDmbawx33mbKA6O",
            "address": "123 Main St, NY",
            "phoneNumber": "555-321-1234",
            "avatarURL": "https://images.unsplash.com/photo-1583864697784-a0efc8379f70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1888&q=80",
            "websiteURL": null,
            "contactName": "Carlos Soleis",
            "businessName": "",
            "shippingAddress": "123 Main St, NY",
            "id": "001",
            "email": "robert@example.com",
          },
        ];

        await firestore.collection("profiles").doc(profile.id).update({friends: friends});
      } else if (profile.gender == "Woman") {
        // Add 3 friends
        const friends = [
          {
            "uid": "6xS0eag96xugl4FHEJ5p",
            "address": "123 Main St, NY",
            "phoneNumber": "555-321-1234",
            "avatarURL": "https://images.unsplash.com/flagged/photo-1556151994-b611e5ab3675?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1760&q=80",
            "websiteURL": null,
            "contactName": "Mike Cunnigham",
            "businessName": "",
            "shippingAddress": "123 Main St, NY",
            "id": "001",
            "email": "robert@example.com",
          },
          {
            "uid": "vBOiXFUkuIwHnPQJnABI",
            "address": "123 Main St, NY",
            "phoneNumber": "555-321-1234",
            "avatarURL": "https://images.unsplash.com/photo-1540875716262-8c2b2c4c00ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
            "websiteURL": null,
            "contactName": "Caroline Tart",
            "businessName": "",
            "shippingAddress": "123 Main St, NY",
            "id": "001",
            "email": "robert@example.com",
          }, {
            "uid": "hlx1y3vcFAEXmlPNCN1I",
            "address": "123 Main St, NY",
            "phoneNumber": "555-321-1234",
            "avatarURL": "https://images.unsplash.com/photo-1548637724-cbc39e0c8d3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1664&q=80",
            "websiteURL": null,
            "contactName": "Elena Vega",
            "businessName": "",
            "shippingAddress": "123 Main St, NY",
            "id": "001",
            "email": "robert@example.com",
          },
        ];

        await firestore.collection("profiles").doc(profile.id).update({friends: friends});
      }
    }
  }

  res.sendStatus(200);
});

exports.getProfiles = functions.https.onRequest(async (req, res) => {
  /*
    const profile: Profile = {
    "avatarURL": "https://images.unsplash.com/photo-1583864697784-a0efc8379f70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1888&q=80",
    "phoneNumber": "+15551234567",
    "creationDate": new Date().toISOString(),
    "configured": true,
    "fullName": "Carlos Soleis",
    "emailAddress": "carlos.soleis@example.com",
    "receiveMarketingMaterial": true,
    "living": {
      "city": "Rye Brook",
      "latitude": 40.9846,
      "state": "NY",
      "longitude": -73.6835,
    },
    "gender": "man",
    "datingType": "Woman",
    "height": 180,
    "ethnicity": "Latino",
    "children": "No children",
    "hometown": {
      "data": "New York, NY",
      "visible": true,
    },
    "jobTitle": {
      "visible": true,
      "data": "Dancer",
    },
    "school": {
      "visible": true,
      "data": "Stanford University",
    },
    "work": {
      "visible": true,
      "data": "Independent",
    },
    "education": {
      "visible": true,
      "data": "Bachelor's in Arts",
    },
    "religion": {
      "visible": true,
      "data": "Catholic",
    },
    "politics": {
      "visible": true,
      "data": "Democrat",
    },
    "drinks": {
      "visible": true,
      "data": "Socially",
    },
    "smoke": {
      "visible": true,
      "data": "No",
    },
    "weed": {
      "visible": true,
      "data": "No",
    },
    "drugs": {
      "visible": true,
      "data": "No",
    },
    "privacyAccepted": true,
    "media": [
      {
        "image": true,
        "url": "https://images.unsplash.com/photo-1543764477-646365e11da3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFsZSUyMG1vZGVsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
      },
      {
        "image": true,
        "url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
      },
      {
        "image": true,
        "url": "https://images.unsplash.com/photo-1634295889011-439a70d7799b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
      },
    ],
    "about": "A dancer who is passionate about performance art",
    "qualities": "Energetic and graceful",
    "birthday": new Date(new Date().getFullYear() - 30, 1, 15).toISOString(),
    "memorableMoments": "Winning a dance competition in New York",
    "friends": [
      {
        "uid": "001",
        "address": "123 Main St, NY",
        "phoneNumber": "555-321-1234",
        "avatarURL": "https://images.unsplash.com/photo-1589481158353-4ac067b3fd37?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
        "websiteURL": null,
        "contactName": "Robert Smith",
        "businessName": "",
        "shippingAddress": "123 Main St, NY",
        "id": "001",
        "email": "robert@example.com",
      },
      {
        "uid": "002",
        "address": "456 Second Ave, NY",
        "phoneNumber": "555-321-5678",
        "avatarURL": "https://images.unsplash.com/photo-1619182597083-17bda72c1d56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1868&q=80",
        "websiteURL": null,
        "contactName": "Sophia Green",
        "businessName": "",
        "shippingAddress": "456 Second Ave, NY",
        "id": "002",
        "email": "sophia@example.com",
      },
      {
        "uid": "003",
        "address": "789 Third St, NY",
        "phoneNumber": "555-321-9876",
        "avatarURL": "https://images.unsplash.com/photo-1527010154944-f2241763d806?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1888&q=80",
        "websiteURL": null,
        "contactName": "Lucas Brown",
        "businessName": "",
        "shippingAddress": "789 Third St, NY",
        "id": "003",
        "email": "lucas@example.com",
      },
    ],
    "benchedFriends": [
      {
        "uid": "004",
        "address": "101 Fourth St, NY",
        "phoneNumber": "555-654-1234",
        "avatarURL": "https://plus.unsplash.com/premium_photo-1661866803933-17fc0cf78150?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1888&q=80",
        "websiteURL": null,
        "contactName": "Sarah White",
        "businessName": "",
        "shippingAddress": "101 Fourth St, NY",
        "id": "004",
        "email": "sarah@example.com",
      },
    ],
    "languages": ["English", "Spanish"],
    "taggedLocations": [
      {
        "locationName": "Central Park",
        "address": "Central Park, New York, NY",
        "id": "001",
      },
      {
        "locationName": "Brooklyn Bridge",
        "address": "Brooklyn Bridge, New York, NY",
        "id": "002",
      },
      {
        "locationName": "Times Square",
        "address": "Times Square, New York, NY",
        "id": "003",
      },
    ],
    "placeOfInterest": [
      {
        "locationName": "Metropolitan Museum of Art",
        "address": "Metropolitan Museum of Art, New York, NY",
        "id": "004",
      },
    ],
    "upcomingEvents": [
      {
        "eventName": "Dance Festival",
        "eventDate": "2023-10-10T19:00:00Z",
        "location": "Central Park, NY",
        "id": "001",
      },
      {
        "eventName": "Art Exhibition",
        "eventDate": "2023-11-05T15:00:00Z",
        "location": "Metropolitan Museum of Art, NY",
        "id": "002",
      },
    ],
  };


  try {
    // Parse the JSON array string into a JavaScript array

    await firestore.collection("profiles").add(profile);
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }


   */

  res.sendStatus(200);
});

exports.createFriends = functions.https.onRequest(async (req, res) => {
  const snapshot = await firestore.collection("profiles").get();
  for (const document of snapshot.docs) {
    const profile = Object.assign({id: document.id}, document.data() as Profile);
    await addFriends(profile);
  }

  res.sendStatus(200);
});

exports.setFriends = functions.https.onRequest(async (req, res) => {
  const derekProfile = await dbUtils.getProfile("0chklRlWnWhlSOR6Z1GrsPAIzDA2");
  const brettProfile = await dbUtils.getProfile("JjxxN53UP7dm9N8PmhxHy9Fa2IX2");
  const erickProfile = await dbUtils.getProfile("NV4cvofidmO9G9FJfmzIZPnjJqp2");
  const richardProfile = await dbUtils.getProfile("5OFGObt5cXiWhLlgKsXB");

  const profiles = [erickProfile, derekProfile, richardProfile];
  const friends: Friend[] = [];
  profiles.forEach((profile) => {
    const f: Friend = {
      "uid": profile.id,
      "phoneNumber": profile.phoneNumber,
      "avatarURL": profile.media[0].url,
      "contactName": profile.firstName+" "+profile.lastName,
      "businessName": "",
      "email": profile.emailAddress,
    };
    friends.push(f);
  });

  await firestore.collection("profiles").doc(brettProfile.id).update({friends: friends});
  res.sendStatus(200);
});

// eslint-disable-next-line require-jsdoc
async function addFriends(profile: Profile) {
  const profiles = [];
  const snapshot = await firestore.collection("profiles").get();
  for (const document of snapshot.docs) {
    const p = Object.assign({id: document.id}, document.data() as Profile);
    if (p.id !== profile.id && p.gender == profile.gender) {
      profiles.push(p);
    }
  }

  // Randomly sort profiles
  profiles.sort(() => 0.5 - Math.random());
  const friends: Friend[] = [];
  const friendProfiles: Profile[] = profiles.slice(0, 3);
  friendProfiles.forEach((friend) => {
    const f: Friend = {
      "uid": friend.id,
      "phoneNumber": "555-321-1234",
      "avatarURL": friend.avatarURL,
      "contactName": friend.firstName+" "+friend.lastName,
      "businessName": "",
      "email": friend.emailAddress,
    };
    friends.push(f);
  });

  const bench: Friend[] = [];
  const benchedProfiles = profiles.slice(4, 6);
  benchedProfiles.forEach((friend) => {
    const f: Friend = {
      "uid": friend.id,
      "phoneNumber": "555-321-1234",
      "avatarURL": friend.avatarURL,
      "contactName": friend.firstName+" "+friend.lastName,
      "businessName": "",
      "email": friend.emailAddress,
    };
    bench.push(f);
  });

  await firestore.collection("profiles").doc(profile.id).update({friends: friends, benchedFriends: bench});
}
