const db = require("../firebase/firestore");

module.exports.getUserInfo = async function getUserInfo(uid) {
  return db.queryDatabaseSingle(uid, "users");
};

module.exports.getFriends = async function getFriends(uid) {
  const userResult = await db.queryDatabaseSingle(uid, "users");
  if (!userResult.success) return { success: false, message: userResult.message };
  const user = userResult.data;
  const friends = user.friends;

  // replace friend ids with friend data
  const friendData = await db.queryMultiple(friends, "users");
  if (!friendData.success) return { success: false, message: friendData.message };
  const friendDocs = friendData.data;
  return { success: true, data: friendDocs };
};

module.exports.followUser = async function followUser(follower, followee) {
  try {
    if (!(await db.updateFieldArray("users", follower, "following", followee)))
      return { success: false };
    if (!(await db.updateFieldArray("users", followee, "followers", follower)))
      return { success: false };
    return { success: true };
  } catch (err) {
    return { success: false, err: err };
  }
};

module.exports.unfollowUser = async function unfollowUser(follower, followee) {
  try {
    if (
      !(await db.removeFromFieldArray("users", follower, "following", followee))
    )
      return { success: false };
    if (
      !(await db.removeFromFieldArray("users", followee, "followers", follower))
    )
      return { success: false };
    return { success: true };
  } catch (err) {
    return { success: false, err: err };
  }
};

module.exports.getFollowers = async function getFollowers(uid) {
  try {
    const followers = (await db.queryDatabaseSingle(uid, "users")).data
      .followers;
    return { success: true, data: followers };
  } catch (err) {
    return { success: false, err: err };
  }
};

module.exports.getFollowing = async function getFollowing(uid) {
  try {
    const following = (await db.queryDatabaseSingle(uid, "users")).data
      .following;
    return { success: true, data: following };
  } catch (err) {
    return { success: false, err: err };
  }
};

module.exports.addFriendConnection = async function addFriendConnection(
  uid1,
  uid2,
) {
  if (!(await db.updateFieldArray("users", uid1, "friends", uid2)))
    return false;
  if (!(await db.updateFieldArray("users", uid2, "friends", uid1)))
    return false;
  return true;
};

module.exports.getFriendRecommendations =
  async function getFriendRecommendations(uid) {
    const userFriendsIds = (await db.queryDatabaseSingle(uid, "users")).data[
      "friends"
    ];
    const userFriends = (await db.queryMultiple(userFriendsIds, "users")).data;
    const frequencyByFriends = {};
    for (const friend of userFriends) {
      for (const secondaryFriend of friend["friends"]) {
        if (uid == secondaryFriend) continue;
        frequencyByFriends[secondaryFriend] =
          (frequencyByFriends[secondaryFriend] || 0) + 1;
      }
    }

    return Object.entries(frequencyByFriends)
      .sort(function (a, b) {
        return b[1] - a[1];
      })
      .slice(0, 2)
      .map((x) => x[0]);
  };
