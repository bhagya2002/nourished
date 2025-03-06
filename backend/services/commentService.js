const db = require("../firebase/firestore");

module.exports.getCommentsOnPost = async function getCommentsOnPost(postId) {
    try {
        const commentsResult = await db.queryDatabaseSingle(postId, "posts");
        if (!commentsResult.success) {
            return commentsResult;
        }
        const commentIds = commentsResult.data.comments;
        const comments = await db.queryMultiple(commentIds, "comments");
        if (!comments.success) {
            return comments;
        }
        return { success: true, data: comments.data };
    } catch (err) {
        return { success: false, error: err };
    }
};

module.exports.createComment = async function createComment(userId, data) {
    try {
        data.uid = userId;
        const result = await db.addSingleDoc("comments", data);
        if (result.success) {
            const updateResult = await db.updateFieldArray("posts", data.postId, "comments", result.id);
            if (updateResult.success) {
                return { success: true, data: { id: result.id } };
            } else {
                return { success: false, error: updateResult.error };
            }
        }
        return { success: false, error: result.error };
    } catch (err) {
        return { success: false, error: err };
    }
};

module.exports.deleteComment = async function deleteComment(data) {
    try {
        const result = await db.deleteSingleDoc("comments", data.commentId);
        if (result.success) {
            const updateResult = await db.removeFromFieldArray("posts", data.postId, "comments", data.commentId);
            if (updateResult.success) {
                return { success: true };
            } else {
                return { success: false, error: updateResult.error };
            }
        }
        return { success: false, error: result.error };
    } catch (err) {
        return { success: false, error: err };
    }
};