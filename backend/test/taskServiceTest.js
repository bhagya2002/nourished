const sinon = require("sinon");
const db = require("../firebase/firestore");
const taskService = require("../services/taskService");
const assert = require("assert");
const { beforeEach } = require("mocha");

describe("taskService Tests", function () {
  afterEach(() => {
    sinon.restore();
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

    it("should return an error if updating user tasks fails", async function () {
      const uid = "user123";
      const task = { title: "Test Task", frequency: "Daily" };

      sinon.stub(db, "addSingleDoc").resolves({ success: true, id: "task456" });
      sinon
        .stub(db, "updateFieldArray")
        .onFirstCall()
        .resolves({ success: false, error: "Failed to update user tasks" });

      const result = await taskService.createTask(uid, task, null);
      assert.deepStrictEqual(result, {
        success: false,
        error: "Failed to update user tasks",
      });
    });

    it("should return an error if updating goal taskIds fails", async function () {
      const uid = "user123";
      const goalId = "goal789";
      const task = { title: "Test Task", frequency: "Daily" };

      sinon.stub(db, "addSingleDoc").resolves({ success: true, id: "task456" });
      sinon
        .stub(db, "updateFieldArray")
        .onFirstCall()
        .resolves({ success: true })
        .onSecondCall()
        .resolves({ success: false, error: "Failed to update goal taskIds" });

      const result = await taskService.createTask(uid, task, goalId);
      assert.deepStrictEqual(result, {
        success: false,
        error: "Failed to update goal taskIds",
      });
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
        .resolves({ success: true })
        .onSecondCall()
        .resolves({ success: true, data: { goalId, frequency: "Daily" } })
        .onThirdCall()
        .resolves({ success: true, data: { deadline: "2025-03-25" } });

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

    it("should return an error if task lookup fails", async function () {
      const uid = "user123";
      const taskId = "task456";

      sinon
        .stub(db, "queryDatabaseSingle")
        .onFirstCall()
        .resolves({ success: true })
        .onSecondCall()
        .resolves({ success: false, error: "Task not found" });

      const result = await taskService.editTask(
        uid,
        taskId,
        "frequency",
        "Weekly",
      );
      assert.deepStrictEqual(result, {
        success: false,
        error: "Task not found",
      });
    });

    it("should return an error if goal lookup fails", async function () {
      const uid = "user123";
      const taskId = "task456";

      sinon
        .stub(db, "queryDatabaseSingle")
        .onFirstCall()
        .resolves({ success: true })
        .onSecondCall()
        .resolves({
          success: true,
          data: { goalId: "goal789", frequency: "Daily" },
        })
        .onThirdCall()
        .resolves({ success: false, error: "Goal not found" });

      const result = await taskService.editTask(
        uid,
        taskId,
        "frequency",
        "Weekly",
      );
      assert.deepStrictEqual(result, {
        success: false,
        error: "Goal not found",
      });
    });
  });

  describe("getUserTasks", function () {
    beforeEach(function () {
      taskService.cacheStore = {
        tasks: {
          tasks_user123: {
            data: { success: true, data: [] },
            expiry: Date.now() + 5000,
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

    it("should return an error if querying tasks fails", async function () {
      const goalId = "goal123";

      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { taskIds: ["task1", "task2"] },
      });
      sinon.stub(db, "queryMultiple").resolves({
        success: false,
        error: "Failed to query tasks",
      });

      const result = await taskService.getGoalTasks(goalId);
      assert.deepStrictEqual(result, {
        success: false,
        error: "Failed to query tasks",
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

    it("should return an error if task lookup fails", async function () {
      const uid = "user123";
      const taskId = "task456";

      sinon
        .stub(db, "queryDatabaseSingle")
        .onFirstCall()
        .resolves({ success: false, error: "Task not found" });

      const result = await taskService.deleteTask(uid, taskId, "badval");
      assert.deepStrictEqual(result, {
        success: false,
        error: "Task not found",
      });
    });

    it("should return an error if goal lookup fails", async function () {
      const uid = "user123";
      const taskId = "task456";
      const goalId = "goal789";

      sinon
        .stub(db, "queryDatabaseSingle")
        .onFirstCall()
        .resolves({ success: true, data: { frequency: "Daily" } })
        .onSecondCall()
        .resolves({ success: false, error: "Goal not found" });

      const result = await taskService.deleteTask(uid, taskId, goalId);
      assert.deepStrictEqual(result, {
        success: false,
        error: "Goal not found",
      });
    });

    it("should return an error if removing task from user fails", async function () {
      const uid = "user123";
      const taskId = "task456";

      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { frequency: "Daily" },
      });
      sinon
        .stub(db, "removeFromFieldArray")
        .resolves({ success: false, error: "Failed to remove task from user" });

      const result = await taskService.deleteTask(uid, taskId, null);
      assert.deepStrictEqual(result, {
        success: false,
        error: "Failed to remove task from user",
      });
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

    it("should return an error if task lookup fails", async function () {
      const uid = "user123";
      const taskId = "task456";

      sinon
        .stub(db, "queryDatabaseSingle")
        .resolves({ success: false, error: "Task not found" });

      const result = await taskService.toggleTaskCompletion(uid, taskId, true);
      assert.deepStrictEqual(result, {
        success: false,
        error: "Failed to find task: Unknown error",
      });
    });

    it("should return an error if task does not belong to user", async function () {
      const uid = "user123";
      const taskId = "task456";

      sinon.stub(db, "queryDatabaseSingle").resolves({
        success: true,
        data: { uid: "differentUser" },
      });

      const result = await taskService.toggleTaskCompletion(uid, taskId, true);
      assert.deepStrictEqual(result, {
        success: false,
        error: "You don't have permission to modify this task",
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

      it("should return an error if task does not belong to user", async function () {
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

    describe("getTaskHistory", function () {
      it("should return an error if user lookup fails", async function () {
        sinon.stub(db, "queryDatabaseSingle").resolves({
          success: false,
          error: "User not found",
        });

        const result = await taskService.getTaskHistory("user123");
        assert.deepStrictEqual(result, {
          success: false,
          error: "User not found",
        });
      });
    });

    describe("submitHappinessRating", function () {
      it("should submit a new happiness rating successfully", async function () {
        sinon.stub(db, "queryDatabaseSingle").resolves({
          success: true,
          data: { uid: "user123", completed: true },
        });
        sinon.stub(db, "queryDatabase").resolves({ success: true, data: [] });
        sinon
          .stub(db, "addSingleDoc")
          .resolves({ success: true, id: "rating123" });
        sinon.stub(db, "updateFieldArray").resolves({ success: true });

        const result = await taskService.submitHappinessRating(
          "user123",
          "task456",
          5,
          "2025-04-02",
        );
        assert.deepStrictEqual(result, {
          success: true,
          data: { id: "rating123", updated: false },
        });
      });

      it("should return an error if task is not completed", async function () {
        sinon.stub(db, "queryDatabaseSingle").resolves({
          success: true,
          data: { uid: "user123", completed: false },
        });

        const result = await taskService.submitHappinessRating(
          "user123",
          "task456",
          5,
          "2025-04-02",
        );
        assert.deepStrictEqual(result, {
          success: false,
          error: "Cannot rate an incomplete task",
        });
      });
    });

    describe("getHappinessData", function () {
      it("should return happiness data with average rating", async function () {
        sinon.stub(db, "queryDatabaseSingle").resolves({ success: true });
        sinon.stub(db, "queryDatabase").resolves({
          success: true,
          data: [
            { rating: 4, date: "2025-04-01" },
            { rating: 5, date: "2025-04-02" },
          ],
        });

        const result = await taskService.getHappinessData("user123");
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.averageHappiness, 4.5);
        assert.strictEqual(result.data.count, 2);
      });

      it("should return an error if user lookup fails", async function () {
        sinon.stub(db, "queryDatabaseSingle").resolves({
          success: false,
          error: "User not found",
        });

        const result = await taskService.getHappinessData("user123");
        assert.deepStrictEqual(result, {
          success: false,
          error: "User not found",
        });
      });
    });

    describe("resetRecurringTasks", function () {
      it("should reset recurring tasks successfully", async function () {
        sinon.stub(db, "queryDatabaseCustom").resolves({
          success: true,
          data: [
            {
              id: "task1",
              frequency: "Daily",
              completedAt: "2025-04-01T10:00:00Z",
            },
          ],
        });
        sinon.stub(db, "updateField").resolves({ success: true });

        const result = await taskService.resetRecurringTasks();
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.tasksReset, 1);
      });

      it("should return an error if fetching tasks fails", async function () {
        sinon.stub(db, "queryDatabaseCustom").resolves({
          success: false,
          error: "Failed to fetch tasks",
        });

        const result = await taskService.resetRecurringTasks();
        assert.deepStrictEqual(result, {
          success: false,
          error: "Failed to fetch tasks for reset",
        });
      });
    });

    describe("associateTaskWithGoal", function () {
      it("should associate a task with a goal successfully", async function () {
        sinon
          .stub(db, "queryDatabaseSingle")
          .onFirstCall()
          .resolves({ success: true, data: { uid: "user123" } })
          .onSecondCall()
          .resolves({
            success: true,
            data: { uid: "user123", deadline: "2025-04-10" },
          });
        sinon.stub(db, "updateField").resolves({ success: true });
        sinon.stub(db, "updateFieldArray").resolves({ success: true });
        sinon.stub(db, "incrementField").resolves({ success: true });

        const result = await taskService.associateTaskWithGoal(
          "user123",
          "task456",
          "goal789",
        );
        assert.deepStrictEqual(result, {
          success: true,
          data: { taskId: "task456", goalId: "goal789" },
        });
      });

      it("should return an error if task is already associated with a goal", async function () {
        sinon.stub(db, "queryDatabaseSingle").resolves({
          success: true,
          data: { uid: "user123", goalId: "goal789" },
        });

        const result = await taskService.associateTaskWithGoal(
          "user123",
          "task456",
          "goal789",
        );
        assert.deepStrictEqual(result, {
          success: false,
          error: "Task is already associated with a goal",
        });
      });

      it("should return an error if task lookup fails", async function () {
        sinon.stub(db, "queryDatabaseSingle").resolves({
          success: false,
          error: "Task not found",
        });

        const result = await taskService.associateTaskWithGoal(
          "user123",
          "task456",
          "goal789",
        );
        assert.deepStrictEqual(result, {
          success: false,
          error: "Task not found",
        });
      });

      it("should return an error if goal lookup fails", async function () {
        sinon
          .stub(db, "queryDatabaseSingle")
          .onFirstCall()
          .resolves({ success: true, data: { uid: "user123", goalId: null } })
          .onSecondCall()
          .resolves({ success: false, error: "Goal not found" });

        const result = await taskService.associateTaskWithGoal(
          "user123",
          "task456",
          "goal789",
        );
        assert.deepStrictEqual(result, {
          success: false,
          error: "Goal not found",
        });
      });

      it("should return an error if user does not own the task", async function () {
        sinon.stub(db, "queryDatabaseSingle").resolves({
          success: true,
          data: { uid: "differentUser", goalId: null },
        });

        const result = await taskService.associateTaskWithGoal(
          "user123",
          "task456",
          "goal789",
        );
        assert.deepStrictEqual(result, {
          success: false,
          error: "You don't have permission to modify this task",
        });
      });
    });

    describe("unassociateTaskFromGoal", function () {
      it("should unassociate a task from a goal successfully", async function () {
        sinon
          .stub(db, "queryDatabaseSingle")
          .onFirstCall()
          .resolves({
            success: true,
            data: { uid: "user123", goalId: "goal789", frequency: "Daily" },
          })
          .onSecondCall()
          .resolves({
            success: true,
            data: { uid: "user123", deadline: "2025-04-10" },
          });
        sinon.stub(db, "updateField").resolves({ success: true });
        sinon.stub(db, "removeFromFieldArray").resolves({ success: true });
        sinon.stub(db, "incrementField").resolves({ success: true });

        const result = await taskService.unassociateTaskFromGoal(
          "user123",
          "task456",
        );
        assert.deepStrictEqual(result, {
          success: true,
          data: { taskId: "task456", goalId: "goal789" },
        });
      });

      it("should return an error if task is not associated with a goal", async function () {
        sinon.stub(db, "queryDatabaseSingle").resolves({
          success: true,
          data: { uid: "user123", goalId: null },
        });

        const result = await taskService.unassociateTaskFromGoal(
          "user123",
          "task456",
        );
        assert.deepStrictEqual(result, {
          success: false,
          error: "Task is not associated with any goal",
        });
      });

      it("should return an error if task lookup fails", async function () {
        sinon.stub(db, "queryDatabaseSingle").resolves({
          success: false,
          error: "Task not found",
        });

        const result = await taskService.unassociateTaskFromGoal(
          "user123",
          "task456",
        );
        assert.deepStrictEqual(result, {
          success: false,
          error: "Task not found",
        });
      });

      it("should return an error if goal lookup fails", async function () {
        sinon
          .stub(db, "queryDatabaseSingle")
          .onFirstCall()
          .resolves({
            success: true,
            data: { uid: "user123", goalId: "goal789" },
          })
          .onSecondCall()
          .resolves({ success: false, error: "Goal not found" });

        const result = await taskService.unassociateTaskFromGoal(
          "user123",
          "task456",
        );
        assert.deepStrictEqual(result, {
          success: false,
          error: "Goal not found",
        });
      });

      it("should return an error if user does not own the task", async function () {
        sinon.stub(db, "queryDatabaseSingle").resolves({
          success: true,
          data: { uid: "differentUser", goalId: "goal789" },
        });

        const result = await taskService.unassociateTaskFromGoal(
          "user123",
          "task456",
        );
        assert.deepStrictEqual(result, {
          success: false,
          error: "You don't have permission to modify this task",
        });
      });
    });
  });
});
