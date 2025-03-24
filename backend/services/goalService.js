const db = require("../firebase/firestore");
const challengeService = require("./challengeService");

module.exports.createGoal = async function createGoal(uid, goal, participants) {
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
      const newChallengeResult = await challengeService.createChallenge(
        uid, 
        {
          goalId: result.id,
          participants: participants,
        }
      );
      if (!newChallengeResult.success) {
        return { success: false, error: newChallengeResult.error };
      }
      return { success: true, data: { id: result.id, challengeId: newChallengeResult.data.id } };
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
    return await db.deleteSingleDoc("goals", goalId);
  }
};
