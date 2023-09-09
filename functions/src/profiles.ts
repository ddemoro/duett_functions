import * as functions from "firebase-functions";
import {Profile} from "./types";

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

exports.getProfiles = functions.https.onRequest(async (req, res) => {
  const json = "{\n" +
      "  \"phoneNumber\": \"+15552348765\",\n" +
      "  \"creationDate\": {\n" +
      "    \"_seconds\": 1692638646,\n" +
      "    \"_nanoseconds\": 405000000\n" +
      "  },\n" +
      "  \"configured\": true,\n" +
      "  \"fullName\": \"Elena Vega\",\n" +
      "  \"emailAddress\": \"elena.vega@example.com\",\n" +
      "  \"receiveMarketingMaterial\": true,\n" +
      "  \"living\": {\n" +
      "    \"city\": \"Miami\",\n" +
      "    \"latitude\": 25.7617,\n" +
      "    \"state\": \"FL\",\n" +
      "    \"longitude\": -80.1918\n" +
      "  },\n" +
      "  \"gender\": \"Woman\",\n" +
      "  \"datingType\": \"Man\",\n" +
      "  \"height\": 168,\n" +
      "  \"ethnicity\": \"Latina\",\n" +
      "  \"children\": \"No children\",\n" +
      "  \"hometown\": {\n" +
      "    \"hometown\": \"Barcelona, Spain\",\n" +
      "    \"visible\": true\n" +
      "  },\n" +
      "  \"jobTitle\": {\n" +
      "    \"visible\": true,\n" +
      "    \"data\": \"Creative Director\"\n" +
      "  },\n" +
      "  \"school\": {\n" +
      "    \"visible\": true,\n" +
      "    \"data\": \"New York University\"\n" +
      "  },\n" +
      "  \"work\": {\n" +
      "    \"visible\": true,\n" +
      "    \"data\": \"Adobe Creative Cloud\"\n" +
      "  },\n" +
      "  \"education\": {\n" +
      "    \"visible\": true,\n" +
      "    \"data\": \"Master of Fine Arts\"\n" +
      "  },\n" +
      "  \"religion\": {\n" +
      "    \"visible\": true,\n" +
      "    \"data\": \"Agnostic\"\n" +
      "  },\n" +
      "  \"politics\": {\n" +
      "    \"visible\": true,\n" +
      "    \"data\": \"Progressive\"\n" +
      "  },\n" +
      "  \"drinks\": {\n" +
      "    \"visible\": true,\n" +
      "    \"data\": \"Socially\"\n" +
      "  },\n" +
      "  \"smoke\": {\n" +
      "    \"visible\": true,\n" +
      "    \"data\": \"No\"\n" +
      "  },\n" +
      "  \"weed\": {\n" +
      "    \"visible\": true,\n" +
      "    \"data\": \"No\"\n" +
      "  },\n" +
      "  \"drugs\": {\n" +
      "    \"visible\": true,\n" +
      "    \"data\": \"No\"\n" +
      "  },\n" +
      "  \"privacyAccepted\": true,\n" +
      "  \"media\": [\n" +
      "    {\n" +
      "      \"image\": true,\n" +
      "      \"url\": \"https://images.unsplash.com/photo-1593351799227-75df2026356b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1895&q=80\"\n" +
      "    },\n" +
      "    {\n" +
      "      \"image\": true,\n" +
      "      \"url\": \"https://images.unsplash.com/photo-1517805686688-47dd930554b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1827&q=80\"\n" +
      "    },\n" +
      "    {\n" +
      "      \"image\": true,\n" +
      "      \"url\": \"https://images.unsplash.com/photo-1462804993656-fac4ff489837?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80\"\n" +
      "    },\n" +
      "    {\n" +
      "      \"image\": true,\n" +
      "      \"url\": \"https://images.unsplash.com/photo-1544717304-a2db4a7b16ee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1888&q=80\"\n" +
      "    }\n" +
      "  ],\n" +
      "  \"about\": \"Passionate about visual storytelling\",\n" +
      "  \"qualities\": \"Imaginative and adventurous\",\n" +
      "  \"birthday\": {\n" +
      "    \"_seconds\": 724992000,\n" +
      "    \"_nanoseconds\": 0\n" +
      "  },\n" +
      "  \"memorableMoments\": \"Exhibiting art at a gallery opening\",\n" +
      "  \"friends\": [\n" +
      "    {\n" +
      "      \"uid\": null,\n" +
      "      \"address\": null,\n" +
      "      \"phoneNumber\": \"555-123-4567\",\n" +
      "      \"avatarURL\": \"https://images.unsplash.com/photo-1616840420121-7ad8ed885f11?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1760&q=80\",\n" +
      "      \"websiteURL\": null,\n" +
      "      \"contactName\": \"Sophia Brown\",\n" +
      "      \"businessName\": \"\",\n" +
      "      \"shippingAddress\": null,\n" +
      "      \"id\": null,\n" +
      "      \"email\": \"sophia@example.com\"\n" +
      "    },\n" +
      "    {\n" +
      "      \"uid\": null,\n" +
      "      \"address\": null,\n" +
      "      \"phoneNumber\": \"555-234-5678\",\n" +
      "      \"avatarURL\": \"https://images.unsplash.com/photo-1607699032287-f58742a2693d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80\",\n" +
      "      \"websiteURL\": null,\n" +
      "      \"contactName\": \"Olivia Johnson\",\n" +
      "      \"businessName\": \"\",\n" +
      "      \"shippingAddress\": null,\n" +
      "      \"id\": null,\n" +
      "      \"email\": \"olivia@example.com\"\n" +
      "    }\n" +
      "  ],\n" +
      "  \"benchedFriends\": [\n" +
      "    {\n" +
      "      \"uid\": null,\n" +
      "      \"address\": null,\n" +
      "      \"phoneNumber\": \"555-345-6789\",\n" +
      "      \"avatarURL\": \"https://images.unsplash.com/photo-1609132718484-cc90df3417f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80\",\n" +
      "      \"websiteURL\": null,\n" +
      "      \"contactName\": \"Isabella Diaz\",\n" +
      "      \"businessName\": \"\",\n" +
      "      \"shippingAddress\": null,\n" +
      "      \"id\": null,\n" +
      "      \"email\": \"isabella@example.com\"\n" +
      "    },\n" +
      "    {\n" +
      "      \"uid\": null,\n" +
      "      \"address\": null,\n" +
      "      \"phoneNumber\": \"555-456-7890\",\n" +
      "      \"avatarURL\": \"https://images.unsplash.com/photo-1544717304-a2db4a7b16ee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1888&q=80\",\n" +
      "      \"websiteURL\": null,\n" +
      "      \"contactName\": \"Carolina Martinez\",\n" +
      "      \"businessName\": \"\",\n" +
      "      \"shippingAddress\": null,\n" +
      "      \"id\": null,\n" +
      "      \"email\": \"carolina@example.com\"\n" +
      "    }\n" +
      "  ],\n" +
      "  \"location\": {\n" +
      "    \"latitude\": 25.7617,\n" +
      "    \"longitude\": -80.1918\n" +
      "  },\n" +
      "  \"avatarURL\": \"https://images.unsplash.com/photo-1601288496920-b6154fe3626a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1826&q=80\"\n" +
      "}\n";

  try {
    // Parse the JSON array string into a JavaScript array
    const jsonObject = JSON.parse(json);
    await firestore.collection("profiles").doc("5bfFZU5e89nDdmadoScN").set(jsonObject);
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }


  res.sendStatus(200);
});
