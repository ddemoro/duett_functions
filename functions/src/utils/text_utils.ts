/* eslint-disable require-jsdoc,@typescript-eslint/no-var-requires,no-useless-escape */
const {v4: uuidv4} = require("uuid");


function slugify(text: string) {
  return text
    .toString() // Cast to string
    .toLowerCase() // Convert the string to lowercase letters
    .normalize("NFD") // The normalize() method returns the Unicode Normalization Form of a given string.
    .trim() // Remove whitespace from both sides of a string
    .replace(/\s+/g, "") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, ""); // Replace multiple - with single -
}


function removeNonChars(text: string) {
  return text
    .toString() // Cast to string
    .normalize("NFD") // The normalize() method returns the Unicode Normalization Form of a given string.
    .trim() // Remove whitespace from both sides of a string
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, ""); // Replace multiple - with single -
}

function generateUniqueCode(name: string) {
  let inviteCode = textUtils.slugify(name).toUpperCase();
  if (inviteCode.length > 6) {
    inviteCode = inviteCode.substring(0, 6);
  }

  const randomCode = generateRandomString(4);


  return inviteCode + "_" + randomCode;
}

function generateRandomString(length: number) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result.toUpperCase();
}

function generateToken() {
  return uuidv4() + "-" + uuidv4();
}

function getFirstName(fullName: string) {
  const indexOfSpace = fullName.indexOf(" ");
  if (indexOfSpace >= fullName.length) {
    return fullName;
  }

  return fullName.substring(0, indexOfSpace);
}

function calculateAge(birthdayDate: { getFullYear: () => number; getMonth: () => number; getDate: () => number; }) {
  const today = new Date();
  let age = today.getFullYear() - birthdayDate.getFullYear();
  const monthDiff = today.getMonth() - birthdayDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdayDate.getDate())) {
    age--;
  }

  return age;
}

const textUtils = {
  slugify,
  generateUniqueCode,
  getFirstName,
  generateRandomString,
  removeNonChars,
  generateToken,
  calculateAge,
};

export default textUtils;
