module.exports.authenticateUser = async function authenticateUser(idToken) {
  getAuth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      return { uid: decodedToken.uid };
    })
    .catch((error) => {
      return { message: error };
    });
};
