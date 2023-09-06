import * as functions from "firebase-functions";
import {Profile} from "./types";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const FieldValue = require("firebase-admin").firestore.FieldValue;

// eslint-disable-next-line max-len
exports.profileAdded = functions.firestore.document("profiles/{uid}").onCreate(async (snap, context) => {
  const profile = Object.assign({id: snap.id}, snap.data() as Profile);
  console.log(profile);

  await snap.ref.update({
    creationDate: FieldValue.serverTimestamp(),
  });


  return Promise.resolve();
});

