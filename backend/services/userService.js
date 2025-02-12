const db = require("../firebase/firestore");

module.exports.getUserInfo = async function getUserInfo(uid) {
  return db.queryDatabaseSingle(uid, "users");
};
