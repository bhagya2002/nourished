const db = require("../firebase/firestore");
const inviteService = require("./inviteService");

module.exports.getChallenges = async function getChallenges(userId) {
  try {
    const userResult = await db.queryDatabaseSingle(userId, "users");
    if (!userResult.success) {
      return { success: false, error: userResult.error };
    }
    const user = userResult.data;
    const challenges = user.challenges;
    const challengeResults = await db.queryMultiple(challenges, "challenges");
    if (!challengeResults.success) {
      return { success: false, error: challengeResults.error };
    }
    const challengeData = challengeResults.data;
    return { success: true, data: challengeData };
  } catch (err) {
    return { success: false, error: err };
  }
};

module.exports.createChallenge = async function createChallenge(userId, data) {
  try {
    data.uid = userId;
    data.participants = [userId];
    const invitees = data.invitees;
    delete data.invitees;

    const result = await db.addSingleDoc("challenges", data);
    if (result.success) {
      const updateResult = await db.updateFieldArray(
        "users",
        userId,
        "challenges",
        result.id,
      );
      if (updateResult.success) {
        const inviterResult = await db.queryDatabaseSingle(userId, "users");
        if (!inviterResult.success) {
          return inviterResult;
        }
        const inviterName = inviterResult.data.name;
        const targetResult = await db.queryDatabaseSingle(data.goalId, "goals");
        if (!targetResult.success) {
          return targetResult;
        }
        const targetTitle = targetResult.data.title;
        // create invites for invitees
        const challengeInvitePromises = [];
        for (const invitee of invitees) {
          const inviteRes = await inviteService.createInvite(userId, {
            inviterName: inviterName,
            invitee: invitee,
            type: 1,
            targetId: result.id,
            targetTitle: targetTitle,
          });
          if (!inviteRes.success) {
            return inviteRes;
          }
          challengeInvitePromises.push(inviteRes);
        }
        const inviteResults = await Promise.all(challengeInvitePromises);
        if (inviteResults.every((res) => res.success)) {
          return { success: true, data: { id: result.id } };
        } else {
          return { success: false, error: "Failed to create invites" };
        }
      } else {
        return {
          success: false,
          error: "Failed to update user challenges array",
        };
      }
    }
    return { success: false, error: "Failed to create challenge" };
  } catch (err) {
    return { success: false, error: err };
  }
};

module.exports.deleteChallenge = async function deleteChallenge(
  userId,
  challengeId,
) {
  try {
    const challengeRes = await db.queryDatabaseSingle(
      challengeId,
      "challenges",
    );
    if (!challengeRes.success) {
      return challengeRes;
    }
    const userIds = challengeRes.data.participants;
    const goalId = challengeRes.data.goalId;
    const updateBatch = db.batch();
    userIds.forEach((userId) => {
      const ref = db.getRef("users", userId);
      updateBatch.update(ref, {
        challenges: db.getDeleteFromArray(challengeId),
        goals: db.getDeleteFromArray(goalId),
      });
    });
    const result = await db.commitBatch(updateBatch);
    if (result.success) {
      const updateResult = await db.deleteSingleDoc("challenges", challengeId);
      if (updateResult.success) {
        const updateInviteResult = await inviteService.deleteInvitesOnChallenge(userId, challengeId);
        if (!updateInviteResult.success) {
          return updateInviteResult;
        }
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

module.exports.addUserToChallenge = async function addUserToChallenge(
  userId,
  challengeId,
) {
  try {
    const result = await db.updateFieldArray(
      "challenges",
      challengeId,
      "participants",
      userId,
    );
    if (result.success) {
      const updateResult = await db.updateFieldArray(
        "users",
        userId,
        "challenges",
        challengeId,
      );
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

module.exports.removeUserFromChallenge = async function removeUserFromChallenge(
  userId,
  challengeId,
) {
  try {
    const result = await db.removeFromFieldArray(
      "challenges",
      challengeId,
      "participants",
      userId,
    );
    if (result.success) {
      const updateResult = await db.removeFromFieldArray(
        "users",
        userId,
        "challenges",
        challengeId,
      );
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

module.exports.incrementChallenge = async function incrementChallenge(data) {
  try {
    const result = await db.incrementField(
      "challenges",
      data.challengeId,
      "progress",
      data.amount,
    );

    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error };
  } catch (err) {
    return { success: false, error: err };
  }
};

module.exports.getChallengeInfo = async function getChallengeInfo(challengeId) {
  return await db.queryDatabaseSingle(challengeId, "challenges");
};
