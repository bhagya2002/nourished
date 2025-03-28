const db = require("../firebase/firestore");

module.exports.createPost = async function createPost(uid, post) {
  try {
    // Set the uid on the post
    post.uid = uid;
    if (!post.name || post.name.trim() === "") {
      const userResult = await db.queryDatabaseSingle(uid, "users");
      if (!userResult.success) {
        return userResult;
      }
      post.name = userResult.data.name;
    }
    // Create a new post document in the "posts" collection
    const result = await db.addSingleDoc("posts", post);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    // Update the user's document in the "users" collection by adding the new post id to the posts array
    const updateResult = await db.updateFieldArray(
      "users",
      uid,
      "posts",
      result.id,
    );
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }
    // Get the goal document data if required and exists
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

    const followersAndFriends = [...userResult.data.friends, ...userResult.data.following];
    const allUids = [...followersAndFriends, uid];

    // Initialize an array to hold all the promises for fetching user and friend posts
    const postFetchPromises = [];

    // For each friend, get their posts from function getUserPosts(uid)
    for (const singleUid of allUids) {
      const getPostsRes = await this.getUserPosts(singleUid);
      if (!getPostsRes.success) {
        return getPostsRes;
      }
      postFetchPromises.push(getPostsRes.data);
    }

    // Wait for all promises to resolve and get the posts
    const posts = await Promise.all(postFetchPromises);

    // Flatten the array of posts arrays into a single array
    const flattenedPosts = posts.reduce((acc, val) => acc.concat(val), []);

    // Sort the posts by date
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

    // Get the user's posts from the "posts" collection
    const postsResult = await db.queryMultiple(userResult.data.posts, "posts");
    if (!postsResult.success) {
      return postsResult;
    }

    // Initialize an array to hold all the promises for fetching goal details
    const goalFetchPromises = postsResult.data.map((post) => {
      if (post.goalId) {
        return db.queryDatabaseSingle(post.goalId, "goals");
      } else {
        return Promise.resolve(null); // Resolve with null if no goalId is present
      }
    });

    // Resolve all promises to get goal details
    const goals = await Promise.all(goalFetchPromises);

    // Replace goalId in each post with the corresponding goal data
    const postsWithGoals = postsResult.data.map((post, index) => {
      if (goals[index] && goals[index].success) {
        post.goal = goals[index].data; // Replace goalId with goal data
      } else {
        post.goal = null; // Set to null if goal was not found or if there was no goalId
      }
      delete post.goalId; // Clean up by removing the goalId field
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
  // Check if the user has already liked the post, if not, like it, if so, remove the like
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
    // update the user doc with like/unlike postId
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
    // update the user doc with like/unlike postId
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
