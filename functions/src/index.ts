import admin = require("firebase-admin");

admin.initializeApp();
const firestore = admin.firestore();
const settings = {timestampsInSnapshots: true, ignoreUndefinedProperties: true};
firestore.settings(settings);


exports.profiles = require("./profiles");
exports.matches = require("./matches");
exports.pairs = require("./pairs");
