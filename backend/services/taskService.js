const db = require("../firebase/firestore");

module.exports.createTask = async function createTask(uid, task) {
    task["uid"] = uid;
    const result = await db.addSingleDoc("tasks", task);
    if (result.success) {
        return await db.updateFieldArray("users", uid, "tasks", result.id);
    }
}

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

module.exports.deleteTask = async function deleteTask(uid, taskId) {
    const result = await db.removeFromFieldArray("users", uid, "tasks", taskId);
    if (result.success) {
        return await db.deleteSingleDoc("tasks", taskId);
    }
}