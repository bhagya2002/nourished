const db = require("../firebase/firestore");
const challengeService = require("./challengeService");

module.exports.createGoal = async function createGoal(uid, goal, invitees) {
  try {
    // Set the uid on the goal
    goal.uid = uid;
    // Create a new goal document in the "goals" collection
    const result = await db.addSingleDoc("goals", goal);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    // Update the user's document in the "users" collection by adding the new goal id to the goals array
    const updateResult = await db.updateFieldArray(
      "users",
      uid,
      "goals",
      result.id,
    );
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }
    // Update the challenge's related
    if (goal.isChallenge && goal.isChallenge === true) {
      const newChallengeResult = await challengeService.createChallenge(uid, {
        goalId: result.id,
        invitees: invitees,
      });
      if (!newChallengeResult.success) {
        return { success: false, error: newChallengeResult.error };
      }
      return {
        success: true,
        data: { id: result.id, challengeId: newChallengeResult.data.id },
      };
    }
    return { success: true, data: { id: result.id, challengeId: null } };
  } catch (err) {
    return { success: false, error: err };
  }
};

module.exports.editGoal = async function editGoal(
  uid,
  goalId,
  fieldToChange,
  newValue,
) {
  const result = await db.queryDatabaseSingle(uid, "users");
  if (result.success) {
    return await db.updateField("goals", goalId, fieldToChange, newValue);
  } else return result;
};

module.exports.getUserGoals = async function getUserGoals(uid) {
  const result = await db.queryDatabaseSingle(uid, "users");
  if (result.success) {
    return await db.queryMultiple(result.data.goals, "goals");
  } else return result;
};

module.exports.deleteGoal = async function deleteGoal(uid, goalId) {
  const result = await db.removeFromFieldArray("users", uid, "goals", goalId);
  if (result.success) {
    const goalRes = await db.queryDatabaseSingle(goalId, "goals");
    if (!goalRes.success) {
      return goalRes;
    }
    const challengeRes = await db.queryDatabase(goalId, "challenges", "goalId");
    if (!challengeRes.success) {
      return challengeRes;
    }

    // If user is deleting the challenge that is not belong to him
    if (goalRes.data.uid !== uid && challengeRes.data.length > 0) {
      const deleteUserFromChallPromises = [];
      for (const challenge of challengeRes.data) {
        const deleteUserChallRes = await db.removeFromFieldArray(
          "users",
          uid,
          "challenges",
          challenge.id,
        );
        deleteUserFromChallPromises.push(deleteUserChallRes);
        const deleteChallPartiRes = await db.removeFromFieldArray(
          "challenges",
          challenge.id,
          "participants",
          uid,
        );
        deleteUserFromChallPromises.push(deleteChallPartiRes);
      }
      const allDeleteUserFromChallRes = await Promise.all(
        deleteUserFromChallPromises,
      );
      if (!allDeleteUserFromChallRes.every((res) => res.success)) {
        return {
          success: false,
          error: "Failed to remove you from all challenges",
        };
      }
      return { success: true, message: "Removed you from the challenge" };
    }

    const deleteGoalRes = await db.deleteSingleDoc("goals", goalId);
    if (!deleteGoalRes.success) {
      return deleteGoalRes;
    }

    // Delete relavant challenge if it exists
    const challengeDeletePromises = [];
    if (challengeRes.data.length > 0) {
      for (const challenge of challengeRes.data) {
        const deleteChallengeRes = await challengeService.deleteChallenge(
          uid,
          challenge.id,
        );
        if (!deleteChallengeRes.success) {
          return deleteChallengeRes;
        }
        challengeDeletePromises.push(deleteChallengeRes);
      }
      const allChallengeDeleteRes = await Promise.all(challengeDeletePromises);
      if (!allChallengeDeleteRes.every((res) => res.success)) {
        return { success: false, error: "Failed to delete all challenges" };
      }
    }
    return { success: true };
  } else return result;
};
