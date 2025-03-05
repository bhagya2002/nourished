const db = require("../firebase/firestore");

module.exports.createChallenge = async function createChallenge(userId, data) {
    try {
        data.owner = userId;
        data.participants = [userId];
        data.progress = 0;

        const result = await db.addSingleDoc("challenges", data);
        if (result.success) {
            const updateResult = await db.updateFieldArray("users", userId, "challenges", result.id);
            if (updateResult.success) {
                return { success: true, data: result.id };
            } else {
                return { success: false, error: updateResult.error };
            }
        }
        return { success: false, error: result.error };
    } catch (err) {
        return { success: false, error: err };
    }
};

module.exports.deleteChallenge = async function deleteChallenge(userId, challengeId) {
    try {
        const userIds = (await db.queryDatabaseSingle(challengeId, "challenges")).data.participants;
        const updateBatch = db.batch();
        userIds.forEach((userId) => {
            const ref = db.getRef("users", userId);
            updateBatch.update(ref, { challenges: db.getDeleteFromArray(challengeId) });
        });
        const result = await db.commitBatch(updateBatch);
        if (result.success) {
            const updateResult = await db.deleteSingleDoc("challenges", challengeId)
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

module.exports.addUserToChallenge = async function addUserToChallenge(userId, challengeId) {
    try {
        const result = await db.updateFieldArray("challenges", challengeId, "participants", userId);
        if (result.success) {
            const updateResult = await db.updateFieldArray("users", userId, "challenges", challengeId);
            if (updateResult.success) {
                return { success: true, data: result.id };
            } else {
                return { success: false, error: updateResult.error };
            }
        } return { success: false, error: result.error };
    } catch (err) {
        return { success: false, error: err };
    }
};

module.exports.removeUserFromChallenge = async function removeUserFromChallenge(userId, challengeId) {
    try {
        const result = await db.removeFromFieldArray("challenges", challengeId, "participants", userId);
        if (result.success) {
            const updateResult = await db.removeFromFieldArray("users", userId, "challenges", challengeId);
            if (updateResult.success) {
                return { success: true, data: result.id };
            } else {
                return { success: false, error: updateResult.error };
            }
        } return { success: false, error: result.error };
    } catch (err) {
        return { success: false, error: err };
    }
};

module.exports.incrementChallenge = async function incrementChallenge(challengeId, amount) {
    try {
        const result = await db.updateField("challenges", challengeId, "userIds", amount);

        if (result.success) {
            return { success: true };
        }
        return { success: false, error: result.error };
    } catch (err) {
        return { success: false, error: err };
    }
}

module.exports.getChallengeInfo = async function getChallengeInfo(challengeId) {
    return await db.queryDatabaseSingle(challengeId, "challenges");
}