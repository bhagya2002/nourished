const db = require("../firebase/firestore");
module.exports.createTask = async function createTask(uid, task, goalId) {
    try {
        // Set the uid on the task
        task.uid = uid;
        // Create a new task document in the "tasks" collection
        const taskResult = await db.addSingleDoc("tasks", task);
        if (!taskResult.success) {
            return { success: false, error: taskResult.error };
        }
        // Update the user's document in the "users" collection by adding the new task id to the tasks array
        const updateResult = await db.updateFieldArray("users", uid, "tasks", taskResult.id);
        if (!updateResult.success) {
            return { success: false, error: updateResult.error };
        }
        if (goalId) {
            await db.updateFieldArray("goals", goalId, "taskIds", taskResult.id);
        }
        return { success: true, data: { id: taskResult.id } };
    } catch (err) {
        return { success: false, error: err };
    }
};

module.exports.editTask = async function editTask(uid, taskId, fieldToChange, newValue) {
    const result = await db.queryDatabaseSingle(uid, "users");
    if (result.success) {
        return await db.updateField("tasks", taskId, fieldToChange, newValue);
    } else return result;
}

module.exports.getUserTasks = async function getUserTasks(uid) {
    const result = await db.queryDatabaseSingle(uid, "users");
    if (result.success) {
        return await db.queryMultiple(result.data.tasks, "tasks");
    } else return result;
}

module.exports.getGoalTasks = async function getGoalTasks(goalId) {
    const result = await db.queryDatabaseSingle(goalId, "goals");
    if (result.success) {
        return await db.queryMultiple(result.data.taskIds, "tasks");
    } else return result;
}

module.exports.deleteTask = async function deleteTask(uid, taskId) {
    const removeResult = await db.removeFromFieldArray("users", uid, "tasks", taskId);
    if (!removeResult.success) {
        return { success: false, error: removeResult.error };
    }
    const deleteResult = await db.deleteSingleDoc("tasks", taskId);
    return deleteResult;
}