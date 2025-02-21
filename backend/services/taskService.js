const db = require("../firebase/firestore");

module.exports.createTask = async function createTask(uid, task) {
    const result = await db.addSingleDoc("tasks", task);
    if (result.success) {
        return await db.updateFieldArray("users", uid, "tasks", result.id);
    }
}

module.exports.deleteTask = async function deleteTask(uid, taskId) {
    const result = await db.removeFromFieldArray("users", uid, "tasks", taskId);
    if (result.success) {
        return await db.deleteSingleDoc("tasks", taskId);
    }
}