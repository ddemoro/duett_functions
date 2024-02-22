import * as functions from "firebase-functions";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require("sharp");


exports.compressImage = functions.storage.object().onFinalize(async (object) => {
  const bucket = admin.storage().bucket(object.bucket);
  const filePath = object.name;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const fileName = filePath.split("/").pop();
  const contentType = object.contentType;
  const file = bucket.file(filePath);
  const [metadata] = await file.getMetadata();
  // Access metadata
  console.log(metadata);
  console.log("Custom Metadata:", metadata);
  console.log("Compressing image " + fileName + " " + contentType);

  // Exit if not an image
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!contentType.startsWith("image/") || fileName.includes("compressed") || metadata.customMetadata) {
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
      .webp({quality: 50}) // Example: Convert to WebP with 80% quality
      .toFile(compressedFilePath);

    // Upload compressed image (replace original or upload to new location)
    const newMetadata = {
      customMetadata: {
        // Your custom metadata fields
        "author": "John Doe",
        "creationDate": new Date().toISOString(),
        "keywords": ["nature", "landscape"],
      },
    };
    await bucket.upload(compressedFilePath, {
      destination: `compressed/compressed_${fileName}`, // Upload to a 'compressed' subfolder
    });

    const file2 = bucket.file(`compressed/compressed_${fileName}`);
    try {
      await file2.setMetadata(newMetadata);
      console.log("Metadata added successfully");
      return null;
    } catch (error) {
      console.error("Error adding metadata:", error);
      return null;
    }

    /*
    const newMetadata = {
      customMetadata: {
        "compressed": "true",
      },
    };
    await bucket.upload(compressedFilePath, {
      destination: filePath,
      metadata: newMetadata,
    });

     */

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
