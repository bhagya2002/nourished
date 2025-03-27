const db = require("../firebase/firestore");
const inviteService = require("./inviteService");

module.exports.getUserInfo = async function getUserInfo(uid) {
  return db.queryDatabaseSingle(uid, "users");
};

module.exports.getFriends = async function getFriends(uid) {
  const userResult = await db.queryDatabaseSingle(uid, "users");
  if (!userResult.success)
    return { success: false, message: userResult.message };
  const user = userResult.data;
  const friends = user.friends;

  // replace friend ids with friend data
  const friendData = await db.queryMultiple(friends, "users");
  if (!friendData.success)
    return { success: false, message: friendData.message };
  const friendDocs = friendData.data;
  return { success: true, data: friendDocs };
};

module.exports.followUser = async function followUser(follower, followee) {
  try {
    if (!(await db.updateFieldArray("users", follower, "following", followee)))
      return { success: false };
    if (!(await db.updateFieldArray("users", followee, "followers", follower)))
      return { success: false };

    const userRes = await db.queryDatabaseSingle(follower, "users");
    if (!userRes.success) return userRes;
    const user = userRes.data;

    // if followee is already the follower of the user, add to friends list
    if (user.followers?.includes(followee)) {
      const followerUpdateRes = await db.updateFieldArray("users", follower, "friends", followee);
      if (!followerUpdateRes) return followerUpdateRes;
      const followeeUpdateRes = await db.updateFieldArray("users", followee, "friends", follower);
      if (!followeeUpdateRes) return followeeUpdateRes;
    } else {
      let input = {};
      input.type = 0;
      input.inviterName = user.name;
      input.invitee = followee;
      const inviteRes = await inviteService.createInvite(follower, input);
      if (!inviteRes.success) return inviteRes;
    }

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

    const userRes = await db.queryDatabaseSingle(follower, "users");
    if (!userRes.success) return userRes;
    const user = userRes.data;

    // if followee is already the friend of the user, remove from friends list
    if (user.friends?.includes(followee)) {
      const followerUpdateRes = await db.removeFromFieldArray("users", follower, "friends", followee);
      if (!followerUpdateRes) return followerUpdateRes;
      const followeeUpdateRes = await db.removeFromFieldArray("users", followee, "friends", follower);
      if (!followeeUpdateRes) return followeeUpdateRes;
    } else {
      const inviteRes = await inviteService.deleteFriendInvite(follower, followee);
      if (!inviteRes.success) return inviteRes;
    }
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

// Search for users by name or email
module.exports.searchUser = async function searchUser(data) {
  try {
    const nameOrEmail = data.keyword.trim();
    const userNameRes = await db.queryDatabaseFuzzy(nameOrEmail, "users", "name");
    const userEmailRes = await db.queryDatabaseFuzzy(nameOrEmail, "users", "email");
    if (!userNameRes.success || !userEmailRes.success) {
      return { success: false, message: "Error searching for user" };
    }
    const users = [...userNameRes.data,...userEmailRes.data];
    return { success: true, data: users };
  } catch (err) {
    return { success: false, err: err };
  }
}