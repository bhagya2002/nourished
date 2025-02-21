const db = require("../firebase/firestore");

module.exports.getUserInfo = async function getUserInfo(uid) {
    return db.queryDatabaseSingle(uid, "users");
};

module.exports.addFriendConnection = async function addFriendConnection(uid1, uid2) {
    if (!(await db.updateFieldArray("users", uid1, "friends", uid2))) return false;
    if (!(await db.updateFieldArray("users", uid2, "friends", uid1))) return false;
    return true;
}

module.exports.getFriendRecommendations = async function getFriendRecommendations(uid) {
    const userFriendsIds = (await db.queryDatabaseSingle(uid, "users")).data["friends"];
    const userFriends = (await (db.queryMultiple(userFriendsIds, "users"))).data;
    const frequencyByFriends = {}
    for (const friend of userFriends) {
        for (const secondaryFriend of friend["friends"]) {
            if (uid == secondaryFriend) continue;
            frequencyByFriends[secondaryFriend] = (frequencyByFriends[secondaryFriend] || 0) + 1;
        }
    }

    return Object.entries(frequencyByFriends).sort(function (a, b) {
        return b[1] - a[1];
    }).slice(0, 2).map(x => x[0]);
}