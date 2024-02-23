import * as functions from "firebase-functions";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require("sharp");
const firestore = admin.firestore();

exports.compressImage = functions.storage.object().onFinalize(async (object) => {
  const bucket = admin.storage().bucket(object.bucket);
  const filePath = object.name;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const fileName = filePath.split("/").pop();
  const contentType = object.contentType;
  console.log("Compressing image FileName:" + fileName + " FilePath: " + filePath + " ContentType:" + contentType);

  // See if this was already compressed.
  const querySnapshot = await firestore.collection("compressed").where("path", "==", filePath).get();
  const documentExists = !querySnapshot.empty;

  // Exit if not an image
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!contentType.startsWith("image/") || documentExists) {
    console.log("This is not an image or it's compressed already");
    return null;
  }

  // Create working directories
  const tmpFilePath = `/tmp/${fileName}`;
  const compressedFilePath = `/tmp/compressed_${fileName}`;

  try {
    // Download the original image
    await bucket.file(filePath).download({destination: tmpFilePath});

    // Compress the image (adjust quality as needed)
    await sharp(tmpFilePath)
      .webp({quality: 80}) // Example: Convert to WebP with 80% quality
      .toFile(compressedFilePath);

    await firestore.collection("compressed").add({path: filePath});
    await bucket.upload(compressedFilePath, {
      destination: filePath, contentType: contentType,
    });


    // Delete temp files
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    fs.unlinkSync(tmpFilePath);
    fs.unlinkSync(compressedFilePath);

    console.log("Image compressed successfully");
    return null;
  } catch (error) {
    console.error("Error compressing image:", error);
    return null;
  }
});

exports.resizeImages = functions.runWith({
  memory: "4GB",
  timeoutSeconds: 540,
}).https.onRequest(async (req, res) => {
  const folderPath = "media/"; // Specify the folder
  const bucket = admin.storage().bucket("duett-a2b3f.appspot.com");

  // Get list of files within the folder
  const [files] = await bucket.getFiles({prefix: folderPath});

  // Iterate and rename each file
  await Promise.all(files.map(async (file: File) => {
    const filePath = file.name;
    const fileObject = bucket.file(filePath);
    const [metadata] = await fileObject.getMetadata();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const contentType = metadata.contentType;

    const fileName = filePath.split("/").pop();
    if (filePath != "media/") {
      // Create working directories
      const tmpFilePath = `/tmp/${fileName}`;
      const compressedFilePath = `/tmp/compressed_${fileName}`;

      try {
        // Download the original image
        await bucket.file(filePath).download({destination: tmpFilePath});

        /*
        // Compress the image (adjust quality as needed)
        await sharp(tmpFilePath)
          .webp({quality: 80}) // Example: Convert to WebP with 80% quality
          .toFile(compressedFilePath);
         */


        await sharp(tmpFilePath)
          .resize(800, 800, {
            fit: sharp.fit.inside,
            withoutEnlargement: true,
          })
          .toFile(compressedFilePath);

        await firestore.collection("compressed").add({path: filePath});
        await bucket.upload(compressedFilePath, {
          destination: filePath, contentType: "image/webp",
        });

        // Delete temp files
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require("fs");
        fs.unlinkSync(tmpFilePath);
        fs.unlinkSync(compressedFilePath);

        console.log("Image compressed successfully");
      } catch (error) {
        console.error("Error compressing image:", error);
      }
    }
  }));

  res.status(200).send(`File renaming completed in folder ${folderPath}`);
});


exports.compressImages = functions.runWith({
  memory: "4GB",
  timeoutSeconds: 540,
}).https.onRequest(async (req, res) => {
  const folderPath = "media/"; // Specify the folder
  const bucket = admin.storage().bucket("duett-a2b3f.appspot.com");

  // Get list of files within the folder
  const [files] = await bucket.getFiles({prefix: folderPath});

  // Iterate and rename each file
  await Promise.all(files.map(async (file: File) => {
    const filePath = file.name;
    const fileObject = bucket.file(filePath);
    const [metadata] = await fileObject.getMetadata();
    const contentType = metadata.contentType;

    const fileName = filePath.split("/").pop();
    if (filePath != "media/" && contentType != "image/webp") {
      // Create working directories
      const tmpFilePath = `/tmp/${fileName}`;
      const compressedFilePath = `/tmp/compressed_${fileName}`;

      try {
        // Download the original image
        await bucket.file(filePath).download({destination: tmpFilePath});

        // Compress the image (adjust quality as needed)
        await sharp(tmpFilePath)
          .webp({quality: 80}) // Example: Convert to WebP with 80% quality
          .toFile(compressedFilePath);

        await firestore.collection("compressed").add({path: filePath});
        await bucket.upload(compressedFilePath, {
          destination: filePath, contentType: "image/webp",
        });

        // Delete temp files
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require("fs");
        fs.unlinkSync(tmpFilePath);
        fs.unlinkSync(compressedFilePath);

        console.log("Image compressed successfully");
      } catch (error) {
        console.error("Error compressing image:", error);
      }
    }
  }));

  res.status(200).send(`File renaming completed in folder ${folderPath}`);
});
