const db = require("../firebase/firestore");

module.exports.createInvite = async function createInvite(uid, input) {
  try {
    const data = {
      createdAt: Date.now(),
      inviter: uid,
      inviterName: input.inviterName ?? "",
      type: input.type,
      invitee: input.invitee,
      targetId: input.targetId ?? "",
      targetTitle: input.targetTitle ?? "",
    };
    const result = await db.addSingleDoc("invites", data);
    if (result.success) {
      return { success: true, data: result.id };
    } else {
      return { success: false, error: result.error };
    }
  } catch (err) {
    return { success: false, err: err };
  }
};

module.exports.acceptInvite = async function acceptInvite(uid, data) {
  try {
    const batch = db.batch();
    batch.delete(db.getRef("invites", data.id));
    switch (data.type) {
      case 0: {
        batch.update(db.getRef("users", data.invitee), {
          friends: db.getAddToArray(data.inviter),
          following: db.getAddToArray(data.inviter),
        });
        batch.update(db.getRef("users", data.inviter), {
          friends: db.getAddToArray(data.invitee),
          followers: db.getAddToArray(data.invitee),
        });
        await batch.commit();
        return { success: true };
      }
      case 1: {
        batch.update(db.getRef("users", data.invitee), {
          challenges: db.getAddToArray(data.targetId),
        });
        batch.update(db.getRef("challenges", data.targetId), {
          participants: db.getAddToArray(data.invitee),
        });
        await batch.commit();

        const challengeRes = await db.queryDatabaseSingle(
          data.targetId,
          "challenges",
        );
        if (!challengeRes.success) {
          return challengeRes;
        }
        const challenge = challengeRes.data;
        const goalId = challenge.goalId;
        const updateGoalsResult = await db.updateFieldArray(
          "users",
          uid,
          "goals",
          goalId,
        );
        if (!updateGoalsResult.success) {
          return updateGoalsResult;
        }
        return { success: true };
      }
    }
  } catch (err) {
    return { success: false, error: err.message || "Invite not found" };
  }
};

module.exports.getUserInvites = async function getUserInvites(uid) {
  return await db.queryDatabase(uid, "invites", "invitee");
};

module.exports.declineInvite = async function declineInvite(data) {
  try {
    const deleteResult = await db.deleteSingleDoc("invites", data.id);
    if (!deleteResult.success) {
      return { success: false, error: "Invite not found" };
    }
    return deleteResult;
  } catch (err) {
    return { success: false, error: err.message || "Invite not found" };
  }
};

module.exports.deleteInvitesOnChallenge = async function deleteInvitesOnChallenge(uid, challengeId) {
  try {
    const batch = db.batch();
    const invites = await db.queryDatabase(challengeId, "invites", "targetId");
    if (!invites.success) {
      return { success: false, error: "Challenge not found" };
    }
    for (const invite of invites.data) {
      batch.delete(db.getRef("invites", invite.id));
    }
    await batch.commit();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Invite not found" };
  }
};

module.exports.deleteFriendInvite = async function deleteFriendInvite(uid, invitee) {
  try {
    const batch = db.batch();
    const invitesRes = await db.queryDatabase(invitee, "invites", "invitee");
    if (!invitesRes.success) return invitesRes;
    for (const invite of invitesRes.data) {
      if (invite.type === 0 && invite.inviter === uid) {
        batch.delete(db.getRef("invites", invite.id));
      }
    }
    await batch.commit();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Invite not found" };
  }
};