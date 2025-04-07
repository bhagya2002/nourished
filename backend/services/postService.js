const db = require("../firebase/firestore");

module.exports.createPost = async function createPost(uid, post) {
  try {

    post.uid = uid;
    if (!post.name || post.name.trim() === "") {
      const userResult = await db.queryDatabaseSingle(uid, "users");
      if (!userResult.success) {
        return userResult;
      }
      post.name = userResult.data.name;
    }

    const result = await db.addSingleDoc("posts", post);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const updateResult = await db.updateFieldArray(
      "users",
      uid,
      "posts",
      result.id,
    );
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    if (post.goalId) {
      const getGoalRes = await db.queryDatabaseSingle(post.goalId, "goals");
      if (!getGoalRes.success) {
        return { success: false, error: getGoalRes.error };
      }
      post.goal = getGoalRes.data;
    } else {
      post.goal = undefined;
    }
    delete post.goalId;
    return { success: true, data: { post: { ...post, id: result.id } } };
  } catch (err) {
    return { success: false, error: err };
  }
};

module.exports.editPost = async function editPost(
  uid,
  postId,
  fieldToChange,
  newValue,
) {
  const result = await db.queryDatabaseSingle(uid, "users");
  if (result.success) {
    return await db.updateField("posts", postId, fieldToChange, newValue);
  } else return result;
};

module.exports.getUserWithFriendPosts = async function getUserWithFriendPosts(
  uid,
) {
  try {
    const userResult = await db.queryDatabaseSingle(uid, "users");
    if (!userResult.success) {
      return userResult;
    }

    const followersAndFriends = [
      ...userResult.data.friends,
      ...userResult.data.following,
    ];
    const allUids = [...followersAndFriends, uid];
    const uniqueUIds = [...new Set(allUids)];

    const postFetchPromises = [];


    for (const singleUid of uniqueUIds) {
      const getPostsRes = await this.getUserPosts(singleUid);
      if (!getPostsRes.success) {
        return getPostsRes;
      }
      postFetchPromises.push(getPostsRes.data);
    }


    const posts = await Promise.all(postFetchPromises);


    const flattenedPosts = posts.reduce((acc, val) => acc.concat(val), []);


    flattenedPosts.sort((a, b) => b.date - a.date);

    return { success: true, data: flattenedPosts };
  } catch (err) {
    return { success: false, error: err };
  }
};

module.exports.getUserPosts = async function getUserPosts(uid) {
  try {
    const userResult = await db.queryDatabaseSingle(uid, "users");
    if (!userResult.success) {
      return userResult;
    }


    const postsResult = await db.queryMultiple(userResult.data.posts, "posts");
    if (!postsResult.success) {
      return postsResult;
    }


    const goalFetchPromises = postsResult.data.map((post) => {
      if (post.goalId) {
        return db.queryDatabaseSingle(post.goalId, "goals");
      } else {
        return Promise.resolve(null);
      }
    });


    const goals = await Promise.all(goalFetchPromises);


    const postsWithGoals = postsResult.data.map((post, index) => {
      if (goals[index] && goals[index].success) {
        post.goal = goals[index].data;
      } else {
        post.goal = null;
      }
      delete post.goalId;
      return post;
    });

    return { success: true, data: postsWithGoals };
  } catch (err) {
    return { success: false, error: err };
  }
};

module.exports.deletePost = async function deletePost(uid, postId) {
  const result = await db.removeFromFieldArray("users", uid, "posts", postId);
  const userLikeResult = await db.removeFromFieldArray(
    "users",
    uid,
    "likes",
    postId,
  );
  if (!result.success) {
    return result;
  } else if (!userLikeResult.success) {
    return userLikeResult;
  }
  return await db.deleteSingleDoc("posts", postId);
};

module.exports.likePost = async function likePost(uid, postId) {
  const result = await db.queryDatabaseSingle(postId, "posts");
  if (!result.success) {
    return result;
  }
  const post = result.data;

  const userResult = await db.queryDatabaseSingle(uid, "users");
  if (!userResult.success) {
    return userResult;
  }

  const isLiked = post.likes.includes(uid);
  if (isLiked) {
    const updateResult = await db.removeFromFieldArray(
      "posts",
      postId,
      "likes",
      uid,
    );
    if (!updateResult.success) {
      return updateResult;
    }
    post.likes = post.likes.filter((id) => id !== uid);

    const userUpdateResult = await db.updateFieldArray(
      "users",
      uid,
      "likes",
      postId,
    );
    if (!userUpdateResult.success) {
      return userUpdateResult;
    }
  } else {
    const updateResult = await db.updateFieldArray(
      "posts",
      postId,
      "likes",
      uid,
    );
    if (!updateResult.success) {
      return updateResult;
    }
    post.likes.push(uid);

    const userUpdateResult = await db.removeFromFieldArray(
      "users",
      uid,
      "likes",
      postId,
    );
    if (!userUpdateResult.success) {
      return userUpdateResult;
    }
  }
  return { success: true, data: { post } };
};
