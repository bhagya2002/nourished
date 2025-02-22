const admin = require("../firebase/firebaseAdmin");

module.exports.authenticateToken = async function authenticateToken(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid };
  } catch (error) {
    return { message: error.message };
  }
};