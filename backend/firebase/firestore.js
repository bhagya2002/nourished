const admin = require("./firebaseAdmin");

module.exports.getUserInfo = async function getUserInfo(uid) {
  const db = admin.firestore();
  const docRef = db.collection("users").doc(uid);
  return await docRef
    .get()
    .then((docSnapshot) => {
      if (docSnapshot.exists) {
        return { success: true, data: docSnapshot.data() };
      } else {
        return { success: false, message: "No such document!" }; // TODO: This is where we create a new one just in case
      }
    })
    .catch((error) => {
      return { success: false, message: error }; // TODO: More robust error handling
    });
};
