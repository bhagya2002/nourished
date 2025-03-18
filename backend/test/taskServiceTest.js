const sinon = require("sinon");
const db = require("../firebase/firestore");
const taskService = require("../services/taskService");
const assert = require("assert");
const { beforeEach } = require("mocha");

describe("taskService Tests", function () {
  afterEach(() => {
    sinon.restore(); // Restore stubs after each test
  });

  describe("createTask", function () {
    it("should create a task and update the user & goal documents", async function () {
      const uid = "user123";
      const goalId = "goal789";
      const task = { title: "Test Task", frequency: "Daily" };

      sinon.stub(db, "addSingleDoc").resolves({ success: true, id: "task456" });
      sinon.stub(db, "updateFieldArray").resolves({ success: true });
      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { deadline: "2025-03-25" },
      });
      sinon.stub(db, "incrementField").resolves({ success: true });

      const result = await taskService.createTask(uid, task, goalId);
      assert.deepStrictEqual(result, {
        success: true,
        data: { id: "task456" },
      });
    });

    it("should return an error if task creation fails", async function () {
      sinon
        .stub(db, "addSingleDoc")
        .resolves({ success: false, error: "DB error" });

      const result = await taskService.createTask("user123", {}, null);
      assert.deepStrictEqual(result, { success: false, error: "DB error" });
    });
  });

  describe("editTask", function () {
    it("should update task frequency and adjust goal totalTasks", async function () {
      const uid = "user123";
      const taskId = "task456";
      const goalId = "goal789";

      sinon
        .stub(db, "queryDatabaseSingle")
        .onFirstCall()
        .resolves({ success: true }) // Check user exists
        .onSecondCall()
        .resolves({ success: true, data: { goalId, frequency: "Daily" } }) // Task data
        .onThirdCall()
        .resolves({ success: true, data: { deadline: "2025-03-25" } }); // Goal data

      sinon.stub(db, "updateField").resolves({ success: true });
      sinon.stub(db, "incrementField").resolves({ success: true });

      const result = await taskService.editTask(
        uid,
        taskId,
        "frequency",
        "Weekly",
      );
      assert.deepStrictEqual(result, { success: true });
    });

    it("should return an error if user lookup fails", async function () {
      sinon
        .stub(db, "queryDatabaseSingle")
        .resolves({ success: false, error: "User not found" });

      const result = await taskService.editTask(
        "user123",
        "task456",
        "frequency",
        "Weekly",
      );
      assert.deepStrictEqual(result, {
        success: false,
        error: "User not found",
      });
    });
  });

  describe("getUserTasks", function () {
    beforeEach(function () {
      taskService.cacheStore = {
        tasks: {
          tasks_user123: {
            data: { success: true, data: [] },
            expiry: Date.now() + 5000, // Cache is still valid
          },
        },
      };
    });

    it("should return cached tasks if cache is valid", async function () {
      const result = await taskService.getUserTasks("user123");
      assert.deepStrictEqual(result, { success: true, data: [] });
    });
  });

  describe("getGoalTasks", function () {
    it("should return tasks associated with a goal", async function () {
      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { taskIds: ["task1", "task2"] },
      });
      sinon
        .stub(db, "queryMultiple")
        .resolves({ success: true, data: [{ id: "task1" }, { id: "task2" }] });

      const result = await taskService.getGoalTasks("goal123");
      assert.deepStrictEqual(result, {
        success: true,
        data: [{ id: "task1" }, { id: "task2" }],
      });
    });

    it("should return an error if goal lookup fails", async function () {
      sinon
        .stub(db, "queryDatabaseSingle")
        .resolves({ success: false, error: "Goal not found" });

      const result = await taskService.getGoalTasks("goal123");
      assert.deepStrictEqual(result, {
        success: false,
        error: "Goal not found",
      });
    });
  });

  describe("deleteTask", function () {
    it("should delete a task and update related documents", async function () {
      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { frequency: "Daily" },
      });
      sinon.stub(db, "incrementField").resolves({ success: true });
      sinon.stub(db, "removeFromFieldArray").resolves({ success: true });
      sinon.stub(db, "deleteSingleDoc").resolves({ success: true });

      const result = await taskService.deleteTask(
        "user123",
        "task456",
        "goal789",
      );
      assert.deepStrictEqual(result, { success: true });
    });
  });

  describe("toggleTaskCompletion", function () {
    it("should mark a task as completed and update timestamps", async function () {
      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { uid: "user123", frequency: "Daily", goalId: "goal456" },
      });
      sinon.stub(db, "updateField").resolves({ success: true });
      sinon.stub(db, "incrementField").resolves({ success: true });

      const result = await taskService.toggleTaskCompletion(
        "user123",
        "task456",
        true,
      );
      assert.deepStrictEqual(result, { success: true });
    });

    it("should return an error if user does not own the task", async function () {
      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { uid: "differentUser" },
      });

      const result = await taskService.toggleTaskCompletion(
        "user123",
        "task456",
        true,
      );
      assert.deepStrictEqual(result, {
        success: false,
        error: "You don't have permission to modify this task",
      });
    });
  });
});
