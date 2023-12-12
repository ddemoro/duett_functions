import admin = require("firebase-admin");

admin.initializeApp();
const firestore = admin.firestore();
const settings = {timestampsInSnapshots: true, ignoreUndefinedProperties: true};
firestore.settings(settings);


exports.profiles = require("./profiles");
exports.matches = require("./matches");
exports.pairs = require("./pairs");
exports.duetts = require("./duetts");
exports.thumbnails = require("./utils/thumbnails");
exports.friends = require("./friends");
exports.test = require("./test");
