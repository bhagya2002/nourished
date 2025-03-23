const db = require("../firebase/firestore");

module.exports.createInvite = async function createInvite(uid, input) {
  try {
    const data = {
      createdAt: Date.now(),
      inviter: uid,
      type: input.type,
      invitee: input.invitee,
      targetId: input.targetId ?? "",
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
    batch.delete(db.getRef("invites", data.inviteId));
    switch (data.type) {
      case 0: {
        batch.update(db.getRef("users", data.invitee), {
          friends: db.getAddToArray(uid),
        });
        batch.update(db.getRef("users", uid), {
          friends: db.getAddToArray(data.invitee),
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
    const deleteResult = await db.deleteSingleDoc("invites", data.inviteId);
    if (!deleteResult.success) {
      return { success: false, error: "Invite not found" };
    }
    return deleteResult;
  } catch (err) {
    return { success: false, error: err.message || "Invite not found" };
  }
};
