const db = require("../firebase/firestore");

module.exports.createPost = async function createPost(uid, post) {
  try {
    // Set the uid on the post
    post.uid = uid;
    // Create a new post document in the "posts" collection
    const result = await db.addSingleDoc("posts", post);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    // Update the user's document in the "users" collection by adding the new post id to the posts array
    const updateResult = await db.updateFieldArray("users", uid, "posts", result.id);
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
    return { success: true, data: { post: {...post, id: result.id } } };
  } catch (err) {
    return { success: false, error: err };
  }
}

module.exports.editPost = async function editPost(uid, postId, fieldToChange, newValue) {
  const result = await db.queryDatabaseSingle(uid, "users");
  if (result.success) {
    return await db.updateField("posts", postId, fieldToChange, newValue);
  } else return result;
}

module.exports.getUserPosts = async function getUserPosts(uid) {
  const result = await db.queryDatabaseSingle(uid, "users");
  if (result.success) {
    return await db.queryMultiple(result.data.posts, "posts");
  } else return result;
}

module.exports.deletePost = async function deletePost(uid, postId) {
  const result = await db.removeFromFieldArray("users", uid, "posts", postId);
  if (result.success) {
    return await db.deleteSingleDoc("posts", postId);
  }
}