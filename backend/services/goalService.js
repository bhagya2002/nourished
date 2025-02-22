const db = require("../firebase/firestore");

module.exports.createGoal = async function createGoal(uid, goal) {
    goal["uid"] = uid;
    const result = await db.addSingleDoc("goals", goal);
    if (result.success) {
        return await db.updateFieldArray("users", uid, "goals", result.id);
    }
}

module.exports.editGoal = async function editGoal(uid, goalId, fieldToChange, newValue) {
    const result = await db.queryDatabaseSingle(uid, "users");
    if (result.success) {
        return await db.updateField("goals", goalId, fieldToChange, newValue);
    } else return result;
}

module.exports.getUserGoals = async function getUserGoals(uid) {
    const result = await db.queryDatabaseSingle(uid, "users");
    if (result.success) {
        return await db.queryMultiple(result.data.goals, "goals");
    } else return result;
}

module.exports.deleteGoal = async function deleteGoal(uid, goalId) {
    const result = await db.removeFromFieldArray("users", uid, "goals", goalId);
    if (result.success) {
        return await db.deleteSingleDoc("goals", goalId);
    }
}