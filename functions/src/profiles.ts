import * as functions from "firebase-functions";
import {Profile} from "./types";

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

exports.resize = functions.https.onRequest(async (req, res) => {
  console.log("YES");
  res.sendStatus(200);
});
