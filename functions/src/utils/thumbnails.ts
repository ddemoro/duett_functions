Object.defineProperty(exports, "__esModule", {value: true});
import * as functions from "firebase-functions";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
const firestore = admin.firestore();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const spawn = require("child-process-promise").spawn;
import * as path from "path";
import * as os from "os";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require("axios");


exports.testThumbnail = functions.https.onRequest(async (req: any, res: { sendStatus: (arg0: number) => void; }) => {
  const videoURL = req.query.videoURL;
  const imageURL = req.query.imageURL;

  if (videoURL) {
    await getThumbFromVideo(videoURL);
  }

  if (imageURL) {
    await addThumbnailToProduct("", imageURL);
  }

  const products = await firestore.collection("products").limit(50).get();
  for (const document of products.docs) {
    console.log(document.id);
  }


  res.sendStatus(200);
});

// eslint-disable-next-line require-jsdoc
function getThumbFromVideo(videoURL: string) {
  const storage = admin.storage();
  const randomName = Math.random().toString(36).substring(5);
  // Load into memory (somehow)
  const tempFilePath = path.join(os.tmpdir(), randomName + ".mp4");
  const finalPath = path.join(os.tmpdir(), randomName + ".gif");
  const writer = fs.createWriteStream(tempFilePath);
  return axios.get(videoURL, {
    responseType: "stream",
  }).then(function(response: { data: { pipe: (arg0: any) => void; on: (arg0: string, arg1: { (): any; (): void; }) => void; }; }) {
    response.data.pipe(writer);
    return new Promise<void>((resolve, reject) => {
      response.data.on("end", () => {
        console.log("Creating Thumbnail for update");
        return spawn("ffmpeg", ["-i", videoURL, "-vframes", "1", "-an", "-s", "400x222", "-ss", "1", finalPath]).then(() => {
          const bucket = storage.bucket();
          const destination = "/thumbnails/" + randomName + ".gif";
          return bucket.upload(finalPath, {destination}).then(() => {
            console.log("Building Public Facing URL for Content ");
            const myFile = admin.storage().bucket().file(destination);
            return myFile.getSignedUrl({
              action: "read",
              expires: "03-09-2491",
            }).then((urls: string | any[]) => {
              console.log("Thumbnail was created and uses URL array " + urls);
              const signedUrl = urls[0];
              return firestore.collection("test_content").add({
                thumbnailURL: signedUrl,
                type: "video",
              }).then(() => {
                console.log("Everything is done. Unlinking " + tempFilePath);
                console.log("Unlinking done");
                fs.unlinkSync(tempFilePath);
                resolve();
              });
            });
          });
        });
      });
      response.data.on("error", () => {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject();
      });
    });
  });
}


// eslint-disable-next-line require-jsdoc
async function doit(file: any, bucketName: string, destination: string) {
  await file.makePublic();
  const url = await file.getDownloadURL();
  console.log("Try this: "+url);

  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent("path/to/your/file")}?alt=media`;
  console.log("Public URL is "+publicUrl);
  return publicUrl;
}

// eslint-disable-next-line require-jsdoc
function addThumbnailToProduct(productID: string, imageURL: string) {
  const storage = admin.storage();
  const randomName = Math.random().toString(36).substring(5);
  // Load into memory (somehow)
  const tempFilePath = path.join(os.tmpdir(), randomName + ".png");
  const writer = fs.createWriteStream(tempFilePath);
  return axios.get(imageURL, {
    responseType: "stream",
  }).then(function(response: { data: { pipe: (arg0: any) => void; on: (arg0: string, arg1: { (): any; (): void; }) => void; }; }) {
    response.data.pipe(writer);
    return new Promise<void>((resolve, reject) => {
      response.data.on("end", () => {
        console.log("Creating Thumbnail for update");
        return spawn("convert", [tempFilePath, "-thumbnail", "200x200>", tempFilePath]).then(() => {
          const bucket = storage.bucket();
          const destination = "/thumbnails/" + randomName + ".png";
          return bucket.upload(tempFilePath, {destination}).then(() => {
            console.log("Building Public Facing URL for Content ");
            const myFile = admin.storage().bucket().file(destination);

            doit(myFile, bucket.name, destination);
            return myFile.getSignedUrl({
              action: "read",
              expires: "03-09-2491",
            }).then((urls: string | any[]) => {
              console.log("Thumbnail was created and uses URL array " + urls);
              const signedUrl = urls[0];
              return firestore.collection("products").add({
                thumbnailURL: signedUrl,
              }).then(() => {
                console.log("Thumbnail generation complete");
                fs.unlinkSync(tempFilePath);
                resolve();
              });
            });
          });
        });
      });
      response.data.on("error", () => {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject();
      });
    });
  });
}

const thumbnailUtils = {
  addThumbnailToProduct,
  getThumbFromVideo,
};

export default thumbnailUtils;
